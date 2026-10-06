
export const formatPercent = (v) => `${(v * 100).toFixed(1)}%`;
export const formatRiskLevel = (l) => l.replace('_', ' ');
export const formatHorizon = (steps, mps) => `${steps * mps} minutes`;
export const formatNumber = (v, d) => v.toFixed(d);
export const generateExplanation = (comp, metrics) => `Component ${comp.id} has high centrality and limited redundancy, causing significant impact if compromised.`;
