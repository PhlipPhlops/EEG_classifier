"""This is a script to import .csv files containing EEG data and reveal
that data as a Pandas dataframe to other scripts who need access

Imports all csv's stored in subdirectories of this module
Labeled based on folder name extension:
<name>_E: 1, true epilepsy
<name>_NE: 0, false epilepsy

exposes data, labels to files that import this module

Expected file structure
./<PATIENT_NAME>_<E, NE>/<*>.csv"""
import os
import random
import numpy as np
import pandas as pd

EXPECTED_SHAPE = (26, 500)

def eeg_to_matrix(eeg):
    """Trims the expected unnecessary columns from a loaded eeg .csv
    and returns as a numpy matrix"""
    # Drop unnamed last column
    eeg = eeg.drop(eeg.columns[len(eeg.columns)-1], axis=1)
    # Drop electrode labels
    eeg = eeg.drop(eeg.columns[0], axis=1)
    return eeg.to_numpy()

def validate_matrix(matrix, expected_shape, on_err):
    """Returns true (valid) if matrix shape matches expected
    otherwise, calls the on_err() method"""
    if matrix.shape != expected_shape:
        on_err()
    return matrix.shape == expected_shape

def load_patient_files():
    """Returns a tuple of two values: a list of EEG matrices, a list of Epilepsy labels
    Data is gathered by loading every .csv in each subdirectory to this one
    Labels are gathered by looked at the suffix of the subdirectory
    """
    matrix_list = []
    label_list = []
    # Index 0 counts label 0, Index 1 counts label 1
    info_counter = [0, 0]
    # Get path to current directory
    curr_dir_path = '/'.join((os.path.abspath(__file__)).split('/')[:-1])
    # grab all subdirectories in current directory
    # [1:] excludes the current './' directory
    directory_names = [x[0] for x in os.walk(curr_dir_path)][1:]
    for directory in directory_names:
        # Set label based on directory suffix
        if directory.endswith('_E'):
            label = 1
        elif directory.endswith('_NE'):
            label = 0
        # Load csv into matrices
        for csv in os.listdir(directory):
            path = directory + "/" + csv
            if not csv.endswith('.csv'):
                print(f"{path} not a .csv, skipping...")
                continue
            eeg = pd.read_csv(path, engine='python')
            matrix = eeg_to_matrix(eeg)

            def validation_err():
                print(f"Validation failed: {path}", end=' || ')
                print(f"Expected shape: {EXPECTED_SHAPE}, got {matrix.shape}")

            if validate_matrix(matrix, EXPECTED_SHAPE, validation_err):
                matrix_list.append(matrix)
                label_list.append(label)
                info_counter[label] += 1
    print(f"Loaded: {info_counter[1]} Epileptic, {info_counter[0]} Non-Epileptic @ ", end='')
    print(f"{EXPECTED_SHAPE[0]} electrodes, {EXPECTED_SHAPE[1]} Hz")
    return matrix_list, label_list

def shuffle_maintain_relation(data_list, label_list):
    """Returns data, labels shuffled, but with index relationship maintained"""
    temp = list(zip(data_list, label_list))
    random.shuffle(temp)
    data_list, label_list = zip(*temp)

    data_list = np.asarray(data_list)
    label_list = np.asarray(label_list)
    return data_list, label_list


data, labels = load_patient_files()
data, labels = shuffle_maintain_relation(data, labels)
