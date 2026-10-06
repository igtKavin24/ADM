import os
import json
import joblib
import pandas as pd
import numpy as np
from backend.config import MODEL_DIR, TARGET_CLASSES, RISK_THRESHOLDS

def load_model(model_name='gradient_boosting'):
    model_path = os.path.join(MODEL_DIR, f'{model_name}.pkl')
    scaler_path = os.path.join(MODEL_DIR, 'scaler.pkl')
    features_path = os.path.join(MODEL_DIR, 'feature_names.json')
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path) or not os.path.exists(features_path):
        raise FileNotFoundError("Model files not found. Run train.py first.")
        
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    with open(features_path, 'r') as f:
        feature_names = json.load(f)
        
    return model, scaler, feature_names

def _get_risk_level(prob_dict):
    expected_risk = prob_dict.get(3, 0) * 1.0 + prob_dict.get(2, 0) * 0.7 + prob_dict.get(1, 0) * 0.4 + prob_dict.get(0, 0) * 0.0
    
    for level, (low, high) in RISK_THRESHOLDS.items():
        if low <= expected_risk <= high:
            return level
    return "CRITICAL" if expected_risk > 0.8 else "STABLE"

def predict(features_dict, model_name='gradient_boosting'):
    model, scaler, feature_names = load_model(model_name)
    df = pd.DataFrame([features_dict]).reindex(columns=feature_names, fill_value=0.0)
    X_scaled = pd.DataFrame(scaler.transform(df), columns=feature_names)
    pred_class = int(model.predict(X_scaled)[0])
    probs = model.predict_proba(X_scaled)[0]
    
    prob_dict = {i: float(probs[i]) for i in range(len(probs))}
    target_info = TARGET_CLASSES.get(pred_class, TARGET_CLASSES[0])
    
    return {
        'prediction': pred_class,
        'risk_level': target_info['name'],
        'probabilities': prob_dict,
        'horizon': target_info['horizon'],
        'model_name': model_name,
        'dataset': 'IEEE14 Synthetic'
    }

def predict_batch(features_list, model_name='gradient_boosting'):
    return [predict(f, model_name) for f in features_list]

def get_model_metrics():
    metrics_path = os.path.join(MODEL_DIR, 'metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            return json.load(f)
    return {}
