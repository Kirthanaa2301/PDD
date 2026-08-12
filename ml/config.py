import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
MODEL_PATH = os.path.join(MODEL_DIR, "asthma_model.keras")
VALIDATOR_PATH = os.path.join(MODEL_DIR, "validator_svm.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "feature_scaler.joblib")
CLASSIFICATION_SCALER_PATH = os.path.join(MODEL_DIR, "classification_scaler.joblib")
CALIBRATOR_PATH = os.path.join(MODEL_DIR, "temperature_calibrator.joblib")

# Datasets
DATASET_V2_DIR = r"d:\PDD WITH MODEL\DATASETS\Asthma Detection Dataset Version 2\Asthma Detection Dataset Version 2"
RESP_SOUND_DB_DIR = r"d:\PDD WITH MODEL\DATASETS\archive\Respiratory_Sound_Database\Respiratory_Sound_Database"
INVALID_DATASET_DIR = r"d:\PDD WITH MODEL\DATASETS\Invalid_Audio_Dataset"

# Audio Settings
SAMPLE_RATE = 16000
WINDOW_DURATION = 7.0   # seconds per sliding analysis frame (219 timesteps)
WINDOW_STEP = 3.5       # 50% overlap for multi-window aggregation
DURATION = 7.0          # reference duration

# Feature Extraction Settings
N_MFCC = 13
N_MELS = 128
N_CHROMA = 12
N_CONTRAST = 6

# Authoritative Class Mapping (Healthy as protected baseline at index 0)
CLASSES = {
    "healthy": 0,
    "asthma": 1,
    "copd": 2,
    "pneumonia": 3,
    "other_abnormal": 4,
    "invalid": 5
}
INV_CLASSES = {v: k for k, v in CLASSES.items()}

# Training Hyperparameters
BATCH_SIZE = 32
EPOCHS = 40
LEARNING_RATE = 1e-3
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15
RANDOM_STATE = 42

# Local inference port
SERVICE_PORT = 5005
