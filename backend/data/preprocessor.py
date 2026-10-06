import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from backend.config import DATA_DIR, MODEL_DIR, RANDOM_SEED, TEST_SIZE, VAL_SIZE

DROP_COLS = ['scenario_id', 'step', 'target']


def load_dataset():
    return pd.read_csv(os.path.join(DATA_DIR, 'ieee14_benchmark.csv'))


def load_and_preprocess_data():
    """Split by scenario (not by time step) so every split sees all risk classes
    and no scenario leaks between train and test. Scaler is fit on train only."""
    df = load_dataset()
    ids = np.array(sorted(df['scenario_id'].unique()))
    np.random.RandomState(RANDOM_SEED).shuffle(ids)
    n_test, n_val = int(len(ids) * TEST_SIZE), int(len(ids) * VAL_SIZE)
    parts = {
        'test': ids[:n_test],
        'val': ids[n_test:n_test + n_val],
        'train': ids[n_test + n_val:],
    }
    split = {k: df[df['scenario_id'].isin(v)] for k, v in parts.items()}

    scaler = StandardScaler().fit(split['train'].drop(columns=DROP_COLS))
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(scaler, os.path.join(MODEL_DIR, 'scaler.pkl'))

    def prep(d):
        X = d.drop(columns=DROP_COLS)
        return pd.DataFrame(scaler.transform(X), columns=X.columns), d['target'].reset_index(drop=True)

    X_train, y_train = prep(split['train'])
    X_val, y_val = prep(split['val'])
    X_test, y_test = prep(split['test'])
    return X_train, X_val, X_test, y_train, y_val, y_test
