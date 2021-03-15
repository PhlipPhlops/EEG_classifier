"""Starts a web server
To test,
$ export FLASK_APP=web_server.py
$ flask run
"""
import os
import string
import random
from flask import Flask, request
from flask import render_template, request, send_file, make_response, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, send
from flask_caching import Cache
from logging.config import dictConfig
from .classifier_interface import ClassifierInterface


## Configure Flask app
app = Flask("backend", static_folder="../react/build", template_folder="../react/build")
config = {
    "SECRET_KEY": "dev",
    "CACHE_TYPE": "SimpleCache",
    "DEBUG": True
}
app.config.from_mapping(config)
cache = Cache(app)
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
## Registered in cache under pattern 'netface_<sid>'

@socketio.on('connect')
def establish_connection():
    # Register connection to netface map
    logger.info("CONNECTION ATTEMPT")
    try:
        netface = ClassifierInterface(socketio, logger, from_dict={
            'sid': request.sid,
            'edf': None
        })
        cache.set("netface_"+request.sid, netface.to_dict())
        netface.establish_connection()
    except Exception as e:
        logger.error(e)
    logger.info("CONNECTION ATTEMPT COMPLETE")

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
        netface_dict = cache.get("netface_"+sid)
        specific_netface = ClassifierInterface(socketio, logger, from_dict=netface_dict)
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
    logger.info(f"EDF-UPLOAD: {request.form['sid']}")
    response_data = netface().handle_edf()

    return make_response(jsonify(response_data))


@app.route("/edf-download/<filekey>", methods=["POST"])
def download_edf(filekey):
    """Returns a file saved in /tmp/ if associated with keymap"""
    # WARNING: Will error if key not available
    filename = netface().file_by_key(filekey)
    return send_from_directory(directory="/tmp/", filename=filename)


@app.route("/edf-chunk", methods=["POST"])
def retrieve_chunk():
    """Grab a chunk of the data for the server to render"""
    chunk_i = request.form['chunk_i']
    chunk_total = request.form['chunk_total']

    response_data = netface().getChunk(chunk_i, chunk_total)
    return make_response(jsonify(response_data))


@app.route("/", methods=["GET"])
def sanity_check():
    """Just a ping"""
    logger.info('ping')
    response = make_response("pong", 200)
    response.mimetype = "text/plain"
    return response
