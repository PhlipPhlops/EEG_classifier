import os
import time
import pandas as pd
import pickle
from .app_config import cache
import mne
from ..mne_reader.fif_reader import  FIFReader

from .app_config import logger


class EegChunker:
    """This class is a stateless collection of functions
    designed to cache EDF data and retrieve chunks as requested
    by the frontend
    """
    def save_path(self, sid):
        """Format for the save path"""
        return '/tmp/'+'EEG_'+sid+'.pkl'

    def montage_save_path(self, sid):
        """Format to save montaged files"""
        return '/tmp/'+'MONTAGE_'+sid+'.pkl'

    def cache_eeg_dataframe(self, sid, filepath, should_filter_body_motion):
        # Convert fif to dataframe
        fif = FIFReader(filepath)
        if should_filter_body_motion:
            fif.filter_body_motion()
        df = fif.to_data_frame()

        # pickle dataframe to file
        df.to_pickle(self.save_path(sid))

    # This cacheing line beings to use memory exponentially
    # it is in fact faster and more memory safe (compared to this line)
    # to simply read from pickle every time
    # @cache.memoize(timeout=60)
    def retrieve_from_pickle(self, sid):
        """Cached method to retrieve dataframe from a keyed pattern"""
        try:
            # Attempt to read from saved montage
            return pd.read_pickle(self.montage_save_path(sid))
        except FileNotFoundError:
            # If montage doesn't exist, read from original
            return pd.read_pickle(self.save_path(sid))

    def retrieve_original(self, sid):
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
        # Apply montage if it exists
        # chunk = self.reorganize_by_montage(sid, chunk)
        return chunk



    def store_montage(self, montage, sid):
        # Read original from pickle
        # Reorganize into montage
        # Store as pickle
        df = self.retrieve_original(sid)
        df = df.transpose()

        # Build list of unique electrode names from montage
        electrode_names = set()
        for m in montage:
            for el in m:
                electrode_names.add(el)
        # Remove empty string from set to prevent unversal matching
        if '' in electrode_names:
            electrode_names.remove('')
        # Build renaming map, then rename
        renaming_map = {}
        for el in electrode_names:
            for c in df.columns:
                if el in c:
                    # If simplified electrode name is contained
                    # in column, rename the column to match it
                    renaming_map[c] = el
        # Apply rename
        logger.info(f"Renaming Map: {renaming_map}")
        df = df.rename(columns=renaming_map)

        kept_columns = []
        logger.info(f"Montage: {montage}")
        logger.info(f"Columns: {df.columns}")
        for m in montage:
            #  For montage in montage list m: [e0, e1]
            if len(m) == 0:
                # Montage is empty, ignore
                continue

            if len(m) == 1 or m[1] == '':
                # Montage contains only one electrode
                column_name = f'{m[0]}'
                kept_columns.append(column_name)
                continue

            if len(m) == 2 and m[0] == '':
                # Montage second element contains the only electrode
                if m[1] != '':
                    column_name = f'{m[1]}'
                    kept_columns.append(column_name)
                    continue
                else:
                    continue

            if not m[0] in df.columns or not m[1] in df.columns:
                # Either electrode name is not contained in df
                # Ignore
                logger.info("passed")
                continue

            column_name = f'{m[0]}-{m[1]}'
            kept_columns.append(column_name)
            # Create the new bipolar columns
            df[column_name] = df[m[0]] - df[m[1]]
        # Keep only bipolar columns
        df = df[kept_columns]
        df = df.transpose()

        df.to_pickle(self.montage_save_path(sid))
        

    def reorganize_by_montage(self, sid, chunk_df):
        """Returns chunk reorganized into montage 

        #### LEGACY METHOD
        """
        return
        # PROBLEM
        # This method runs a calculation on every network request
        # This calculation could be run once and cached to save
        # processing time
        df = chunk_df
        logger.info("CHUNK BEFORE")
        logger.info(chunk_df)
        montage = self.grab_montage(sid)

        if montage == []:
            # Montage isn't saved, return original chunk
            return chunk_df

        kept_columns = []
        logger.info(f"Montage: {montage}")
        logger.info(f"Columns: {df.columns}")
        for m in montage:
            logger.info(m)
            if len(m) == 0:
                continue

            if len(m) == 1 or m[1] == '':
                column_name = f'{m[0]}'
                kept_columns.append(column_name)
                continue

            if len(m) == 2 and m[0] == '':
                if m[1] != '':
                    column_name = f'{m[1]}'
                    kept_columns.append(column_name)
                    continue
                else:
                    continue

            if not m[0] in df.columns or not m[1] in df.columns:
                logger.info("passed")
                continue

            column_name = f'{m[0]}-{m[1]}'
            kept_columns.append(column_name)
            # Create the new bipolar columns
            df[column_name] = df[m[0]] - df[m[1]]
            logger.info(m)
            logger.info(df[column_name])
        # Keep only bipolar columns
        df = df[kept_columns]
        logger.info("CHUNK AFTER")
        logger.info(df)
        return df






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