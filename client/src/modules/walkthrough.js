// Interactive walkthrough / onboarding tour
// Highlights elements one at a time with a spotlight overlay and tooltip

const STEPS = [
  {
    target: '#newProjectBtnDashboard',
    title: 'Create a Project',
    body: 'Click here to start a new project. You can also click any existing project card to reopen it.',
    view: 'dashboard',
  },
  {
    target: '#addressInput',
    title: 'Search a Location',
    body: 'Type an address or place name here. Use arrow keys to browse suggestions, Enter to select.',
    view: 'map',
  },
  {
    target: '#detailSelector',
    title: 'Detail Level',
    body: 'Draft (90m, fastest), Standard (30m, balanced), or Survey (10m lidar, US only). Pick based on your needs.',
    view: 'map',
  },
  {
    target: '#areaValue',
    title: 'Area Size',
    body: 'Set the size of your terrain area. Supports km, meters, miles, feet, and acres. The blue box on the map shows your selection.',
    view: 'map',
  },
  {
    target: '#dropCenterBtn',
    title: 'Drop Center',
    body: 'Places the selection box at the center of the current map view. You can also click anywhere on the map to move it.',
    view: 'map',
  },
  {
    target: '#generateBtn',
    title: 'Generate Terrain',
    body: 'Creates a 3D terrain model from real elevation data. This may take a few seconds. You\'ll be taken to the Studio view when ready.',
    view: 'map',
  },
  {
    target: '#scene',
    title: '3D Terrain',
    body: 'Your terrain renders here with elevation colors. Green = low, white = high. Drag to orbit, scroll to zoom. The red arrow points true north.',
    view: 'studio',
  },
  {
    target: '#toggleMapPreview',
    title: 'Site Map Preview',
    body: 'Click to see a preview of the map area you selected, so you can reference it without going back.',
    view: 'studio',
  },
  {
    target: '.exports',
    title: 'Export',
    body: 'Download your terrain as OBJ, STL, or Heightmap for use in other 3D software like Blender, Unity, or Unreal.',
    view: 'studio',
  },
  {
    target: '#versionList',
    title: 'Generation History',
    body: 'Each time you regenerate, the old version is saved here. Click the eye icon to load a previous version.',
    view: 'studio',
  },
  {
    target: '#saveBtnStudio',
    title: 'Save',
    body: 'Save your project manually. Your work also auto-saves when you change the area or location.',
    view: 'studio',
  },
  {
    target: '#settingsBtnStudio',
    title: 'Settings & Sign Out',
    body: 'Click the gear icon to configure your AI provider API key. The Sign Out button is at the bottom of the settings dialog.',
    view: 'studio',
  },
];

let overlay = null;
let tooltip = null;
let currentStep = 0;
let isActive = false;

export function startWalkthrough() {
  if (isActive) return;
  isActive = true;
  currentStep = 0;

  overlay = document.createElement('div');
  overlay.className = 'walkthrough-overlay';
  document.body.appendChild(overlay);

  tooltip = document.createElement('div');
  tooltip.className = 'walkthrough-tooltip';
  document.body.appendChild(tooltip);

  showStep();
}

export function endWalkthrough() {
  isActive = false;
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
  localStorage.setItem('cs-walkthrough-done', '1');
}

function showStep() {
  if (currentStep >= STEPS.length) {
    endWalkthrough();
    return;
  }

  const step = STEPS[currentStep];

  if (step.view) {
    import('../router.js').then(({ navigate, getCurrentView }) => {
      if (getCurrentView() !== step.view) {
        navigate(step.view);
      }
      setTimeout(() => positionStep(step), 300);
    });
  } else {
    positionStep(step);
  }
}

function positionStep(step) {
  const target = document.querySelector(step.target);

  if (!target) {
    currentStep++;
    showStep();
    return;
  }

  const rect = target.getBoundingClientRect();
  const padding = 8;

  const highlight = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  const total = currentStep + 1;
  const totalSteps = STEPS.length;

  tooltip.innerHTML = `
    <div class="walkthrough-progress">Step ${total} of ${totalSteps}</div>
    <h4>${step.title}</h4>
    <p>${step.body}</p>
    <div class="walkthrough-actions">
      <button class="ghost sm walkthrough-skip">Skip</button>
      <button class="primary sm walkthrough-next">${total === totalSteps ? 'Finish' : 'Next'}</button>
    </div>
  `;

  positionTooltip(highlight);

  overlay.style.clipPath = `polygon(0% 0%, 0% 100%, ${highlight.left}px 100%, ${highlight.left}px ${highlight.top}px, ${highlight.left + highlight.width}px ${highlight.top}px, ${highlight.left + highlight.width}px ${highlight.top + highlight.height}px, ${highlight.left}px ${highlight.top + highlight.height}px, ${highlight.left}px 100%, 100% 100%, 100% 0%)`;

  tooltip.querySelector('.walkthrough-next')?.addEventListener('click', () => {
    currentStep++;
    showStep();
  });

  tooltip.querySelector('.walkthrough-skip')?.addEventListener('click', endWalkthrough);
}

function positionTooltip(highlight) {
  const tipRect = tooltip.getBoundingClientRect();
  const margin = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = highlight.top + highlight.height + margin;
  let left = highlight.left;

  if (top + tipRect.height > vh - margin) {
    top = highlight.top - tipRect.height - margin;
    if (top < margin) top = margin;
  }

  if (left + tipRect.width > vw - margin) {
    left = vw - tipRect.width - margin;
  }
  if (left < margin) left = margin;

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

export function shouldShowWalkthrough() {
  try {
    return !localStorage.getItem('cs-walkthrough-done');
  } catch {
    return false;
  }
}
