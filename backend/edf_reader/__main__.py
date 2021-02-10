import sys
from .edf_reader import EDFReader

filename = sys.argv[1]
edf = EDFReader(filename)
print(edf.data_to_standard_matrix().shape)
edf.plot()