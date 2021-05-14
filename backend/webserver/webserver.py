"""Starts a web server
To test,
$ export FLASK_APP=web_server.py
$ flask run
"""
from flask import request, make_response, jsonify, send_from_directory
from .app_config import app, socketio, logger

from .classifier_interface import ClassifierInterface
from .eeg_chunker import EegChunker
from .socket_interface import SocketInterface
from .session_manager import saveFilenameToSession, getFilenameBySid
from .eeg_reader import save_agnostic_to_edf
from ..edf_reader import EDFReader, write_edf

from threading import Thread

@socketio.on('connect')
def establish_connection():
    # Handshake to verify connection
    SocketInterface().establish_connection(request.sid)

@app.route("/eeg-upload", methods=["POST"])
def upload_anytype_eeg():
    """Handles file upload of any supported type. Caches
    the file so its data is workable and annotations accessible
    """
    sid = request.form['sid']
    f = request.files['file']

    # Save to tmp
    og_filepath = "/tmp/" + f.filename
    f.save(og_filepath)
    # Convert file to RAW
    #   Read from main 3 types: edf, nihon, cnt
    # Path contains '/tmp/'
    edf_path = save_agnostic_to_edf(og_filepath)

    # Tell session manager where .edf is
    saveFilenameToSession(sid, edf_path)

    # Cache the edf as a dataframe
    chunker = EegChunker()
    chunker.cache_eeg_dataframe(sid, edf_path)

    # Tell client we're ready for it to request data chunks
    socketio.emit('edf uploaded', {}, room=sid)

    # Respond with sample rate
    response_data = {
        "sample_rate": chunker.get_sample_rate(sid, edf_path)
    }

    return make_response(jsonify(response_data))


@app.route("/set-annotations", methods=["POST"])
def save_annotations_to_file():
    """Processes annotations and saves to relevant file
    """
    sid = request.form['sid']
    onsets = list(map(float, request.form['onsets'].split(',')))
    durations = list(map(float, request.form['durations'].split(',')))
    # TODO: Clean this up for descriptions with commas
    descriptions = request.form['descriptions'].split(',')
    logger.info(onsets)
    # Find file
    filename = getFilenameBySid(sid)
    # Load as raw
    edf = EDFReader(filename)
    # Set annotations
    edf.set_annotations(onsets, durations, descriptions)
    # Save back to file
    write_edf(edf.raw_edf, filename, overwrite=True)
    # Return the saved annotations
    return edf.get_annotations_as_df().to_json()

@app.route("/get-annotations", methods=["POST"])
def get_annotations_from_file():
    """Grabs annotations already stored in file
    """
    sid = request.form['sid']
    filename = getFilenameBySid(sid)
    edf = EDFReader(filename)
    logger.info(edf.get_annotations_as_df())
    return edf.get_annotations_as_df().to_json()


@app.route("/edf-upload", methods=["POST"])
def upload_edf():
    """Take in an edf and store it in /tmp/, classify on it
    and save the result. Then respond with the key from
    annotated file so it can be retrieved later, along with
    the data so it can be rendered

    ### LEGACY ENDPOINT
    """
    sid = request.form['sid']
    logger.info(f"EDF-UPLOAD: {sid}")

    # Save file to /tmp/
    f = request.files['file']
    filepath = "/tmp/" + f.filename
    f.save(filepath)

    # Tell session manager where it is
    saveFilenameToSession(sid, f.filename)

    # Cache the edf as a dataframe
    chunker = EegChunker()
    chunker.cache_eeg_dataframe(sid, filepath)
    # Tell client we're ready for it to request data chunks
    socketio.emit('edf uploaded', {}, room=sid)

    # Initiate classifier on filepath
    ### Classifier Disabled; save EC2 resources while testing
    # def task():
    #     ClassifierInterface(sid).initiate_classifier(filepath)
    # thread = Thread(target=task)
    # thread.daemon = True
    # thread.start()

    response_data = {
        "sample_rate": chunker.get_sample_rate(sid, filepath)
    }

    return make_response(jsonify(response_data))


@app.route("/edf-download", methods=["POST"])
def download_edf():
    """Returns a file saved in /tmp/ if associated with keymap"""
    sid = request.form['sid']
    filename = getFilenameBySid(sid).lstrip('/tmp/')
    logger.info(f'Returning {filename}')
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
