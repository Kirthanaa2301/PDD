import numpy as np
import librosa
from ml import config

def extract_features_from_signal(y, sr=config.SAMPLE_RATE):
    """
    Extract frame-level acoustic features from an audio signal window:
    - Mel Spectrogram (128 bands)
    - MFCCs (13 coefficients)
    - Chroma STFT (12 bins)
    - Spectral Contrast (6 bands)
    - Zero Crossing Rate (1)
    - RMS Energy (1)
    
    Returns:
        feature_matrix: numpy array of shape (timesteps, total_features) (e.g. 157, 161)
    """
    n_fft = 1024
    hop_length = 512
    
    # 1. Mel Spectrogram (log scale)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mels=config.N_MELS)
    log_mel = librosa.power_to_db(mel, ref=np.max)
    
    # 2. MFCCs
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mfcc=config.N_MFCC)
    
    # 3. Chroma STFT
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_chroma=config.N_CHROMA)
    
    # 4. Spectral Contrast
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_bands=config.N_CONTRAST - 1)
    
    # 5. Zero Crossing Rate
    zcr = librosa.feature.zero_crossing_rate(y=y, frame_length=n_fft, hop_length=hop_length)
    
    # 6. RMS Energy
    rms = librosa.feature.rms(y=y, frame_length=n_fft, hop_length=hop_length)
    
    # Concatenate features along axis 0
    features = np.vstack([log_mel, mfcc, chroma, contrast, zcr, rms])
    
    # Transpose to shape (T, Total_Features)
    feature_matrix = features.T
    
    return feature_matrix

def extract_features_from_file(filepath):
    """Load, preprocess, and extract features from a representative window of an audio file."""
    from ml.preprocessor import load_and_preprocess_single_window
    y, sr = load_and_preprocess_single_window(filepath)
    return extract_features_from_signal(y, sr)

def extract_multi_window_features_from_file(filepath):
    """Load, preprocess, and extract features for all sliding windows of an audio recording."""
    from ml.preprocessor import load_and_preprocess_all_windows
    windows, sr = load_and_preprocess_all_windows(filepath)
    feature_list = [extract_features_from_signal(w, sr) for w in windows]
    return np.array(feature_list)
