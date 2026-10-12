import * as d3 from 'd3';

const W = 750, H = 540;

// Color scales
export const loadingRiskColor = r => (r >= 0.8 ? '#cc5643' : r >= 0.6 ? '#d4a942' : '#4a8259');
export const priorityScoreColor = p => (p >= 0.7 ? '#cc5643' : p >= 0.45 ? '#d4a942' : '#4a8259');

/**
 * Interactive D3 Network Topology Graph
 * Supports:
 * - Clear mode encoding: 'risk' (incident-line loading) or 'priority' (heuristic priority)
 * - Zoom & Reset view buttons
 * - Selected node highlight ring
 * - Accessible SVG elements & tooltips
 */
export function createNetworkGraph(data, containerEl, {
  risks = {},
  priorities = {},
  encoding = 'risk', // 'risk' | 'priority'
  selectedId = null,
  onClick
} = {}) {
  containerEl.replaceChildren();

  // Controls overlay wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative; width:100%; height:100%;';

  const graphDiv = document.createElement('div');
  graphDiv.style.cssText = 'width:100%; height:100%; overflow:hidden;';
  wrapper.appendChild(graphDiv);

  // Floating Zoom / Fit Controls
  const controls = document.createElement('div');
  controls.style.cssText = 'position:absolute; top:12px; right:12px; display:flex; gap:6px; z-index:10;';

  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'btn btn-secondary btn-sm';
  zoomInBtn.textContent = '+';
  zoomInBtn.title = 'Zoom In';

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'btn btn-secondary btn-sm';
  zoomOutBtn.textContent = '−';
  zoomOutBtn.title = 'Zoom Out';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset View';
  resetBtn.title = 'Reset Zoom and Center';

  controls.append(zoomInBtn, zoomOutBtn, resetBtn);
  wrapper.appendChild(controls);
  containerEl.appendChild(wrapper);

  // SVG Initialization
  const svg = d3.select(graphDiv).append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', [0, 0, W, H])
    .attr('style', 'display:block; touch-action:none;');

  const g = svg.append('g');

  const zoom = d3.zoom()
    .scaleExtent([0.6, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  zoomInBtn.onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 1.3);
  zoomOutBtn.onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 0.7);
  resetBtn.onclick = () => svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity);

  const pos = new Map(data.nodes.map(n => [n.id, n]));

  // Transmission Lines / Edges
  g.append('g')
    .attr('class', 'edges')
    .selectAll('line')
    .data(data.edges)
    .join('line')
    .attr('x1', e => pos.get(e.source).x)
    .attr('y1', e => pos.get(e.source).y)
    .attr('x2', e => pos.get(e.target).x)
    .attr('y2', e => pos.get(e.target).y)
    .attr('stroke', '#a67c52')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', e => Math.max(1.5, Math.min(5, e.thermal_limit / 40)))
    .append('title')
    .text(e => `Line ${e.id} (${pos.get(e.source).name} ↔ ${pos.get(e.target).name}): Thermal limit ${e.thermal_limit} MW`);

  // Substation Nodes
  const nodeG = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(data.nodes)
    .join('g')
    .attr('transform', n => `translate(${n.x},${n.y})`)
    .style('cursor', 'pointer')
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', n => `${n.name} (${n.type})`)
    .on('click', (_, n) => onClick && onClick(n))
    .on('keydown', (e, n) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick && onClick(n);
      }
    });

  // Highlight halo for selected node
  nodeG.append('circle')
    .attr('class', 'node-halo')
    .attr('r', n => (n.type === 'generator' ? 24 : 20))
    .attr('fill', 'none')
    .attr('stroke', '#f2ede4')
    .attr('stroke-width', 2.5)
    .attr('stroke-dasharray', '3 2')
    .style('display', n => (n.id === selectedId ? 'block' : 'none'));

  // Main node circle
  nodeG.append('circle')
    .attr('class', 'node-circle')
    .attr('r', n => (n.type === 'generator' ? 18 : 13))
    .attr('fill', n => {
      if (encoding === 'priority') {
        return priorityScoreColor(priorities[n.id] ?? 0);
      }
      return loadingRiskColor(risks[n.id] ?? 0);
    })
    .attr('stroke', n => (n.type === 'generator' ? '#e0c273' : '#a67c52'))
    .attr('stroke-width', n => (n.type === 'generator' ? 2.5 : 1.5));

  // Node number / ID label
  nodeG.append('text')
    .text(n => n.id)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#0a0d17')
    .style('font-size', '11px')
    .style('font-weight', '700')
    .style('font-family', 'sans-serif')
    .style('pointer-events', 'none');

  // Node tooltip title
  nodeG.append('title')
    .text(n => `${n.name} (ID: ${n.id}, Type: ${n.type})\nIncident Line Loading Risk: ${( (risks[n.id] ?? 0) * 100 ).toFixed(1)}%\nPriority Score: ${((priorities[n.id] ?? 0)).toFixed(3)}`);

  return {
    svg,
    setSelected: (newSelectedId) => {
      nodeG.selectAll('.node-halo')
        .style('display', n => (n.id === newSelectedId ? 'block' : 'none'));
    },
    setEncoding: (newEncoding) => {
      nodeG.selectAll('.node-circle')
        .attr('fill', n => {
          if (newEncoding === 'priority') {
            return priorityScoreColor(priorities[n.id] ?? 0);
          }
          return loadingRiskColor(risks[n.id] ?? 0);
        });
    }
  };
}
