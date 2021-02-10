import os
import sys
from .classify_epilepsy import EpilepsyClassifier

## Change save_name
## Change uploaded model
## Change window_size
filename = sys.argv[1]
save_name = filename[:-4] + "_0.5.3.edf"
model_name = "neurogram_0.5.3.97acc.h5"


stored_models_dir_path = (
    "/".join((os.path.abspath(__file__)).split("/")[:-2]) + "/stored_models/"
)
model_path = stored_models_dir_path + model_name

classifier = EpilepsyClassifier(model_path)
edf = classifier.classify_on_edf(filename, save_file=save_name, window_size=250)
print(edf.annotations)
print(f"Saved to {save_name}")
