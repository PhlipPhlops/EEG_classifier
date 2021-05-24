"""A suite of methods leveraging MNE to convert a .edf file
into model interpretable data or act (say, visualize) on the data
"""
import mne
from scipy import signal

from .mne_base_reader import MNEBaseReader

class FIFReader(MNEBaseReader):
    """Suit of methods for fif files"""

    def __init__(self, file_path):
        MNEBaseReader.__init__(self, file_path)
