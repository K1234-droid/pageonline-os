const STORAGE_KEY = 'pageonline_os_state';

function loadPersistentState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('State load error', e);
  }
  return {};
}

const persistent = loadPersistentState();

function getInitialLanguage() {
  if (persistent.language) return persistent.language;

  const navLang = navigator.language || 'en';
  return navLang.startsWith('id') ? 'id' : 'en';
}

const initialDesktopApps = [
  { id: 'settings', x: 0, y: 0 },
  { id: 'browser', x: 1, y: 0 },
  { id: 'terminal', x: 2, y: 0 },
  { id: 'notepad', x: 3, y: 0 },
  { id: 'files', x: 4, y: 0 }
];

export const state = {
  powerStatus: 'off',
  language: getInitialLanguage(),
  activeApps: [],
  focusedApp: null,
  time: new Date(),
  startMenuOpen: false,
  startMenuOpen: false,
  pinnedDesktopApps: persistent.savedDesktopApps || initialDesktopApps,
  savedDesktopApps: persistent.savedDesktopApps || initialDesktopApps,
  pinnedTaskbarApps: persistent.pinnedTaskbarApps || ['browser', 'notepad', 'files'],
  selectedDesktopApps: [],
};

if (state.pinnedDesktopApps.length > 0 && typeof state.pinnedDesktopApps[0] === 'string') {
  const migrated = state.pinnedDesktopApps.map((id, index) => ({
    id,
    x: index % 10,
    y: Math.floor(index / 10)
  }));
  state.pinnedDesktopApps = migrated;
  state.savedDesktopApps = migrated;
}

const listeners = [];

export function subscribe(callback) {
  listeners.push(callback);
}

export function notify() {
  listeners.forEach(callback => callback(state));
}

export function setState(newState) {
  Object.assign(state, newState);

  const toSave = {
    language: state.language,
    savedDesktopApps: state.savedDesktopApps,
    pinnedTaskbarApps: state.pinnedTaskbarApps
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

  notify();
}

export function toggleLanguage() {
  const newLang = state.language === 'id' ? 'en' : 'id';
  setState({ language: newLang });
}

export function addActiveApp(app) {
  const existing = state.activeApps.find(a => a.instanceId === app.instanceId);
  if (!existing) {
    state.activeApps.push(app);
    state.focusedApp = app.instanceId;
    notify();
  }
}

export function removeActiveApp(instanceId) {
  state.activeApps = state.activeApps.filter(a => a.instanceId !== instanceId);
  if (state.focusedApp === instanceId) {
    state.focusedApp = state.activeApps.length > 0 ? state.activeApps[state.activeApps.length - 1].instanceId : null;
  }
  notify();
}

export function focusApp(instanceId) {
  state.focusedApp = instanceId;
  notify();
}

export function toggleAppList() {
  setState({ appListOpen: !state.appListOpen });
}

export function togglePinDesktop(id, maxCols = 10) {
  const current = state.pinnedDesktopApps;
  const isPinned = current.some(app => app.id === id);

  if (isPinned) {
    const newPinned = current.filter(app => app.id !== id);
    setState({ pinnedDesktopApps: newPinned, savedDesktopApps: newPinned });
  } else {
    let x = 0, y = 0;
    while (current.some(app => app.x === x && app.y === y)) {
      x++;
      if (x >= maxCols) { x = 0; y++; }
    }
    const newPinned = [...current, { id, x, y }];
    setState({ pinnedDesktopApps: newPinned, savedDesktopApps: newPinned });
  }
}

export function togglePinTaskbar(id) {
  const current = state.pinnedTaskbarApps;
  const next = current.includes(id)
    ? current.filter(appId => appId !== id)
    : [...current, id];
  setState({ pinnedTaskbarApps: next });
}
