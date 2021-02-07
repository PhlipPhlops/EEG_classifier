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
from scipy import signal
from .edf_reader import EDFReader

# International standard; 19 electrodes
# Expecting .5 second epoch at 500hz
DESIRED_SAMPLE_RATE = 500
EXPECTED_SHAPE = (19, 250)

def eeg_to_matrix(eeg):
    """Excludes non-standard electrodes, leaving 19,
    Trims the expected unnecessary columns from a loaded eeg .csv
    and returns as a numpy matrix shape (19 X width)
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
        ## Disabled since behavior is not replicated in EDFs
        #eeg = eeg.sort_values('Time', ascending=True)
    else:
        # Assuming no electrode labels
        # Return a dead matrix to be caught by validator
        return np.asarray([])

    # Drop unnamed last column
    eeg = eeg.drop(eeg.columns[len(eeg.columns)-1], axis=1)

    # Drop electrode labels
    eeg = eeg.drop(eeg.columns[0], axis=1)
    return eeg.to_numpy()

def validate_matrix(matrix, on_err):
    """Returns true (valid) if matrix contains expected
    number of electrodes (row count),
    otherwise calls the on_err() method"""
    is_valid = matrix.shape[0] == EXPECTED_SHAPE[0]
    if not is_valid:
        on_err()
    return is_valid


def shuffle_maintain_relation(data_list, label_list, filename_list=[]):
    """Returns data, labels shuffled, but with index relationship maintained"""
    if len(filename_list) == 0:
        temp = list(zip(data_list, label_list))
        random.shuffle(temp)
        data_list, label_list = zip(*temp)

        data_list = np.asarray(data_list)
        label_list = np.asarray(label_list)
        return data_list, label_list
    else:
        temp = list(zip(data_list, label_list, filename_list))
        random.shuffle(temp)
        data_list, label_list, filename_list = zip(*temp)

        data_list = np.asarray(data_list)
        label_list = np.asarray(label_list)
        return data_list, label_list, filename_list


def chop_into_windows(data, window_width):
    """Takes in a matrix of dimensions (e X M)
    Chops into window_count equidistance windows
        of width window_width
    Returns a list of matrices shaped [(e X window_width)]
    """
    window_list = []
    window_count = int(data.shape[1] / window_width)
    for i in range(0, window_count):
        split_i = i * window_width
        window_list.append(data[:, split_i:(split_i+window_width)])
    return window_list


def data_from_csv(file_path, csv_sample_rate):
    """Loads .csv into a list of .5 second chunks
       Upsamples the data to 500Hz before cutting
       Returns a list of matrices
    """
    eeg = pd.read_csv(file_path, engine='python')
    data_matrix = eeg_to_matrix(eeg)

    def validation_err():
        print(f"Validation failed: {file_path}", end=' || ')
        print(f"Expected shape: ({EXPECTED_SHAPE[0]}, _), got {data_matrix.shape}")

    if not validate_matrix(data_matrix, validation_err):
        # Return a dead list to be ignored if malformed data
        return []

    if csv_sample_rate != 500:
        # Resample to 500hz
        resample_ratio = float(DESIRED_SAMPLE_RATE) / float(csv_sample_rate)
        num_samples = int(data_matrix.shape[1] * resample_ratio)
        data_matrix = signal.resample(data_matrix, num_samples, axis=1)

    data_list = chop_into_windows(data_matrix, EXPECTED_SHAPE[1])
    return data_list


def data_from_edf(file_path):
    """Loads .edf into a list of .5 second chunks,
       Resamples to 500Hz before cutting
       Returns a list of matrices
    """
    edf = EDFReader(file_path)
    data_matrix = edf.data_to_resampled_matrix(500)
    data_list = chop_into_windows(data_matrix, EXPECTED_SHAPE[1])
    return data_list


def load_from_folder(folder_path, label):
    """Loads data from a given folder, marking each the same label
    Handles .csv and .edf separately
    Loads in the shape of standard EEG matrices [(19eX250)]

    Determines whether to resample by the number in the directory path
        THIS CAN POSE A PROBLEM IF THERE'S A "500" STRING ANYWHERE
        IN THE SYSTEM PATH
    If detects a 500, leaves samplerate alone
    If detects a 200, upsamples to 500hz

    Returns a tuple of two lists: a list of standard EEG matrics,
            a list of the same length containing the data's label,
    """
    matrix_list = []
    # Get path to current file so this can be called from anywhere
    this_file_path = '/'.join((os.path.abspath(__file__)).split('/')[:-1])
    curr_dir_path = this_file_path + '/' + folder_path
    # grab subdirectory paths in the current directory
    # [1:] excludes the current './' directory
    directory_names = [x[0] for x in os.walk(curr_dir_path)][1:]
    for directory in directory_names:
        # Set samplerate to 200 if 500 isn't found in the directory name
        samplerate = 200
        if "500" in directory:
            samplerate = 500

        for file_name in os.listdir(directory):
            # sees every file in the parent folder
            file_path = directory + '/' + file_name

            loaded_data = []
            if file_name.endswith('.csv'):
                loaded_data = data_from_csv(file_path, samplerate)
            elif file_name.endswith('.edf'):
                loaded_data = data_from_edf(file_path)
            matrix_list.extend(loaded_data)
    # Generate labels and return
    label_list = [label] * len(matrix_list)
    return matrix_list, label_list


def load_training_data(shuffle_data=True, balance_data=True):
    """Returns a tuple of two values: a list of EEG matrices, a list of Epilepsy labels
    Data is gathered by loading every .csv in each subdirectory to this one
    Labels are gathered by looked at the suffix of the subdirectory

    if balance_data is True, will throw out most non-epileptic events
    at random, keeping only as many as there are epileptic event
    """
    data_dir = 'data_training/'
    e_positive_dir = data_dir + 'epileptic'
    e_negative_dir = data_dir + 'non_epileptic'

    print("====== Loading data ======")
    print(f"Loading from ./{data_dir}")
    print(f"Shuffle data: {shuffle_data}")
    print("Chill for a sec, this'll take a bit.")

    pos_matrices, pos_labels = load_from_folder(e_positive_dir, 1)
    neg_matrices, neg_labels = load_from_folder(e_negative_dir, 0)

    print("")
    print("Loaded.")
    print(f"Count epileptic: {len(pos_labels)}")
    print(f"Count non-epileptic: {len(neg_labels)}")

    if balance_data:
        print("Balancing...")
        num_samples = len(pos_labels)
        neg_matrices = random.sample(neg_matrices, num_samples)
        neg_labels = neg_labels[:num_samples]

    matrix_list, label_list = [], []
    matrix_list.extend(pos_matrices)
    matrix_list.extend(neg_matrices)
    label_list.extend(pos_labels)
    label_list.extend(neg_labels)

    if shuffle_data:
        matrix_list, label_list = shuffle_maintain_relation(matrix_list, label_list)

    matrix_list = np.array(matrix_list)
    label_list = np.array(label_list)

    print(f"Final shapes of data, labels: {matrix_list.shape}, {label_list.shape}")
    print("=====/ Loading data /=====")

    return matrix_list, label_list

if __name__ == "__main__":
    m, l = load_training_data()


"""
Deprecated below this point, kept for reference
"""

def DEPRECATED_load_eeg_data(data_directory='data_500hz_1s', shuffle_data=True,
                        load_negative_patients=False, show_ratio=False, 
                        scramble_electrodes=False, expose_filenames=False):
    """Returns a tuple of two values: a list of EEG matrices, a list of Epilepsy labels
    Data is gathered by loading every .csv in each subdirectory to this one
    Labels are gathered by looked at the suffix of the subdirectory

    DEPRECATED

    load_negative_patient: if True, loads up epilepsy Negative patients, avoids
        epilepsy Postive patients marked as _E, and loads _NE patients as epilepsy positive
    show_ratio: show how many files are loaded for each patient
    scramble_electrodes: shuffle order of electrodes (rows)
    """
    print("load_eeg_data() is deprecated.")
    exit(1)

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
