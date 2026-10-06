
import { demoData } from './utils/demoData.js';

const API_BASE = '/api';
const USE_DEMO = true;

function fetchWrap(url, options = {}) {
  if (USE_DEMO) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (url.includes('network')) resolve(demoData.network);
        else if (url.includes('metrics')) resolve(demoData.metrics);
        else if (url.includes('forecast')) resolve(demoData.forecast);
        else resolve({ status: 'ok', data: demoData });
      }, 500);
    });
  }
  return fetch(url, options).then(r => r.json());
}

export const api = {
  getNetwork: () => fetchWrap(`${API_BASE}/network`),
  getNetworkMetrics: () => fetchWrap(`${API_BASE}/network/metrics`),
  getForecast: () => fetchWrap(`${API_BASE}/forecast`),
  getForecastById: (id) => fetchWrap(`${API_BASE}/forecast/${id}`),
  getVulnerabilities: () => fetchWrap(`${API_BASE}/vulnerabilities`),
  getVulnerabilityById: (id) => fetchWrap(`${API_BASE}/vulnerabilities/${id}`),
  simulateOutage: (data) => fetchWrap(`${API_BASE}/simulation/outage`, { method: 'POST', body: JSON.stringify(data) }),
  getInterventions: () => fetchWrap(`${API_BASE}/interventions`),
  evaluateInterventions: (data) => fetchWrap(`${API_BASE}/interventions/evaluate`, { method: 'POST', body: JSON.stringify(data) }),
  optimizeInterventions: (data) => fetchWrap(`${API_BASE}/interventions/optimize`, { method: 'POST', body: JSON.stringify(data) }),
  getModelMetrics: () => fetchWrap(`${API_BASE}/model/metrics`),
  getExplainability: () => fetchWrap(`${API_BASE}/model/explainability`),
  getProvenance: () => fetchWrap(`${API_BASE}/data/provenance`),
  getExperiments: () => fetchWrap(`${API_BASE}/experiments`),
  runExperiment: (data) => fetchWrap(`${API_BASE}/experiments/run`, { method: 'POST', body: JSON.stringify(data) }),
};
