"""Starts a web server
To test,
$ export FLASK_APP=web_server.py
$ flask run
"""
import os
import string
import random
from flask import Flask
from flask import render_template, request, send_file, make_response, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
from waitress import serve
from .classify_epilepsy import EpilepsyClassifier
from .edf_reader import EDFReader

## Configure Flask app
app = Flask("backend", static_folder="../react/build", template_folder="../react/build")
app.config["SECRET_KEY"] = "dev"

## Setup CORS headers
cors = CORS(app)

## Constants
# Points to a file in /tmp/ that fills with key/val pairs
KEYMAP_FILENAME = '/tmp/file_key_map.txt'
# The Neurogram model version to classify with
MODEL_NAME = 'neurogram_1.0.3.h5'

@app.route("/", methods=["GET"])
def sanity_check():
    """Just a ping"""
    response = make_response("pong", 200)
    response.mimetype = "text/plain"
    return response

def classify_on_edf(filepath):
    """Runs the (long) method to classify epileptic
    discharges on EDF dta
    Returns savepath of associated file
    """
    savepath = filepath[:-4] + "_ng-annotated.edf"
    # Get path to current file so this can be called from anywhere
    parent_folder_path = "/".join((os.path.abspath(__file__)).split("/")[:-1])
    classifier = EpilepsyClassifier(
        parent_folder_path + "/stored_models/" + MODEL_NAME
    )
    # Clasifies and saves file to path: savepath
    classifier.classify_on_edf(filepath, save_file=savepath)
    return savepath


def generate_key(filename):
    """Adds key value pair to the keymap fle
       filename is the file to be stored
    """
    def random_string(length=16):
        """Returns a random string of given length"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    
    key = random_string()
    with open(KEYMAP_FILENAME, "a") as keymap_file:
        keymap_file.write(key + ":" + filename + "\n")
        keymap_file.close()
    return key

def retrieve_filename(key, trim_tmp=True):
    """Reads keymap file and retrieves filename associated with key
    if trim_tmp, expects file to be in /tmp/ and trims /tmp/ from
    filename
    """
    keymap_dict = {}
    with open(KEYMAP_FILENAME, "r") as keymap_file:
        for line in keymap_file:
            read_key, read_val = line.split(":")
            keymap_dict[read_key] = read_val
    filename = keymap_dict[key]
    if trim_tmp:
        filename = filename[5:]
    return filename.strip() # strip \n characters


@app.route("/edf-upload", methods=["POST"])
def upload_edf():
    """Take in an edf and store it in /tmp/, classify on it
    and save the result. Then respond with the key from
    annotated file so it can be retrieved later, along with
    the data so it can be rendered
    """
    # Save file to /tmp/
    # WARNING: Overlapping filenames?
    f = request.files['file']
    original_filepath = "/tmp/" + f.filename
    f.save(original_filepath)

    # Classify on the saved file and grab where its save name
    save_file = classify_on_edf(original_filepath)

    # Generate key and store in keymap file for later retrieval
    file_key = generate_key(save_file)
    # Read data and annotations from edf
    edf = EDFReader(save_file)

    # Craft response including file_key, file_name, data, and annotations
    return make_response(jsonify({
        "file_key": file_key,
        "file_name": f.filename,
        "eeg_data": edf.to_data_frame().to_json(),
        "eeg_annotations": edf.get_annotations_as_df().to_json()
    }))


@app.route("/edf-download/<filekey>", methods=["GET"])
def download_edf(filekey):
    """Returns a file saved in /tmp/ if associated with keymap"""
    # WARNING: Will error if key not available
    filename = retrieve_filename(filekey, trim_tmp=True)
    return send_from_directory(directory="/tmp/", filename=filename)


if __name__ == "__main__":
    # serve called when run as a module
    # so it doesn't interfere with flask dev
    serve(app, listen='*:8080')
