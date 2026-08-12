import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import glob
import hashlib
import json
import csv
import random
import soundfile as sf
import numpy as np
from collections import defaultdict
from ml import config

def get_file_hash(filepath):
    """Calculate MD5 hash of audio file to eliminate duplicate recordings."""
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            buf = f.read(65536)
            while len(buf) > 0:
                hasher.update(buf)
                buf = f.read(65536)
        return hasher.hexdigest()
    except Exception:
        return None

def check_audio_corrupted(filepath):
    """Verify if the audio file is readable and non-empty."""
    try:
        with sf.SoundFile(filepath) as f:
            if len(f) == 0:
                return True, "Empty audio file"
            chunk = f.read(100)
            if chunk is None or len(chunk) == 0:
                return True, "Unreadable audio data"
        return False, "OK"
    except Exception as e:
        return True, str(e)

def extract_patient_id(filename, dataset_source):
    """
    Extract canonical patient identifier to enforce strict patient-level splitting.
    """
    basename = os.path.splitext(os.path.basename(filename))[0]
    
    if dataset_source == "dataset_v2":
        if basename.startswith("P") and any(k in basename for k in ["Asthma", "Wheezing", "COPD", "Healthy", "Bronchial", "Pneumonia"]):
            for keyword in ["Asthma", "Wheezing", "COPD", "Healthy", "Bronchial", "Pneumonia"]:
                if keyword in basename:
                    return f"v2_{basename.split(keyword)[0]}"
            return f"v2_{basename.split('_')[0]}"
        elif "_" in basename:
            return f"v2_{basename.split('_')[0]}"
        else:
            return f"v2_{basename}"
            
    elif dataset_source == "resp_sound_db":
        parts = basename.split('_')
        return f"icbhi_{parts[0]}"
        
    elif dataset_source == "invalid_dataset":
        return f"invalid_{basename}"
        
    return f"unknown_{basename}"

def load_resp_sound_db_diagnoses():
    """Load clinical diagnosis mapping from patient_diagnosis.csv."""
    diag_map = {}
    csv_path = os.path.join(config.RESP_SOUND_DB_DIR, "patient_diagnosis.csv")
    if not os.path.exists(csv_path):
        print(f"WARNING: patient_diagnosis.csv not found at {csv_path}")
        return diag_map
    
    with open(csv_path, mode='r') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 2:
                pid, diag = row[0].strip(), row[1].strip()
                diag_map[pid] = diag
    return diag_map

def map_diagnosis_to_class(diag):
    """Map raw clinical diagnosis string to authoritative config class."""
    diag_lower = diag.lower().strip()
    if "healthy" in diag_lower:
        return "healthy"
    elif "asthma" in diag_lower:
        return "asthma"
    elif "copd" in diag_lower:
        return "copd"
    elif "pneumonia" in diag_lower:
        return "pneumonia"
    elif diag_lower in ["urti", "lrti", "bronchiectasis", "bronchiolitis", "bronchial"]:
        return "other_abnormal"
    else:
        return "other_abnormal"

def scan_datasets():
    """Scan dataset paths, remove duplicates, filter corrupt audio, and extract patient IDs."""
    samples = []
    seen_hashes = set()
    logs = {
        "scanned_files": 0,
        "corrupted_files": [],
        "duplicate_files": [],
        "class_counts": {k: 0 for k in config.CLASSES.keys()},
        "sources": {"dataset_v2": 0, "resp_sound_db": 0, "invalid_dataset": 0}
    }

    # 1. Scan Asthma Detection Dataset Version 2
    if os.path.exists(config.DATASET_V2_DIR):
        print("Processing Asthma Detection Dataset Version 2...")
        for folder in os.listdir(config.DATASET_V2_DIR):
            folder_path = os.path.join(config.DATASET_V2_DIR, folder)
            if not os.path.isdir(folder_path):
                continue
            
            if folder.lower() == "bronchial":
                norm_class = "other_abnormal"
            else:
                norm_class = map_diagnosis_to_class(folder)
                
            if norm_class not in config.CLASSES:
                continue
                
            wav_files = glob.glob(os.path.join(folder_path, "*.wav"))
            for filepath in wav_files:
                logs["scanned_files"] += 1
                
                is_corrupt, reason = check_audio_corrupted(filepath)
                if is_corrupt:
                    logs["corrupted_files"].append({"file": filepath, "reason": reason})
                    continue
                
                file_hash = get_file_hash(filepath)
                if file_hash in seen_hashes:
                    logs["duplicate_files"].append(filepath)
                    continue
                
                seen_hashes.add(file_hash)
                patient_id = extract_patient_id(filepath, "dataset_v2")
                samples.append({
                    "filepath": os.path.abspath(filepath),
                    "label": norm_class,
                    "patient_id": patient_id,
                    "source": "dataset_v2"
                })
                logs["class_counts"][norm_class] += 1
                logs["sources"]["dataset_v2"] += 1

    # 2. Scan Respiratory Sound Database (archive)
    audio_dir = os.path.join(config.RESP_SOUND_DB_DIR, "audio_and_txt_files")
    if os.path.exists(audio_dir):
        print("Processing Respiratory Sound Database...")
        diag_map = load_resp_sound_db_diagnoses()
        
        wav_files = glob.glob(os.path.join(audio_dir, "*.wav"))
        for filepath in wav_files:
            logs["scanned_files"] += 1
            
            filename = os.path.basename(filepath)
            pid = filename.split('_')[0]
            diag = diag_map.get(pid, "other_abnormal")
            norm_class = map_diagnosis_to_class(diag)
            
            is_corrupt, reason = check_audio_corrupted(filepath)
            if is_corrupt:
                logs["corrupted_files"].append({"file": filepath, "reason": reason})
                continue
            
            file_hash = get_file_hash(filepath)
            if file_hash in seen_hashes:
                logs["duplicate_files"].append(filepath)
                continue
            
            seen_hashes.add(file_hash)
            patient_id = extract_patient_id(filepath, "resp_sound_db")
            samples.append({
                "filepath": os.path.abspath(filepath),
                "label": norm_class,
                "patient_id": patient_id,
                "source": "resp_sound_db"
            })
            logs["class_counts"][norm_class] += 1
            logs["sources"]["resp_sound_db"] += 1

    # 3. Scan Invalid Audio Dataset
    if hasattr(config, "INVALID_DATASET_DIR") and os.path.exists(config.INVALID_DATASET_DIR):
        print("Processing Invalid Audio Dataset...")
        wav_files = glob.glob(os.path.join(config.INVALID_DATASET_DIR, "*.wav"))
        for filepath in wav_files:
            logs["scanned_files"] += 1
            
            is_corrupt, reason = check_audio_corrupted(filepath)
            if is_corrupt:
                logs["corrupted_files"].append({"file": filepath, "reason": reason})
                continue
                
            file_hash = get_file_hash(filepath)
            if file_hash in seen_hashes:
                logs["duplicate_files"].append(filepath)
                continue
                
            seen_hashes.add(file_hash)
            patient_id = extract_patient_id(filepath, "invalid_dataset")
            samples.append({
                "filepath": os.path.abspath(filepath),
                "label": "invalid",
                "patient_id": patient_id,
                "source": "invalid_dataset"
            })
            logs["class_counts"]["invalid"] += 1
            logs["sources"]["invalid_dataset"] += 1

    # Save preprocessing logs
    os.makedirs(config.MODEL_DIR, exist_ok=True)
    os.makedirs(config.REPORTS_DIR, exist_ok=True)
    with open(os.path.join(config.MODEL_DIR, "preprocessing_log.json"), 'w') as f:
        json.dump(logs, f, indent=4)
        
    print(f"Preprocessing completed. Scanned: {logs['scanned_files']}, Valid: {len(samples)}, Corrupted: {len(logs['corrupted_files'])}, Duplicates: {len(logs['duplicate_files'])}")
    print("Class Counts:", logs["class_counts"])
    
    return samples

def split_dataset(samples, val_split=config.VAL_SPLIT, test_split=config.TEST_SPLIT, seed=config.RANDOM_STATE):
    """
    Organize samples into train, val, and test splits with strict patient-level grouping.
    Prevents patient acoustic leakage across splits.
    """
    random.seed(seed)
    np.random.seed(seed)
    
    # Group samples by patient ID
    patients = defaultdict(list)
    patient_classes = {}
    for sample in samples:
        pid = sample["patient_id"]
        patients[pid].append(sample)
        if pid not in patient_classes:
            patient_classes[pid] = sample["label"]

    # Stratified patient assignment by primary condition
    class_patients = defaultdict(list)
    for pid, cls_name in patient_classes.items():
        class_patients[cls_name].append(pid)

    train_pats = set()
    val_pats = set()
    test_pats = set()

    for cls_name, pids in class_patients.items():
        random.shuffle(pids)
        n = len(pids)
        n_test = max(1, int(round(n * test_split))) if n >= 4 else (1 if n >= 3 else 0)
        n_val = max(1, int(round(n * val_split))) if n >= 4 else (1 if n >= 2 else 0)
        n_train = n - n_test - n_val
        if n_train <= 0:
            n_train = max(1, n - 1)
            n_val = 0
            n_test = n - n_train

        test_pats.update(pids[:n_test])
        val_pats.update(pids[n_test:n_test + n_val])
        train_pats.update(pids[n_test + n_val:])

    train_set = [s for s in samples if s["patient_id"] in train_pats]
    val_set = [s for s in samples if s["patient_id"] in val_pats]
    test_set = [s for s in samples if s["patient_id"] in test_pats]

    # Verify zero patient overlap
    overlap_train_test = train_pats.intersection(test_pats)
    overlap_train_val = train_pats.intersection(val_pats)
    overlap_val_test = val_pats.intersection(test_pats)
    
    assert len(overlap_train_test) == 0, f"Leakage detected between train and test: {overlap_train_test}"
    assert len(overlap_train_val) == 0, f"Leakage detected between train and val: {overlap_train_val}"
    assert len(overlap_val_test) == 0, f"Leakage detected between val and test: {overlap_val_test}"

    random.shuffle(train_set)
    random.shuffle(val_set)
    random.shuffle(test_set)

    print(f"\n[SUCCESS] Patient-Level Group Split Complete (Zero Leakage):")
    print(f"  * Unique Patients -> Train: {len(train_pats)}, Val: {len(val_pats)}, Test: {len(test_pats)}")
    print(f"  * Sample Counts  -> Train: {len(train_set)}, Val: {len(val_set)}, Test: {len(test_set)}")
    
    return train_set, val_set, test_set

if __name__ == "__main__":
    samples = scan_datasets()
    train_set, val_set, test_set = split_dataset(samples)
