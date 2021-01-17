import pandas as pd

# Import all csvs into collection
collection = []
PATH = 'data/AgnaldoE/'
for i in range(1, 31):
  p = PATH + str(i) + ".csv"
  collection.append(pd.read_csv(p))

# Some csvs have unnecessary last column; drop it
# Drop electrode labels
for i in range(len(collection)):
  c = collection[i]
  if len(c.columns) == 1002:
    collection[i] = c.drop(c.columns[1001], axis=1)
  # Drop electrode labels
  eeg = eeg.drop(eeg.columns[0], axis=1)


# Stitch 