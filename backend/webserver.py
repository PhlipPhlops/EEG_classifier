"""Starts a web server
To test,
$ export FLASK_APP=web_server.py
$ flask run
"""
import os
from flask import Flask
from flask import render_template, request, send_file, make_response, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
from waitress import serve
from .classify_epilepsy import EpilepsyClassifier

## Configure Flask app
app = Flask("backend", static_folder="../react/build", template_folder="../react/build")
app.config["SECRET_KEY"] = "dev"

## Setup CORS headers
# app.config["CORS_HEADERS"] = ["Content-Type", "Authorization"]
# app.config["CORS_ORIGINS"] = "http://localhost:3000/"
cors = CORS(app)
## To return the following headers
# Access-Control-Allow-Origin:  http://127.0.0.1:3000
# Access-Control-Allow-Methods: POST
# Access-Control-Allow-Headers: Content-Type, Authorization

@app.route("/", methods=["GET"])
def sanity_check():
    """Just a ping"""
    response = make_response("pong", 200)
    response.mimetype = "text/plain"
    return response

def classify_on_edf(filepath):
    """Runs the (long) method to classify epileptic
    discharges on EDF dta
    """
    savepath = filepath[:-4] + "_ng-annotated.edf"
    # Get path to current file so this can be called from anywhere
    parent_folder_path = "/".join((os.path.abspath(__file__)).split("/")[:-1])
    classifier = EpilepsyClassifier(
        parent_folder_path + "/stored_models/neurogram_1.0.3.h5"
    )
    # Clasifies and saves file to path: savepath
    classifier.classify_on_edf(filepath, save_file=savepath)
    return savepath


@app.route("/edf-upload", methods=["POST"])
def upload_edf():
    """Take in an edf and store it in /tmp/"""
    f = request.files['file']
    filepath = "/tmp/" + f.filename
    f.save(filepath)

    # Classify on the saved file and grab where it's saved to
    save_file = classify_on_edf(filepath)
    save_file = save_file[5:] # Cut /tmp/ from filename
    print(save_file)

    # response = make_response(jsonify({"annoted_file_url": save_file}))
    return send_from_directory(directory="/tmp/", filename=save_file)

if __name__ == "__main__":
    # serve called when run as a module
    # so it doesn't interfere with flask dev
    serve(app, listen='*:8080')
