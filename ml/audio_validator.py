import os
import joblib
import numpy as np
import librosa
import soundfile as sf
from ml import config

def extract_validation_features(y, sr):
    """
    Extract a compact, 35-dimensional acoustic feature vector for clinical validation.
    Features:
    - RMS Energy (mean, std, max) [3]
    - Spectral Centroid (mean) [1]
    - Spectral Rolloff (mean 85%) [1]
    - Spectral Flatness (mean) [1]
    - Zero Crossing Rate (mean) [1]
    - Respiratory Band Energy Ratio (<=2500Hz / Total) [1]
    - Harmonicity Energy Ratio (Harmonic / Total via HPSS) [1]
    - MFCC Means (13) [13]
    - MFCC Stds (13) [13]
    Total: 35 features
    """
    # 1. Resample to 16kHz to standardize acoustic calculations
    if sr != config.SAMPLE_RATE:
        y = librosa.resample(y, orig_sr=sr, target_sr=config.SAMPLE_RATE)
        sr = config.SAMPLE_RATE

    n_fft = 1024
    hop_length = 512
    
    # 2. Energy & Dynamic Range
    rms = librosa.feature.rms(y=y, frame_length=n_fft, hop_length=hop_length)
    mean_rms = float(np.mean(rms))
    std_rms = float(np.std(rms))
    max_rms = float(np.max(rms))
    
    # 3. Spectral Descriptors
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length)
    mean_centroid = float(np.mean(centroid))
    
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, roll_percent=0.85)
    mean_rolloff = float(np.mean(rolloff))
    
    flatness = librosa.feature.spectral_flatness(y=y, n_fft=n_fft, hop_length=hop_length)
    mean_flatness = float(np.mean(flatness))
    
    zcr = librosa.feature.zero_crossing_rate(y=y, frame_length=n_fft, hop_length=hop_length)
    mean_zcr = float(np.mean(zcr))
    
    # 4. Respiratory Band Energy Ratio (energy below 2500 Hz vs total spectrum)
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))**2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    resp_mask = freqs <= 2500
    resp_energy = np.sum(S[resp_mask, :])
    total_energy = np.sum(S) + 1e-9
    resp_energy_ratio = float(resp_energy / total_energy)
    
    # 5. Harmonicity (Voiced Speech vs Turbulent Lung Sounds)
    y_harm, _ = librosa.effects.hpss(y)
    harm_energy = np.sum(y_harm**2)
    tot_hpss_energy = np.sum(y**2) + 1e-9
    harmonic_ratio = float(harm_energy / tot_hpss_energy)
    
    # 6. MFCCs (13 coefficients mean & std)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)
    
    feature_vector = np.concatenate([
        [mean_rms, std_rms, max_rms, mean_centroid, mean_rolloff, mean_flatness, mean_zcr, resp_energy_ratio, harmonic_ratio],
        mfcc_mean,
        mfcc_std
    ])
    
    return feature_vector

def validate_audio_file(filepath):
    """
    Validate the audio file against formats, corruption, silence, noise, speech, and non-lung audio.
    Returns:
        is_valid: bool
        message: str
    """
    # 1. Check file existence and format extension
    if not os.path.exists(filepath):
        return False, "Audio file does not exist on disk."
        
    ext = os.path.splitext(filepath)[1].lower()
    allowed_exts = ['.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg', '.3gp', '.webm']
    if ext not in allowed_exts:
        return False, f"Unsupported file format '{ext}'. Supported formats: {', '.join(allowed_exts)}"
        
    # 2. Check empty file
    if os.path.getsize(filepath) == 0:
        return False, "Audio recording file is empty (0 bytes)."
        
    # 3. Check readability (corruption)
    try:
        y, sr = librosa.load(filepath, sr=None, mono=True)
    except Exception as e:
        return False, f"Audio file is corrupted or unreadable: {str(e)}"
        
    # 4. Check length/duration
    duration = len(y) / sr
    if duration < 1.0:
        return False, "Recording is too short. Please provide a recording of at least 1.5 seconds."
        
    # 5. Extract features for acoustic validation
    features = extract_validation_features(y, sr)
    mean_rms = features[0]
    max_rms = features[2]
    mean_centroid = features[3]
    mean_rolloff = features[4]
    mean_flatness = features[5]
    mean_zcr = features[6]
    resp_energy_ratio = features[7]
    harmonic_ratio = features[8]
    
    # 6. Silence / Low amplitude check
    if mean_rms < 0.003 or max_rms < 0.01:
        return False, "Silent or inaudible recording detected. Please ensure the microphone is positioned close to the chest or trachea and breathing is clearly audible."
        
    # 7. Excessive noise or flat static white noise check
    if mean_flatness > 0.35 or mean_zcr > 0.30:
        return False, "Excessive background noise, static, or electrical interference detected. Please record in a quiet environment."
        
    # 8. Human speech, singing, songs, or music check (High spectral centroid / High rolloff)
    if mean_centroid > 380.0:
        return False, "Non-respiratory sound detected. The recording contains prominent human speech, vocalization, songs, or background music instead of respiratory lung sounds."
        
    if mean_rolloff > 1400.0:
        return False, "Non-respiratory sound detected. High-frequency acoustic harmonics (such as speech, musical instruments, or alarms) were detected."
        
    # 9. Frequency band check (respiratory sounds are concentrated <= 2500 Hz)
    if resp_energy_ratio < 0.55:
        return False, "Invalid acoustic spectrum. The recording contains high-frequency environmental noise outside of human respiratory bandwidth."

    # 10. Machine learning outlier detection (Isolation Forest / Outlier model)
    if os.path.exists(config.VALIDATOR_PATH) and os.path.exists(config.SCALER_PATH):
        try:
            validator = joblib.load(config.VALIDATOR_PATH)
            scaler = joblib.load(config.SCALER_PATH)
            
            features_scaled = scaler.transform(features.reshape(1, -1))
            pred = validator.predict(features_scaled)[0]
            if pred == -1:
                return False, "Invalid audio. The recording does not match typical acoustic breathing sound patterns. Please record clinical chest/mouth breathing."
        except Exception as e:
            # Non-blocking fallback
            print(f"Warning: Outlier validator check failed: {e}")
            
    return True, "Audio file is valid."
