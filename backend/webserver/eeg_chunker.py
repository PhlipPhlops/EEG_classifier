import os
import time
import pandas as pd
from .app_config import cache
import mne
from ..mne_reader.fif_reader import  FIFReader


class EegChunker:
    """This class is a stateless collection of functions
    designed to cache EDF data and retrieve chunks as requested
    by the frontend
    """
    def save_path(self, sid):
        """Format for the save path"""
        return '/tmp/'+'EEG_'+sid+'.pkl'

    def cache_eeg_dataframe(self, sid, filepath, should_bipolar_preprocess):
        # Convert fif to dataframe
        fif = FIFReader(filepath)
        if should_bipolar_preprocess:
            fif.filter_body_motion()
            fif.bipolar_preprocess_DEPRECATE_SOON()
        df = fif.to_data_frame()

        # pickle dataframe to file
        df.to_pickle(self.save_path(sid))

    # This cacheing line beings to use memory exponentially
    # it is in fact faster and more memory safe (compared to this line)
    # to simply read from pickle every time
    # @cache.memoize(timeout=60)
    def retrieve_from_pickle(self, sid):
        """Cached method to retrieve dataframe from a keyed pattern"""
        return pd.read_pickle(self.save_path(sid))

    def get_sample_rate(self, sid, filepath):
        """Return the samplerate of the chunked file"""
        return FIFReader(filepath).sample_rate

    def get_num_samples(self, sid, filepath):
        """Return the total number of samples (time stamps) of chunked file"""
        return FIFReader(filepath).to_data_frame().shape[1]

    def chunk_by_index(self, sid, i_start, i_end):
        """Returns samples of data from i_start up to, not including, i_end
        """
        df = self.retrieve_from_pickle(sid)
        chunk = df.iloc[:, i_start:i_end]
        return chunk

    def chunk_as_data_frame(self, sid, n, N):
        """Returns the nth chunk out of N total chunks
        of the data frame; specifically, all available electrodes
        from timestep n*(timesteps/N):(n+1)*(timesteps/N)-1

        ### LEGACY METHOD
        """
        if n < 0 or n >= N:
            raise Exception("n chunk must be in range [0:N)")

        # Might be the case that the og pickle isn't done writing yet
        # by the first chunk call. Check, and wait until it is
        if n == 0:
            timeout_counter = 10
            while not os.path.isfile(self.save_path(sid)) and timeout_counter > 0:
                time.sleep(1)
                timeout_counter -= 1
            if timeout_counter == 0:
                raise Exception("Timeout waiting for fif dataframe to write to pickle")

        # Hypothetically the value of this should be cached after chunk #1
        df = self.retrieve_from_pickle(sid)
        # Start and end indices
        timesteps = len(df.columns)
        w_s = n*(int(timesteps / N))
        w_e = (n+1)*(int(timesteps / N)) - 1

        chunk = df.iloc[:, w_s:w_e]
        return chunk