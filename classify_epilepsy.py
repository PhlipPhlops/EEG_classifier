"""This script loads up a pretrained model to classify incoming eeg
data as either epileptic or non-epileptic

Loads data from a csv and passes a sliding window over it
"""
import pandas as pd
import numpy as np
import sys
from tensorflow import keras
from transformations import Transforms
from scipy.signal import resample

import mne
from edf_reader import EDFReader
from load_data import eeg_to_matrix
from save_edf import write_edf

class EpilepsyClassifier():
    def __init__(self, model_path, sample_rate=500):
        """Loads clasifer model
        
        model_path: path to saved model
        sample_rate: frequency at which to base classifications
        """
        self.sample_rate = sample_rate
        self.model = keras.models.load_model(model_path)   

    def _sliding_window(self, data, positive_threshold=0.5, sample_rate=500,
                        window_size=250, step_width=200):
        """Passes a sliding window over the data, passing the window
        into the given model to classify for epileptic discharges.

        data: np matrix of (#electrodes)x(#timesteps in entiredataset)
        positive_threshold: cutoff probability for what should be reported as
            epilepsy positive [0, 1]
        window_size: size of the window to be passed into the model
            must match the input shape that the model is expecting
        step_width: number of timesteps for the window to travel each iteration
        
        returns: onsets, durations
            where onsets is a list reporting where an annotation starts
            and durations reports duration of index-corresponding annotation
            all in seconds
        """

        def i2sec(i):
            """convert index (a timestamp at some {samplerate}Hz) to seconds"""
            return float(i/sample_rate)

        print("Classifying, hold your horses.")
        percent_step = .10

        # Slide window across data
        # Collect positive indices and prediction confidence
        positive_indices = []
        prediction_confs = []
        for i in range(0, data.shape[1]-window_size, step_width):
            if float(i) / data.shape[1] >= percent_step:
                print(f"{percent_step*100}%: {i}/{data.shape[1]}")
                percent_step += .10
            # Convert window into a "list" (one element) of windows
            # needs to be in a list for the following transform
            window = np.array([data[:, i:(i+window_size)]])
            transformed = Transforms().fourier_transform_all(window)
            # Reshape for predictor (n_images=1, x_shape, y_shape, channels)
            s = transformed.shape
            transformed = transformed.reshape(1, s[1], s[2], 1)
            # Predict on the "list" of windows
            prediction_list = self.model.predict(transformed)
            # Grab the prediction value
            p = prediction_list[0][0]

            if p > positive_threshold:
                positive_indices.append(i)
                prediction_confs.append(p)
        
        # parse positive indices for onsets and durations
        onsets = []
        durations = []
        descriptions = []

        if len(positive_indices) > 0:
            # j is an index of this list
            # i is the index of the original data
            ws_j = 0
            last_i_j = 0
            for j in range(1, len(positive_indices[1:])):
                window_start = positive_indices[ws_j]
                last_i = positive_indices[last_i_j]
                i = positive_indices[j]
                if i - last_i > window_size:
                    onset = i2sec(window_start)
                    duration = (i2sec(last_i) - onset) + i2sec(window_size)
                    
                    if ws_j == last_i_j:
                        prob = prediction_confs[last_i_j]
                    else:
                        prob = max(prediction_confs[ws_j:last_i_j])
                    description = "{:.2f}".format(prob) + "pc"

                    onsets.append(onset)
                    durations.append(duration)
                    descriptions.append(description)

                    ws_j = j
                last_i_j = j

        return onsets, durations, descriptions


    def classify_on_edf(self, file_name, save_file=''):
        """Passes a sliding window over the data, passing the window
        into the given model to classify for epileptic discharges.

        data: np matrix of (#electrodes)x(#timesteps)
        """ 
        print("=======")
        print(file_name)
        edf = EDFReader(file_name)
        data = edf.data_to_resampled_matrix(self.sample_rate)
        raw = edf.raw_edf
        
        # The meat of the classification
        onsets, durations, descriptions = self._sliding_window(data)
        # Save annotations to edf
        annotations = mne.Annotations(onsets, durations, descriptions)
        raw.set_annotations(annotations)
        if save_file != '':
            write_edf(raw, save_file, overwrite=True)

        return raw



if __name__ == "__main__":
    filename = sys.argv[1]
    save_name = filename[:-4] + '_0.5.2.edf'
    classifier = EpilepsyClassifier('./stored_models/neurogram_0.5.2.h5')
    edf = classifier.classify_on_edf(filename, save_file=save_name)
    print(edf.annotations)
    print(f"Saved to {save_name}")
