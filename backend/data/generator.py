import os
import numpy as np
import pandas as pd
from backend.config import DATA_DIR, IEEE14_LINES, TARGET_CLASSES

DATASET_PROVENANCE = {
    'name': 'JARASANDHA IEEE 14-Bus Synthetic Benchmark',
    'type': 'Deterministic synthetic benchmark',
    'basis': 'IEEE 14-bus test system topology and parameters',
    'purpose': 'ML model development and prototype demonstration',
    'limitation': 'Synthetic data based on plausible parameter ranges; not from live Grid2Op simulation',
    'generation_method': 'Deterministic scenario simulation with controlled degradation patterns',
    'seed': 42
}

def generate_dataset():
    np.random.seed(42)
    n_scenarios = 100
    total_records = 5000
    records_per_scenario = total_records // n_scenarios
    
    data = []
    
    for scenario_id in range(n_scenarios):
        # Scenario baseline conditions
        base_load_multiplier = np.random.uniform(0.8, 1.3)
        degradation_rate = np.random.uniform(0.01, 0.05)
        
        for step in range(records_per_scenario):
            record = {'scenario_id': scenario_id, 'step': step}
            
            # Loads (11 loads)
            total_load = 0
            for i in range(11):
                p = np.random.normal(15 * base_load_multiplier, 3) * (1 + step * degradation_rate)
                q = p * np.random.uniform(0.1, 0.3)
                record[f'load_p_{i}'] = p
                record[f'load_q_{i}'] = q
                total_load += p
                
            # Generators (5 generators)
            total_gen = 0
            for i in range(5):
                p = np.random.normal(total_load / 5, 5)
                record[f'gen_p_{i}'] = p
                total_gen += p
                
            record['total_gen'] = total_gen
            record['total_load'] = total_load
            record['gen_load_balance'] = total_gen - total_load
            
            # Lines (20 lines)
            max_rho = 0
            n_overloaded = 0
            n_disconnected = 0
            
            for i in range(20):
                # Line status
                disconnect_prob = 0.001 + (step * 0.002 * degradation_rate)
                is_disconnected = np.random.random() < disconnect_prob
                record[f'line_status_{i}'] = 0 if is_disconnected else 1
                
                if is_disconnected:
                    n_disconnected += 1
                    rho = 0.0
                    p_or = 0.0
                    q_or = 0.0
                else:
                    base_rho = np.random.uniform(0.3, 0.8)
                    rho = base_rho * (1 + step * degradation_rate)
                    rho += np.random.normal(0, 0.05)
                    rho = max(0.0, rho)
                    
                    limit = IEEE14_LINES[i]['thermal_limit']
                    p_or = rho * limit * np.random.uniform(0.8, 1.0)
                    q_or = p_or * np.random.uniform(0.1, 0.3)
                    
                    if rho > 1.0:
                        n_overloaded += 1
                    max_rho = max(max_rho, rho)
                    
                record[f'rho_{i}'] = rho
                record[f'p_or_{i}'] = p_or
                record[f'q_or_{i}'] = q_or
                
            record['max_rho'] = max_rho
            record['n_overloaded'] = n_overloaded
            record['n_disconnected'] = n_disconnected
            
            risk_score = (max_rho * 0.5) + (n_overloaded * 0.3) + (n_disconnected * 0.5)
            risk_score += np.random.normal(0, 0.1)
            
            # Adjusted thresholds to aim for 60/20/12/8 distribution
            if risk_score < 0.65:
                target = 0
            elif risk_score < 1.05:
                target = 1
            elif risk_score < 1.4:
                target = 2
            else:
                target = 3
                
            record['target'] = target
            data.append(record)
            
    df = pd.DataFrame(data)
    
    os.makedirs(DATA_DIR, exist_ok=True)
    out_path = os.path.join(DATA_DIR, 'ieee14_benchmark.csv')
    df.to_csv(out_path, index=False)
    print(f"Generated dataset at {out_path} with {len(df)} records.")
    print("Class distribution:")
    print(df['target'].value_counts(normalize=True))

if __name__ == '__main__':
    generate_dataset()
