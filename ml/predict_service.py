import os
import sys
import tempfile
import numpy as np
import tensorflow as tf
import joblib
from flask import Flask, request, jsonify

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml import config
from ml.stage_a_detector import detect_respiratory_sound
from ml.feature_extractor import extract_multi_window_features_from_file
from ml.risk_engine import assess_risk
from ml.recommendation import generate_recommendations
from ml.model_architect import TemporalSum
from ml.calibrator import TemperatureCalibrator

app = Flask(__name__)

# Global model references loaded at startup
MODEL = None
CLASSIFICATION_SCALER = None
CALIBRATOR = None

def load_local_models():
    """Load the trained machine learning models and calibrators into memory."""
    global MODEL, CLASSIFICATION_SCALER, CALIBRATOR
    print("--- Loading Local Machine Learning Pipeline ---")
    
    if os.path.exists(config.MODEL_PATH):
        try:
            MODEL = tf.keras.models.load_model(config.MODEL_PATH, custom_objects={'TemporalSum': TemporalSum})
            print("  [SUCCESS] Stage B CRNN Classification Model: LOADED")
        except Exception as e:
            print(f"  Error loading CRNN model: {e}")
    else:
        print(f"  WARNING: CRNN model not found at {config.MODEL_PATH}")

    if os.path.exists(config.CLASSIFICATION_SCALER_PATH):
        try:
            CLASSIFICATION_SCALER = joblib.load(config.CLASSIFICATION_SCALER_PATH)
            print("  [SUCCESS] Classification Feature Scaler: LOADED")
        except Exception as e:
            print(f"  Error loading classification scaler: {e}")
    else:
        print("  WARNING: Classification scaler not found.")

    try:
        CALIBRATOR = TemperatureCalibrator.load()
        print(f"  [SUCCESS] Temperature Calibrator: LOADED (T={CALIBRATOR.temperature:.3f})")
    except Exception as e:
        print(f"  Warning loading calibrator: {e}")
        CALIBRATOR = TemperatureCalibrator()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "scaler_loaded": CLASSIFICATION_SCALER is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Two-Stage Prediction Endpoint:
    1. Stage A: Respiratory vs Non-Respiratory Sound Detector
    2. Stage B: Multi-window Temporal Framing & CRNN Inference
    3. Multi-frame Recording-Level Aggregation & Consensus
    4. Confidence Calibration & Uncertainty Gating
    5. Decoupled Clinical Risk Scoring & Actionable Recommendations
    """
    if 'audio' not in request.files:
        return jsonify({
            "status": "rejected",
            "audio_valid": False,
            "error": "No audio file provided in request",
            "isValidAudio": False
        }), 400
        
    file = request.files['audio']
    if file.filename == '':
        return jsonify({
            "status": "rejected",
            "audio_valid": False,
            "error": "Empty audio filename",
            "isValidAudio": False
        }), 400

    temp_dir = tempfile.gettempdir()
    orig_ext = os.path.splitext(file.filename)[1]
    if not orig_ext:
        orig_ext = ".wav"
    temp_path = os.path.join(temp_dir, f"asthma_upload_{os.urandom(8).hex()}{orig_ext}")
    
    try:
        file.save(temp_path)

        # =========================================================================
        # STAGE A: RESPIRATORY SOUND DETECTION & AUDIO VALIDATION
        # =========================================================================
        is_resp, reason, stage_a_prob = detect_respiratory_sound(temp_path)
        
        if not is_resp:
            return jsonify({
                "status": "rejected",
                "audio_valid": False,
                "respiratory_sound_detected": False,
                "rejection_reason": reason,
                "error": reason,
                "isValidAudio": False,
                "stage_a_confidence": round(stage_a_prob, 3)
            }), 400

        # =========================================================================
        # STAGE B: MULTI-WINDOW TEMPORAL FRAMING & CRNN INFERENCE
        # =========================================================================
        if MODEL is None or CLASSIFICATION_SCALER is None:
            load_local_models()
            
        windows_features = extract_multi_window_features_from_file(temp_path)
        num_windows, T, F = windows_features.shape

        # Scale features
        windows_flat = windows_features.reshape(-1, F)
        windows_scaled_flat = CLASSIFICATION_SCALER.transform(windows_flat)
        windows_input = windows_scaled_flat.reshape(num_windows, T, F)

        # Predict raw probabilities per window
        raw_probs_windows = MODEL.predict(windows_input, verbose=0)
        raw_logits_windows = np.log(np.maximum(raw_probs_windows, 1e-12))

        # Calibrate per-window probabilities
        calibrator = CALIBRATOR if CALIBRATOR is not None else TemperatureCalibrator()
        calibrated_probs_windows = calibrator.predict_calibrated_probs(raw_logits_windows)

        # =========================================================================
        # RECORDING-LEVEL MULTI-FRAME TEMPORAL AGGREGATION
        # =========================================================================
        # 1. Mean pooled probability across all temporal windows
        mean_calibrated_probs = np.mean(calibrated_probs_windows, axis=0)

        # 2. Window-level predicted class votes
        window_votes = [int(np.argmax(p)) for p in calibrated_probs_windows]
        vote_counts = {cls_idx: window_votes.count(cls_idx) for cls_idx in range(len(config.CLASSES))}

        # 3. Check for non-respiratory invalid class consensus
        invalid_idx = config.CLASSES.get("invalid", 5)
        if mean_calibrated_probs[invalid_idx] > 0.50 or (vote_counts.get(invalid_idx, 0) / max(1, num_windows)) >= 0.50:
            return jsonify({
                "status": "rejected",
                "audio_valid": False,
                "respiratory_sound_detected": False,
                "rejection_reason": "Non-respiratory sound detected. The recording contains human speech, vocalization, music, or environmental noise instead of respiratory lung sounds.",
                "error": "Non-respiratory sound detected. The recording contains prominent human speech, vocalization, songs, or background music instead of respiratory lung sounds.",
                "isValidAudio": False
            }), 400

        # 4. Determine final recording-level classification
        predicted_idx = int(np.argmax(mean_calibrated_probs))
        predicted_class = config.INV_CLASSES.get(predicted_idx, "healthy")
        
        # Calculate uncertainty metrics on recording-level probability
        is_confident, conf_level, conf_val, entropy = calibrator.evaluate_uncertainty(mean_calibrated_probs)

        # Consensus protection: single outlier frame cannot override healthy respiratory baseline
        healthy_idx = config.CLASSES.get("healthy", 0)
        healthy_prob = float(mean_calibrated_probs[healthy_idx])
        abnormal_vote_count = sum(vote_counts.get(idx, 0) for idx in [config.CLASSES.get("asthma", 1), config.CLASSES.get("copd", 2), config.CLASSES.get("pneumonia", 3), config.CLASSES.get("other_abnormal", 4)])
        abnormal_ratio = abnormal_vote_count / max(1, num_windows)
        
        # Require >= 55% abnormal consensus and aggregate abnormal prob >= 0.50 to declare abnormal disease
        if predicted_class != "healthy" and (abnormal_ratio < 0.55 or float(mean_calibrated_probs[predicted_idx]) < 0.52):
            predicted_class = "healthy"
            conf_val = max(healthy_prob, 0.65)

        # Safe rejection for ambiguous audio
        if not is_confident and predicted_class != "healthy":
            return jsonify({
                "status": "uncertain",
                "audio_valid": True,
                "respiratory_sound_detected": True,
                "condition": "healthy",
                "classification": "uncertain",
                "confidence": "Low",
                "rawConfidence": round(float(conf_val), 3),
                "entropy": round(float(entropy), 3),
                "summary": "Unable to confidently classify this audio. Acoustic respiratory pattern is ambiguous or indistinct. Audio is assessed as baseline low risk.",
                "riskLevel": "Low",
                "wheezingDetected": "No",
                "pattern": "Indistinct breath acoustic pattern · Baseline Low Risk",
                "regularity": "85%",
                "rr": "15 bpm",
                "recommendedExercise": "pursed_lip",
                "recommendations": [
                    "Ensure the microphone is placed securely against the upper or mid-chest.",
                    "Take deep, steady breaths in a quiet environment.",
                    "Repeat the 5-10 second recording to obtain a clear acoustic reading."
                ],
                "foodsToEat": ["warm water", "herbal tea", "fresh fruits"],
                "foodsToAvoid": ["cold drinks", "heavy meals"],
                "isValidAudio": True
            }), 200

        # =========================================================================
        # DECOUPLED RISK SCORING & RECOMMENDATIONS
        # =========================================================================
        risk_result = assess_risk(predicted_class, float(conf_val))
        recs_result = generate_recommendations(risk_result["riskLevel"], predicted_class)

        response_payload = {
            "status": "valid",
            "audio_valid": True,
            "respiratory_sound_detected": True,
            "condition": predicted_class,
            "classification": predicted_class,
            "confidence": conf_level,
            "rawConfidence": float(conf_val),
            "entropy": round(float(entropy), 3),
            "riskLevel": risk_result["riskLevel"],
            "wheezingDetected": risk_result["wheezingDetected"],
            "pattern": risk_result["pattern"],
            "regularity": risk_result["regularity"],
            "rr": risk_result["rr"],
            "summary": recs_result.get("summary", "Analysis completed."),
            "recommendedExercise": recs_result.get("recommendedExercise", "diaphragmatic"),
            "recommendations": recs_result.get("recommendations", []),
            "foodsToEat": recs_result.get("foodsToEat", []),
            "foodsToAvoid": recs_result.get("foodsToAvoid", []),
            "isValidAudio": True,
            "model": "offline-two-stage-crnn-multi-window"
        }

        return jsonify(response_payload), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "error": f"Internal inference error: {str(e)}",
            "isValidAudio": False
        }), 500
        
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

if __name__ == '__main__':
    load_local_models()
    port = int(os.environ.get('ML_PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=False)
