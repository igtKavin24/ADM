"""
JARASANDHA Backend Configuration
Predictive Power-Grid Resilience Engine
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'datasets')
MODEL_DIR = os.path.join(BASE_DIR, 'ml', 'models')

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# ─── Dataset Configuration ───────────────────────────────────────
DATASET_NAME = "IEEE 14-Bus Grid2Op Sandbox Benchmark"
DATASET_TYPE = "Public simulation benchmark"
DATASET_DOMAIN = "Power-grid resilience"
DATASET_LIMITATION = "Simulation-based; not live operational utility data"
TIMESTEP_MINUTES = 5  # Grid2Op l2rpn_case14_sandbox: 5 minutes per step

# ─── ML Configuration ────────────────────────────────────────────
RANDOM_SEED = 42
TEST_SIZE = 0.15
VAL_SIZE = 0.15
MODEL_VERSION = "1.0.0"

# Target class mapping (derived from time-to-failure in simulation steps)
TARGET_CLASSES = {
    0: {"name": "STABLE", "label": "Stable", "horizon": "No imminent failure", "color": "#4a7c59"},
    1: {"name": "WATCH", "label": "Watch", "horizon": f"Failure within 3-5 steps (~{3*TIMESTEP_MINUTES}-{5*TIMESTEP_MINUTES} min)", "color": "#c9a84c"},
    2: {"name": "HIGH_RISK", "label": "High Risk", "horizon": f"Failure within 1-3 steps (~{1*TIMESTEP_MINUTES}-{3*TIMESTEP_MINUTES} min)", "color": "#b44a3f"},
    3: {"name": "CRITICAL", "label": "Critical", "horizon": f"Failure within 1 step (~{TIMESTEP_MINUTES} min)", "color": "#8b2020"},
}

# Risk level thresholds (for mapping continuous scores)
RISK_THRESHOLDS = {
    "STABLE": (0.0, 0.3),
    "WATCH": (0.3, 0.6),
    "HIGH_RISK": (0.6, 0.8),
    "CRITICAL": (0.8, 1.0),
}

# ─── Priority Engine Configuration ───────────────────────────────
# Prototype-defined heuristic weights (manually selected, NOT learned)
PRIORITY_WEIGHTS = {
    "risk": 0.30,        # ML prediction importance
    "criticality": 0.25, # Betweenness centrality (structural importance)
    "vulnerability": 0.20, # 1 - redundancy (lack of alternatives)
    "impact": 0.25,      # Fraction disconnected on failure (consequence)
}

# ─── Intervention Configuration ──────────────────────────────────
DEFAULT_BUDGET = 2
MAX_BUDGET = 5
INTERVENTION_TYPES = [
    {"id": "reinforce_line", "name": "Reinforce Line", "description": "Increase thermal capacity of a power line", "cost": 1},
    {"id": "add_redundancy", "name": "Add Redundant Path", "description": "Add an alternative connection between substations", "cost": 1},
]

# ─── Server Configuration ────────────────────────────────────────
API_HOST = "127.0.0.1"
API_PORT = 5000
DEBUG = True

# ─── IEEE 14-Bus Network Definition ──────────────────────────────
# Based on the standard IEEE 14-bus test system
# 14 substations (buses), 20 power lines, 5 generators, 11 loads
IEEE14_SUBSTATIONS = [
    {"id": 0, "name": "Sub_0", "type": "generator", "bus": 1, "voltage_kv": 138.0, "x": 150, "y": 50},
    {"id": 1, "name": "Sub_1", "type": "generator", "bus": 2, "voltage_kv": 138.0, "x": 350, "y": 50},
    {"id": 2, "name": "Sub_2", "type": "generator", "bus": 3, "voltage_kv": 138.0, "x": 550, "y": 100},
    {"id": 3, "name": "Sub_3", "type": "load", "bus": 4, "voltage_kv": 138.0, "x": 450, "y": 200},
    {"id": 4, "name": "Sub_4", "type": "load", "bus": 5, "voltage_kv": 138.0, "x": 250, "y": 200},
    {"id": 5, "name": "Sub_5", "type": "generator", "bus": 6, "voltage_kv": 138.0, "x": 650, "y": 250},
    {"id": 6, "name": "Sub_6", "type": "load", "bus": 7, "voltage_kv": 69.0, "x": 550, "y": 350},
    {"id": 7, "name": "Sub_7", "type": "generator", "bus": 8, "voltage_kv": 69.0, "x": 350, "y": 350},
    {"id": 8, "name": "Sub_8", "type": "load", "bus": 9, "voltage_kv": 69.0, "x": 200, "y": 400},
    {"id": 9, "name": "Sub_9", "type": "load", "bus": 10, "voltage_kv": 69.0, "x": 100, "y": 350},
    {"id": 10, "name": "Sub_10", "type": "load", "bus": 11, "voltage_kv": 69.0, "x": 100, "y": 250},
    {"id": 11, "name": "Sub_11", "type": "load", "bus": 12, "voltage_kv": 69.0, "x": 250, "y": 450},
    {"id": 12, "name": "Sub_12", "type": "load", "bus": 13, "voltage_kv": 69.0, "x": 450, "y": 450},
    {"id": 13, "name": "Sub_13", "type": "load", "bus": 14, "voltage_kv": 69.0, "x": 350, "y": 500},
]

# Lines: (from_sub, to_sub, thermal_limit_mw, impedance_pu)
IEEE14_LINES = [
    {"id": 0, "from": 0, "to": 1, "thermal_limit": 200, "impedance": 0.01938},
    {"id": 1, "from": 0, "to": 4, "thermal_limit": 150, "impedance": 0.05403},
    {"id": 2, "from": 1, "to": 2, "thermal_limit": 180, "impedance": 0.04699},
    {"id": 3, "from": 1, "to": 3, "thermal_limit": 130, "impedance": 0.05811},
    {"id": 4, "from": 1, "to": 4, "thermal_limit": 130, "impedance": 0.05695},
    {"id": 5, "from": 2, "to": 3, "thermal_limit": 100, "impedance": 0.06701},
    {"id": 6, "from": 3, "to": 4, "thermal_limit": 120, "impedance": 0.01335},
    {"id": 7, "from": 3, "to": 6, "thermal_limit": 90, "impedance": 0.20912},
    {"id": 8, "from": 3, "to": 8, "thermal_limit": 90, "impedance": 0.55618},
    {"id": 9, "from": 4, "to": 5, "thermal_limit": 80, "impedance": 0.25202},
    {"id": 10, "from": 5, "to": 10, "thermal_limit": 70, "impedance": 0.19890},
    {"id": 11, "from": 5, "to": 11, "thermal_limit": 60, "impedance": 0.25581},
    {"id": 12, "from": 5, "to": 12, "thermal_limit": 60, "impedance": 0.13027},
    {"id": 13, "from": 6, "to": 7, "thermal_limit": 80, "impedance": 0.17615},
    {"id": 14, "from": 6, "to": 8, "thermal_limit": 80, "impedance": 0.11001},
    {"id": 15, "from": 8, "to": 9, "thermal_limit": 70, "impedance": 0.03181},
    {"id": 16, "from": 8, "to": 13, "thermal_limit": 60, "impedance": 0.12711},
    {"id": 17, "from": 9, "to": 10, "thermal_limit": 60, "impedance": 0.08205},
    {"id": 18, "from": 11, "to": 12, "thermal_limit": 50, "impedance": 0.19988},
    {"id": 19, "from": 12, "to": 13, "thermal_limit": 50, "impedance": 0.34802},
]

# Generator data (bus, max_mw, min_mw, type)
IEEE14_GENERATORS = [
    {"id": 0, "sub": 0, "max_mw": 332.4, "min_mw": 0, "type": "thermal"},
    {"id": 1, "sub": 1, "max_mw": 140.0, "min_mw": 0, "type": "thermal"},
    {"id": 2, "sub": 2, "max_mw": 100.0, "min_mw": 0, "type": "thermal"},
    {"id": 3, "sub": 5, "max_mw": 100.0, "min_mw": 0, "type": "thermal"},
    {"id": 4, "sub": 7, "max_mw": 100.0, "min_mw": 0, "type": "thermal"},
]

# Load data (bus, nominal_mw, nominal_mvar)
IEEE14_LOADS = [
    {"id": 0, "sub": 1, "p_mw": 21.7, "q_mvar": 12.7},
    {"id": 1, "sub": 2, "p_mw": 94.2, "q_mvar": 19.0},
    {"id": 2, "sub": 3, "p_mw": 47.8, "q_mvar": -3.9},
    {"id": 3, "sub": 4, "p_mw": 7.6, "q_mvar": 1.6},
    {"id": 4, "sub": 5, "p_mw": 11.2, "q_mvar": 7.5},
    {"id": 5, "sub": 8, "p_mw": 29.5, "q_mvar": 16.6},
    {"id": 6, "sub": 9, "p_mw": 9.0, "q_mvar": 5.8},
    {"id": 7, "sub": 10, "p_mw": 3.5, "q_mvar": 1.8},
    {"id": 8, "sub": 11, "p_mw": 6.1, "q_mvar": 1.6},
    {"id": 9, "sub": 12, "p_mw": 13.5, "q_mvar": 5.8},
    {"id": 10, "sub": 13, "p_mw": 14.9, "q_mvar": 5.0},
]
