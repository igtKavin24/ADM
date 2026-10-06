import * as d3 from 'd3';

const W = 750, H = 560;
export const riskColor = r => (r >= 0.8 ? '#c45a4a' : r >= 0.6 ? '#c9a84c' : '#4a7c59');

// Draws the grid at the substation coordinates from the API; node colour = risk (0-1).
export function createNetworkGraph(data, containerEl, { risks = {}, onClick } = {}) {
  containerEl.replaceChildren();
  const svg = d3.select(containerEl).append('svg')
    .attr('width', '100%').attr('height', '100%').attr('viewBox', [0, 0, W, H]);
  const pos = new Map(data.nodes.map(n => [n.id, n]));

  svg.append('g').attr('stroke', '#a67c52').attr('stroke-opacity', 0.7)
    .selectAll('line').data(data.edges).join('line')
    .attr('x1', e => pos.get(e.source).x).attr('y1', e => pos.get(e.source).y)
    .attr('x2', e => pos.get(e.target).x).attr('y2', e => pos.get(e.target).y)
    .attr('stroke-width', e => Math.max(1, e.thermal_limit / 40))
    .append('title').text(e => `Line ${e.id} (limit ${e.thermal_limit} MW)`);

  const node = svg.append('g').selectAll('g').data(data.nodes).join('g')
    .attr('transform', n => `translate(${n.x},${n.y})`).style('cursor', 'pointer')
    .on('click', (_, n) => onClick && onClick(n));
  node.append('circle').attr('r', n => (n.type === 'generator' ? 16 : 12))
    .attr('fill', n => riskColor(risks[n.id] ?? 0)).attr('stroke', '#c9a84c').attr('stroke-width', 1.5);
  node.append('text').text(n => n.id).attr('text-anchor', 'middle').attr('dy', '0.35em')
    .attr('fill', '#0d0f1a').style('font-size', '11px').style('font-weight', 600).style('pointer-events', 'none');
  return svg;
}
