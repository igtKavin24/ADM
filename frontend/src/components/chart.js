import Chart from 'chart.js/auto';

Chart.defaults.color = '#9b8e7e';
const grid = { color: 'rgba(201, 168, 76, 0.1)' };

// Returns a fixed-height wrapper containing the chart canvas.
export function createBarChart(labels, datasets, options = {}) {
  const wrap = document.createElement('div');
  wrap.style.height = '280px';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  setTimeout(() => new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x: { grid }, y: { grid, ...(options.y || {}) } },
      plugins: { legend: { display: datasets.length > 1 } },
    },
  }), 0);
  return wrap;
}
