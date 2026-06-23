import { $, api } from '../utils.js';
import { store, setStatus } from '../store/index.js';
import { setTerrain, getTerrainMesh } from './viewport.js';
import { computeBounds } from './map.js';
import { loadProjects } from './projects.js';

export function initTerrain() {
  $('searchBtn').addEventListener('click', searchAddress);
  $('addressInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchAddress();
  });

  $('generateBtn').addEventListener('click', generateTerrain);

  // Detail selector
  const detailBtns = document.querySelectorAll('#detailSelector button');
  detailBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      detailBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      store.set({ detail: btn.dataset.value });
    });
  });

  // Exports
  document.querySelectorAll('.exports button').forEach((btn) => {
    btn.addEventListener('click', () => exportTerrain(btn.dataset.export));
  });

  // Map upload
  $('mapUpload').addEventListener('change', analyzeMapUpload);

  store.subscribe((state) => {
    const hasTerrain = !!state.currentTerrain;
    document.querySelectorAll('.exports button').forEach((b) => (b.disabled = !hasTerrain));
    $('generateBtn').disabled = !state.bounds;
  });
}

async function searchAddress() {
  const address = $('addressInput').value.trim();
  if (!address) return;

  setStatus('Geocoding address…', '');
  try {
    const data = await api('/geocode', {
      method: 'POST',
      body: JSON.stringify({ address, sizeMeters: 1000 }),
    });
    store.set({ center: data.center, bounds: data.bounds });
    setStatus(`Found: ${data.displayName}`, 'ok');
  } catch (e) {
    setStatus(e.message, 'error');
  }
}

async function generateTerrain() {
  const bounds = store.get('bounds');
  if (!bounds) {
    setStatus('Search for a location first.', 'error');
    return;
  }

  store.set({ isGenerating: true });
  setStatus('Queueing terrain generation…', '');
  document.querySelectorAll('.exports button').forEach((b) => (b.disabled = true));

  try {
    const detailLevel = store.get('detail');
    const { jobId } = await api('/jobs/terrain', {
      method: 'POST',
      body: JSON.stringify({ bounds, detailLevel, verticalExaggeration: 1.5 }),
    });

    setStatus('Generating terrain…', '');
    const data = await pollJob(jobId);

    store.set({ currentTerrain: data, currentProject: { id: data.projectId } });
    setTerrain(data.mesh);
    updateStats(data);
    setStatus(`${data.sourceDescription || 'Terrain'} · ${data.resolutionMeters}m resolution`, 'ok');
    loadProjects();
  } catch (e) {
    setStatus('Generation failed: ' + e.message, 'error');
  } finally {
    store.set({ isGenerating: false });
  }
}

async function pollJob(jobId) {
  const start = Date.now();
  const maxWait = 5 * 60 * 1000; // 5 minutes

  while (Date.now() - start < maxWait) {
    const job = await api(`/jobs/${jobId}`);

    if (job.status === 'completed') {
      return job.result;
    }
    if (job.status === 'failed') {
      throw new Error(job.error || 'Job failed');
    }

    setStatus(`Generating terrain… ${job.progress}%`, '');
    await sleep(1500);
  }

  throw new Error('Terrain generation timed out');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeMapUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  setStatus(`Analyzing ${file.name}…`, '');
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/maps/analyze', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message);
    }

    const data = await res.json();
    store.set({ currentMapAnalysis: data.analysis });

    const interval = data.analysis?.contourIntervalMeters
      ? `${data.analysis.contourIntervalMeters}m contour interval`
      : 'no contour interval detected';
    setStatus(`Map analyzed: ${data.analysis?.title || file.name} · ${interval}`, 'ok');
  } catch (e) {
    setStatus('Map analysis failed: ' + e.message, 'error');
  } finally {
    e.target.value = '';
  }
}

function updateStats(data) {
  const stats = $('stats');
  const range = (data.maxElevation - data.minElevation).toFixed(1);
  stats.innerHTML = `
    <b>${data.mesh.width} × ${data.mesh.height}</b> vertices ·
    <b>${range}</b> m range ·
    <b>${data.verticalExaggeration}×</b> vertical exaggeration
  `;
}

async function exportTerrain(format) {
  const terrain = store.get('currentTerrain');
  if (!terrain) return;

  setStatus(`Exporting ${format.toUpperCase()}…`, '');
  try {
    const filename = $('filename').value.trim() || 'terrain';
    const res = await fetch('/api/terrain/export', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesh: terrain.mesh, format, filename, projectId: terrain.projectId }),
    });

    if (!res.ok) throw new Error(`Export ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'heightmap' ? 'png' : format;
    a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Export complete.', 'ok');
  } catch (e) {
    setStatus('Export failed: ' + e.message, 'error');
  }
}
