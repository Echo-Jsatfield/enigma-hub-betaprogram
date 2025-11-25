// ============================================
// ENIGMA HUB - ELECTRON MAIN PROCESS
// WITH REACT FIRST-RUN WIZARD
// ============================================

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { startTelemetryServer, stopTelemetryServer, setCurrentUser } from './telemetry-server.js';
import { getGamePaths, saveGamePaths } from './game-paths.js';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// ============================================
// EARLY LOGGING SETUP
// ============================================

const logPath = join(app.getPath('userData'), 'app.log');
let logStream;

const logDir = dirname(logPath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

logStream = fs.createWriteStream(logPath, { flags: 'a' });

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  if (logStream) {
    const msg = args.join(' ');
    logStream.write(`[LOG] ${new Date().toISOString()} ${msg}\n`);
  }
};

console.error = (...args) => {
  originalError(...args);
  if (logStream) {
    const msg = args.join(' ');
    logStream.write(`[ERROR] ${new Date().toISOString()} ${msg}\n`);
  }
};

console.log('===========================================');
console.log('ENIGMA HUB STARTING');
console.log(`Log file: ${logPath}`);
console.log('===========================================');

// ============================================
// ENVIRONMENT DETECTION
// ============================================

const isDev = !app.isPackaged;

console.log(`Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`Packaged: ${app.isPackaged}`);
console.log(`__dirname: ${__dirname}`);

// ============================================
// MAIN WINDOW
// ============================================

let mainWindow;

// ============================================
// PATH RESOLUTION
// ============================================

function getPreloadPath() {
  if (isDev) {
    return join(__dirname, 'preload.cjs');
  }
  return join(__dirname, 'preload.cjs');
}

function getHTMLPath() {
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL;
  }
  
  if (app.isPackaged) {
    return join(__dirname, '../../dist/index.html');
  }
  
  return join(__dirname, '../../dist/index.html');
}

// ============================================
// FIRST RUN CHECK
// ============================================

function isFirstRun() {
  const paths = getGamePaths();
  return !paths.ets2 || !paths.ats;
}

// ============================================
// PLUGIN INSTALLATION
// ============================================

function installGamePlugins(ets2Path, atsPath) {
  try {
    let pluginSource;
    
    if (app.isPackaged) {
      pluginSource = join(process.resourcesPath, 'app.asar.unpacked', 'src', 'telemetry');
    } else {
      pluginSource = join(process.cwd(), 'src', 'telemetry');
    }
    
    console.log('[PluginInstall] Plugin source:', pluginSource);
    
    // Verify source exists
    if (!fs.existsSync(pluginSource)) {
      console.error('[PluginInstall] Plugin source not found!');
      return false;
    }
    
    const corePlugin = join(pluginSource, 'enigma_telemetry_core.dll');
    const scsPlugin = join(pluginSource, 'scs-telemetry.dll');
    
    if (!fs.existsSync(corePlugin) || !fs.existsSync(scsPlugin)) {
      console.error('[PluginInstall] Plugin DLLs not found!');
      return false;
    }
    
    // Install ETS2
    if (ets2Path) {
      const ets2Plugins = join(ets2Path, 'bin', 'win_x64', 'plugins');
      const ets2Enigma = join(ets2Plugins, 'enigma');
      
      if (!fs.existsSync(ets2Enigma)) {
        fs.mkdirSync(ets2Enigma, { recursive: true });
      }
      
      fs.copyFileSync(scsPlugin, join(ets2Plugins, 'scs-telemetry.dll'));
      fs.copyFileSync(corePlugin, join(ets2Enigma, 'enigma_telemetry_core.dll'));
      console.log('[PluginInstall] ✅ ETS2 plugins installed');
    }
    
    // Install ATS
    if (atsPath) {
      const atsPlugins = join(atsPath, 'bin', 'win_x64', 'plugins');
      const atsEnigma = join(atsPlugins, 'enigma');
      
      if (!fs.existsSync(atsEnigma)) {
        fs.mkdirSync(atsEnigma, { recursive: true });
      }
      
      fs.copyFileSync(scsPlugin, join(atsPlugins, 'scs-telemetry.dll'));
      fs.copyFileSync(corePlugin, join(atsEnigma, 'enigma_telemetry_core.dll'));
      console.log('[PluginInstall] ✅ ATS plugins installed');
    }
    
    return true;
  } catch (error) {
    console.error('[PluginInstall] Error installing plugins:', error);
    return false;
  }
}

// Check and reinstall plugins if app version changed
function checkAndReinstallPlugins() {
  try {
    const appDataPath = app.getPath('userData');
    const versionFile = join(appDataPath, 'installed-version.txt');
    
    // Get current app version
    const projectRoot = join(__dirname, '../..');
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    
    // Check if version file exists
    let installedVersion = null;
    if (fs.existsSync(versionFile)) {
      installedVersion = fs.readFileSync(versionFile, 'utf8').trim();
    }
    
    // If version changed, reinstall plugins
    if (installedVersion !== currentVersion) {
      console.log(`[PluginUpdate] Version changed: ${installedVersion} → ${currentVersion}`);
      console.log('[PluginUpdate] Reinstalling game plugins...');
      
      const gamePaths = getGamePaths();
      if (gamePaths.ets2 || gamePaths.ats) {
        const success = installGamePlugins(gamePaths.ets2, gamePaths.ats);
        if (success) {
          // Save current version
          fs.writeFileSync(versionFile, currentVersion);
          console.log('[PluginUpdate] ✅ Plugins updated to v' + currentVersion);
        }
      }
    } else {
      console.log('[PluginUpdate] Plugins up to date (v' + currentVersion + ')');
    }
  } catch (error) {
    console.error('[PluginUpdate] Error checking plugins:', error);
  }
}

// ============================================
// WINDOW MANAGEMENT
// ============================================

function createWindow() {
  console.log('[Window] Creating main window...');
  
  const preloadPath = getPreloadPath();
  console.log(`[Window] Preload path: ${preloadPath}`);
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    },
    icon: join(__dirname, '../../src/assets/icon.ico'),
    show: false
  });

  const htmlPath = getHTMLPath();
  console.log(`[Window] Loading: ${htmlPath}`);
  
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(htmlPath);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.once('ready-to-show', () => {
    console.log('[Window] ✅ Window ready to show');
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Window] ❌ Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    console.log('[Window] Window closed');
    mainWindow = null;
  });

  console.log('[Window] ✅ Main window created');
}

// ============================================
// IPC HANDLERS - WINDOW CONTROLS
// ============================================

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('toggle-devtools', () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  }
});

// ============================================
// IPC HANDLERS - TELEMETRY
// ============================================

// ✅ CORRECT - Using .handle and returning response
ipcMain.handle('telemetry-user-login', (event, userData) => {
  console.log('[Telemetry] User logged in:', userData.username);
  setCurrentUser(userData);
  return { success: true };
});

ipcMain.handle('telemetry-user-logout', () => {
  console.log('[Telemetry] User logged out');
  setCurrentUser(null);
  return { success: true };
});

// ============================================
// IPC HANDLERS - APP INFO
// ============================================

ipcMain.handle('get-app-version', () => {
  try {
    const projectRoot = join(__dirname, '../..');
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('[Version] Error reading version:', error);
    return '1.0.0';
  }
});

// ============================================
// IPC HANDLERS - FIRST RUN WIZARD
// ============================================

ipcMain.handle('check-first-run', () => {
  const firstRun = isFirstRun();
  console.log('[FirstRun] Check result:', firstRun);
  return firstRun;
});

ipcMain.handle('get-game-paths', () => {
  const paths = getGamePaths();
  console.log('[GamePaths] Retrieved:', paths);
  return paths;
});

ipcMain.handle('browse-folder', async (event, title, defaultPath) => {
  console.log('[BrowseFolder] Opening dialog:', title);
  
  const result = await dialog.showOpenDialog(mainWindow, {
    title: title || 'Select Folder',
    defaultPath: defaultPath || 'C:\\Program Files (x86)\\Steam\\steamapps\\common',
    properties: ['openDirectory']
  });
  
  if (result.canceled || !result.filePaths[0]) {
    console.log('[BrowseFolder] User cancelled');
    return null;
  }
  
  console.log('[BrowseFolder] Selected:', result.filePaths[0]);
  return result.filePaths[0];
});

ipcMain.handle('validate-game-path', (event, path, game) => {
  console.log('[ValidatePath] Checking:', game, path);
  
  if (!path) return false;
  
  let isValid = false;
  
  if (game === 'ets2') {
    isValid = fs.existsSync(join(path, 'bin', 'win_x64', 'eurotrucks2.exe'));
  } else if (game === 'ats') {
    isValid = fs.existsSync(join(path, 'bin', 'win_x64', 'amtrucks.exe'));
  }
  
  console.log('[ValidatePath] Result:', isValid);
  return isValid;
});

ipcMain.handle('save-game-paths', async (event, ets2Path, atsPath) => {
  console.log('[SavePaths] Saving:', { ets2: ets2Path, ats: atsPath });
  
  try {
    // Save paths
    const saved = saveGamePaths(ets2Path, atsPath);
    
    if (!saved) {
      console.error('[SavePaths] Failed to save paths');
      return { success: false, error: 'Failed to save paths' };
    }
    
    // Install plugins
    console.log('[SavePaths] Installing plugins...');
    const installed = installGamePlugins(ets2Path, atsPath);
    
    if (!installed) {
      console.error('[SavePaths] Failed to install plugins');
      return { success: false, error: 'Failed to install plugins' };
    }
    
    console.log('[SavePaths] ✅ Success!');
    return { success: true };
  } catch (error) {
    console.error('[SavePaths] Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auto-detect-games', () => {
  console.log('[AutoDetect] Searching for games...');
  
  const steamPaths = [
    'C:\\Program Files (x86)\\Steam\\steamapps\\common',
    'D:\\SteamLibrary\\steamapps\\common',
    'E:\\SteamLibrary\\steamapps\\common',
    'F:\\SteamLibrary\\steamapps\\common',
    'G:\\SteamLibrary\\steamapps\\common'
  ];
  
  const detected = {
    ets2: null,
    ats: null
  };
  
  for (const steamPath of steamPaths) {
    if (!detected.ets2) {
      const ets2Path = join(steamPath, 'Euro Truck Simulator 2');
      if (fs.existsSync(join(ets2Path, 'bin', 'win_x64', 'eurotrucks2.exe'))) {
        detected.ets2 = ets2Path;
        console.log('[AutoDetect] Found ETS2:', ets2Path);
      }
    }
    
    if (!detected.ats) {
      const atsPath = join(steamPath, 'American Truck Simulator');
      if (fs.existsSync(join(atsPath, 'bin', 'win_x64', 'amtrucks.exe'))) {
        detected.ats = atsPath;
        console.log('[AutoDetect] Found ATS:', atsPath);
      }
    }
    
    if (detected.ets2 && detected.ats) break;
  }
  
  console.log('[AutoDetect] Results:', detected);
  return detected;
});

// ============================================
// IPC HANDLERS - DEVPANEL & UPDATES
// ============================================

ipcMain.on('install-update', () => {
  console.log('[AutoUpdater] Quit and install triggered');
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('quick-push', async () => {
  try {
    const { stdout } = await execAsync('git add . && git commit -m "Quick update" && git push');
    console.log('[QuickPush] Success:', stdout);
    return { success: true, message: 'Pushed to GitHub' };
  } catch (error) {
    console.error('[QuickPush] Error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('push-release', async (event, { version, releaseNotes }) => {
  try {
    const projectRoot = join(__dirname, '../..');
    const packageJsonPath = join(projectRoot, 'package.json');
    
    // Update package.json version
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('[PushRelease] Updated version to:', version);

    // Git commit and tag
    await execAsync(`git add . && git commit -m "Release v${version}" && git tag -a v${version} -m "${releaseNotes}" && git push && git push --tags`);
    console.log('[PushRelease] Pushed tags');

    // Build and publish
    await execAsync('npm run publish');
    console.log('[PushRelease] Published to GitHub');

    return { success: true };
  } catch (error) {
    console.error('[PushRelease] Error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('uninstall-app', async () => {
  try {
    const appDataPath = app.getPath('appData');
    const enigmaPath = join(appDataPath, 'enigma-hub-frontend');
    
    // Get game paths
    const gamePathsFile = join(enigmaPath, 'game-paths.json');
    let gamePaths = null;
    
    if (fs.existsSync(gamePathsFile)) {
      const data = fs.readFileSync(gamePathsFile, 'utf8');
      gamePaths = JSON.parse(data);
    }
    
    // Delete plugins from games
    if (gamePaths) {
      const deletePlugin = (gamePath) => {
        if (!gamePath) return;
        const pluginsDir = join(gamePath, 'bin', 'win_x64', 'plugins');
        
        // Delete DLL
        const dllPath = join(pluginsDir, 'scs-telemetry.dll');
        if (fs.existsSync(dllPath)) {
          fs.unlinkSync(dllPath);
          console.log('[Uninstall] Deleted:', dllPath);
        }
        
        // Delete folder
        const folderPath = join(pluginsDir, 'enigma');
        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log('[Uninstall] Deleted folder:', folderPath);
        }
      };
      
      deletePlugin(gamePaths.ets2);
      deletePlugin(gamePaths.ats);
    }
    
    // Delete app data
    if (fs.existsSync(enigmaPath)) {
      fs.rmSync(enigmaPath, { recursive: true, force: true });
      console.log('[Uninstall] Deleted app data');
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Uninstall] Error:', error.message);
    return { success: false, error: error.message };
  }
});


// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(() => {
  console.log('[App] App ready!');
  console.log('[App] Starting telemetry server on port 25555...');
  startTelemetryServer();
  
  // Check and reinstall plugins if version changed
  checkAndReinstallPlugins();
  
  createWindow();

  // Check for updates (production only)
  if (!isDev) {
    console.log('[AutoUpdater] Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('checking-for-update', () => {
      console.log('[AutoUpdater] Checking for update...');
    });
    
    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] Update available:', info.version);
      if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
      }
    });
    
    autoUpdater.on('update-not-available', () => {
      console.log('[AutoUpdater] App is up to date');
    });
    
    autoUpdater.on('download-progress', (progress) => {
      console.log(`[AutoUpdater] Download progress: ${Math.round(progress.percent)}%`);
      if (mainWindow) {
        mainWindow.webContents.send('download-progress', progress);
      }
    });
    
    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] Update downloaded:', info.version);
      if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', info);
      }
    });
    
    autoUpdater.on('error', (err) => {
      console.error('[AutoUpdater] Error:', err);
    });
    
    // Check every 2 hours
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 7200000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('[App] All windows closed');
  console.log('[App] Stopping telemetry server...');
  stopTelemetryServer();
  
  if (logStream) {
    logStream.end();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('browser-window-created', (_, window) => {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      if (window.webContents.isDevToolsOpened()) {
        window.webContents.closeDevTools();
      } else {
        window.webContents.openDevTools();
      }
      event.preventDefault();
    }
  });
});

process.on('uncaughtException', (error) => {
  console.error('[App] ❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[App] ❌ Unhandled rejection:', error);
});

console.log('[App] ✅ Main process initialized');