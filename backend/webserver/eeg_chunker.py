import pandas as pd
from .app_config import cache
from ..edf_reader import EDFReader


class EegChunker:
    """This class is a stateless collection of functions
    designed to cache EDF data and retrieve chunks as requested
    by the frontend
    """
    def save_path(self, sid):
        """Format for the save path"""
        return '/tmp/'+'EEG_'+sid+'.pkl'

    def cache_eeg_dataframe(self, sid, filepath):
        # Convert edf to dataframe
        df = EDFReader(filepath).to_data_frame()
        # pickle dataframe to file
        df.to_pickle(self.save_path(sid))
        
    @cache.memoize(timeout=60)
    def retrieve_from_pickle(self, sid):
        """Cached method to retrieve dataframe from a keyed pattern"""
        return pd.read_pickle(self.save_path(sid))

    def chunk_as_data_frame(self, sid, n, N):
        """Returns the nth chunk out of N total chunks
        of the data frame; specifically, all available electrodes
        from timestep n*(timesteps/N):(n+1)*(timesteps/N)-1
        """
        if n < 0 or n >= N:
            raise Exception("n chunk must be in range [0:N)")

        # Hypothetically the value of this should be cached after chunk #1
        df = self.retrieve_from_pickle(sid)
        # Start and end indices
        timesteps = len(df.columns)
        w_s = n*(int(timesteps / N))
        w_e = (n+1)*(int(timesteps / N)) - 1

        chunk = df.iloc[:, w_s:w_e]
        return chunk