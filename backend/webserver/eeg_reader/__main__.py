"""Load and plot EEG"""
import mne
from .save_edf import write_edf
import numpy as np
import sys
import os

# Site linewidth for easier comparison
np.set_printoptions(edgeitems=10)
np.core.arrayprint._line_width = 180


# Path to EEG that was blowing a fuse
EEG_path = '/home/phalcon/Desktop/Neurogram-other/FA0751KH.EEG'
edf_path = '/home/phalcon/Desktop/Neurogram-other/edf_test/FA0751KH.edf'

EEG_raw = mne.io.read_raw_nihon(EEG_path)
write_edf(EEG_raw, edf_path, overwrite=True)




def full_directory_analysis():
  analysis = []

  def read_write_compare(filepath):
    print(f'\n{filepath}')
    if filepath.endswith('.EEG'):
      orig_raw = mne.io.read_raw_nihon(filepath)
    elif filepath.endswith('.edf'):
      orig_raw = mne.io.read_raw_edf(filepath)
    else:
      return
    # Convert filename to edf
    edf_path = '.'.join(filepath.split('.')[:-1]) + '.edf'
    # Dump edf to edf_test folder
    split_path = edf_path.split('/')
    filename = split_path[-1]
    split_path = split_path[:-1]
    split_path.append('edf_test')
    split_path.append(filename)
    edf_path = '/'.join(split_path)
    # Write to edf path
    write_edf(orig_raw, edf_path, overwrite=True, orig_fname=filepath)
    # Read from edf
    edf_raw = mne.io.read_raw_edf(edf_path)
    # Compare data
    orig_data = orig_raw.get_data()
    edf_data = edf_raw.get_data()
    # Explore data
    check = orig_data == edf_data

    if type(check) == bool:
      analysis.append(f"{filepath}: check == {check}")
    else:
      analysis.append(f"{filepath}: any(): {check.any()}, all(): {check.all()}")

    analysis.append(orig_data.dtype)
    analysis.append(orig_data[10:13,100:104])
    analysis.append(edf_data.dtype)
    analysis.append(edf_data[10:13,100:104])
    analysis.append('\n\n')


  dir1 = '/home/phalcon/Projects/Neurogram/backend/data'
  dir2 = '/home/phalcon/Desktop/Neurogram-other'

  paths = [dir1 + '/' + filename for filename in os.listdir(dir1)]
  paths.extend([dir2 + '/' + filename for filename in os.listdir(dir2)])

  for path in paths:
    read_write_compare(path)

  print("\n\n\n##### ANALYSIS #####\n\n\n")
  for string in analysis:
    print(string)