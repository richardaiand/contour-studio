import { $ } from './utils.js';
import { store, setStatus } from './store/index.js';
import { initTheme, applyTheme } from './modules/theme.js';
import { initAuth, restoreSession } from './modules/auth.js';
import { initSettings } from './modules/settings.js';
import { initProjects, loadProjects } from './modules/projects.js';
import { initMap } from './modules/map.js';
import { initViewport } from './modules/viewport.js';
import { initTerrain } from './modules/terrain.js';
import { initRouter, setInitialView, navigate } from './router.js';

async function init() {
  initTheme();
  initRouter();
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

  store.subscribe((state) => {
    const titleEl = $('projectTitle');
    if (titleEl) titleEl.textContent = state.currentProject?.title || 'No project';
    const titleStudioEl = $('projectTitleStudio');
    if (titleStudioEl) titleStudioEl.textContent = state.currentProject?.title || 'No project';
  });

  $('sidebarToggle')?.addEventListener('click', () => {
    $('sidebar')?.classList.toggle('collapsed');
  });

  $('projectsToggle')?.addEventListener('click', () => {
    $('projectsPanel')?.classList.toggle('collapsed');
  });

  $('studioSidebarToggle')?.addEventListener('click', () => {
    $('studioSidebar')?.classList.toggle('collapsed');
  });

  // Theme buttons on all views
  ['themeBtn', 'themeBtnStudio', 'themeBtnLogin'].forEach((id) => {
    const btn = $(id);
    if (btn) {
      btn.addEventListener('click', () => {
        const next = store.get('theme') === 'dark' ? 'light' : 'dark';
        store.set({ theme: next });
        localStorage.setItem('cs-theme', next);
        applyTheme(next);
      });
    }
  });

  // Auth buttons on all views
  ['authBtn', 'authBtnStudio'].forEach((id) => {
    const btn = $(id);
    if (btn) {
      btn.addEventListener('click', () => {
        store.set({ user: null, settings: null });
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        setStatus('Signed out.', '');
        navigate('login');
      });
    }
  });

  // Restore session
  const session = await restoreSession();
  setInitialView(!!session);

  if (session) {
    setStatus('Ready. Search for a location to begin.', '');
  }
}

init().catch((e) => {
  console.error('Init error', e);
  setStatus('Startup error: ' + e.message, 'error');
});
