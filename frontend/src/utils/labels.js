/**
 * labels.js — Canonical display-name helpers for the IEEE 14-bus benchmark.
 *
 * Internal IDs are 0-indexed (sub 0…13, line 0…19).
 * Display names follow the IEEE convention: Bus 1…14, Line 1…20.
 *
 * These must match backend/graph/labels.py exactly.
 */

/**
 * @param {number} internalId  - 0-indexed substation id
 * @param {Array}  substations - array from /api/network response (has .bus field)
 * @returns {string}  e.g. "Bus 6"
 */
export function busLabel(internalId, substations = []) {
  const sub = substations.find(s => s.id === internalId);
  if (sub) return `Bus ${sub.bus}`;
  return `Bus ?(${internalId})`;
}

/**
 * @param {number} lineId - 0-indexed line id
 * @returns {string}  e.g. "Line 7"
 */
export function lineLabel(lineId) {
  return `Line ${lineId + 1}`;
}

/**
 * Build a lookup map: internalId -> "Bus N"
 * @param {Array} substations
 * @returns {Object}
 */
export function busLabelsMap(substations = []) {
  return Object.fromEntries(substations.map(s => [s.id, `Bus ${s.bus}`]));
}

/**
 * Build a lookup map: lineId -> "Line N"
 * @param {Array} lines
 * @returns {Object}
 */
export function lineLabelsMap(lines = []) {
  return Object.fromEntries(lines.map(l => [l.id, `Line ${l.id + 1}`]));
}
