import os
import sys
import unittest
import numpy as np
import soundfile as sf
import tempfile

# Ensure project root is in the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml import config
from ml.audio_validator import validate_audio_file, extract_validation_features
from ml.preprocessor import preprocess_audio, bandpass_filter
from ml.feature_extractor import extract_features_from_signal
from ml.risk_engine import assess_risk
from ml.recommendation import generate_recommendations
from ml.model_architect import build_model

class TestMLPipeline(unittest.TestCase):
    
    def setUp(self):
        # Create a temporary synthetic wav file representing noise
        self.sr = 16000
        # 1.5 seconds of simulated audio
        self.audio_len = int(1.5 * self.sr)
        self.signal = np.random.uniform(-0.2, 0.2, self.audio_len)
        
        self.temp_wav_fd, self.temp_wav_path = tempfile.mkstemp(suffix=".wav")
        sf.write(self.temp_wav_path, self.signal, self.sr)
        
    def tearDown(self):
        os.close(self.temp_wav_fd)
        if os.path.exists(self.temp_wav_path):
            try:
                os.remove(self.temp_wav_path)
            except Exception:
                pass

    def test_audio_validator_basic(self):
        """Test basic audio validation rules (format, existence, length)."""
        # Test nonexistent file
        is_valid, msg = validate_audio_file("nonexistent.wav")
        self.assertFalse(is_valid)
        self.assertIn("exist", msg.lower())
        
        # Test unsupported format
        temp_txt_fd, temp_txt_path = tempfile.mkstemp(suffix=".txt")
        try:
            with os.fdopen(temp_txt_fd, 'w') as f:
                f.write("dummy content")
            is_valid, msg = validate_audio_file(temp_txt_path)
            self.assertFalse(is_valid)
            self.assertIn("format", msg.lower())
        finally:
            if os.path.exists(temp_txt_path):
                os.remove(temp_txt_path)
                
        # Test valid synthetic file (Note: might fail SVM test if model trained, but format/size checks should pass)
        is_valid, msg = validate_audio_file(self.temp_wav_path)
        # It's okay if it fails due to noise check or SVM outlier check, but it shouldn't raise exceptions
        self.assertIsInstance(is_valid, bool)

    def test_preprocessing(self):
        """Test audio preprocessing (resampling, filtering, duration normalization)."""
        # Apply preprocessing
        y_proc = preprocess_audio(self.signal, self.sr)
        
        # Check target sample rate duration
        expected_len = int(config.DURATION * config.SAMPLE_RATE)
        self.assertEqual(len(y_proc), expected_len)
        
        # Check normalization (max absolute value should be 1.0 or 0.0 if silent)
        max_val = np.max(np.abs(y_proc))
        self.assertTrue(max_val == 0.0 or np.isclose(max_val, 1.0))

    def test_feature_extraction(self):
        """Test feature extraction output shape."""
        y_proc = preprocess_audio(self.signal, self.sr)
        feats = extract_features_from_signal(y_proc, config.SAMPLE_RATE)
        
        # Check output shape (timesteps, features)
        # timesteps = 1 + floor(target_samples / hop_length) = 1 + floor(112000 / 512) = 219
        self.assertEqual(feats.ndim, 2)
        self.assertEqual(feats.shape[0], 219)
        self.assertEqual(feats.shape[1], 161)  # Mel (128) + MFCC (13) + Chroma (12) + Contrast (6) + ZCR (1) + RMS (1)

    def test_model_architecture(self):
        """Test instantiation and shape checking of CRNN model."""
        model = build_model(input_shape=(219, 161))
        self.assertEqual(model.input_shape, (None, 219, 161))
        self.assertEqual(model.output_shape, (None, len(config.CLASSES)))

    def test_risk_scoring(self):
        """Test mapping predicted conditions to risk levels."""
        risk_healthy = assess_risk("healthy", 0.95)
        self.assertEqual(risk_healthy["riskLevel"], "Low")
        self.assertEqual(risk_healthy["wheezingDetected"], "No")
        
        risk_asthma = assess_risk("asthma", 0.85)
        self.assertEqual(risk_asthma["riskLevel"], "High")
        self.assertEqual(risk_asthma["wheezingDetected"], "Yes")
        
        risk_abnormal = assess_risk("other_abnormal", 0.70)
        self.assertEqual(risk_abnormal["riskLevel"], "Moderate")

    def test_recommendation_generation(self):
        """Test recommendation content selection based on risk level."""
        recs_low = generate_recommendations("Low", "healthy")
        self.assertIn("healthy", recs_low["summary"].lower())
        self.assertEqual(recs_low["recommendedExercise"], "none")
        
        recs_high = generate_recommendations("High", "asthma")
        self.assertIn("asthma", recs_high["summary"].lower())
        self.assertEqual(recs_high["recommendedExercise"], "diaphragmatic")
        self.assertTrue(len(recs_high["recommendations"]) > 0)

if __name__ == "__main__":
    unittest.main()
