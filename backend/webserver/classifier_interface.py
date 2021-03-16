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

## Constants
# Points to a file in /tmp/ that fills with key/val pairs
KEYMAP_FILENAME = '/tmp/file_key_map.txt'
# The Neurogram model version to classify with
MODEL_NAME = 'neurogram_1.0.3.h5'


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


### FILE HANDLING METHODS #####################
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
#################################################

class ClassifierInterface:
    """This class interfaces the webserver and classifier to handle
    connection-specific events to the client
    """
    def __init__(self, sid):
        self.sid = sid

    def establish_connection(self):
        socketio.emit('establish', {'sid': self.sid}, room=self.sid)

    def initiate_classifier(self, filepath):
        # Read edf and register to interface
        edf = EDFReader(filepath)

        def on_percent(perc):
            """Callback to emit percent-done"""
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
            "eeg_annotations": edf.get_annotations_as_df().to_json()
        }

    def file_by_key(self, filekey):
        """Returns a file saved in /tmp/ if associated with keymap"""
        return retrieve_filename(filekey, trim_tmp=True)
