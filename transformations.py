"""Implements multiple transformation methods for 500hz eeg data"""
import numpy as np
import matplotlib.pyplot as plt
import scipy.fftpack
import scipy.stats
import scipy.signal as signal

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

    def resample(self, data, samplerate, new_samplerate):
        """Applied Scipy's use of fourier transforms to resample data
        
        data: an np list containing matrices of data
        new_sr: int, new sample rate
        """
        print("===== RESAMPLING =====")
        # new num samples = length of data * (new_samplerate / old_samplerate)
        num_samples = int(data.shape[2] * (float(new_samplerate) / float(samplerate)))
        new_data = signal.resample(data, num_samples, axis=2)
        print(data.shape)
        print(new_data.shape)
        print("====/ RESAMPLING /====")

        return new_data


if __name__ == "__main__":
    import pandas as pd
    from scipy import signal
    
    def testResample():
        tra = Transforms()
        
        # Test import of large data
        csv = pd.read_pickle('./data_other/1ks_sample.pkl')
        data = csv.to_numpy()
        print(data)
        print(data.shape)
        d2 = tra.resample(data, 3)
        print(d2)
        print(data.shape)

    def scipyEg():
        x = np.linspace(0, 100, 20, endpoint=False)
        y = np.cos(-x**2/6.0)

        newsr = 400

        f = signal.resample(y, newsr)
        xnew = np.linspace(0, 100, newsr, endpoint=False)

        import matplotlib.pyplot as plt
        plt.plot(x, y, 'go-', xnew, f, '.-')
        plt.legend(['data', 'resampled'], loc='best')
        plt.show()

    def scipyEgWMyData():
        # Load data
        csv = pd.read_pickle('./data_other/1ks_sample.pkl')
        data = csv.to_numpy()

        num_samples = 40
        new_samplerate = 400
        # num points to display
        nptd = 100
        
        d = data[:, :num_samples]

        x = np.linspace(0, nptd, num_samples, endpoint=False)
        y = d[0]

        f = signal.resample(d, new_samplerate, axis=1)
        # print(d[0])
        # print(f[0])
        f0 = f[0]
        xnew = np.linspace(0, nptd, new_samplerate, endpoint=False)
        print('shapes')
        print(d.shape)
        print(f.shape)

        import matplotlib.pyplot as plt
        plt.plot(x, y, 'g-', xnew, f0, '-')
        plt.legend(['data', 'resampled'], loc='best')
        plt.show()

    scipyEgWMyData()