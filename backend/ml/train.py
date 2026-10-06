import os
import json
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from backend.data.preprocessor import load_and_preprocess_data
from backend.config import MODEL_DIR, RANDOM_SEED

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False
    from sklearn.ensemble import HistGradientBoostingClassifier

def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro', zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1, 2, 3]).tolist()
    
    per_class_prec, per_class_rec, per_class_f1, _ = precision_recall_fscore_support(y_test, y_pred, average=None, labels=[0, 1, 2, 3], zero_division=0)
    
    metrics = {
        'accuracy': acc,
        'macro_precision': prec,
        'macro_recall': rec,
        'macro_f1': f1,
        'per_class': {
            'precision': per_class_prec.tolist(),
            'recall': per_class_rec.tolist(),
            'f1': per_class_f1.tolist()
        },
        'majority_baseline_accuracy': float(y_test.value_counts(normalize=True).max()),
        'test_class_counts': {int(k): int(v) for k, v in y_test.value_counts().sort_index().items()},
        'confusion_matrix': cm
    }
    return metrics

def train_all():
    print("Loading and preprocessing data...")
    X_train, X_val, X_test, y_train, y_val, y_test = load_and_preprocess_data()
    
    print("Training Logistic Regression baseline...")
    lr = LogisticRegression(max_iter=1000, random_state=RANDOM_SEED)
    lr.fit(X_train, y_train)
    lr_metrics = evaluate_model(lr, X_test, y_test)
    
    print("Training Gradient Boosting model...")
    if HAS_LGB:
        gbm = lgb.LGBMClassifier(random_state=RANDOM_SEED)
    else:
        gbm = HistGradientBoostingClassifier(random_state=RANDOM_SEED)
        
    gbm.fit(X_train, y_train)
    gbm_metrics = evaluate_model(gbm, X_test, y_test)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    joblib.dump(lr, os.path.join(MODEL_DIR, 'logistic_regression.pkl'))
    joblib.dump(gbm, os.path.join(MODEL_DIR, 'gradient_boosting.pkl'))
    
    features = list(X_train.columns)
    with open(os.path.join(MODEL_DIR, 'feature_names.json'), 'w') as f:
        json.dump(features, f)
        
    all_metrics = {
        'logistic_regression': lr_metrics,
        'gradient_boosting': gbm_metrics
    }
    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w') as f:
        json.dump(all_metrics, f, indent=4)
        
    print("Training complete. Metrics:")
    print(json.dumps(all_metrics, indent=2))

if __name__ == '__main__':
    train_all()
