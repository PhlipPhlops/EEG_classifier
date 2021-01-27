"""Implements multiple transformation methods for 500hz eeg data"""
import numpy as np
import matplotlib.pyplot as plt
import scipy.fftpack
import scipy.stats

class Transforms():
    """Data transformation methods"""

    def entropy_transform(self, data):
        """Extract entropy data from EEG recordings

        data: list of eeg scan matrices
        """
        transformed = []
        for d in data:
            d_transformed = []
            for e in range(d.shape[0]):
                x = d[e]
                yf = scipy.stats.entropy(x)
                d_transformed.append(yf)
            d_transformed = np.asarray(d_transformed)
            transformed.append(yf)
        transformed = np.asarray(transformed)
        return transformed

    def fourier_transform_1e(self, data, electrode=17):
        """Decomposes timeseries data from a single electrode
        at index <electrode>

        data: list of eeg scan matrices
        electrode: defaults for 26 electrode scans: {17: Cz, 4: C3, 5: C4}
        """
        transformed = []
        for d in data:
            x = d[electrode]
            yf = scipy.fftpack.fft(x)
            transformed.append(yf)
        transformed = np.asarray(transformed)
        return transformed

    def fourier_transform_all(self, data):
        """Decomposes timeseries data from all electrodes into 2d array

        data: list of eeg scan matrices
        """
        transformed = []
        for d in data:
            d_transformed = []
            for e in range(d.shape[0]):
                # Grab data from electrode e
                x = d[e]
                # transform
                yf = scipy.fftpack.fft(x)
                d_transformed.append(yf)
            d_transformed = np.asarray(d_transformed)
            transformed.append(d_transformed)
        transformed = np.asarray(transformed)
        return transformed
        
    def hellohello_transform(self, data, window_size=64, step=14):
        """Transform based on notes provided by Daniele in Telegram post
        captioned "hello hello"

        Sliding window across electrode rows Cz, C3, C4, fft the window

        Stack fft from windows horizontally into row chunks
        Stack those row chunks from all 3 electrodes vertically
        
        data: list of eeg scan matrices
        """
        # Electrodes C3, CZ, C4 (assuming 26 electrode EEG)
        electrodes = [4, 17, 5]
        transformed = []
        for d in data:
            d_transformed = []
            for e in electrodes:
                # Grab data from electrode e
                x = d[e]
                pseudo_filters = []
                for i in range(0, len(x) - window_size, step):
                    # Sliding window
                    window = x[i : i + window_size]
                    f_window = scipy.fftpack.fft(window)
                    pseudo_filters.append(f_window)
                # arrange matrix of window_size x num_windows
                pseudo_filters = np.asarray(pseudo_filters)
                # stack the electrodes on top
                d_transformed.append(pseudo_filters)
            # stack the electrodes vertically
            d_transformed = np.asarray(d_transformed)
            d_transformed = np.reshape(d_transformed, (96, 64))
            transformed.append(d_transformed)
        transformed = np.asarray(transformed)
        return transformed


if __name__ == "__main__":
    from data_500hz_1s.load_data import data, labels

    t = Transforms()
    trans = t.entropy_transform(data)
    print(trans)