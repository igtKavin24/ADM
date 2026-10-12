/**
 * JARASANDHA — Shared Application State
 * Minimal, reactive singleton store for managing:
 * - selected benchmark case ID (persisted across Forecast, Network, Component Ranking)
 * - valid case range and total state count from API provenance
 * - default demo case ID
 * - active network encoding mode
 * - selected component for inspector panels
 */

import { api } from './api.js';

class AppState {
  constructor() {
    this.selectedCaseId = 5; // Initialized to default demo state, updated via provenance
    this.defaultCaseId = 5;
    this.totalCases = 5000;
    this.validRange = [0, 4999];
    this.provenance = null;
    this.initialized = false;
    
    // UI selections
    this.selectedComponentId = null; // null or number (0-13)
    this.networkEncoding = 'risk'; // 'risk' (Incident-line loading risk) | 'priority' (Structural heuristic priority)
    
    // Subscriptions
    this.listeners = new Set();
  }

  async init() {
    if (this.initialized) return;
    try {
      const prov = await api.getProvenance();
      this.provenance = prov;
      this.totalCases = prov.n_rows || 5000;
      this.validRange = prov.valid_range || [0, this.totalCases - 1];
      if (typeof prov.demo_state_id === 'number') {
        this.defaultCaseId = prov.demo_state_id;
        // Keep selected case within valid bounds
        if (this.selectedCaseId < 0 || this.selectedCaseId >= this.totalCases) {
          this.selectedCaseId = this.defaultCaseId;
        }
      }
      this.initialized = true;
      this.notify();
    } catch (err) {
      console.warn('Could not load provenance metadata for state initialization:', err);
    }
  }

  getCaseId() {
    return this.selectedCaseId;
  }

  setCaseId(id) {
    const num = Number(id);
    if (Number.isNaN(num) || !Number.isInteger(num)) {
      throw new Error(`State ID must be an integer (valid range: ${this.validRange[0]}–${this.validRange[1]}).`);
    }
    if (num < this.validRange[0] || num > this.validRange[1]) {
      throw new Error(`State ID ${num} is out of range (${this.validRange[0]}–${this.validRange[1]}).`);
    }
    if (this.selectedCaseId !== num) {
      this.selectedCaseId = num;
      this.notify();
    }
    return this.selectedCaseId;
  }

  resetToDefaultCase() {
    return this.setCaseId(this.defaultCaseId);
  }

  getSelectedComponentId() {
    return this.selectedComponentId;
  }

  setSelectedComponentId(id) {
    this.selectedComponentId = id;
    this.notify();
  }

  getNetworkEncoding() {
    return this.networkEncoding;
  }

  setNetworkEncoding(mode) {
    if (mode === 'risk' || mode === 'priority') {
      this.networkEncoding = mode;
      this.notify();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    });
  }
}

export const state = new AppState();
