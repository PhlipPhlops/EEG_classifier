"""Starts a web server
To test,
$ export FLASK_APP=web_server.py
$ flask run
"""
import os
from flask import Flask
from flask import render_template, request, send_file, make_response
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
from .classify_epilepsy import EpilepsyClassifier

# Serves from the ./ng-react/build folder
# Remember to rebuild on frontend changes
app = Flask(__name__, static_folder="../ng-react/build", static_url_path="/")
# Enable pesky CORS
cors = CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"
app.config["SECRET_KEY"] = "dev"


@app.route("/")
def index():
    """Serve the main react app"""
    print("Serve")
    return app.send_static_file("index.html")


def classify_on_edf(filepath):
    """Runs the (long) method to classify epileptic
    discharges on EDF dta
    """
    savepath = filepath[:-4] + "_ng-annotated.edf"
    # Get path to current file so this can be called from anywhere
    parent_folder_path = "/".join((os.path.abspath(__file__)).split("/")[:-2])
    classifier = EpilepsyClassifier(
        parent_folder_path + "/stored_models/neurogram_0.5.2.h5"
    )
    # Clasifies and saves file to path: savepath
    classifier.classify_on_edf(filepath, save_file=savepath)
    return savepath


@app.route("/edf-upload", methods=["POST"])
@cross_origin()
def upload_edf():
    """Take in an edf and store it in /tmp/"""
    f = request.files["file"]
    filepath = "/tmp/" + f.filename
    f.save(filepath)
    save_file = classify_on_edf(filepath)

    return save_file
