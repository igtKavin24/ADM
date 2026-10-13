"""
labels.py — Canonical display-name helpers for the IEEE 14-bus benchmark.

Internal IDs are 0-indexed (sub 0 … sub 13, line 0 … line 19).
Display names follow the standard IEEE convention: Bus 1 … Bus 14, Line 1 … Line 20.
"""
from backend.config import IEEE14_SUBSTATIONS, IEEE14_LINES


def bus_label(internal_id: int) -> str:
    """Return the IEEE-standard display label for a substation, e.g. 'Bus 1'."""
    # IEEE bus numbers are stored in the 'bus' field (1-indexed)
    for sub in IEEE14_SUBSTATIONS:
        if sub["id"] == internal_id:
            return f"Bus {sub['bus']}"
    return f"Bus ?({internal_id})"


def line_label(line_id: int) -> str:
    """Return the display label for a transmission line, e.g. 'Line 1'."""
    return f"Line {line_id + 1}"


def bus_labels_map() -> dict:
    """Return {internal_id: 'Bus N'} for all substations."""
    return {sub["id"]: f"Bus {sub['bus']}" for sub in IEEE14_SUBSTATIONS}


def line_labels_map() -> dict:
    """Return {line_id: 'Line N'} for all lines."""
    return {line["id"]: f"Line {line['id'] + 1}" for line in IEEE14_LINES}
