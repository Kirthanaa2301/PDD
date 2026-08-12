import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

import json
from concurrent.futures import ProcessPoolExecutor, as_completed
import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
import joblib

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from ml import config
from ml.data_processor import scan_datasets, split_dataset
from ml.feature_extractor import extract_features_from_file
from ml.model_architect import build_model
from ml.stage_a_detector import train_stage_a_detector
from ml.calibrator import TemperatureCalibrator

def _extract_single_sample(item):
    filepath, label, label_idx = item
    try:
        feat = extract_features_from_file(filepath)
        return feat, label_idx, None
    except Exception as e:
        return None, None, f"{filepath}: {str(e)}"

def extract_classification_features_parallel(samples, label_to_idx, max_workers=6):
    """Extract features in parallel using ProcessPoolExecutor."""
    tasks = [(s["filepath"], s["label"], label_to_idx[s["label"]]) for s in samples]
    total = len(tasks)
    print(f"Extracting features for {total} samples using {max_workers} worker processes...", flush=True)

    X = []
    y = []
    completed = 0

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(_extract_single_sample, t) for t in tasks]
        for f in as_completed(futures):
            feat, label_idx, err = f.result()
            if feat is not None:
                X.append(feat)
                y.append(label_idx)
            elif err:
                print(f"  Warning: {err}", flush=True)
            
            completed += 1
            if completed % 400 == 0 or completed == total:
                print(f"  Processed {completed}/{total} files...", flush=True)

    return np.array(X), np.array(y)

def plot_training_curves(history, output_dir):
    """Plot training and validation accuracy/loss."""
    plt.figure(figsize=(14, 5))
    
    # Accuracy
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy', color='#2563EB', lw=2)
    plt.plot(history.history['val_accuracy'], label='Val Accuracy', color='#059669', lw=2)
    plt.title('Stage B Model Accuracy', fontsize=12, fontweight='bold')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(alpha=0.3)
    
    # Loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss', color='#DC2626', lw=2)
    plt.plot(history.history['val_loss'], label='Val Loss', color='#D97706', lw=2)
    plt.title('Stage B Model Loss', fontsize=12, fontweight='bold')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(alpha=0.3)
    
    plt.tight_layout()
    os.makedirs(output_dir, exist_ok=True)
    plt.savefig(os.path.join(output_dir, "training_history.png"), dpi=300)
    plt.close()

def plot_confusion_matrix(cm, class_names, output_dir):
    """Generate and save confusion matrix figure."""
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Stage B Test Confusion Matrix (Unseen Patients)', fontsize=13, fontweight='bold')
    plt.colorbar()
    
    tick_marks = np.arange(len(class_names))
    plt.xticks(tick_marks, class_names, rotation=45, ha='right')
    plt.yticks(tick_marks, class_names)
    
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     ha="center", va="center",
                     color="white" if cm[i, j] > thresh else "black",
                     fontweight='bold')
                     
    plt.ylabel('Ground Truth Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=300)
    plt.close()

def main():
    print("==================================================", flush=True)
    print("STARTING COMPLETE OFFLINE RESPIRATORY ML TRAINING", flush=True)
    print("==================================================", flush=True)
    
    # 1. Scan and Split Dataset with Patient Grouping (Zero Leakage)
    samples = scan_datasets()
    train_samples, val_samples, test_samples = split_dataset(samples)
    
    # 2. Stage A Detector
    if not os.path.exists(config.VALIDATOR_PATH):
        print("\n--- Training Stage A Detector ---", flush=True)
        train_stage_a_detector(train_samples, val_samples)
    else:
        print("\n--- Stage A Detector Models Found (Skipping Stage A Re-extraction) ---", flush=True)
    
    # 3. Extract Stage B Classification Features in Parallel
    print("\n--- Extracting Stage B Classification Features ---", flush=True)
    X_train, y_train = extract_classification_features_parallel(train_samples, config.CLASSES, max_workers=6)
    X_val, y_val = extract_classification_features_parallel(val_samples, config.CLASSES, max_workers=6)
    X_test, y_test = extract_classification_features_parallel(test_samples, config.CLASSES, max_workers=6)
    
    print(f"X_train shape: {X_train.shape}, y_train: {y_train.shape}", flush=True)
    print(f"X_val shape:   {X_val.shape}, y_val:   {y_val.shape}", flush=True)
    print(f"X_test shape:  {X_test.shape}, y_test:  {y_test.shape}", flush=True)
    
    # 4. Standardize Sequence Features with StandardScaler
    print("\n--- Fitting Sequence Feature Scaler ---", flush=True)
    scaler_classification = StandardScaler()
    N_train, T, F = X_train.shape
    X_train_flat = X_train.reshape(-1, F)
    X_train_scaled_flat = scaler_classification.fit_transform(X_train_flat)
    X_train = X_train_scaled_flat.reshape(N_train, T, F)
    
    N_val = X_val.shape[0]
    X_val_flat = X_val.reshape(-1, F)
    X_val_scaled_flat = scaler_classification.transform(X_val_flat)
    X_val = X_val_scaled_flat.reshape(N_val, T, F)
    
    N_test = X_test.shape[0]
    X_test_flat = X_test.reshape(-1, F)
    X_test_scaled_flat = scaler_classification.transform(X_test_flat)
    X_test = X_test_scaled_flat.reshape(N_test, T, F)
    
    joblib.dump(scaler_classification, config.CLASSIFICATION_SCALER_PATH)
    print(f"Classification scaler saved to {config.CLASSIFICATION_SCALER_PATH}", flush=True)
    
    # 5. Build and Train Stage B CRNN Architecture
    print("\n--- Building CRNN Model Architecture ---", flush=True)
    model = build_model(input_shape=(T, F))
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config.LEARNING_RATE),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Compute smoothed class weights to protect healthy class
    from sklearn.utils.class_weight import compute_class_weight
    raw_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    smoothed_weights = np.sqrt(raw_weights)
    smoothed_weights = smoothed_weights / np.mean(smoothed_weights)
    class_weight_dict = dict(enumerate(smoothed_weights))
    print(f"Smoothed Class Weights for Training: {class_weight_dict}", flush=True)
    
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True, verbose=1),
        ModelCheckpoint(filepath=config.MODEL_PATH, monitor='val_loss', save_best_only=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4, min_lr=1e-5, verbose=1)
    ]
    
    print("\n--- Training CRNN Model on Patient Training Split ---", flush=True)
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=30,
        batch_size=config.BATCH_SIZE,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1
    )
    
    # 6. Fit Temperature Calibrator on Validation Split
    print("\n--- Fitting Confidence Temperature Calibrator ---", flush=True)
    val_probs_raw = model.predict(X_val, verbose=0)
    val_logits = np.log(np.maximum(val_probs_raw, 1e-12))
    calibrator = TemperatureCalibrator()
    calibrator.fit(val_logits, y_val)
    calibrator.save()
    
    # 7. Evaluate on Held-Out Unseen Patient Test Set
    print("\n--- Evaluating Complete Pipeline on Unseen Patient Test Set ---", flush=True)
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Loss: {test_loss:.4f}, Test Accuracy: {test_acc:.4f} ({test_acc*100:.2f}%)", flush=True)
    
    test_probs = model.predict(X_test, verbose=0)
    test_preds = np.argmax(test_probs, axis=1)
    
    target_names = [config.INV_CLASSES[i] for i in range(len(config.CLASSES))]
    report = classification_report(y_test, test_preds, target_names=target_names, digits=4)
    print("\nClassification Report (Unseen Patients):", flush=True)
    print(report, flush=True)
    
    cm = confusion_matrix(y_test, test_preds)
    print("Confusion Matrix:", flush=True)
    print(cm, flush=True)
    
    # Save visualizations
    plot_training_curves(history, config.MODEL_DIR)
    plot_confusion_matrix(cm, target_names, config.MODEL_DIR)
    
    # Save evaluation summary to reports
    eval_summary = {
        "test_loss": float(test_loss),
        "test_accuracy": float(test_acc),
        "classification_report": classification_report(y_test, test_preds, target_names=target_names, output_dict=True),
        "confusion_matrix": cm.tolist()
    }
    with open(os.path.join(r"d:\PDD WITH MODEL\ml\reports", "test_evaluation_report.json"), "w") as f:
        json.dump(eval_summary, f, indent=4)
        
    print("\n[SUCCESS] Pipeline Retraining & Unseen Patient Evaluation Finished.", flush=True)

if __name__ == "__main__":
    main()
