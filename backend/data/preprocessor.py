import os
import pandas as pd
from sklearn.preprocessing import StandardScaler
from backend.config import DATA_DIR
import joblib

def load_and_preprocess_data():
    file_path = os.path.join(DATA_DIR, 'ieee14_benchmark.csv')
    df = pd.read_csv(file_path)
    
    train_dfs, val_dfs, test_dfs = [], [], []
    
    for scenario_id, group in df.groupby('scenario_id'):
        group = group.sort_values('step')
        n = len(group)
        n_train = int(n * 0.7)
        n_val = int(n * 0.15)
        
        train_dfs.append(group.iloc[:n_train])
        val_dfs.append(group.iloc[n_train:n_train+n_val])
        test_dfs.append(group.iloc[n_train+n_val:])
        
    train_df = pd.concat(train_dfs)
    val_df = pd.concat(val_dfs)
    test_df = pd.concat(test_dfs)
    
    drop_cols = ['scenario_id', 'step', 'target']
    X_train = train_df.drop(columns=drop_cols)
    X_val = val_df.drop(columns=drop_cols)
    X_test = test_df.drop(columns=drop_cols)
    
    y_train = train_df['target']
    y_val = val_df['target']
    y_test = test_df['target']
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    X_train = pd.DataFrame(X_train_scaled, columns=X_train.columns)
    X_val = pd.DataFrame(X_val_scaled, columns=X_val.columns)
    X_test = pd.DataFrame(X_test_scaled, columns=X_test.columns)
    
    scaler_path = os.path.abspath(os.path.join(DATA_DIR, '..', '..', 'ml', 'models', 'scaler.pkl'))
    os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
    joblib.dump(scaler, scaler_path)
    
    return X_train, X_val, X_test, y_train, y_val, y_test
