"""This file presents a network/websocket interface to communicate
with the client while handling methods in the edf classification task,
including classification, file transfer, data transfer, etc.
"""
import os
import random
import string

from .app_config import socketio
from ..classify_epilepsy import EpilepsyClassifier
from ..edf_reader import EDFReader


def classify_on_edf(filepath, edf, percent_callback=None):
    """Runs the (long) method to classify epileptic
    discharges on EDF dta
    Returns savepath of associated file
    """
    savepath = filepath[:-4] + "_ng-annotated.edf"
    # Get path to current module so this can be called from anywhere
    parent_folder_path = "/".join((os.path.abspath(__file__)).split("/")[:-2])
    classifier = EpilepsyClassifier(
        parent_folder_path + "/stored_models/" + MODEL_NAME
    )
    # Classifies and saves file to path: savepath
    classifier.classify_on_edf(edf, save_file=savepath, percent_callback=percent_callback)
    return savepath


class ClassifierInterface:
    """This class interfaces the webserver and classifier to handle
    connection-specific events to the client
    """
    # The Neurogram model version to classify with
    MODEL_NAME = 'neurogram_1.0.3.h5'

    def __init__(self, sid):
        self.sid = sid

    def initiate_classifier(self, filepath):
        # Read edf and register to interface
        edf = EDFReader(filepath)

        def on_percent(perc):
            """Callback to emit percent-done"""
            # TODO: move to sessionmanager
            socketio.emit('loading', {'percent': perc}, room=self.sid)

        # Classify on the saved file and grab where its save name
        save_file = classify_on_edf(filepath, edf, percent_callback=on_percent)
        # Generate key and store in keymap file for later retrieval
        file_key = generate_key(save_file)
        # Read data and annotations from edf
        edf = EDFReader(save_file)
        # Return response data (will be jsonified)
        return {
            "file_key": file_key,
            ## Might break, was f.filename
            "file_name": save_file,
            # "eeg_annotations": edf.get_annotations_as_df().to_json()
        }

    def file_by_key(self, filekey):
        """Returns a file saved in /tmp/ if associated with keymap"""
        # TODO: move to sessionmanager method
        return retrieve_filename(filekey, trim_tmp=True)
