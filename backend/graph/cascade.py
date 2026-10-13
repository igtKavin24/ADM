"""
cascade.py — Deterministic DC power-flow cascade simulation (active power only).

Model assumptions and limitations
──────────────────────────────────
• DC power-flow: voltage magnitudes fixed at 1 pu, reactive power ignored.
• Generator dispatch: proportional to each generator's max_mw rating; total
  dispatch equals total load (lossless).
• Load shedding: loads on islands that contain no generator are fully shed.
• Thermal limits: taken from config.IEEE14_LINES; a line trips when |flow|
  exceeds its thermal_limit (MW).
• Cascade terminates when no new trips occur in a round (converged), or when
  the grid is fully islanded.
• This is a simplified research prototype — NOT a certified power-systems
  solver. Results are illustrative only.

API
───
    result = run_cascade(initial_trip: dict) -> dict
        initial_trip: {"type": "bus"|"line", "id": int}
        returns: see _make_result() docstring.
"""

from __future__ import annotations

import math
from typing import Optional

import numpy as np

from backend.config import (
    IEEE14_SUBSTATIONS,
    IEEE14_LINES,
    IEEE14_GENERATORS,
    IEEE14_LOADS,
)
from backend.graph.labels import bus_label, line_label

# ─── Constants ────────────────────────────────────────────────────────────────
N_BUS = len(IEEE14_SUBSTATIONS)          # 14
_GEN_MAX = {g["sub"]: g["max_mw"] for g in IEEE14_GENERATORS}
_LOAD_P   = {ld["sub"]: ld["p_mw"]  for ld in IEEE14_LOADS}

# Build susceptance matrix (B) index: internal substation id 0..13
_ID_TO_IDX = {sub["id"]: i for i, sub in enumerate(IEEE14_SUBSTATIONS)}
_IDX_TO_ID = {i: sub["id"] for i, sub in enumerate(IEEE14_SUBSTATIONS)}


def _build_B(active_lines: list[dict]) -> np.ndarray:
    """Return N×N DC susceptance matrix for the given active line set."""
    B = np.zeros((N_BUS, N_BUS))
    for ln in active_lines:
        i, j = _ID_TO_IDX[ln["from"]], _ID_TO_IDX[ln["to"]]
        b = 1.0 / max(ln["impedance"], 1e-6)   # avoid divide-by-zero
        B[i, i] += b
        B[j, j] += b
        B[i, j] -= b
        B[j, i] -= b
    return B


def _connected_components(active_nodes: set[int], active_lines: list[dict]) -> list[set[int]]:
    """Return list of connected-component sets of *substation IDs*."""
    adj: dict[int, set[int]] = {n: set() for n in active_nodes}
    for ln in active_lines:
        f, t = ln["from"], ln["to"]
        if f in active_nodes and t in active_nodes:
            adj[f].add(t)
            adj[t].add(f)
    visited: set[int] = set()
    components: list[set[int]] = []
    for start in active_nodes:
        if start not in visited:
            comp: set[int] = set()
            stack = [start]
            while stack:
                node = stack.pop()
                if node in visited:
                    continue
                visited.add(node)
                comp.add(node)
                stack.extend(adj[node] - visited)
            components.append(comp)
    return components


def _dc_flow(active_nodes: set[int], active_lines: list[dict]) -> dict[int, float]:
    """
    Return {line_id: flow_MW} for all active lines.

    Uses a standard DC-PF formulation with slack bus at sub-id 0 (Bus 1),
    or at the first generator bus in the component if sub-0 is tripped.
    For islanded components without generation, all injections are zero
    (load-shedding), so flows are zero.
    """
    comps = _connected_components(active_nodes, active_lines)
    flows: dict[int, float] = {}

    for comp in comps:
        buses = sorted(comp)
        idx_map = {sid: i for i, sid in enumerate(buses)}
        n = len(buses)

        # Net injection vector (MW): generation – load, proportional dispatch
        gen_buses_in_comp = [sid for sid in buses if sid in _GEN_MAX]
        total_gen_cap = sum(_GEN_MAX[sid] for sid in gen_buses_in_comp)
        total_load    = sum(_LOAD_P.get(sid, 0.0) for sid in buses)

        P = np.zeros(n)
        if total_gen_cap > 0:
            # Proportional dispatch: generators share load
            for sid in gen_buses_in_comp:
                P[idx_map[sid]] += _GEN_MAX[sid] / total_gen_cap * total_load
            for sid in buses:
                P[idx_map[sid]] -= _LOAD_P.get(sid, 0.0)
        # else: island has no generation → all injections 0, all flows 0

        # Local B matrix for this component
        B_loc = np.zeros((n, n))
        comp_lines = [ln for ln in active_lines if ln["from"] in comp and ln["to"] in comp]
        for ln in comp_lines:
            i, j = idx_map[ln["from"]], idx_map[ln["to"]]
            b = 1.0 / max(ln["impedance"], 1e-6)
            B_loc[i, i] += b
            B_loc[j, j] += b
            B_loc[i, j] -= b
            B_loc[j, i] -= b

        # Choose slack: prefer gen bus closest to sub-0, else first bus
        slack_candidates = gen_buses_in_comp if gen_buses_in_comp else buses[:1]
        slack_idx = idx_map[slack_candidates[0]]

        if n == 1:
            # Single-bus island, no lines → no flows
            for ln in comp_lines:
                flows[ln["id"]] = 0.0
            continue

        # Remove slack row/col → solve reduced system
        red_idx = [i for i in range(n) if i != slack_idx]
        B_red = B_loc[np.ix_(red_idx, red_idx)]
        P_red = P[red_idx]

        try:
            theta_red = np.linalg.solve(B_red, P_red)
        except np.linalg.LinAlgError:
            theta_red = np.zeros(len(red_idx))

        theta = np.zeros(n)
        for pos, ri in enumerate(red_idx):
            theta[ri] = theta_red[pos]

        # Compute line flows
        for ln in comp_lines:
            i, j = idx_map[ln["from"]], idx_map[ln["to"]]
            b = 1.0 / max(ln["impedance"], 1e-6)
            flows[ln["id"]] = b * (theta[i] - theta[j])

    return flows


def _shed_load(active_nodes: set[int], active_lines: list[dict]) -> float:
    """Return total shed load (MW) for islands that have no generation."""
    comps = _connected_components(active_nodes, active_lines)
    shed = 0.0
    for comp in comps:
        has_gen = any(sid in _GEN_MAX for sid in comp)
        if not has_gen:
            shed += sum(_LOAD_P.get(sid, 0.0) for sid in comp)
    return shed


# ─── Public API ───────────────────────────────────────────────────────────────

def run_cascade(initial_trip: dict) -> dict:
    """
    Simulate a DC-power-flow cascade starting from one component trip.

    Parameters
    ----------
    initial_trip : {"type": "bus"|"line", "id": int}

    Returns
    -------
    dict with keys:
        initial_trip      – echoed input
        rounds            – list of round dicts (see below)
        final_active_buses – list of surviving bus IDs
        final_active_lines – list of surviving line IDs
        total_load_shed_mw – cumulative shed load (MW)
        converged         – True if cascade stopped naturally
        model_note        – disclaimer string

    Each round dict:
        round             – 1-indexed round number
        tripped_buses     – list of {id, label} for buses tripped this round
        tripped_lines     – list of {id, label} for lines tripped this round
        overloaded_lines  – list of {id, label, flow_mw, thermal_limit} detected before trip
        load_shed_mw      – cumulative shed load after this round
        active_buses      – surviving bus IDs after this round
        active_lines      – surviving line IDs after this round
    """
    kind = initial_trip.get("type", "bus")
    cid  = int(initial_trip["id"])

    all_bus_ids  = {sub["id"] for sub in IEEE14_SUBSTATIONS}
    all_line_ids = {ln["id"]  for ln in IEEE14_LINES}
    line_by_id   = {ln["id"]: ln for ln in IEEE14_LINES}

    active_buses = set(all_bus_ids)
    active_line_ids: set[int] = set(all_line_ids)

    rounds: list[dict] = []
    total_shed = 0.0

    # ── Round 0: apply initial trip ──
    init_buses: list[dict] = []
    init_lines: list[dict] = []

    if kind == "bus":
        if cid not in active_buses:
            raise ValueError(f"Bus ID {cid} not found in the grid.")
        active_buses.discard(cid)
        # Also remove lines connected to this bus
        removed = {lid for lid in active_line_ids
                   if line_by_id[lid]["from"] == cid or line_by_id[lid]["to"] == cid}
        active_line_ids -= removed
        init_buses = [{"id": cid, "label": bus_label(cid)}]
        init_lines = [{"id": lid, "label": line_label(lid)} for lid in sorted(removed)]
    elif kind == "line":
        if cid not in active_line_ids:
            raise ValueError(f"Line ID {cid} not found in the grid.")
        active_line_ids.discard(cid)
        init_lines = [{"id": cid, "label": line_label(cid)}]
    else:
        raise ValueError(f"Invalid type '{kind}'. Must be 'bus' or 'line'.")

    active_lines_list = [line_by_id[lid] for lid in active_line_ids]
    shed0 = _shed_load(active_buses, active_lines_list)
    total_shed = shed0

    rounds.append({
        "round": 0,
        "label": "Initial trip",
        "tripped_buses": init_buses,
        "tripped_lines": init_lines,
        "overloaded_lines": [],
        "load_shed_mw": round(total_shed, 2),
        "active_buses": sorted(active_buses),
        "active_lines": sorted(active_line_ids),
    })

    # ── Cascade rounds ──
    MAX_ROUNDS = 20
    converged  = False

    for rnd in range(1, MAX_ROUNDS + 1):
        if not active_buses or not active_line_ids:
            converged = True
            break

        active_lines_list = [line_by_id[lid] for lid in active_line_ids]
        flows = _dc_flow(active_buses, active_lines_list)

        overloaded: list[dict] = []
        newly_tripped_line_ids: set[int] = set()

        for lid, flow_mw in flows.items():
            ln = line_by_id[lid]
            if abs(flow_mw) > ln["thermal_limit"]:
                overloaded.append({
                    "id": lid,
                    "label": line_label(lid),
                    "flow_mw": round(flow_mw, 2),
                    "thermal_limit": ln["thermal_limit"],
                })
                newly_tripped_line_ids.add(lid)

        if not newly_tripped_line_ids:
            converged = True
            break

        active_line_ids -= newly_tripped_line_ids

        # Re-compute shed after new trips
        active_lines_list = [line_by_id[lid] for lid in active_line_ids]
        total_shed = _shed_load(active_buses, active_lines_list)

        rounds.append({
            "round": rnd,
            "label": f"Cascade round {rnd}",
            "tripped_buses": [],
            "tripped_lines": [{"id": lid, "label": line_label(lid)}
                               for lid in sorted(newly_tripped_line_ids)],
            "overloaded_lines": sorted(overloaded, key=lambda x: -abs(x["flow_mw"])),
            "load_shed_mw": round(total_shed, 2),
            "active_buses": sorted(active_buses),
            "active_lines": sorted(active_line_ids),
        })

    return {
        "initial_trip": {
            "type": kind,
            "id": cid,
            "label": bus_label(cid) if kind == "bus" else line_label(cid),
        },
        "rounds": rounds,
        "final_active_buses": sorted(active_buses),
        "final_active_lines": sorted(active_line_ids),
        "total_load_shed_mw": round(total_shed, 2),
        "total_load_mw": round(sum(_LOAD_P.values()), 2),
        "converged": converged,
        "model_note": (
            "DC active-power flow only (lossless, unity voltage). "
            "Generator dispatch is proportional to capacity. "
            "Thermal limits are prototype values. "
            "This is a simplified research model — not a certified power-systems solver."
        ),
    }
