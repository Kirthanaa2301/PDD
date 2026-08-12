import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import joblib
from scipy.optimize import minimize
from ml import config

CALIBRATOR_PATH = os.path.join(config.MODEL_DIR, "temperature_calibrator.joblib")

class TemperatureCalibrator:
    """
    Temperature Scaling calibrator to align raw neural network output logits
    with true posterior probabilities and prevent overconfident false predictions.
    """
    def __init__(self, temperature=1.0, rejection_threshold=0.55, max_entropy=1.80):
        self.temperature = float(temperature)
        self.rejection_threshold = float(rejection_threshold)
        self.max_entropy = float(max_entropy)
        
    def fit(self, logits, y_true):
        """
        Fit temperature parameter T > 0 on held-out validation logits minimizing NLL.
        """
        def nll_loss(T):
            T = max(1e-4, float(T[0]))
            scaled_logits = logits / T
            # Subtract max for numerical stability
            exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=1, keepdims=True))
            probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
            # Gather true class probabilities
            n = len(y_true)
            true_probs = probs[np.arange(n), y_true]
            return -np.mean(np.log(np.maximum(true_probs, 1e-12)))

        res = minimize(nll_loss, [1.0], method='Nelder-Mead', bounds=[(0.05, 5.0)])
        self.temperature = float(res.x[0])
        print(f"Fitted Temperature Scaling Parameter: T = {self.temperature:.4f}")
        return self

    def predict_calibrated_probs(self, logits):
        """Scale logits by temperature T and apply softmax."""
        scaled_logits = logits / self.temperature
        exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
        return probs

    def evaluate_uncertainty(self, probs):
        """
        Evaluate if the model's prediction is safe or uncertain.
        Returns:
            is_confident: bool
            confidence_level: str ('High', 'Moderate', 'Low')
            confidence_val: float
            entropy: float
        """
        confidence_val = float(np.max(probs))
        entropy = float(-np.sum(probs * np.log2(np.maximum(probs, 1e-12))))
        
        if confidence_val >= 0.75:
            conf_str = "High"
        elif confidence_val >= self.rejection_threshold:
            conf_str = "Moderate"
        else:
            conf_str = "Low"
            
        is_confident = (confidence_val >= self.rejection_threshold) and (entropy <= self.max_entropy)
        return is_confident, conf_str, confidence_val, entropy

    def save(self, filepath=CALIBRATOR_PATH):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)
        print(f"Saved Temperature Calibrator to {filepath}")

    @staticmethod
    def load(filepath=CALIBRATOR_PATH):
        if os.path.exists(filepath):
            return joblib.load(filepath)
        return TemperatureCalibrator()
