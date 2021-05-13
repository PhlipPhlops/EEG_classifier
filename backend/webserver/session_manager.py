"""Using client-given SID as an identifier, this session manager points
the server to the actively edited file and handles accidental disconnections
"""
import json

## Constants
# Points to a file in /tmp/ that fills with key/val pairs
SID_FILE_MAP_FILENAME = '/tmp/sid_to_file_map.json'

def _getMapFromFile():
  try:
    f = open(SID_FILE_MAP_FILENAME, 'r')
    sf_map = json.load(f)
  except:
    sf_map = {}
  return sf_map

def _saveMapToFile(sf_map):
  f = open(SID_FILE_MAP_FILENAME, 'w')
  json.dump(sf_map, f)

def saveFilenameToSession(sid, filename):
  sf_map = _getMapFromFile()
  sf_map[sid] = filename
  _saveMapToFile(sf_map)

def getFilenameBySid(sid):
  sf_map = _getMapFromFile()
  return sf_map[sid]



# Saving old structure for inspiration

# ### FILE HANDLING METHODS #####################
# def generate_key(filename):
#     """Adds key value pair to the keymap fle
#        filename is the file to be stored
#     """
#     def random_string(length=16):
#         """Returns a random string of given length"""
#         return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    
#     key = random_string()
#     with open(KEYMAP_FILENAME, "a") as keymap_file:
#         keymap_file.write(key + ":" + filename + "\n")
#         keymap_file.close()
#     return key

# def retrieve_filename(key, trim_tmp=True):
#     """Reads keymap file and retrieves filename associated with key
#     if trim_tmp, expects file to be in /tmp/ and trims /tmp/ from
#     filename
#     """
#     keymap_dict = {}
#     with open(KEYMAP_FILENAME, "r") as keymap_file:
#         for line in keymap_file:
#             read_key, read_val = line.split(":")
#             keymap_dict[read_key] = read_val
#     filename = keymap_dict[key]
#     if trim_tmp:
#         filename = filename[5:]
#     return filename.strip() # strip \n characters
# #################################################
