"""Implements multiple transformation methods for 500hz eeg data"""
import numpy as np
import matplotlib.pyplot as plt
import scipy.fftpack

class Transforms():
    """Data transformation methods"""

    def fourier_transform_1e(self, data, electrode=17):
        """Decomposes timeseries data from a single electrode
        at index <electrode>

        data: list of eeg scan matrices
        electrode: defaults for 26 electrode scans: {17: Cz, 4: C3, 5: C4}
        """
        transformed = []
        for d in data:
            x = d[electrode]
            # y = np.sin(50.0 * 2.0*np.pi*x) + 0.5*np.sin(80.0 * 2.0*np.pi*x)
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
        


if __name__ == "__main__":
    from data_500hz_1s.load_data import data, labels
    from visualizer import Visualizer

    t = Transforms()
    data = t.fourier_transform(data)
    print(data.shape)

    # # Number of samplepoints
    N = 600
    # # Sample spacing
    T = 1.0 / 500.0
    # # x = np.linspace(0.0, N*T, N)
    # x = data[1][1]
    # # y = np.sin(50.0 * 2.0*np.pi*x) + 0.5*np.sin(80.0 * 2.0*np.pi*x)
    # yf = scipy.fftpack.fft(x)
    yf = data[1]
    xf = np.linspace(0.0, int(1.0/(2.0*T)), int(N/2))

    fig, ax = plt.subplots()
    ax.plot(xf, 2.0/N * np.abs(yf[:int(N/2)]))
    plt.show()

    # # d is an eeg matrix shape (26, 500)
    # d = data[1]
    # # now d is a single electrode shape (500,)
    # d = d[1]
    # fourier = np.fft.fft(d)
    # # fourier shape is (500,)
    # print(fourier.shape)
    # print(fourier)
    # print(fourier.dtype)

    # fq = 10.
    # time_interval = 1
    # samples = 10

    # t, y = tra._generate_sinewave(fq, time_interval, samples)
    # viz.plot_wave(t, y)

    # time = np.arange(0, 10, 0.1)
    # amplitude = np.sin(time)
    # viz.plot_wave(time, amplitude)
