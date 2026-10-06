import pytest
from backend.app import app


@pytest.fixture(scope="module")
def client():
    return app.test_client()


def test_forecast_returns_valid_class(client):
    r = client.get("/api/forecast")
    assert r.status_code == 200
    d = r.get_json()
    assert d["risk_level"] in {"STABLE", "WATCH", "HIGH_RISK", "CRITICAL"}
    assert abs(sum(d["probabilities"].values()) - 1) < 1e-6
    assert d["top_contributions"]


def test_vulnerabilities_sorted_and_ranked(client):
    v = client.get("/api/vulnerabilities").get_json()["vulnerabilities"]
    scores = [x["priority_score"] for x in v]
    assert scores == sorted(scores, reverse=True)
    assert [x["rank"] for x in v] == list(range(1, len(v) + 1))


def test_generator_outage_loses_capacity_and_load_outage_loses_load(client):
    gen = client.post("/api/simulation/outage", json={"type": "node", "id": 0}).get_json()
    assert gen["gen_lost_mw"] > 0
    load = client.post("/api/simulation/outage", json={"type": "node", "id": 1}).get_json()
    assert load["load_lost_mw"] > 0


def test_unknown_component_is_400(client):
    assert client.post("/api/simulation/outage", json={"type": "node", "id": 99}).status_code == 400


def test_hardening_never_hurts(client):
    r = client.post("/api/interventions/evaluate", json={"interventions": [3, 4]}).get_json()
    assert r["load_served_gain"] >= 0


def test_experiment_covers_all_strategies(client):
    r = client.post("/api/experiments/run", json={"budget": 2, "n_scenarios": 50}).get_json()
    assert set(r["results"]) == {"random", "degree_based", "centrality_based", "ml_risk", "jarasandha_optimized"}
