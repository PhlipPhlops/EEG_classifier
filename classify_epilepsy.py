"""This script loads up a pretrained model to classify incoming eeg
data as either epileptic or non-epileptic
"""
from tensorflow import keras
from load_data import load_eeg_data
from transformations import Transforms

model = keras.models.load_model('./stored_models/19eX500hz_1s.95acc.h5')
data, labels, filenames = load_eeg_data(data_directory='.ignorable/data/test_500hz',
                            shuffle_data=False, expose_filenames=True)

# Fourier Transform all data
data = Transforms().fourier_transform_all(data)
# Reshape to (n_images, x_shape, y_shape, channels)
s = data.shape
data = data.reshape(s[0], s[1], s[2], 1)
print(labels)

# predictions = model.predict(data)
# for i in range(len(predictions)):
#     p = predictions[i][0]
#     f = filenames[i]
#     s = '{}, {:.2f}'.format(f, p)
#     if p > 0.5:
#         s = '---> ' + s
#     print(s)

evaluate = model.evaluate(data, labels, verbose=2)
