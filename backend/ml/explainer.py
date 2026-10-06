import os
import numpy as np
import pandas as pd
from backend.ml.model import load_model

def get_feature_importance(model_name='gradient_boosting'):
    model, scaler, feature_names = load_model(model_name)
    
    importances = None
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'coef_'):
        importances = np.abs(model.coef_[0])
        
    if importances is not None:
        feat_imp = list(zip(feature_names, importances))
        feat_imp.sort(key=lambda x: x[1], reverse=True)
        return feat_imp
    return []

def explain_prediction(features_dict, model_name='gradient_boosting'):
    model, scaler, feature_names = load_model(model_name)
    
    df = pd.DataFrame([features_dict])
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0.0
    df = df[feature_names]
    
    X_scaled = scaler.transform(df)[0]
    
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_scaled.reshape(1, -1))
        if isinstance(shap_values, list):
            sv = np.abs(np.array(shap_values)).mean(axis=0)[0]
        else:
            sv = np.abs(shap_values[0])
            
        contributions = list(zip(feature_names, sv))
    except Exception:
        global_imp = dict(get_feature_importance(model_name))
        contributions = []
        for i, col in enumerate(feature_names):
            val = abs(X_scaled[i]) * global_imp.get(col, 0)
            contributions.append((col, val))
            
    contributions.sort(key=lambda x: x[1], reverse=True)
    return contributions[:10]
