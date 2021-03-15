"""A suite of methods leveraging MNE to convert a .edf file
into model interpretable data or act (say, visualize) on the data
"""
import mne
from scipy import signal

from .save_edf import write_edf


class EDFReader:
    """Suit of methods for edf files"""

    def __init__(self, file_path):
        self.file_path = file_path
        self.raw_edf = mne.io.read_raw_edf(file_path)
        self.info = self.raw_edf.info
        self.sample_rate = self.info["sfreq"]
        self.df = None
        print(f"This file has a sample rate of {self.sample_rate}Hz")

    def to_data_frame(self):
        """Returns a dataframe of (#electrodes)x(#timesteps)"""
        return self.raw_edf.to_data_frame(scalings={"eeg": 1}).transpose()

    def plot(self):
        """Plot to visual waveforms"""
        self.raw_edf.plot(block=True)

    def resample(self, sample_rate):
        """Change the samplerate"""
        self.raw_edf.resample(sample_rate)
        self.sample_rate = self.raw_edf.info["sfreq"]

    def get_annotations_as_df(self):
        """Grab the annotations stored in the original file as
        pandas dataframe
        """
        annotations = mne.read_annotations(self.file_path)
        return annotations.to_data_frame()

    def data_to_resampled_matrix(self, new_samplerate):
        data = self.data_to_standard_matrix()
        # new num samples = length of data * (new_samplerate / old_samplerate)
        num_samples = int(
            data.shape[1] * (float(new_samplerate) / float(self.sample_rate))
        )
        new_data = signal.resample(data, num_samples, axis=1)

        return new_data

    def data_to_standard_matrix(self):
        """Returns data as a numpy matrix excluding rows from non-standard
        electrodes
        """
        KEPT_ELECTRODES = [
            "Fp1",
            "F3",
            "F7",
            "C3",
            "T3",
            "P3",
            "T5",
            "O1",
            "Pz",
            "Fp2",
            "Fz",
            "F4",
            "F8",
            "Cz",
            "C4",
            "T4",
            "P4",
            "T6",
            "O2",
        ]
        # Different labels for the same electrodes
        KEPT_ELECTRODES.extend(["T7", "P7", "T8", "P8"])
        # # HACK: EXTENDING FOR DANI DELAY
        # KEPT_ELECTRODES.extend(['A1', 'A2'])

        # Electrodes labels look like "EEG Fp1", apply for string matching
        kept_e = [el_label.upper() for el_label in KEPT_ELECTRODES]

        eeg = self.to_data_frame()
        ## TODO: FIX THE LABEL SLICING PROBLEM
        # print(eeg)
        # Drop all electrodes aside from international standard
        # def filter_row(row):
        #     el_name = row.name.upper()
        #     # Split on spaces
        #     electrode = el_name.split(' ')[-1]
        #     return any(label == electrode for label in kept_e)
        # eeg = eeg[eeg.apply(filter_row, axis=1)]
        eeg = eeg[
            eeg.apply(
                lambda row: any(label in row.name.upper() for label in kept_e), axis=1
            )
        ]
        # Would sort alphabetically for consistency, but assuming EDF has its own consistency
        return eeg.to_numpy()
