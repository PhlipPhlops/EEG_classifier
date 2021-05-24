"""A suite of methods leveraging MNE to convert a .edf file
into model interpretable data or act (say, visualize) on the data
"""
import mne
import pandas as pd
from scipy import signal


class MNEBaseReader:
    """Suit of methods for raw"""

    def __init__(self, file_path):
        self.file_path = file_path
        self.raw = self.read_raw(file_path)
        self.info = self.raw.info
        self.sample_rate = self.info["sfreq"]
        self.df = None
        print(f"This file has a sample rate of {self.sample_rate}Hz")

    def read_raw(self, file_path):
        """Reads a raw from file and returns"""
        # Note: Passing this preload=True method is a compute-time expensive
        # work-around to the .save() method not allowing save to the same file
        # This loads all data into RAM immediately (thus every time this)
        # class is init'ed) rather than leaving a memory map.
        return mne.io.read_raw_fif(file_path, preload=True)

    def to_data_frame(self):
        """Returns a dataframe of (#electrodes)x(#timesteps)"""
        return self.raw.to_data_frame(scalings={"eeg": 1}).transpose()

    def plot(self):
        """Plot to visual waveforms"""
        self.raw.plot(block=True)

    def resample(self, sample_rate):
        """Change the samplerate"""
        self.raw.resample(sample_rate)
        self.sample_rate = self.raw.info["sfreq"]

    def get_annotations_as_df(self):
        """Grab the annotations stored in the original file as
        pandas dataframe
        """
        try:
            annotations = mne.read_annotations(self.file_path)
            annotations = annotations.to_data_frame()
        except OSError:
            # No annotations existed
            annotations = pd.DataFrame({
                'onset': [],
                'duration': [],
                'description': [],
            })
        return annotations

    def set_annotations(self, onsets, durations, descriptions):
        annotations = mne.Annotations(onsets, durations, descriptions)
        self.raw.set_annotations(annotations)

    def save(self):
        self.raw.save(self.file_path, overwrite=True)