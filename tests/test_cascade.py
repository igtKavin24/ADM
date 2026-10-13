"""
tests/test_cascade.py — Unit tests for the DC cascade simulation.

Run with:   python -m pytest tests/test_cascade.py -v
"""
import pytest
from backend.graph.cascade import run_cascade
from backend.graph.labels import bus_label, line_label, bus_labels_map, line_labels_map
from backend.config import IEEE14_SUBSTATIONS, IEEE14_LINES


# ─── Label helper tests ───────────────────────────────────────────────────────

def test_bus_label_zero():
    # Sub id=0 → bus=1 → "Bus 1"
    assert bus_label(0) == "Bus 1"


def test_bus_label_five():
    # Sub id=5 → bus=6 → "Bus 6"
    assert bus_label(5) == "Bus 6"


def test_bus_label_unknown():
    assert "?" in bus_label(999)


def test_line_label_zero():
    assert line_label(0) == "Line 1"


def test_line_label_nineteen():
    assert line_label(19) == "Line 20"


def test_bus_labels_map_coverage():
    m = bus_labels_map()
    assert len(m) == len(IEEE14_SUBSTATIONS)
    for sub in IEEE14_SUBSTATIONS:
        assert m[sub["id"]] == f"Bus {sub['bus']}"


def test_line_labels_map_coverage():
    m = line_labels_map()
    assert len(m) == len(IEEE14_LINES)
    for ln in IEEE14_LINES:
        assert m[ln["id"]] == f"Line {ln['id'] + 1}"


# ─── Cascade simulation tests ─────────────────────────────────────────────────

def test_cascade_bus_trip_structure():
    result = run_cascade({"type": "bus", "id": 0})
    assert "rounds" in result
    assert "total_load_shed_mw" in result
    assert "final_active_buses" in result
    assert "final_active_lines" in result
    assert isinstance(result["converged"], bool)
    assert 0 not in result["final_active_buses"]


def test_cascade_line_trip_structure():
    result = run_cascade({"type": "line", "id": 0})
    assert "rounds" in result
    assert 0 not in result["final_active_lines"]


def test_cascade_round_zero_initial_bus():
    result = run_cascade({"type": "bus", "id": 1})
    r0 = result["rounds"][0]
    assert r0["round"] == 0
    assert any(b["id"] == 1 for b in r0["tripped_buses"])


def test_cascade_round_zero_initial_line():
    result = run_cascade({"type": "line", "id": 5})
    r0 = result["rounds"][0]
    assert r0["round"] == 0
    assert any(ln["id"] == 5 for ln in r0["tripped_lines"])


def test_cascade_load_shed_non_negative():
    result = run_cascade({"type": "bus", "id": 0})
    assert result["total_load_shed_mw"] >= 0.0
    for rnd in result["rounds"]:
        assert rnd["load_shed_mw"] >= 0.0


def test_cascade_load_shed_le_total():
    result = run_cascade({"type": "bus", "id": 0})
    assert result["total_load_shed_mw"] <= result["total_load_mw"] + 1e-6


def test_cascade_monotone_active_buses():
    """Active bus count must be non-increasing across rounds."""
    result = run_cascade({"type": "bus", "id": 3})
    counts = [len(r["active_buses"]) for r in result["rounds"]]
    for a, b in zip(counts, counts[1:]):
        assert a >= b


def test_cascade_monotone_active_lines():
    """Active line count must be non-increasing across rounds."""
    result = run_cascade({"type": "line", "id": 0})
    counts = [len(r["active_lines"]) for r in result["rounds"]]
    for a, b in zip(counts, counts[1:]):
        assert a >= b


def test_cascade_invalid_type_raises():
    with pytest.raises(ValueError, match="Invalid type"):
        run_cascade({"type": "switch", "id": 0})


def test_cascade_invalid_bus_id_raises():
    with pytest.raises(ValueError):
        run_cascade({"type": "bus", "id": 999})


def test_cascade_label_in_initial_trip():
    result = run_cascade({"type": "bus", "id": 5})
    assert result["initial_trip"]["label"] == "Bus 6"


def test_cascade_line_label_in_initial_trip():
    result = run_cascade({"type": "line", "id": 0})
    assert result["initial_trip"]["label"] == "Line 1"


def test_cascade_model_note_present():
    result = run_cascade({"type": "line", "id": 1})
    assert "model_note" in result
    assert len(result["model_note"]) > 10
