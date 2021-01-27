"""This script loads up a pretrained model to classify incoming eeg
data as either epileptic or non-epileptic

Loads data from a csv and passes a sliding window over it
"""
import pandas as pd
import numpy as np
from tensorflow import keras
from load_data import load_eeg_data
from transformations import Transforms
from scipy.signal import resample


def sliding_window():
    print("Assuming 500hz")
    WINDOW_SIZE = 500
    STEP_WIDTH = 200
    THRESHOLD = 0.5

    def i2sec(i, sample_rate=500):
        """convert index @ some hz to seconds as a string"""
        return "{:.2f}".format(i/sample_rate)

    # Import large data
    print("Loading (thicc) file")
    csv = pd.read_csv('./data_other/0_1000.csv', header=None)
    print("Loaded. Highlighting.")
    # csv = pd.read_pickle('./data_other/1ks_sample.pkl')
    data = csv.to_numpy()
    # Import model
    model = keras.models.load_model('./stored_models/19eX500hz_1s.95acc.h5')
    
    # Slide window across data
    last_print_i = 0
    for i in range(0, csv.shape[1]-WINDOW_SIZE, STEP_WIDTH):
        # Convert window into a "list" (one element) of windows
        window = np.array([data[:, i:(i+WINDOW_SIZE)]])
        transformed = Transforms().fourier_transform_all(window)
        # Reshape for predictor (n_images=1, x_shape, y_shape, channels)
        s = transformed.shape
        transformed = transformed.reshape(1, s[1], s[2], 1)
        prediction_list = model.predict(transformed)
        p = prediction_list[0][0]
        if p > THRESHOLD:
            if i - last_print_i > WINDOW_SIZE:
                print("-----------")
            console = "{}s-{}s: {:.2f}".format(i2sec(i), i2sec(i+WINDOW_SIZE), p)
            # console = "---> " + console
            print(console)
            last_print_i = i


sliding_window()


def classify_prechunked_data():
    model = keras.models.load_model('./stored_models/19eX500hz_1s.95acc.h5')
    data, labels, filenames = load_eeg_data(data_directory='.ignorable/data/test_200hz',
                                shuffle_data=False, expose_filenames=True)

    data = data[:,:,:200]
    data = resample(data, 500, axis=2)

    # Fourier Transform all data
    data = Transforms().fourier_transform_all(data)
    # Reshape to (n_images, x_shape, y_shape, channels)
    s = data.shape
    data = data.reshape(s[0], s[1], s[2], 1)
    print(s)

    predictions = model.predict(data)
    for i in range(len(predictions)):
        p = predictions[i][0]
        f = filenames[i]
        s = '{}, {:.2f}'.format(f, p)
        if p > 0.5:
            s = '---> ' + s
        print(s)

    evaluate = model.evaluate(data, labels, verbose=2)
