import { $, api } from '../utils.js';
import { store, setStatus } from '../store/index.js';

const PRESETS = [
  { name: 'AIand', endpoint: 'https://api.aiand.com/v1', model: 'deepseek-ai/deepseek-v4-pro', modelsEndpoint: '/providers/aiand/models' },
  { name: 'OpenAI', endpoint: 'https://api.openai.com/v1', model: 'gpt-4o' },
  { name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' },
  { name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  { name: 'Ollama', endpoint: 'http://localhost:11434/v1', model: 'llama3.1' },
];

let aiandModels = [];

export function initSettings() {
  $('settingsBtn')?.addEventListener('click', openSettings);
  $('settingsBtnDashboard')?.addEventListener('click', openSettings);
  $('cancelSettings')?.addEventListener('click', () => $('settingsDlg')?.close());
  $('saveSettings')?.addEventListener('click', saveSettings);

  const wrap = $('providerPresets');
  if (wrap) {
    PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.className = 'sm secondary';
      b.textContent = p.name;
      b.addEventListener('click', () => applyPreset(p));
      wrap.appendChild(b);
    });
  }

  $('modelSelect')?.addEventListener('change', () => {
    const val = $('modelSelect').value;
    const input = $('model');
    if (val === 'custom') {
      input.style.display = 'block';
    } else {
      input.style.display = 'none';
      input.value = val;
    }
  });

  store.subscribe((state) => {
    const btn = $('settingsBtn') || $('settingsBtnDashboard');
    if (!btn) return;
    if (!state.user) {
      btn.disabled = true;
      btn.title = 'Sign in to configure AI provider';
    } else {
      btn.disabled = false;
      btn.title = '';
    }
  });
}

async function openSettings() {
  const settings = store.get('settings') || {};
  $('endpoint').value = settings.providerEndpoint || '';
  $('model').value = settings.providerModel || '';
  $('apiKey').value = '';

  // Preselect AIand so the model dropdown loads
  if (!$('endpoint').value) {
    applyPreset(PRESETS[0], false);
  } else {
    updateModelSelect(settings.providerModel);
  }

  $('settingsDlg').showModal();
}

async function applyPreset(preset, updateInputs = true) {
  if (updateInputs) {
    $('endpoint').value = preset.endpoint;
  }

  if (preset.modelsEndpoint) {
    await loadModels(preset.modelsEndpoint);
  } else {
    clearModels();
    aiandModels = [];
  }

  if (updateInputs) {
    updateModelSelect(preset.model);
  }
}

async function loadModels(endpoint) {
  try {
    const data = await api(endpoint);
    aiandModels = data.models || [];
    populateModelSelect();
  } catch (e) {
    aiandModels = [];
    clearModels();
  }
}

function clearModels() {
  const select = $('modelSelect');
  select.innerHTML = '<option value="custom">Custom…</option>';
}

function populateModelSelect() {
  const select = $('modelSelect');
  select.innerHTML = '<option value="custom">Custom…</option>';
  aiandModels.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name || m.id;
    select.appendChild(opt);
  });
}

function updateModelSelect(currentModel) {
  const select = $('modelSelect');
  const input = $('model');
  const match = aiandModels.find((m) => m.id === currentModel);

  if (match) {
    select.value = match.id;
    input.style.display = 'none';
    input.value = match.id;
  } else {
    select.value = 'custom';
    input.style.display = 'block';
    input.value = currentModel || '';
  }
}

async function saveSettings() {
  try {
    const modelSelect = $('modelSelect');
    let model = $('model').value.trim();
    if (modelSelect && modelSelect.value !== 'custom') {
      model = modelSelect.value;
    }

    const body = {
      providerEndpoint: $('endpoint').value.trim(),
      providerModel: model,
      apiKey: $('apiKey').value.trim(),
    };

    const data = await api('/auth/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    store.set({ settings: data.settings });
    $('settingsDlg').close();
    setStatus('Settings saved.', 'ok');
  } catch (e) {
    setStatus('Failed to save settings: ' + e.message, 'error');
  }
}
