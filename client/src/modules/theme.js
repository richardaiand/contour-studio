import { store } from '../store/index.js';

export function initTheme() {
  const saved = localStorage.getItem('cs-theme') || 'dark';
  store.set({ theme: saved });
  applyTheme(saved);
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('[id^="themeBtn"]').forEach((btn) => {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}
