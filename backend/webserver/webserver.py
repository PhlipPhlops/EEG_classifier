"""Starts a web server
To test,
$ export FLASK_APP=web_server.py
$ flask run
"""
from flask import request, make_response, jsonify, send_from_directory, Response, stream_with_context
from .app_config import app, socketio, logger

from .classifier_interface import ClassifierInterface
from .eeg_chunker import EegChunker


@socketio.on('connect')
def establish_connection():
    # Handshake to verify connection
    ClassifierInterface(request.sid).establish_connection()


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
    ### Classifier Disabled; blocking thread
    #response_data = ClassifierInterface(sid).initiate_classifier(filepath)
    response_data = {
            "file_key": '',
            "file_name": '',
            "eeg_annotations": '{}'
        }

    return make_response(jsonify(response_data))


@app.route("/edf-download/<filekey>", methods=["POST"])
def download_edf(filekey):
    """Returns a file saved in /tmp/ if associated with keymap"""
    # WARNING: Will error if key not available
    filename = ClassifierInterface(request.form['sid']).file_by_key(filekey)
    return send_from_directory(directory="/tmp/", filename=filename)

@app.route("/stream-test", methods=["POST"])
def gen_stream_test():
    def generate():
        for i in range(30):
            logger.info(f"Stream Test {i}")
            yield jsonify({
                "val": i
            })
    return Response(stream_with_context(generate()), content_type='application/json')

@app.route("/stream-data", methods=["POST"])
def generate_stream():
    sid = request.form['sid']
    num_chunks = int(request.form['num_chunks'])
    def generate_chunks():
        chunk_i = 0
        chunker = EegChunker()
        while chunk_i < num_chunks:
            chunk_df = chunker.chunk_as_data_frame(sid, chunk_i, num_chunks)
            chunk_i += 1
            logger.info(f"CHUNK REQUESTED {chunk_i}/{num_chunks}")
            yield jsonify({
                "eeg_chunk": chunk_df.to_json()
            })
    return Response(stream_with_context(generate_chunks()), content_type='application/json', status=200)

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
