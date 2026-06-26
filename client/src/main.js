import { $ } from './utils.js';
import { store, setStatus } from './store/index.js';
import { initTheme } from './modules/theme.js';
import { initAuth } from './modules/auth.js';
import { initSettings } from './modules/settings.js';
import { initProjects, loadProjects } from './modules/projects.js';
import { initMap } from './modules/map.js';
import { initViewport } from './modules/viewport.js';
import { initTerrain } from './modules/terrain.js';

async function init() {
  initTheme();
  initAuth();
  initSettings();
  initProjects();
  initMap();
  initViewport();
  initTerrain();

  let projectsLoaded = false;
  store.subscribe((state) => {
    if (state.user && !projectsLoaded) {
      projectsLoaded = true;
      loadProjects();
    }
    if (!state.user) {
      projectsLoaded = false;
    }
  });
  if (store.get('user')) {
    projectsLoaded = true;
    loadProjects();
  }

  store.subscribe((state) => {
    const titleEl = $('projectTitle');
    if (!titleEl) return;
    titleEl.textContent = state.currentProject?.title || 'No project';
  });

  $('sidebarToggle')?.addEventListener('click', () => {
    $('sidebar')?.classList.toggle('collapsed');
  });

  $('projectsToggle')?.addEventListener('click', () => {
    $('projectsPanel')?.classList.toggle('collapsed');
  });

  setStatus('Ready. Search for a location to begin.', '');
}

init().catch((e) => {
  console.error('Init error', e);
  setStatus('Startup error: ' + e.message, 'error');
});
