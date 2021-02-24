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
from .classifier_interface import ClassifierInterface

## Configure Flask app
app = Flask("backend", static_folder="../react/build", template_folder="../react/build")
app.config["SECRET_KEY"] = "dev"
socketio = SocketIO(app, cors_allowed_origins="*")

## Setup CORS headers
cors = CORS(app)

## Pull out the logger for use
logger = app.logger

## Classifier interface to be established on connection
## Register connections here
netface_map = {} # Key: SID, val ClassifierInterface object

@socketio.on('connect')
def establish_connection():
    # Register connection to netface map
    netface = ClassifierInterface(socketio, request.sid, logger)
    netface_map[request.sid] = netface
    netface.establish_connection()

def netface():
    """Use an established interface bound to this sid
    for requests

    THERE MUST BE A request.form['sid'] MADE AVAILABLE
    IN THE FORMDATA OF THE INCOMING REQUEST for this method

    use like: netface().someFunction()
    """
    logger.info(f"verify {request.form['sid']}")
    return netface_map[request.form['sid']]


@app.route("/edf-upload", methods=["POST"])
def upload_edf():
    """Take in an edf and store it in /tmp/, classify on it
    and save the result. Then respond with the key from
    annotated file so it can be retrieved later, along with
    the data so it can be rendered
    """
    logger.info(request.form['sid'])
    response_data = netface().handle_edf()

    return make_response(jsonify(response_data))


@app.route("/edf-download/<filekey>", methods=["POST"])
def download_edf(filekey):
    """Returns a file saved in /tmp/ if associated with keymap"""
    # WARNING: Will error if key not available
    filename = netface().file_by_key(filekey)
    return send_from_directory(directory="/tmp/", filename=filename)


### Trivial Methods ###

@app.route("/", methods=["GET"])
def sanity_check():
    """Just a ping"""
    logger.info('ping')
    response = make_response("pong", 200)
    response.mimetype = "text/plain"
    return response
