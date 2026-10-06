
import * as d3 from 'd3';

export function createNetworkGraph(data, containerEl, options = {}) {
  const width = options.width || 800;
  const height = options.height || 600;
  
  containerEl.innerHTML = '';
  const svg = d3.select(containerEl).append('svg')
    .attr('width', '100%').attr('height', '100%')
    .attr('viewBox', [0, 0, width, height]);
    
  const zoomGroup = svg.append('g');
  
  const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (e) => {
    zoomGroup.attr('transform', e.transform);
  });
  svg.call(zoom);

  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.edges).id(d => d.id).distance(50))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(20));
    
  const link = zoomGroup.append('g').attr('stroke', '#a67c52').attr('stroke-opacity', 0.6)
    .selectAll('line').data(data.edges).join('line').attr('stroke-width', d => Math.max(1, (d.flow || 0)/20));
    
  const node = zoomGroup.append('g')
    .selectAll('circle').data(data.nodes).join('circle')
    .attr('r', d => d.type === 'generator' ? 12 : 8)
    .attr('fill', d => d.riskScore > 0.8 ? '#8b2020' : '#4a7c59')
    .attr('stroke', '#c9a84c').attr('stroke-width', 1.5)
    .on('click', (e, d) => { if(options.onClick) options.onClick(d); });
    
  simulation.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('cx', d => d.x).attr('cy', d => d.y);
  });
  
  return svg;
}
