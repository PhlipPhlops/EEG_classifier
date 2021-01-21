from matplotlib import colors
import matplotlib.pyplot as plt
import numpy as np

class Visualizer():
    def show_plot(self, eeg):
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

if __name__ == "__main__":
    from data_500hz_1s.load_data import data, labels
    INDEX = 3

    d = data[INDEX]
    l = labels[INDEX]
    print(f"Is epileptic: {bool(l)}")
    viz = Visualizer()
    
    viz.show_plot(d)