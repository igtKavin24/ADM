const API_BASE = '/api';

async function request(path, body) {
  const options = body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
  const res = await fetch(API_BASE + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  getNetwork: () => request('/network'),
  getNetworkMetrics: () => request('/network/metrics'),
  getForecast: () => request('/forecast'),
  getForecastById: (id) => request(`/forecast/${id}`),
  getVulnerabilities: () => request('/vulnerabilities'),
  simulateOutage: (data) => request('/simulation/outage', data),
  getInterventions: () => request('/interventions'),
  evaluateInterventions: (ids) => request('/interventions/evaluate', { interventions: ids }),
  optimizeInterventions: (budget) => request('/interventions/optimize', { budget }),
  getModelMetrics: () => request('/model/metrics'),
  getExplainability: () => request('/model/explainability'),
  getProvenance: () => request('/data/provenance'),
  getExperiments: () => request('/experiments'),
  runExperiment: (data) => request('/experiments/run', data),
};
