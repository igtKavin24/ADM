
export function createRiskBadge(level) {
  const el = document.createElement('span');
  let lvlClass = 'risk-stable';
  if(level === 'WATCH') lvlClass = 'risk-watch';
  else if(level === 'HIGH_RISK') lvlClass = 'risk-high';
  else if(level === 'CRITICAL') lvlClass = 'risk-critical';
  
  el.className = `badge ${lvlClass}`;
  el.textContent = level.replace('_', ' ');
  return el;
}
