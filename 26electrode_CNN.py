import tensorflow as tf
from tensorflow.keras import datasets, layers, models
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

SANDBOX_DATA_PATH = 'data/AgnaldoE/2.csv'
eeg = pd.read_csv(SANDBOX_DATA_PATH)

def eeg_to_matrix(eeg):
  # Drop unnamed last column
  if len(eeg.columns) == 1002:
    eeg = eeg.drop(eeg.columns[1001], axis=1)
  # Drop electrode labels
  eeg = eeg.drop(eeg.columns[0], axis=1)
  # Should return shape (26, 1000)
  # 26 electrodes, 1000 measurements
  return eeg.to_numpy()
  
# Mock single data instance
eeg = eeg_to_matrix(eeg)

train_data = np.array([eeg, eeg, eeg, eeg])
train_labels = np.array([1, 1, 1, 1])

test_data = np.array([eeg, eeg])
test_labels = np.array([1, 1])

# Reshape to (n_images, x_shape, y_shape, channels)
s = train_data.shape
train_data = train_data.reshape(s[0], s[1], s[2], 1)
s = test_data.shape
test_data = test_data.reshape(s[0], s[1], s[2], 1)

# Values are bounded between 1, -1 (as far as I've seen)
# no need to normalize

def show_plot(eeg):
  # Visualize a single EEG instance as if
  # it were an image. Amplitude of an electrode visualized
  # as color
  plt.figure(figsize=(200,200))
  plt.imshow(eeg)
  plt.show()
show_plot(eeg)

def define_model():
  model = models.Sequential()
  # Convolutional network for feature extraction
  # (26, 3) kernal, stretch across all electrodes
  # Each timestep of EEG is .002s
  model.add(layers.Conv2D(20, (26, 10),
                          activation='relu', input_shape=(26, 1000, 1)))
  model.add(layers.MaxPooling2D((1, 4)))
  model.add(layers.Conv2D(10, (1, 4), activation='relu'))

  # Fully connected NN for classification
  model.add(layers.Flatten())
  model.add(layers.Dense(12, activation='relu'))
  model.add(layers.Dense(2))

  model.summary()
  return model

def train_model(model, train_data, train_labels, test_data, test_labels):
  model.compile(optimizer='adam',
              loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
              metrics=['accuracy'])
  history = model.fit(train_data, train_labels, epochs=10, 
                      validation_data=(test_data, test_labels))
  return history

def plot_history(history):
  plt.plot(history.history['accuracy'], label='accuracy')
  plt.plot(history.history['val_accuracy'], label = 'val_accuracy')
  plt.xlabel('Epoch')
  plt.ylabel('Accuracy')
  plt.ylim([0.5, 1])
  plt.legend(loc='lower right')
  plt.show()

model = define_model()
history = train_model(model, train_data, train_labels, test_data, test_labels)
plot_history(history)

test_loss, test_acc = model.evaluate(test_data,  test_labels, verbose=2)

print(test_acc)