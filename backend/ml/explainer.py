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
    
    df = pd.DataFrame([features_dict]).reindex(columns=feature_names, fill_value=0.0)
    X_scaled = pd.DataFrame(scaler.transform(df), columns=feature_names)

    try:
        import shap
        sv = np.array(shap.TreeExplainer(model).shap_values(X_scaled))
        # shap returns (classes, 1, features) or (1, features, classes) depending on version
        sv = np.abs(sv).squeeze()
        if sv.ndim == 2:
            sv = sv.mean(axis=0 if sv.shape[1] == len(feature_names) else 1)
        contributions = list(zip(feature_names, sv))
    except Exception:
        global_imp = dict(get_feature_importance(model_name))
        contributions = [(c, abs(float(X_scaled.iloc[0][c])) * global_imp.get(c, 0)) for c in feature_names]

    contributions.sort(key=lambda x: x[1], reverse=True)
    return [(f, float(v)) for f, v in contributions[:10]]
