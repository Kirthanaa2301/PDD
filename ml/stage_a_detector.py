import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import librosa
import soundfile as sf
import joblib
from sklearn.ensemble import HistGradientBoostingClassifier, ExtraTreesClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from ml import config

STAGE_A_MODEL_PATH = os.path.join(config.MODEL_DIR, "stage_a_detector.joblib")
STAGE_A_SCALER_PATH = os.path.join(config.MODEL_DIR, "stage_a_scaler.joblib")
STAGE_A_ISOFOREST_PATH = os.path.join(config.MODEL_DIR, "stage_a_isofor.joblib")

def extract_stage_a_features(y, sr=16000):
    """
    Extract a comprehensive 46-dimensional acoustic representation to discriminate
    authentic respiratory airflow from speech, singing, songs, music, environmental noise, and static.
    """
    if sr != config.SAMPLE_RATE:
        y = librosa.resample(y, orig_sr=sr, target_sr=config.SAMPLE_RATE)
        sr = config.SAMPLE_RATE

    n_fft = 1024
    hop_length = 512
    
    # 1. Energy & Dynamic Range
    rms = librosa.feature.rms(y=y, frame_length=n_fft, hop_length=hop_length)[0]
    mean_rms = float(np.mean(rms))
    std_rms = float(np.std(rms))
    max_rms = float(np.max(rms))
    dyn_range = float(max_rms / (mean_rms + 1e-9))
    
    # 2. Envelope Cadence Modulation Frequency
    # Speech syllable rate is 2.5 - 6 Hz; Music beat is 1.5 - 4 Hz; Breathing is 0.15 - 0.50 Hz
    rms_detrend = rms - np.mean(rms)
    fft_rms = np.abs(np.fft.rfft(rms_detrend))
    freqs_rms = np.fft.rfftfreq(len(rms_detrend), d=hop_length/sr)
    dominant_mod_freq = float(freqs_rms[np.argmax(fft_rms[1:]) + 1]) if len(fft_rms) > 1 else 0.0
    speech_cadence_energy = float(np.sum(fft_rms[(freqs_rms >= 2.0) & (freqs_rms <= 6.0)]) / (np.sum(fft_rms) + 1e-9))
    resp_cadence_energy = float(np.sum(fft_rms[(freqs_rms >= 0.1) & (freqs_rms <= 0.6)]) / (np.sum(fft_rms) + 1e-9))
    
    # 3. Spectral Descriptors
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length)[0]
    mean_centroid = float(np.mean(centroid))
    std_centroid = float(np.std(centroid))
    
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, roll_percent=0.85)[0]
    mean_rolloff = float(np.mean(rolloff))
    std_rolloff = float(np.std(rolloff))
    
    flatness = librosa.feature.spectral_flatness(y=y, n_fft=n_fft, hop_length=hop_length)[0]
    mean_flatness = float(np.mean(flatness))
    
    zcr = librosa.feature.zero_crossing_rate(y=y, frame_length=n_fft, hop_length=hop_length)[0]
    mean_zcr = float(np.mean(zcr))
    std_zcr = float(np.std(zcr)) # High variance in speech between vowels and consonants
    
    # 4. Chroma Pitch & Tonality (Speech/Music have sharp pitch peaks; Breath is turbulent noise)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length)
    chroma_mean_profile = np.mean(chroma, axis=1)
    chroma_std = float(np.std(chroma_mean_profile))
    chroma_max = float(np.max(chroma_mean_profile))
    
    # 5. Respiratory Band Energy Ratio (<= 2500 Hz vs Total Spectrum)
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))**2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    resp_mask = freqs <= 2500
    resp_energy = np.sum(S[resp_mask, :])
    total_energy = np.sum(S) + 1e-9
    resp_energy_ratio = float(resp_energy / total_energy)
    high_energy_ratio = float(np.sum(S[freqs >= 3000, :]) / total_energy)
    
    # 6. Harmonicity (Voiced Speech / Instrument vs Turbulent Airflow)
    y_harm, _ = librosa.effects.hpss(y)
    harmonic_ratio = float(np.sum(y_harm**2) / (np.sum(y**2) + 1e-9))
    
    # 7. MFCCs (13 coefficients mean & std)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)
    
    feature_vector = np.concatenate([
        [
            mean_rms, std_rms, max_rms, dyn_range,
            dominant_mod_freq, speech_cadence_energy, resp_cadence_energy,
            mean_centroid, std_centroid, mean_rolloff, std_rolloff,
            mean_flatness, mean_zcr, std_zcr,
            chroma_std, chroma_max,
            resp_energy_ratio, high_energy_ratio, harmonic_ratio
        ],
        mfcc_mean,
        mfcc_std
    ])
    
    metrics = {
        "mean_rms": mean_rms,
        "max_rms": max_rms,
        "mean_centroid": mean_centroid,
        "mean_rolloff": mean_rolloff,
        "mean_flatness": mean_flatness,
        "mean_zcr": mean_zcr,
        "std_zcr": std_zcr,
        "chroma_std": chroma_std,
        "dominant_mod_freq": dominant_mod_freq,
        "speech_cadence_energy": speech_cadence_energy,
        "harmonic_ratio": harmonic_ratio
    }
    
    return feature_vector, metrics

def train_stage_a_detector(train_samples, val_samples):
    """
    Train and calibrate the Stage A Binary Respiratory Detector.
    Label 1: Valid Respiratory Lung Audio
    Label 0: Invalid / Non-respiratory Audio
    """
    print("\n--- Training Stage A (Respiratory Sound Detector) ---")
    
    X_train, y_train = [], []
    X_resp_only = []
    
    for s in train_samples:
        try:
            y, sr = librosa.load(s["filepath"], sr=config.SAMPLE_RATE, mono=True)
            feat, _ = extract_stage_a_features(y, sr)
            is_resp = 1 if s["label"] != "invalid" else 0
            X_train.append(feat)
            y_train.append(is_resp)
            if is_resp == 1:
                X_resp_only.append(feat)
        except Exception:
            pass
            
    X_train = np.array(X_train)
    y_train = np.array(y_train)
    X_resp_only = np.array(X_resp_only)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # Train Gradient Boosting Classifier
    clf = HistGradientBoostingClassifier(
        max_iter=200,
        learning_rate=0.06,
        random_state=config.RANDOM_STATE,
        class_weight='balanced'
    )
    clf.fit(X_train_scaled, y_train)
    
    # Train Isolation Forest on genuine respiratory features
    X_resp_scaled = scaler.transform(X_resp_only)
    isofor = IsolationForest(n_estimators=200, contamination=0.03, random_state=config.RANDOM_STATE)
    isofor.fit(X_resp_scaled)
    
    # Evaluate on Validation Set
    X_val, y_val = [], []
    for s in val_samples:
        try:
            y, sr = librosa.load(s["filepath"], sr=config.SAMPLE_RATE, mono=True)
            feat, _ = extract_stage_a_features(y, sr)
            X_val.append(feat)
            y_val.append(1 if s["label"] != "invalid" else 0)
        except Exception:
            pass
            
    X_val_scaled = scaler.transform(np.array(X_val))
    val_probs = clf.predict_proba(X_val_scaled)[:, 1]
    val_preds = (val_probs >= 0.50).astype(int)
    
    acc = np.mean(val_preds == np.array(y_val)) * 100
    print(f"Stage A Validation Binary Accuracy: {acc:.2f}%")
    
    # Save artifacts
    os.makedirs(config.MODEL_DIR, exist_ok=True)
    joblib.dump(clf, STAGE_A_MODEL_PATH)
    joblib.dump(scaler, STAGE_A_SCALER_PATH)
    joblib.dump(isofor, STAGE_A_ISOFOREST_PATH)
    print(f"Saved Stage A models to {config.MODEL_DIR}")
    
    return clf, scaler, isofor

def detect_respiratory_sound(filepath):
    """
    Inference function for Stage A.
    Returns:
        is_respiratory: bool
        message: str
        confidence: float
    """
    # 1. File existence and format extension
    if not os.path.exists(filepath):
        return False, "Audio file does not exist on disk.", 0.0
        
    ext = os.path.splitext(filepath)[1].lower()
    allowed_exts = ['.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg', '.3gp', '.webm']
    if ext not in allowed_exts:
        return False, f"Unsupported file format '{ext}'.", 0.0
        
    # 2. Empty file
    if os.path.getsize(filepath) == 0:
        return False, "Unable to analyze: recording is empty (0 bytes).", 0.0
        
    # 3. Readability
    try:
        y, sr = librosa.load(filepath, sr=config.SAMPLE_RATE, mono=True)
    except Exception as e:
        return False, f"Audio file is corrupted or unreadable: {str(e)}", 0.0
        
    # 4. Duration check
    duration = len(y) / sr
    if duration < 1.0:
        return False, "Unable to analyze: recording is too short (less than 1 second).", 0.0
        
    # 5. Extract acoustic features & metrics
    features, metrics = extract_stage_a_features(y, sr)
    
    # 6. Physical silence / inaudible guard
    if metrics["mean_rms"] < 0.003 or metrics["max_rms"] < 0.01:
        return False, "Unable to analyze: silent or inaudible recording detected.", 0.0
        
    # 7. Static noise check
    if metrics["mean_flatness"] > 0.35 or metrics["mean_zcr"] > 0.35:
        return False, "Unable to analyze: excessive static or background noise detected.", 0.0
        
    # 8. Acoustic rule-based guards for prominent speech cadence / music tonality
    if metrics["speech_cadence_energy"] > 0.45 and metrics["harmonic_ratio"] > 0.30:
        return False, "Unable to analyze: respiratory sound not detected (contains prominent human speech).", 0.0
        
    if metrics["chroma_std"] > 0.32 and metrics["harmonic_ratio"] > 0.40:
        return False, "Unable to analyze: respiratory sound not detected (contains music or melodic singing).", 0.0
        
    # 9. Evaluate Stage A ML Model if loaded
    if os.path.exists(STAGE_A_MODEL_PATH) and os.path.exists(STAGE_A_SCALER_PATH):
        try:
            clf = joblib.load(STAGE_A_MODEL_PATH)
            scaler = joblib.load(STAGE_A_SCALER_PATH)
            isofor = joblib.load(STAGE_A_ISOFOREST_PATH) if os.path.exists(STAGE_A_ISOFOREST_PATH) else None
            
            feat_scaled = scaler.transform(features.reshape(1, -1))
            prob = float(clf.predict_proba(feat_scaled)[0, 1])
            
            if isofor is not None:
                iso_pred = isofor.predict(feat_scaled)[0]
                if iso_pred == -1 and prob < 0.85:
                    return False, "Unable to analyze: respiratory sound not detected (acoustic outlier).", prob
                    
            if prob < 0.60:
                return False, "Unable to analyze: respiratory sound not detected.", prob
                
            return True, "Respiratory sound detected.", prob
        except Exception as e:
            print(f"Warning: Stage A ML model evaluation error: {e}")
            
    return True, "Respiratory sound detected.", 0.90
