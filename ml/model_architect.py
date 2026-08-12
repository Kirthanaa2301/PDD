import tensorflow as tf
from tensorflow.keras.layers import (
    Input, Conv2D, MaxPooling2D, Reshape, Bidirectional, LSTM, 
    Dense, Dropout, Softmax, Multiply, Lambda
)
from tensorflow.keras.models import Model
import tensorflow.keras.backend as K
from ml import config

@tf.keras.utils.register_keras_serializable(package="custom_layers")
class TemporalSum(tf.keras.layers.Layer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
    def call(self, inputs):
        return tf.reduce_sum(inputs, axis=1)
        
    def get_config(self):
        config = super().get_config()
        return config

def build_model(input_shape=(219, 161)):
    """
    Build a hybrid CRNN (CNN + BiLSTM + Attention) model for respiratory audio classification.
    
    Args:
        input_shape: tuple, shape of input features (timesteps, features)
    """
    T, F = input_shape
    
    # 1. Input layer
    inputs = Input(shape=(T, F))
    
    # Reshape input to (timesteps, features, channels) for Conv2D
    x = Reshape((T, F, 1))(inputs)
    
    # 2. CNN Spatial Feature Learning
    x = Conv2D(16, kernel_size=(3, 3), padding="same", activation="relu")(x)
    x = MaxPooling2D(pool_size=(1, 2))(x)  # Shrink features from F to F/2
    
    x = Conv2D(32, kernel_size=(3, 3), padding="same", activation="relu")(x)
    x = MaxPooling2D(pool_size=(1, 2))(x)  # Shrink features from F/2 to F/4
    
    # 3. Reshape back to sequence for LSTM
    # New feature dimension: (F // 4) * 32 filters
    new_F = (F // 4) * 32
    x = Reshape((T, new_F))(x)
    
    # 4. Temporal Sequence Learning (BiLSTM)
    lstm_out = Bidirectional(LSTM(64, return_sequences=True))(x)  # Output shape: (T, 128)
    
    # 5. Attention Mechanism (temporal attention)
    # Dense layer to compute score key/query representation
    u = Dense(64, activation="tanh")(lstm_out)
    scores = Dense(1, activation=None)(u)  # Score for each timestep
    
    # Softmax along time axis to get attention weight distribution
    weights = Softmax(axis=1, name="attention_weights")(scores)  # Shape: (None, T, 1)
    
    # Multiply LSTM outputs by weights
    context = Multiply()([lstm_out, weights])
    
    # Sum over timesteps to get a single vector representation
    context_vector = TemporalSum(name="attention_sum")(context)  # Shape: (None, 128)
    
    # 6. Classification Head
    dense_out = Dense(64, activation="relu")(context_vector)
    dense_out = Dropout(0.4)(dense_out)
    
    outputs = Dense(len(config.CLASSES), activation="softmax", name="classification_output")(dense_out)
    
    # Build Model
    model = Model(inputs=inputs, outputs=outputs, name="Respiratory_CRNN_Attention")
    return model

if __name__ == "__main__":
    model = build_model()
    model.summary()
