"""A suite of methods leveraging MNE to convert a .edf file
into model interpretable data or act (say, visualize) on the data
"""
import mne

class EDFReader():
    """Suit of methods for edf files"""
    def __init__(self, file_path):
        self.raw_edf = mne.io.read_raw_edf(file_path)

    def print_data(self):
        """Display values from edf"""
        print(self.raw_edf.load_data())

    def plot(self):
        self.raw_edf.plot()

    def to_data_frame(self):
        return self.raw_edf.to_data_frame().transpose()

edf = EDFReader('data_other/gabriel.edf')
edf.print_data()
edf.plot()
print(edf.to_data_frame())
