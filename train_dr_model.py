"""
EyeRaksha — Real ML Model Trainer
Trains a 5-class Diabetic Retinopathy classifier on the retinal dataset.
Saves model checkpoint to models/dr_classifier.pkl
"""

import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import cv2
import numpy as np
import pickle
from pathlib import Path
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

DATASET_DIR = Path("matlab_dataset")
MODEL_DIR = Path("models")
MODEL_PATH = MODEL_DIR / "dr_classifier.pkl"

CLASS_LABELS = {
    0: "No DR",
    1: "Mild DR",
    2: "Moderate DR",
    3: "Severe DR",
    4: "Proliferative DR"
}

def extract_fundus_features(image_input):
    """
    Extract visual feature vector from a fundus image.
    Calculates:
    - Green channel lesion contrast & intensity distribution
    - LAB color space A/B channel histograms (exudates & hemorrhages)
    - Multi-scale spatial grid stats (4x4 grid)
    """
    if isinstance(image_input, (str, Path)):
        img = cv2.imread(str(image_input))
    elif isinstance(image_input, np.ndarray):
        img = image_input
    else:
        raise ValueError("Invalid image input")
        
    if img is None:
        raise ValueError("Could not read fundus image")
        
    # Resize to standard size 128x128 for efficient feature extraction
    img_resized = cv2.resize(img, (128, 128))
    
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    mask = gray > 15
    
    green = img_resized[:, :, 1]
    lab = cv2.cvtColor(img_resized, cv2.COLOR_BGR2LAB)
    
    features = []
    
    # Global statistical features
    if np.any(mask):
        retina_pixels_g = green[mask]
        retina_pixels_l = lab[:, :, 0][mask]
        retina_pixels_a = lab[:, :, 1][mask]
        retina_pixels_b = lab[:, :, 2][mask]
        
        features.extend([
            float(np.mean(retina_pixels_g)), float(np.std(retina_pixels_g)),
            float(np.percentile(retina_pixels_g, 10)), float(np.percentile(retina_pixels_g, 90)),
            float(np.mean(retina_pixels_l)), float(np.std(retina_pixels_l)),
            float(np.mean(retina_pixels_a)), float(np.std(retina_pixels_a)),
            float(np.mean(retina_pixels_b)), float(np.std(retina_pixels_b))
        ])
    else:
        features.extend([0.0] * 10)
        
    # Color histograms (16 bins per channel in LAB space)
    hist_l = cv2.calcHist([lab], [0], mask.astype(np.uint8), [16], [0, 256]).flatten()
    hist_a = cv2.calcHist([lab], [1], mask.astype(np.uint8), [16], [0, 256]).flatten()
    hist_b = cv2.calcHist([lab], [2], mask.astype(np.uint8), [16], [0, 256]).flatten()
    
    hist_l = hist_l / (np.sum(hist_l) + 1e-6)
    hist_a = hist_a / (np.sum(hist_a) + 1e-6)
    hist_b = hist_b / (np.sum(hist_b) + 1e-6)
    
    features.extend(hist_l.tolist())
    features.extend(hist_a.tolist())
    features.extend(hist_b.tolist())
    
    # Multi-scale spatial grid stats (4x4 grid)
    for i in range(4):
        for j in range(4):
            patch = green[i*32:(i+1)*32, j*32:(j+1)*32]
            features.append(float(np.mean(patch)))
            features.append(float(np.std(patch)))
            
    return np.array(features, dtype=np.float32)

def load_split_dataset(split_name):
    X, y = [], []
    split_dir = DATASET_DIR / split_name
    for class_id in range(5):
        class_dir = split_dir / str(class_id)
        if not class_dir.exists():
            continue
        for img_file in class_dir.glob("*.png"):
            try:
                feat = extract_fundus_features(img_file)
                X.append(feat)
                y.append(class_id)
            except Exception as e:
                print(f"Error processing {img_file}: {e}")
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)

def train():
    print("Loading training dataset...")
    X_train, y_train = load_split_dataset("train")
    print(f"Loaded {len(X_train)} training samples with feature dim {X_train.shape[1]}.")
    
    print("Loading validation dataset...")
    X_val, y_val = load_split_dataset("validation")
    print(f"Loaded {len(X_val)} validation samples.")
    
    print("Training ML classifier...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42
    )
    clf.fit(X_train, y_train)
    
    val_preds = clf.predict(X_val)
    acc = accuracy_score(y_val, val_preds)
    print(f"Validation Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_val, val_preds, target_names=[CLASS_LABELS[i] for i in range(5)]))
    
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({
            "model": clf,
            "class_labels": CLASS_LABELS,
            "feature_dim": X_train.shape[1],
            "framework": "scikit-learn",
            "val_accuracy": float(acc)
        }, f)
    print(f"Model successfully saved to {MODEL_PATH}")

if __name__ == "__main__":
    train()
