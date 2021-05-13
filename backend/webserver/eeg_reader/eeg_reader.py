"""These methods allow you to read an EEG to an mne.io.RAW and access it later
"""

import mne
from .save_edf import write_edf

def _read_to_raw(filepath):
  """Filetype agnostic method that reads to mne RAW type"""
  read_methods = {
    'edf': mne.io.read_raw_edf,
    'eeg': mne.io.read_raw_nihon,
    'cnt': mne.io.read_raw_cnt,
  }
  # Grab extension to determine
  extension = filepath.split('.')[-1]
  read_file = read_methods[extension.lower()]

  raw = read_file(filepath)
  return raw

def save_agnostic_to_edf(filepath):
  """Saves an agnostic filetype to .edf to work with later
  Returns the path to the edf
  """
  raw = _read_to_raw(filepath)
  edf_path = '.'.join(filepath.split('.')[:-1]) + '.edf'
  write_edf(raw, edf_path, overwrite=True)
  return edf_path
  