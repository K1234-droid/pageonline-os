const DB_NAME = 'pageonline_os_db';
const STORE_NAME = 'settings';
const STORAGE_KEY = 'state';

let db = null;

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveToDB(data) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, STORAGE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

async function loadFromDB() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STORAGE_KEY);
    request.onsuccess = () => resolve(request.result || {});
    request.onerror = (e) => reject(e.target.error);
  });
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
  language: 'en',
  activeApps: [],
  focusedApp: null,
  time: new Date(),
  startMenuOpen: false,
  username: 'User',
  profilePicture: null,
  desktopWallpaper: null,
  pinnedDesktopApps: initialDesktopApps,
  savedDesktopApps: initialDesktopApps,
  pinnedTaskbarApps: ['browser', 'notepad', 'files'],
  selectedDesktopApps: [],
  clockFormat: '24h',
  dateDisplay: 'time-only',
  isFullscreenStable: true,
  alwaysShowFullscreen: true,
  enableAnimations: true,
  enableBlur: true,
};

const listeners = [];

export function subscribe(callback) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

export function notify() {
  listeners.forEach(callback => callback(state));
}

export async function initStorage() {
  const persistent = await loadFromDB();

  if (persistent.language) state.language = persistent.language;
  else {
    const navLang = navigator.language || 'en';
    state.language = navLang.startsWith('id') ? 'id' : 'en';
  }

  if (persistent.username) state.username = persistent.username;
  if (persistent.profilePicture) state.profilePicture = persistent.profilePicture;
  if (persistent.desktopWallpaper) state.desktopWallpaper = persistent.desktopWallpaper;
  if (persistent.savedDesktopApps) {
    state.pinnedDesktopApps = persistent.savedDesktopApps;
    state.savedDesktopApps = persistent.savedDesktopApps;
  }
  if (persistent.pinnedTaskbarApps) state.pinnedTaskbarApps = persistent.pinnedTaskbarApps;
  if (persistent.clockFormat) state.clockFormat = persistent.clockFormat;
  if (persistent.dateDisplay) state.dateDisplay = persistent.dateDisplay;
  if (persistent.alwaysShowFullscreen !== undefined) state.alwaysShowFullscreen = persistent.alwaysShowFullscreen;
  if (persistent.enableAnimations !== undefined) state.enableAnimations = persistent.enableAnimations;
  if (persistent.enableBlur !== undefined) state.enableBlur = persistent.enableBlur;

  if (state.pinnedDesktopApps.length > 0 && typeof state.pinnedDesktopApps[0] === 'string') {
    const migrated = state.pinnedDesktopApps.map((id, index) => ({
      id,
      x: index % 10,
      y: Math.floor(index / 10)
    }));
    state.pinnedDesktopApps = migrated;
    state.savedDesktopApps = migrated;
  }

  notify();
}

export function setState(newState) {
  Object.assign(state, newState);

  const toSave = {
    language: state.language,
    savedDesktopApps: state.savedDesktopApps,
    pinnedTaskbarApps: state.pinnedTaskbarApps,
    username: state.username,
    profilePicture: state.profilePicture,
    desktopWallpaper: state.desktopWallpaper,
    clockFormat: state.clockFormat,
    dateDisplay: state.dateDisplay,
    alwaysShowFullscreen: state.alwaysShowFullscreen,
    enableAnimations: state.enableAnimations,
    enableBlur: state.enableBlur
  };

  saveToDB(toSave).catch(err => console.error('Storage save error', err));
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
