import sys
from .edf_reader import EDFReader

filename = 'backend/data/Maria_19_elec.edf'
edf = EDFReader(filename)
print(edf.data_to_standard_matrix().shape)
print(edf.get_annotations_as_df())
