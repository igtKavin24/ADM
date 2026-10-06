"""JARASANDHA — Flask API for the power-grid resilience engine."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request
from flask_cors import CORS

from backend.config import (
    API_HOST, API_PORT, DEBUG, DATASET_NAME, DATASET_TYPE, DATASET_DOMAIN, DATASET_LIMITATION,
    TIMESTEP_MINUTES, TARGET_CLASSES, RISK_THRESHOLDS, PRIORITY_WEIGHTS, DEFAULT_BUDGET,
    MAX_BUDGET, INTERVENTION_TYPES, MODEL_VERSION, RANDOM_SEED,
    IEEE14_SUBSTATIONS, IEEE14_LINES, IEEE14_GENERATORS, IEEE14_LOADS,
)
from backend.data.preprocessor import load_dataset, DROP_COLS
from backend.graph.network import PowerGrid
from backend.graph.analysis import full_analysis
from backend.graph.simulation import OutageSimulator
from backend.ml.model import predict, get_model_metrics
from backend.ml.explainer import get_feature_importance, explain_prediction
from backend.engine.priority import rank_nodes
from backend.engine import experiment as exp, intervention as iv

app = Flask(__name__)
CORS(app)

# ─── State built once at startup ─────────────────────────────────
GRID = PowerGrid().build_from_config()
ANALYSIS = full_analysis(GRID)
SIM = OutageSimulator(GRID)
DATA = load_dataset()
# Default "current grid state": first real HIGH_RISK row in the dataset
_high = DATA.index[DATA['target'] == 2]
DEMO_STATE_ID = int(_high[0]) if len(_high) else 0


def get_state(state_id):
    """A dataset row used as the grid state: (feature dict, actual class id)."""
    row = DATA.iloc[int(state_id) % len(DATA)]
    return row.drop(DROP_COLS).astype(float).to_dict(), int(row['target'])


def ranking_for(state_id=DEMO_STATE_ID):
    return rank_nodes(GRID, ANALYSIS, get_state(state_id)[0])


@app.errorhandler(ValueError)
def bad_request(e):
    return jsonify({"error": str(e), "status": "error"}), 400


@app.errorhandler(Exception)
def server_error(e):
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return jsonify({"error": e.description, "status": "error"}), e.code
    app.logger.exception(e)
    return jsonify({"error": str(e), "status": "error"}), 500


# ─── Network ─────────────────────────────────────────────────────
@app.get('/api/network')
def get_network():
    nodes = []
    for sub in IEEE14_SUBSTATIONS:
        node = dict(sub)
        node["generators"] = [g for g in IEEE14_GENERATORS if g["sub"] == sub["id"]]
        node["loads"] = [l for l in IEEE14_LOADS if l["sub"] == sub["id"]]
        nodes.append(node)
    edges = [{"id": l["id"], "source": l["from"], "target": l["to"],
              "thermal_limit": l["thermal_limit"], "impedance": l["impedance"]} for l in IEEE14_LINES]
    return jsonify({"nodes": nodes, "edges": edges, "metadata": {
        "name": "IEEE 14-Bus Test System", "substations": len(nodes), "lines": len(edges),
        "generators": len(IEEE14_GENERATORS), "loads": len(IEEE14_LOADS)}})


@app.get('/api/network/metrics')
def get_network_metrics():
    return jsonify({**ANALYSIS, "topology": {
        "nodes": len(GRID.nodes), "edges": len(GRID.edges),
        "is_connected": GRID.is_connected(), "connected_components": len(GRID.connected_components())}})


# ─── Forecast ────────────────────────────────────────────────────
def forecast(state_id):
    state, actual = get_state(state_id)
    res = predict(state)
    res.update({
        "state_id": int(state_id),
        "actual_risk_level": TARGET_CLASSES[actual]["name"],
        "features": {k: round(state[k], 3) for k in
                     ("max_rho", "n_overloaded", "n_disconnected", "total_gen", "total_load", "gen_load_balance")},
        "line_loading": {l["id"]: round(state[f"rho_{l['id']}"], 3) for l in IEEE14_LINES},
        "top_contributions": [{"feature": f, "score": round(s, 4)} for f, s in explain_prediction(state)],
        "vulnerable_components": [{k: r[k] for k in ("id", "name", "type", "risk_score")}
                                  for r in sorted(ranking_for(state_id), key=lambda r: -r["risk_score"])[:3]],
        "model_version": MODEL_VERSION, "dataset": DATASET_NAME,
        "dataset_type": DATASET_TYPE, "timestep_minutes": TIMESTEP_MINUTES,
    })
    return jsonify(res)


@app.get('/api/forecast')
def get_forecast():
    return forecast(DEMO_STATE_ID)


@app.get('/api/forecast/<int:state_id>')
def get_forecast_by_id(state_id):
    return forecast(state_id)


# ─── Vulnerabilities ─────────────────────────────────────────────
@app.get('/api/vulnerabilities')
def get_vulnerabilities():
    state_id = request.args.get("state", DEMO_STATE_ID, type=int)
    return jsonify({
        "state_id": state_id, "vulnerabilities": ranking_for(state_id), "weights": PRIORITY_WEIGHTS,
        "weight_type": "Heuristic weights (manually selected, not learned)",
        "formula": "Priority = w_risk·Risk + w_crit·Criticality + w_vuln·Vulnerability + w_impact·Impact",
    })


@app.get('/api/vulnerabilities/<int:component_id>')
def get_vulnerability_detail(component_id):
    comp = next((r for r in ranking_for() if r["id"] == component_id), None)
    if comp is None:
        return jsonify({"error": f"Component {component_id} not found", "status": "error"}), 404
    return jsonify(comp)


# ─── Simulation ──────────────────────────────────────────────────
@app.post('/api/simulation/outage')
def simulate_outage():
    data = request.get_json(silent=True) or {}
    if data.get("id") is None:
        raise ValueError("Component ID required")
    kind, cid = data.get("type", "node"), int(data["id"])
    if kind == "node":
        result = SIM.simulate(nodes=[cid])
    elif kind == "edge":
        result = SIM.simulate(edges=[cid])
    else:
        raise ValueError(f"Invalid component type: {kind}")
    result["terminology_note"] = ("Structural simulation on the grid graph. Load is lost at failed substations "
                                  "and in islands without generation. This is NOT an electrical power-flow model.")
    return jsonify(result)


# ─── Interventions ───────────────────────────────────────────────
@app.get('/api/interventions')
def get_interventions():
    return jsonify({"candidates": iv.get_candidates(ranking_for()), "intervention_types": INTERVENTION_TYPES,
                    "default_budget": DEFAULT_BUDGET, "max_budget": MAX_BUDGET})


@app.post('/api/interventions/evaluate')
def evaluate_interventions():
    ids = [int(i) for i in (request.get_json(silent=True) or {}).get("interventions", [])]
    unknown = [i for i in ids if i not in GRID.nodes]
    if unknown:
        raise ValueError(f"Unknown substations: {unknown}")
    return jsonify(iv.evaluate_selection(SIM, ranking_for(), ids))


@app.post('/api/interventions/optimize')
def optimize_interventions():
    budget = (request.get_json(silent=True) or {}).get("budget", DEFAULT_BUDGET)
    return jsonify(iv.optimize(SIM, ranking_for(), max(1, min(int(budget), MAX_BUDGET))))


# ─── Model ───────────────────────────────────────────────────────
@app.get('/api/model/metrics')
def get_metrics():
    return jsonify({**get_model_metrics(), "model_version": MODEL_VERSION, "dataset": DATASET_NAME,
                    "dataset_type": DATASET_TYPE, "target_classes": TARGET_CLASSES,
                    "risk_thresholds": RISK_THRESHOLDS})


@app.get('/api/model/explainability')
def get_explainability():
    imp = [{"feature": f, "importance": round(float(s), 5)} for f, s in get_feature_importance()[:15]]
    return jsonify({"feature_importance": imp, "method": "LightGBM split-count importance (global); SHAP for single predictions",
                    "model_name": "gradient_boosting"})


# ─── Experiments ─────────────────────────────────────────────────
@app.get('/api/experiments')
def get_experiments():
    return jsonify({"strategies": exp.STRATEGIES, "default_budget": DEFAULT_BUDGET, "max_budget": MAX_BUDGET})


@app.post('/api/experiments/run')
def run_experiment():
    data = request.get_json(silent=True) or {}
    budget = max(1, min(int(data.get("budget", DEFAULT_BUDGET)), MAX_BUDGET))
    n = max(10, min(int(data.get("n_scenarios", 200)), 1000))
    return jsonify(exp.run_comparison(SIM, ranking_for(), budget, n, data.get("strategies")))


# ─── Provenance / health ─────────────────────────────────────────
@app.get('/api/data/provenance')
def get_data_provenance():
    return jsonify({
        "name": DATASET_NAME, "type": DATASET_TYPE, "domain": DATASET_DOMAIN,
        "limitation": DATASET_LIMITATION, "timestep_minutes": TIMESTEP_MINUTES,
        "model_version": MODEL_VERSION, "random_seed": RANDOM_SEED, "n_rows": len(DATA),
        "n_scenarios": int(DATA["scenario_id"].nunique()),
        "target_classes": TARGET_CLASSES, "priority_weights": PRIORITY_WEIGHTS,
        "limitations": [
            "Synthetic data on the IEEE 14-bus topology; not live utility data and not from a power-flow simulator.",
            "Labels are generated from the same loading features the model sees, so high accuracy reflects the labelling rule, not real forecasting skill.",
            "Outage simulation is structural (graph connectivity), not electrical.",
            "Priority weights are heuristic and would need expert calibration.",
            "Experiment results depend on the assumed failure model (risk-weighted double substation failures).",
        ],
    })


@app.get('/api/health')
def health_check():
    return jsonify({"status": "ok", "nodes": len(GRID.nodes), "rows": len(DATA), "demo_state_id": DEMO_STATE_ID})


if __name__ == '__main__':
    print(f"JARASANDHA API on http://{API_HOST}:{API_PORT}")
    app.run(host=API_HOST, port=API_PORT, debug=DEBUG)
