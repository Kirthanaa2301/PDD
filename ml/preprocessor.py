import numpy as np
import librosa
from scipy.signal import butter, lfilter
from ml import config

def butter_bandpass(lowcut=80, highcut=2000, fs=config.SAMPLE_RATE, order=5):
    """Generate Butterworth bandpass filter coefficients for human respiratory bandwidth."""
    nyq = 0.5 * fs
    low = max(0.001, lowcut / nyq)
    high = min(0.999, highcut / nyq)
    b, a = butter(order, [low, high], btype='band')
    return b, a

def bandpass_filter(data, lowcut=80, highcut=2000, fs=config.SAMPLE_RATE, order=5):
    """Apply Butterworth bandpass filter to eliminate ambient non-respiratory noise."""
    try:
        b, a = butter_bandpass(lowcut, highcut, fs, order=order)
        return lfilter(b, a, data)
    except Exception as e:
        print(f"Warning: Bandpass filter error: {e}. Using raw signal.")
        return data

def clean_audio_signal(y, sr):
    """
    Standardize and clean raw audio signal:
    1. Mono channel check
    2. Resample to 16 kHz
    3. Bandpass filter (80 - 2000 Hz)
    4. Trim silence from extremities
    5. Amplitude peak normalization
    """
    if y.ndim > 1:
        y = np.mean(y, axis=0)

    if sr != config.SAMPLE_RATE:
        y = librosa.resample(y, orig_sr=sr, target_sr=config.SAMPLE_RATE)
        sr = config.SAMPLE_RATE

    # Bandpass filter
    y = bandpass_filter(y, lowcut=80, highcut=2000, fs=sr)

    # Trim extreme silence
    try:
        y, _ = librosa.effects.trim(y, top_db=28)
    except Exception:
        pass

    # Peak normalization
    max_val = np.max(np.abs(y))
    if max_val > 1e-6:
        y = y / max_val

    return y, sr

def segment_audio_windows(y, sr=config.SAMPLE_RATE, window_sec=config.WINDOW_DURATION, step_sec=config.WINDOW_STEP):
    """
    Split audio into overlapping temporal analysis windows.
    Avoids arbitrary silence zero-padding and preserves all breath cycles.
    """
    window_samples = int(window_sec * sr)
    step_samples = int(step_sec * sr)
    total_samples = len(y)

    if total_samples <= window_samples:
        # If shorter than target window, repeat/reflect signal naturally to fill window without dead silence
        repeats = int(np.ceil(window_samples / max(1, total_samples)))
        padded_y = np.tile(y, repeats)[:window_samples]
        return [padded_y]

    windows = []
    start = 0
    while start + window_samples <= total_samples:
        windows.append(y[start:start + window_samples])
        start += step_samples

    # If the last remaining tail is at least 60% of a window, include it as the final window
    if start < total_samples and (total_samples - start) >= int(0.6 * window_samples):
        windows.append(y[-window_samples:])
    elif len(windows) == 0:
        windows.append(y[:window_samples])

    return windows

def load_and_preprocess_single_window(filepath, window_sec=config.WINDOW_DURATION):
    """Load audio file and return a single standardized representative window."""
    y, sr = librosa.load(filepath, sr=None, mono=True)
    y_clean, sr = clean_audio_signal(y, sr)
    windows = segment_audio_windows(y_clean, sr=sr, window_sec=window_sec, step_sec=window_sec)
    return windows[0], sr

def load_and_preprocess_all_windows(filepath, window_sec=config.WINDOW_DURATION, step_sec=config.WINDOW_STEP):
    """Load audio file and return all overlapping temporal analysis windows."""
    y, sr = librosa.load(filepath, sr=None, mono=True)
    y_clean, sr = clean_audio_signal(y, sr)
    windows = segment_audio_windows(y_clean, sr=sr, window_sec=window_sec, step_sec=step_sec)
    return windows, sr

def preprocess_audio(y, sr):
    """Clean and pad/truncate signal to reference duration * sample rate."""
    y_clean, _ = clean_audio_signal(y, sr)
    target_len = int(config.DURATION * config.SAMPLE_RATE)
    if len(y_clean) >= target_len:
        return y_clean[:target_len]
    else:
        return np.pad(y_clean, (0, target_len - len(y_clean)), mode='constant')
