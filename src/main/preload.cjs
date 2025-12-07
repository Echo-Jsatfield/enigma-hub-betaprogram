const { contextBridge, ipcRenderer } = require('electron');

// ============================================
// WINDOW-LEVEL UPDATE EVENT EMITTER
// This survives React re-renders!
// ============================================
let updateListeners = [];

// Register IPC listener ONCE at preload time
ipcRenderer.on('update-notification', (_event, data) => {
  console.log('[Preload] 📥 Received update-notification, broadcasting to', updateListeners.length, 'listeners');
  console.log('[Preload] Data:', data);

  // Broadcast to all registered listeners
  updateListeners.forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error('[Preload] Error calling update listener:', err);
    }
  });
});

console.log('[Preload] ✅ Window-level update emitter initialized');

// ============================================
// CONTEXT BRIDGE API
// ============================================
contextBridge.exposeInMainWorld('electronAPI', {
  // Telemetry
  telemetryUserLogin: (userData) => ipcRenderer.invoke('telemetry-user-login', userData),
  telemetryUserLogout: () => ipcRenderer.invoke('telemetry-user-logout'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  toggleOverlay: () => ipcRenderer.invoke('toggle-overlay'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // First run wizard
  checkFirstRun: () => ipcRenderer.invoke('check-first-run'),
  getGamePaths: () => ipcRenderer.invoke('get-game-paths'),
  browseFolder: (title, defaultPath) => ipcRenderer.invoke('browse-folder', title, defaultPath),
  validateGamePath: (path, game) => ipcRenderer.invoke('validate-game-path', path, game),
  saveGamePaths: (ets2Path, atsPath) => ipcRenderer.invoke('save-game-paths', ets2Path, atsPath),
  autoDetectGames: () => ipcRenderer.invoke('auto-detect-games'),

  // electron-updater - Window-level events (survives React re-renders)
  onUpdateNotification: (callback) => {
    console.log('[Preload] ✅ Registering update listener');
    updateListeners.push(callback);

    // Return unsubscribe function (optional, but good practice)
    return () => {
      const index = updateListeners.indexOf(callback);
      if (index > -1) {
        updateListeners.splice(index, 1);
        console.log('[Preload] Unregistered update listener');
      }
    };
  },
  installUpdate: () => ipcRenderer.send('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Manual Update Manager (NEW - for DevPanel)
  downloadUpdate: (params) => ipcRenderer.invoke('download-update', params),
  applyUpdate: (params) => ipcRenderer.invoke('apply-update', params),

  // DevPanel
  quickPush: () => ipcRenderer.invoke('quick-push'),
  pushRelease: (data) => ipcRenderer.invoke('push-release', data),
  uninstallApp: () => ipcRenderer.invoke('uninstall-app'),

  // Auth
  sendAuthToken: (token) => {
    console.log('[Preload] sendAuthToken called with token:', token ? '[token received]' : '[no token]');
    ipcRenderer.send('auth-token', token);
  },
  saveToken: (token) => ipcRenderer.send('save-token', token),

  // Job Events
  onJobDeleted: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('job:deleted', listener);
    return () => ipcRenderer.removeListener('job:deleted', listener);
  },
});

console.log('[Preload] electronAPI exposed');
