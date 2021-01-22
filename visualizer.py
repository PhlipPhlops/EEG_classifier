from matplotlib import colors
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
matplotlib.use('TkAgg')

class Visualizer():

    def register_onclick(self, plot, callback_left, callback_right):
        """Register callbacks to be triggered on the left and right
        arrow buttons when a plot is being shown
        """
        def onclick(event):
            if event.key == 'left':
                callback_left()
            if event.key == 'right':
                callback_right()
        
        plt.gcf().canvas.mpl_connect('key_press_event', onclick)
        
    def plot_eeg(self, eeg):
        """Visualize a single EEG instance as if it were an image.
        Amplitude of an electrode visualized as color
        """
        fig = plt.figure(figsize=(100,100))

        # Find min and max of all colors for setting the color scale
        vmin, vmax = eeg.min(), eeg.max()
        norm = colors.Normalize(vmin=vmin, vmax=vmax)
        
        # Load image
        img = plt.imshow(eeg)
        img.set_norm(norm)

        fig.colorbar(img, orientation='vertical', fraction=.1)
        plt.show()

    def plot_wave(self, time, amplitude):
        """Plots amplitude vs time, like a sine wave"""
        plt.plot(time, amplitude)
        plt.title('Sine wave')
        plt.xlabel('Time')
        plt.ylabel('Amplitude = sin(time)')
        plt.grid(True, which='both')
        plt.axhline(y=0, color='k')
        plt.show()

if __name__ == "__main__":
    from data_500hz_1s.load_data import data, labels
    INDEX = 3

    d = data[INDEX]
    l = labels[INDEX]
    print(f"Is epileptic: {bool(l)}")
    viz = Visualizer()
    
    viz.plot_eeg(d)
