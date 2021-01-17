import os
import numpy as np
import pandas as pd
import random

SKIP_FAULTY_FIRST_FILES = True
if SKIP_FAULTY_FIRST_FILES: print("WARNING: Skipping first files for formatting issues")

def eeg_to_matrix(eeg):
  # Drop unnamed last column
  eeg = eeg.drop(eeg.columns[len(eeg.columns)-1], axis=1)
  # Drop electrode labels
  eeg = eeg.drop(eeg.columns[0], axis=1)
  # Should return shape (26, 1000)
  # 26 electrodes, 1000 measurements
  return eeg.to_numpy()


# Expected file structure
# data/<PATIENT_NAME>/<E, NE, A>/<#>.csv
# Returns numpy matrix of patients and labels from a patients subfolder
def sort_patient_files(patients, subfolder, label):
  data = []
  labels = []
  for patient in patients:
    path = "data/" + patient + "/" + subfolder
    for file in os.listdir(path):
      if file.endswith(".csv"):
        eeg = pd.read_csv(path + "/" + file)
        if SKIP_FAULTY_FIRST_FILES and not 'Time' in eeg.columns:
          continue
        matrix = eeg_to_matrix(eeg)
        data.append(matrix)
        labels.append(label)
  return data, labels

# LABELS: 1 for true epilepsy, 0 for not-epilepsy

PATIENT_NAMES = ['Leliane']

data = []
labels = []

d, l = sort_patient_files(PATIENT_NAMES, 'NE', 0)
data.extend(d)
labels.extend(l)

d, l = sort_patient_files(PATIENT_NAMES, 'A', 0)
data.extend(d)
labels.extend(l)

d, l = sort_patient_files(PATIENT_NAMES, 'E', 1)
data.extend(d)
labels.extend(l)

# Shuffle together
temp = list(zip(data, labels))
random.shuffle(temp)
data, labels = zip(*temp)

data = np.asarray(data)
labels = np.asarray(labels)
