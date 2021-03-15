"""Starts a web server
To test,
$ export FLASK_APP=web_server.py
$ flask run
"""
import os
import string
import random
import dill
from flask import Flask, request
from flask import render_template, request, send_file, make_response, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, send
from multiprocessing import Manager
from logging.config import dictConfig

from .classifier_interface import ClassifierInterface
from .eeg_chunker import EegChunker
from .extensions import cache


## Configure Flask app
app = Flask("backend", static_folder="../react/build", template_folder="../react/build")
config = {
    "SECRET_KEY": "dev",
    "DEBUG": True
}
app.config.from_mapping(config)
cache.init_app(app, config={'CACHE_TYPE': 'simple'})
socketio = SocketIO(app, cors_allowed_origins="*")

## Setup CORS headers
cors = CORS(app)

## Pull out the logger for use
dictConfig({
    'version': 1,
    'root': {
        'level': 'INFO'
    }
})
logger = app.logger

## Classifier interface to be established on connection
# manager = Manager()
netface_dict = {}

@socketio.on('connect')
def establish_connection():
    # Handshake to verify connection
    ClassifierInterface(request.sid).establish_connection()

def netface():
    """Use an established interface bound to this sid
    for requests

    THERE MUST BE A request.form['sid'] MADE AVAILABLE
    IN THE FORMDATA OF THE INCOMING REQUEST for this method

    use like: netface().someFunction()
    """
    logger.info(f"verify {request.form['sid']}")
    try:
        sid = request.form['sid']
        specific_netface = netface_dict[sid]
        # with open('/tmp/'+sid) as pkl_file:
        #     specific_netface = dill.load(pkl_file)
        # specific_netface = ClassifierInterface(socketio, logger, from_dict=netface_dict)
    except (KeyError):
        logger.error(f"No associated netface with this sid: {request.form['sid']}")

    return specific_netface


@app.route("/edf-upload", methods=["POST"])
def upload_edf():
    """Take in an edf and store it in /tmp/, classify on it
    and save the result. Then respond with the key from
    annotated file so it can be retrieved later, along with
    the data so it can be rendered
    """
    sid = request.form['sid']
    logger.info(f"EDF-UPLOAD: {sid}")

    # Save file to /tmp/
    f = request.files['file']
    filepath = "/tmp/" + f.filename
    f.save(filepath)

    # Cache the edf as a dataframe
    chunker = EegChunker()
    chunker.cache_eeg_dataframe(sid, filepath)
    # Tell client we're ready for it to request data chunks
    socketio.emit('edf uploaded', {}, room=sid)

    # Initiate classifier on filepath
    response_data = ClassifierInterface(sid).initiate_classifier(filepath)

    return make_response(jsonify(response_data))


@app.route("/edf-download/<filekey>", methods=["POST"])
def download_edf(filekey):
    """Returns a file saved in /tmp/ if associated with keymap"""
    # WARNING: Will error if key not available
    # filename = netface().file_by_key(filekey)
    filename = ClassifierInterface(request.form['sid']).file_by_key(filekey)
    return send_from_directory(directory="/tmp/", filename=filename)


@app.route("/edf-chunk", methods=["POST"])
def retrieve_chunk():
    """Grab a chunk of the data for the server to render"""
    # grab sid, n and N
    sid = request.form['sid']
    chunk_i = int(request.form['chunk_i'])
    chunks_total = int(request.form['chunk_total'])
    # Retrieve cached dataframe and grab a chunk from it
    chunker = EegChunker()
    chunk_df = chunker.chunk_as_data_frame(sid, chunk_i, chunks_total)

    response_data = {
        "eeg_chunk": chunk_df.to_json()
    }
    return make_response(jsonify(response_data))


@app.route("/", methods=["GET"])
def sanity_check():
    """Just a ping"""
    logger.info('ping')
    response = make_response("pong", 200)
    response.mimetype = "text/plain"
    return response
