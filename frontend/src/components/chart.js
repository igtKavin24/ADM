
import Chart from 'chart.js/auto';

export function createBarChart(canvasId, labels, datasets, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  setTimeout(() => {
    new Chart(canvas, { type: 'bar', data: { labels, datasets }, options: { ...options, responsive: true, maintainAspectRatio: false, color: '#e8e0d4', scales: { x: { ticks: {color: '#9b8e7e'}, grid: {color: 'rgba(201, 168, 76, 0.1)'} }, y: { ticks: {color: '#9b8e7e'}, grid: {color: 'rgba(201, 168, 76, 0.1)'} } } } });
  }, 0);
  return canvas;
}
export function createRadarChart(canvasId, labels, datasets) {
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  setTimeout(() => {
    new Chart(canvas, { type: 'radar', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { color: 'rgba(201, 168, 76, 0.2)' }, grid: { color: 'rgba(201, 168, 76, 0.2)' }, pointLabels: { color: '#e8e0d4' }, ticks: { display: false } } } } });
  }, 0);
  return canvas;
}
