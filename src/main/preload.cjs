const { contextBridge, ipcRenderer } = require('electron');

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
  
  // electron-updater (NSIS) - Auto-updater
  onUpdateAvailable: (callback) => {
    const listener = (event, info) => callback(info);
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  onDownloadProgress: (callback) => {
    const listener = (event, progress) => callback(progress);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = (event, info) => callback(info);
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
  installUpdate: () => ipcRenderer.send('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),

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

  // Job Events
  onJobDeleted: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('job:deleted', listener);
    return () => ipcRenderer.removeListener('job:deleted', listener);
  },
});

console.log('[Preload] electronAPI exposed');