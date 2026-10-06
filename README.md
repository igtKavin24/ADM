# JARASANDHA — Predictive Power-Grid Resilience Engine

Forecast failure risk → understand consequences → prioritise interventions, on the IEEE 14-bus topology.

**Data is synthetic** (see `backend/data/generator.py`). Labels are derived from the same loading features the model sees, so accuracy reflects the labelling rule rather than real forecasting skill. Outage simulation is structural (graph connectivity), not an electrical power flow.

## Run

```bash
pip install -r requirements.txt
python -m backend.app            # API on http://127.0.0.1:5000

cd frontend && npm install && npm run dev   # UI on http://localhost:3000 (proxies /api)
```

## Other commands

```bash
python -m backend.data.generator   # regenerate dataset
python -m backend.ml.train         # retrain models (rewrites backend/ml/models/)
python -m pytest                   # API tests
```

## Layout

- `backend/graph` — grid graph, centrality/articulation analysis, outage simulation
- `backend/ml` — training, prediction, SHAP explanations
- `backend/engine` — priority scoring, interventions, strategy experiment
- `frontend/src/pages` — one file per page
