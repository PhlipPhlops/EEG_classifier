import pandas as pd

# Import all csvs into collection
collection = []
PATH = 'data/AgnaldoE/'
for i in range(1, 31):
  p = PATH + str(i) + ".csv"
  collection.append(pd.read_csv(p))

# Some csvs have unnecessary column; drop it
for i in range(len(collection)):
  c = collection[i]
  if len(c.columns) == 1002:
    collection[i] = c.drop(c.columns[1001], axis=1)

# Update column header timestamps to represent position in entire
# eeg timeline (not just position in its 2s interval)
for i in range(len(collection)):
  c = collection[i]
  timeshift = 2.0 * i


# Stitch 