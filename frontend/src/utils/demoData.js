
export const demoData = {
  network: {
    nodes: Array.from({length: 14}).map((_, i) => ({ id: `bus_${i+1}`, type: i<5?'generator':'load', riskScore: Math.random(), centrality: Math.random() })),
    edges: Array.from({length: 20}).map((_, i) => ({ source: `bus_${Math.floor(Math.random()*14)+1}`, target: `bus_${Math.floor(Math.random()*14)+1}`, flow: Math.random()*100, limit: 100, id: `line_${i+1}` }))
  },
  metrics: { stable: 10, watch: 2, high: 1, critical: 1, total: 14 },
  forecast: { riskLevel: 'HIGH_RISK', confidence: 0.85, horizon: 12, topFeatures: [{name: 'Line 2 Loading', value: 0.9}, {name: 'Bus 5 Voltage', value: 0.7}] },
  interventions: [
    { id: 1, action: 'Redispatch Gen 2', cost: 1, riskReduction: 0.4 },
    { id: 2, action: 'Shed Load at Bus 14', cost: 2, riskReduction: 0.8 }
  ]
};
