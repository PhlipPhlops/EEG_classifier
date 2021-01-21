"""Trains a convolutional neural network to separate Epilepsy events
from Non-Epilepsy events

Trains on 1s events at a 500hz sample rate with 26 electrodes"""
import tensorflow as tf
from tensorflow.keras import layers, models, metrics
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

from data_500hz_1s.load_data import data, labels

# Split data, (SPLIT_RATIO) training set, (1 - SPLIT_RATIO) testing set
SPLIT_RATIO = 0.8
split = int(SPLIT_RATIO * len(labels))

train_data, test_data = data[:split], data[split:]
train_labels, test_labels = labels[:split], labels[split:]

# Reshape to (n_images, x_shape, y_shape, channels)
s = train_data.shape
train_data = train_data.reshape(s[0], s[1], s[2], 1)
s = test_data.shape
test_data = test_data.reshape(s[0], s[1], s[2], 1)

# Values are bounded between 1, -1 (as far as I've seen)
# no need to normalize

print('Train shapes: data, labels')
print(train_data.shape)
print(train_labels.shape)
print('Test shapes: data, labels')
print(test_data.shape)
print(test_labels.shape)

def define_model():
    """Defines a joint convolutional net & fully connected neural net
    for the purposes of classifying 26(electrode)x500(sample@500hz) EEG data
    as an epileptic event"""
    model = models.Sequential()
    ## Convolutional network for feature extraction
    model.add(layers.Conv2D(filters=20, kernel_size=(3, 3),
                            activation='relu', input_shape=(26, 500, 1)))
    model.add(layers.MaxPooling2D(pool_size=(2, 2)))
    model.add(layers.Conv2D(filters=10, kernel_size=(3, 3), activation='relu'))
    model.add(layers.MaxPooling2D(pool_size=(2, 2)))

    ## Fully connected NN for classification
    model.add(layers.Flatten())
    model.add(layers.Dense(24, activation='relu'))
    model.add(layers.Dense(1, activation='sigmoid'))

    model.summary()
    return model

def train_model(model, train_X, train_Y, test_X, test_Y):
    """Compiles then fits model to data"""
    other_metrics = [
        metrics.AUC(),
        metrics.Precision(),
        metrics.Recall(),
        metrics.TruePositives(),
        metrics.TrueNegatives(),
        metrics.FalsePositives(),
        metrics.FalseNegatives()
    ]
    model.compile(optimizer='adam',
                loss=tf.keras.losses.BinaryCrossentropy(),
                metrics=['accuracy', *other_metrics])
    model_history = model.fit(train_X, train_Y, epochs=200, 
                        validation_data=(test_X, test_Y))
    return model_history

def plot_history(history):
    """Plots training and testing accuracy vs epoch"""
    plt.plot(history.history['accuracy'], label='accuracy')
    plt.plot(history.history['val_accuracy'], label = 'val_accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.ylim([0.5, 1])
    plt.legend(loc='lower right')
    plt.show()

CNN_model = define_model()
history = train_model(
                    CNN_model,
                    train_data, train_labels,
                    test_data, test_labels)
plot_history(history)

test_loss, test_acc = CNN_model.evaluate(test_data,  test_labels, verbose=2)

print(f'Test accuracy: {test_acc}')
print('Metric reminder: Precision = (TP / TP + FP), Recall = (TP / TP + FN)')
print('Sensitivity: ratio of correctly defined Positives')
print('Specificity: ratio of correctly defined Negatives')
