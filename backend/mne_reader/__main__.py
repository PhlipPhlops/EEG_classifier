import sys
from .edf_reader import EDFReader

filename = sys.argv[1]
edf = EDFReader(filename)
edf.plot()
