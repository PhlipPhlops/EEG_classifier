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
        self.df = self.raw.to_data_frame(scalings={"eeg": 1})
        print(f"This file has a sample rate of {self.sample_rate}Hz")

    def read_raw(self, file_path):
        """Reads a raw from file and returns"""
        # Note: Passing this preload=True method is a compute-time expensive
        # work-around to the .save() method not allowing save to the same file
        # This loads all data into RAM immediately (thus every time this)
        # class is init'ed) rather than leaving a memory map.
        return mne.io.read_raw_fif(file_path, preload=True)

    def filter_body_motion(self):
        """Applies a 0.57hz lowpass filter to the data"""
        self.raw.filter(0.57, None)
        self.df = self.raw.to_data_frame(scalings={"eeg": 1})

    def bipolar_preprocess_DEPRECATE_SOON(self):
        """Applies a standard bipolar montage subtraction to the dataframe
        """
        df = self.df

        # Apply montage
        montage = [
            # Bipolar data is [0] - [1]
            ['FP1', 'F3'],
            ['F3','C3'],
            ['C3','P3'],
            ['P3','O1'],
            ['FP1','F7'],
            ['F7','T3'],
            ['T3','T5'],
            ['T5','O1'],
            ['FZ','CZ'],
            ['CZ','PZ'],
            ['FP2','F4'],
            ['F4','C4'],
            ['C4','P4'],
            ['P4','O2'],
            ['FP2','F8'],
            ['F8','T4'],
            ['T4','T6'],
            ['T6','O2'],
            ['T1','A1'],
            ['A1','A2'],
            ['A2','T2'],
            ['T2','T1'],
        ]

        kept_columns = []
        for m in montage:
            if not m[0] in df.columns or not m[1] in df.columns:
                continue
            column_name = f'{m[0]}-{m[1]}'
            kept_columns.append(column_name)
            # Create the new bipolar columns
            df[column_name] = df[m[0]] - df[m[1]]
        # Keep only bipolar columns
        self.df = df[kept_columns]

    def to_data_frame(self):
        """Returns a dataframe of (#electrodes)x(#timesteps)"""
        return self.df.transpose()

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