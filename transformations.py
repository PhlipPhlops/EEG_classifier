"""Implements multiple transformation methods for 500hz eeg data"""
import numpy as np
import matplotlib.pyplot as plt
import scipy.fftpack

class Transforms():
    """Data transformation methods"""

    def fourier_transform(self, electrode):
        """Decomposes timeseries data from a single electrode
        at index <electrode>
        """
        # Number of samplepoints
        N = 600
        # Sample spacing
        T = 1.0 / 500.0
        # x = np.linspace(0.0, N*T, N)
        x = data[1][electrode]
        # y = np.sin(50.0 * 2.0*np.pi*x) + 0.5*np.sin(80.0 * 2.0*np.pi*x)
        yf = scipy.fftpack.fft(x)
        xf = np.linspace(0.0, int(1.0/(2.0*T)), int(N/2))
        


if __name__ == "__main__":
    from data_500hz_1s.load_data import data, labels
    from visualizer import Visualizer

    # Number of samplepoints
    N = 600
    # Sample spacing
    T = 1.0 / 500.0
    # x = np.linspace(0.0, N*T, N)
    x = data[1][1]
    # y = np.sin(50.0 * 2.0*np.pi*x) + 0.5*np.sin(80.0 * 2.0*np.pi*x)
    yf = scipy.fftpack.fft(x)
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
