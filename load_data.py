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

# International standard; 19 electrodes
# Expecting 1 second epoch at 500hz
EXPECTED_SHAPE = (19, 500)

# Expected for default clinic data
# EXPECTED_SHAPE = (26, 500)

def eeg_to_matrix(eeg):
    """Excludes non-standard electrodes,
    Trims the expected unnecessary columns from a loaded eeg .csv
    and returns as a numpy matrix
    1  -  Fp1
    2  -  F3
    3  -  F7
    4  -  C3
    5  -  T7 = T3
    6  -  P3
    7  -  P7 = T5
    8  -  O1
    9  -  Pz
    10  -  Fp2
    11  -  Fz
    12  -  F4
    13  -  F8
    14  -  Cz
    15  -  C4
    16  -  T8 = T4
    17  -  P4
    18  -  P8 = T6
    19  -  O2
    """
    KEPT_ELECTRODES = [
        'Fp1', 'F3', 'F7', 'C3', 'T3', 'P3', 'T5', 'O1', 'Pz',
        'Fp2', 'Fz', 'F4', 'F8', 'Cz', 'C4', 'T4', 'P4', 'T6', 'O2'
    ]
    # Different labels for the same electrodes
    KEPT_ELECTRODES.extend(['T7', 'P7', 'T8', 'P8'])
    # Electrodes labels look like "EEG Fp1", apply for string matching
    kept_labels = [el_label.upper() for el_label in KEPT_ELECTRODES]

    # Drop all electrodes aside from international standard
    # WARNING: Not safe to assume Time is a column on all .edf imports
    if 'Time' in eeg:
        eeg = eeg[eeg.apply(lambda row: any(label in row[0].upper() for label in kept_labels), axis=1)]
        # Sort alphabetically by electrode label (just for consistent ordering)
        eeg = eeg.sort_values('Time', ascending=True)
    else:
        # Assuming no electrode labels
        # Return a dead matrix to be caught by validator
        return np.asarray([])

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


def shuffle_maintain_relation(data_list, label_list, filename_list):
    """Returns data, labels shuffled, but with index relationship maintained"""
    temp = list(zip(data_list, label_list, filename_list))
    random.shuffle(temp)
    data_list, label_list, filename_list = zip(*temp)

    data_list = np.asarray(data_list)
    label_list = np.asarray(label_list)
    return data_list, label_list, filename_list

def load_eeg_data(data_directory='data_500hz_1s', shuffle_data=True,
                        load_negative_patients=False, show_ratio=False, 
                        scramble_electrodes=False, expose_filenames=False):
    """Returns a tuple of two values: a list of EEG matrices, a list of Epilepsy labels
    Data is gathered by loading every .csv in each subdirectory to this one
    Labels are gathered by looked at the suffix of the subdirectory

    load_negative_patient: if True, loads up epilepsy Negative patients, avoids
        epilepsy Postive patients marked as _E, and loads _NE patients as epilepsy positive
    show_ratio: show how many files are loaded for each patient
    scramble_electrodes: shuffle order of electrodes (rows)
    """
    print("====== Loading data ======")
    print(f"Loading from ./{data_directory}")
    print(f"Shuffle data: {shuffle_data}")
    print(f"Scramble electrodes: {scramble_electrodes}")
    print(f"Loading for epilepsy negative patients: {load_negative_patients}")
    
    print("Remember, expected structure of data directory is:")
    print("data_dir/*_E, data_dir/*_NE (and data_dir/Negative_Patients)")
    print("=====/ Loading data /=====")

    matrix_list = []
    label_list = []
    # for exposing filenames, not for data collection
    filename_list = []
    # Keys: Directory name, count
    ratio_count = {}
    # Index 0 counts label 0, Index 1 counts label 1
    info_counter = [0, 0]
    # Get path to current directory
    this_file_path = '/'.join((os.path.abspath(__file__)).split('/')[:-1])
    curr_dir_path = this_file_path + '/' + data_directory
    # grab all subdirectories in current directory
    # [1:] excludes the current './' directory
    directory_names = [x[0] for x in os.walk(curr_dir_path)][1:]
    for directory in directory_names:
        if load_negative_patients:
            # Set label based on directory suffix
            if directory.endswith('_E'):
                # Skip epilepsy positive events
                continue
            elif directory.endswith('_NE'):
                label = 1
            elif 'Negative_Patients' in directory:
                label = 0
            else:
                continue
        else:
            # Set label based on directory suffix
            if directory.endswith('_E'):
                label = 1
            elif directory.endswith('_NE'):
                label = 0
            else:
                continue

        ratio_count[directory] = 0
        # Load csv into matrices
        for csv in os.listdir(directory):
            path = directory + "/" + csv
            if not csv.endswith('.csv'):
                print(f"{path} not a .csv, skipping...")
                continue
            eeg = pd.read_csv(path, engine='python')
            matrix = eeg_to_matrix(eeg)

            if scramble_electrodes:
                # Shuffles only rows, not columns
                np.random.shuffle(matrix)

            def validation_err():
                print(f"Validation failed: {path}", end=' || ')
                print(f"Expected shape: {EXPECTED_SHAPE}, got {matrix.shape}")

            if validate_matrix(matrix, EXPECTED_SHAPE, validation_err):
                matrix_list.append(matrix)
                label_list.append(label)
                filename_list.append(csv)
                info_counter[label] += 1
                ratio_count[directory] += 1
    print(f"Loaded: {info_counter[1]} Epileptic, {info_counter[0]} Non-Epileptic @ ", end='')
    print(f"{EXPECTED_SHAPE[0]} electrodes, {EXPECTED_SHAPE[1]} Hz")
    # Show patient names and E/NE breakdown
    if show_ratio:
        for directory in ratio_count:
            print(f"{directory} + {ratio_count[directory]}")

    if shuffle_data:
        matrix_list, label_list, filename_list = shuffle_maintain_relation(
                                            matrix_list, label_list, filename_list)

    # Convert to np arrays
    matrix_list = np.array(matrix_list)
    label_list = np.array(label_list)

    if expose_filenames:
        return matrix_list, label_list, filename_list
    else:
        return matrix_list, label_list
