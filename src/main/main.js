// ============================================
// ENIGMA HUB - ELECTRON MAIN PROCESS
// WITH REACT FIRST-RUN WIZARD + CUSTOM UPDATER
// ============================================

import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http'; // Import http module
import { setCurrentUser } from './telemetry-server.js';
import { io } from 'socket.io-client';

const API_URL = process.env.VITE_API_URL || 'https://enigmalogistics.org';
import { getGamePaths, saveGamePaths } from './game-paths.js';
import pkg from 'electron-updater';
import { createOverlay, toggleOverlay, sendToOverlay } from './overlay-manager.js';
const { autoUpdater } = pkg;

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater event listeners
autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] ✅ Update available:', info.version);
  if (mainWindow && !mainWindow.isDestroyed() && isWindowReady) {
    console.log('[AutoUpdater] Sending update-available to renderer');
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes || ''
    });
  } else {
    console.log('[AutoUpdater] ⚠️ Cannot send update-available - window not ready');
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[AutoUpdater] No updates available. Current version:', info.version);
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  console.log(`[AutoUpdater] Download progress: ${percent}%`);
  if (mainWindow && !mainWindow.isDestroyed() && isWindowReady) {
    mainWindow.webContents.send('download-progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdater] ✅ Update downloaded! Version:', info.version);
  console.log('[AutoUpdater] Will install on app quit');

  // Store update info for late-joining listeners
  updateDownloadedInfo = {
    version: info.version,
    releaseNotes: info.releaseNotes || ''
  };

  if (mainWindow && !mainWindow.isDestroyed() && isWindowReady) {
    console.log('[AutoUpdater] Sending update-downloaded to renderer');
    mainWindow.webContents.send('update-downloaded', updateDownloadedInfo);
  } else {
    console.log('[AutoUpdater] ⚠️ Cannot send update-downloaded - window not ready');
  }
});

autoUpdater.on('error', (err) => {
  console.error('[AutoUpdater] ❌ Error:', err.message);
});

const GITHUB_OWNER = 'Echo-Jsatfield';
const GITHUB_REPO = 'enigma-hub-betaprogram';
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60 * 2; // 2 hours

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// PORT UTILITIES
// ============================================

const killProcessOnPort = async (port) => {
  console.log(`[Port Cleanup] Checking for processes on port ${port}...`);
  try {
    const { stdout: netstatOutput } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = netstatOutput.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        console.log(`[Port Cleanup] Found process with PID ${pid} on port ${port}. Attempting to terminate...`);
        try {
          await execAsync(`taskkill /F /PID ${pid}`);
          console.log(`[Port Cleanup] Successfully terminated process with PID ${pid}.`);
        } catch (taskkillError) {
          console.error(`[Port Cleanup] Failed to terminate process with PID ${pid}: ${taskkillError.message}`);
        }
      }
    }
  } catch (error) {
    if (error.message.includes('No rows were found') || error.message.includes('findstr')) {
      console.log(`[Port Cleanup] No process found on port ${port}.`);
    } else {
      console.error(`[Port Cleanup] Error checking port ${port}: ${error.message}`);
    }
  }
};

// ============================================
// UPDATE CLEANUP
// ============================================

// Clean up old update files (older than 7 days)
function cleanupOldUpdates() {
  try {
    const updatesDir = join(app.getPath('userData'), 'updates');
    if (!fs.existsSync(updatesDir)) return;
    
    const files = fs.readdirSync(updatesDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    let cleaned = 0;
    files.forEach(file => {
      if (file.endsWith('.exe') || file.endsWith('.bat')) {
        const filePath = join(updatesDir, file);
        try {
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;
          
          if (age > maxAge) {
            console.log('[CustomUpdater] Cleaning up old file:', file);
            fs.unlinkSync(filePath);
            cleaned++;
          }
        } catch (err) {
          console.error('[CustomUpdater] Failed to clean file:', file, err);
        }
      }
    });
    
    if (cleaned > 0) {
      console.log(`[CustomUpdater] Cleaned ${cleaned} old update file(s)`);
    }
  } catch (error) {
    console.error('[CustomUpdater] Cleanup error:', error);
  }
}


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
let socket;
let isWindowReady = false;
let authToken = null;
let updateDownloadedInfo = null; // Store update info for late-joining listeners

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
// BACKEND REACHABILITY CHECK
// ============================================

function checkBackendReachability() {
  const backendHealthUrl = `${API_URL}/health`;
  console.log(`[BackendCheck] Checking backend reachability at: ${backendHealthUrl}`);

  const client = https;

  client.get(backendHealthUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`[BackendCheck] ✅ Backend is reachable. Status: ${res.statusCode}, Data: ${data}`);
      } else {
        console.error(`[BackendCheck] ❌ Backend returned non-200 status. Status: ${res.statusCode}, Data: ${data}`);
      }
    });
  }).on('error', (err) => {
    console.error(`[BackendCheck] ❌ Failed to reach backend: ${err.message}`);
  });
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

    // Only need the core plugin now
    const corePlugin = join(pluginSource, 'enigma_telemetry_core.dll');

    if (!fs.existsSync(corePlugin)) {
      console.error('[PluginInstall] Core plugin DLL not found!');
      return false;
    }

    console.log('[PluginInstall] Found core plugin');

    // Install ETS2
    if (ets2Path) {
      const ets2Plugins = join(ets2Path, 'bin', 'win_x64', 'plugins');

      // Ensure plugins directory exists
      if (!fs.existsSync(ets2Plugins)) {
        fs.mkdirSync(ets2Plugins, { recursive: true });
      }

      // Copy core plugin directly to plugins/ (no nested folder)
      fs.copyFileSync(corePlugin, join(ets2Plugins, 'enigma_telemetry_core.dll'));

      // Clean up old files if they exist
      const oldScsPlugin = join(ets2Plugins, 'scs-telemetry.dll');
      const oldEnigmaFolder = join(ets2Plugins, 'enigma');

      if (fs.existsSync(oldScsPlugin)) {
        fs.unlinkSync(oldScsPlugin);
        console.log('[PluginInstall] 🗑️ Removed old scs-telemetry.dll from ETS2');
      }

      if (fs.existsSync(oldEnigmaFolder)) {
        fs.rmSync(oldEnigmaFolder, { recursive: true, force: true });
        console.log('[PluginInstall] 🗑️ Removed old enigma/ folder from ETS2');
      }

      console.log('[PluginInstall] ✅ ETS2 plugin installed');
    }

    // Install ATS
    if (atsPath) {
      const atsPlugins = join(atsPath, 'bin', 'win_x64', 'plugins');

      // Ensure plugins directory exists
      if (!fs.existsSync(atsPlugins)) {
        fs.mkdirSync(atsPlugins, { recursive: true });
      }

      // Copy core plugin directly to plugins/ (no nested folder)
      fs.copyFileSync(corePlugin, join(atsPlugins, 'enigma_telemetry_core.dll'));

      // Clean up old files if they exist
      const oldScsPlugin = join(atsPlugins, 'scs-telemetry.dll');
      const oldEnigmaFolder = join(atsPlugins, 'enigma');

      if (fs.existsSync(oldScsPlugin)) {
        fs.unlinkSync(oldScsPlugin);
        console.log('[PluginInstall] 🗑️ Removed old scs-telemetry.dll from ATS');
      }

      if (fs.existsSync(oldEnigmaFolder)) {
        fs.rmSync(oldEnigmaFolder, { recursive: true, force: true });
        console.log('[PluginInstall] 🗑️ Removed old enigma/ folder from ATS');
      }

      console.log('[PluginInstall] ✅ ATS plugin installed');
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
// CUSTOM PORTABLE UPDATER HELPERS
// ============================================

function getCurrentVersion() {
  try {
    const projectRoot = join(__dirname, '../..');
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (err) {
    console.error('[CustomUpdater] Failed to read current version:', err);
    return '0.0.0';
  }
}

function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'enigma-hub-updater'
      }
    };

    https
      .get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function isNewerVersion(current, latest) {
  const c = current.split('.').map((n) => parseInt(n, 10));
  const l = latest.split('.').map((n) => parseInt(n, 10));

  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

async function checkForPortableUpdate() {
  try {
    const currentVersion = getCurrentVersion();
    console.log('[CustomUpdater] Current version:', currentVersion);

    const latest = await fetchLatestRelease();
    if (!latest || !latest.tag_name) {
      console.log('[CustomUpdater] No latest release info found');
      return;
    }

    const latestVersion = latest.tag_name.replace(/^v/, '');
    console.log('[CustomUpdater] Latest version on GitHub:', latestVersion);

    if (!isNewerVersion(currentVersion, latestVersion)) {
      console.log('[CustomUpdater] App is up to date');
      return;
    }

    const asset = (latest.assets || []).find((a) =>
      a.name.toLowerCase().endsWith('.exe')
    );

    if (!asset) {
      console.log('[CustomUpdater] No .exe asset found in latest release');
      return;
    }

    console.log(
      '[CustomUpdater] Update available:',
      latestVersion,
      asset.browser_download_url
    );

    if (mainWindow) {
      mainWindow.webContents.send('custom-update-available', {
        version: latestVersion,
        notes: latest.body || '',
        downloadUrl: asset.browser_download_url
      });
    }
  } catch (err) {
    console.error('[CustomUpdater] Error checking for updates:', err);
  }
}

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        const total = parseInt(response.headers['content-length'] || '0', 10);
        let downloaded = 0;

        response.on('data', (chunk) => {
          file.write(chunk);
          downloaded += chunk.length;
          if (total && onProgress) {
            onProgress(downloaded, total);
          }
        });

        response.on('end', () => {
          file.end();
          resolve();
        });

        response.on('error', (err) => {
          file.close();
          reject(err);
        });
      })
      .on('error', (err) => {
        file.close();
        reject(err);
      });
  });
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
    isWindowReady = true;
    console.log('[Window] ✅ Renderer ready for IPC');
    mainWindow.show();

    // Initialize Socket.IO client
    socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: false,
      auth: {
      token: authToken // Pass the JWT token here
    }
  });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection Error:', err.message, err.data);
      // Optionally, emit this error to the renderer process if needed
      // mainWindow.webContents.send('socket-connect-error', err.message);
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to API server');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('socket-connected');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected from API server:', reason);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('socket-disconnected', reason);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('socket-error', error.message);
      }
    });

    // IPC channel for job:deleted event
    socket.on('job:deleted', (data) => {
      console.log('[Socket.IO] Received job:deleted event:', data);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('job:deleted', data);
      }
    });

    // Connect the socket
    // socket.connect(); // Removed initial connect call
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Window] ❌ Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    console.log('[Window] Window closed');
    if (socket) {
      socket.disconnect();
      console.log('[Socket.IO] Disconnected socket due to window close');
    }
    // Removed stopTelemetryServer() from here
    mainWindow = null;
    if (logStream) {
      logStream.end();
      logStream = null;
    }
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

// ✅ Overlay toggle
ipcMain.handle('toggle-overlay', () => {
  toggleOverlay();
});

// ============================================
// IPC HANDLERS - AUTHENTICATION
// ============================================

ipcMain.handle('telemetry-user-login', (event, userData) => {
  console.log('[Telemetry] User logged in:', userData.username);
  console.time('setCurrentUser_from_main');
  setCurrentUser(userData);
  console.timeEnd('setCurrentUser_from_main');
  authToken = userData.token; // Set authToken from userData
  console.log('[Auth Debug] authToken after telemetry-user-login:', authToken);
  console.log('[Auth Debug] Socket state - initialized:', !!socket, 'connected:', socket?.connected);
  if (socket && !socket.connected) {
    socket.auth = { token: authToken };
    try {
      socket.connect();
      console.log('[Auth] Attempting to connect Socket.IO...');
    } catch (error) {
      console.error('[Auth] Error initiating Socket.IO connection:', error);
    }
  }
  return { success: true };
});

ipcMain.on('auth-token', (event, token) => {
  console.log('[Auth Debug] Received new auth-token from renderer.');
  authToken = token;
  if (socket) {
    socket.auth = { token: authToken };
    if (socket.connected) {
      console.log('[Auth] Socket already connected, re-authenticating with new token...');
      socket.disconnect().connect(); // Disconnect and reconnect to re-authenticate
    } else if (!socket.active) {
      console.log('[Auth] Socket not active, attempting to connect with new token...');
      socket.connect();
    }
  }
});

// ============================================
// IPC HANDLERS - CUSTOM UPDATER
// ============================================

ipcMain.handle('custom-download-update', async (event, { downloadUrl, version }) => {
  try {
    const appDataPath = app.getPath('userData');
    const updatesDir = join(appDataPath, 'updates');
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
    }

    const exePath = join(updatesDir, `EnigmaHub-${version}.exe`);
    console.log('[CustomUpdater] Downloading update to:', exePath);

    await downloadFile(downloadUrl, exePath, (downloaded, total) => {
      const percent = total ? Math.round((downloaded / total) * 100) : 0;
      if (mainWindow) {
        mainWindow.webContents.send('custom-download-progress', {
          downloaded,
          total,
          percent
        });
      }
    });

    console.log('[CustomUpdater] Download complete');

    if (mainWindow) {
      mainWindow.webContents.send('custom-update-downloaded', {
        version,
        exePath
      });
    }

    return { success: true, path: exePath };
  } catch (err) {
    console.error('[CustomUpdater] Download failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('custom-apply-update', async (event, { exePath }) => {
  try {
    console.log('[CustomUpdater] Applying update:', exePath);
    
    if (!fs.existsSync(exePath)) {
      console.error('[CustomUpdater] Update file not found:', exePath);
      return { success: false, error: 'Update file not found' };
    }
    
    // Get current .exe path
    const currentExePath = app.getPath('exe');
    console.log('[CustomUpdater] Current exe:', currentExePath);
    console.log('[CustomUpdater] New exe:', exePath);
    
    // Check if running from temp folder
    const isTempLocation = currentExePath.includes('\\Temp\\') || 
                          currentExePath.includes('\\AppData\\Local\\Temp') ||
                          currentExePath.includes('\\TEMP\\');
    
    if (isTempLocation) {
      console.warn('[CustomUpdater] Running from TEMP folder - cannot update in place');
      
      // Just launch the new exe and quit (user will manually replace)
      exec(`"${exePath}"`, (err) => {
        if (err) {
          console.error('[CustomUpdater] Failed to launch new exe:', err);
        }
      });
      
      setTimeout(() => {
        app.quit();
      }, 500);
      
      return { 
        success: false, 
        error: 'temp_location',
        message: 'Please move Enigma Hub.exe to a permanent location (like Desktop or Documents) before updating.'
      };
    }
    
    // If portable build, replace the .exe
    if (app.isPackaged) {
      // Create update batch script
      const updatesDir = join(app.getPath('userData'), 'updates');
      const batchPath = join(updatesDir, 'apply-update.bat');
      
      // Batch script to replace .exe after quit
      const batchScript = `@echo off
echo [Enigma Hub Updater]
echo Waiting for app to close...
timeout /t 2 /nobreak > nul

echo Replacing old version...
del /F /Q "${currentExePath}"
if errorlevel 1 (
  echo ERROR: Failed to delete old version
  pause
  exit /b 1
)

echo Installing new version...
move /Y "${exePath}" "${currentExePath}"
if errorlevel 1 (
  echo ERROR: Failed to move new version
  pause
  exit /b 1
)

echo Starting new version...
start "" "${currentExePath}"

echo Cleaning up...
timeout /t 2 /nobreak > nul
del "%~f0"
`;
      
      // Write batch script
      fs.writeFileSync(batchPath, batchScript);
      console.log('[CustomUpdater] Batch script created:', batchPath);
      
      // Launch batch script (hidden window)
      exec(`cmd /c "${batchPath}"`, {
        windowsHide: true,
        detached: true
      }, (err) => {
        if (err) {
          console.error('[CustomUpdater] Failed to launch updater:', err);
        }
      });
      
      // Quit app after short delay
      setTimeout(() => {
        console.log('[CustomUpdater] Quitting to apply update...');
        app.quit();
      }, 500);
      
      return { success: true };
    } else {
      // Dev mode - just launch new exe
      console.log('[CustomUpdater] Dev mode - launching new exe without replacement');
      exec(`"${exePath}"`, (err) => {
        if (err) {
          console.error('[CustomUpdater] Failed to launch new exe:', err);
        }
      });
      
      setTimeout(() => {
        app.quit();
      }, 1000);
      
      return { success: true };
    }
  } catch (err) {
    console.error('[CustomUpdater] Apply update failed:', err);
    return { success: false, error: err.message };
  }
});

// Manual check for updates (from Settings button) - ELECTRON-UPDATER
ipcMain.handle('check-for-updates', async () => {
  try {
    console.log('[AutoUpdater] Manual update check triggered');
    console.log('[AutoUpdater] Current version:', app.getVersion());
    console.log('[AutoUpdater] Feed URL:', autoUpdater.getFeedURL());

    if (!isDev) {
      const result = await autoUpdater.checkForUpdates();
      console.log('[AutoUpdater] Check result:', JSON.stringify(result, null, 2));

      if (result?.updateInfo) {
        console.log('[AutoUpdater] Latest version on GitHub:', result.updateInfo.version);
        console.log('[AutoUpdater] Current version:', result.currentVersion);
      }

      return { success: true, updateInfo: result?.updateInfo };
    }
    return { success: true, message: 'Dev mode - no updates' };
  } catch (error) {
    console.error('[AutoUpdater] Manual check error:', error);
    return { success: false, error: error.message };
  }
});

// Get current update status (for late-joining listeners)
ipcMain.handle('get-update-status', () => {
  console.log('[AutoUpdater] Renderer requested update status, stored info:', updateDownloadedInfo ? 'available' : 'none');
  return updateDownloadedInfo;
});

// Install update (quit and install)
ipcMain.on('install-update', () => {
  console.log('[AutoUpdater] Quit and install triggered');
  autoUpdater.quitAndInstall(false, true);
});

// CUSTOM UPDATER HANDLERS - DISABLED FOR NSIS
// Manual check for updates (from Settings button)
// ipcMain.handle('custom-check-for-updates', async () => {
//   try {
//     console.log('[CustomUpdater] Manual update check triggered');
//     await checkForPortableUpdate();
//     return { success: true };
//   } catch (error) {
//     console.error('[CustomUpdater] Manual check error:', error);
//     return { success: false, error: error.message };
//   }
// });

// ============================================
// IPC HANDLERS - TELEMETRY
// ============================================



ipcMain.handle('telemetry-user-logout', () => {
  console.log('[Telemetry] User logged out');
  setCurrentUser(null);
  return { success: true };
});

// ============================================
// IPC HANDLERS - MANUAL UPDATE MANAGER
// ============================================

ipcMain.handle('download-update', async (event, { downloadUrl, version }) => {
  try {
    const appDataPath = app.getPath('userData');
    const updatesDir = join(appDataPath, 'updates');
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
    }

    const exePath = join(updatesDir, `EnigmaHub-${version}.exe`);
    console.log('[ManualUpdate] Downloading to:', exePath);

    await downloadFile(downloadUrl, exePath, (downloaded, total) => {
      const percent = total ? Math.round((downloaded / total) * 100) : 0;
      if (mainWindow) {
        mainWindow.webContents.send('download-progress', {
          downloaded,
          total,
          percent
        });
      }
    });

    console.log('[ManualUpdate] Download complete');
    return { success: true, path: exePath };
  } catch (err) {
    console.error('[ManualUpdate] Download failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('apply-update', async (event, { exePath }) => {
  try {
    console.log('[ManualUpdate] Applying update:', exePath);
    
    if (!fs.existsSync(exePath)) {
      return { success: false, error: 'Update file not found' };
    }

    // For NSIS installer, just launch it
    exec(`"${exePath}"`, (err) => {
      if (err) {
        console.error('[ManualUpdate] Failed to launch installer:', err);
      }
    });

    // Quit after short delay
    setTimeout(() => {
      app.quit();
    }, 1000);

    return { success: true };
  } catch (err) {
    console.error('[ManualUpdate] Apply failed:', err);
    return { success: false, error: err.message };
  }
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

    // Telemetry server moved to VPS - no longer needed locally
    // The plugin now sends directly to the VPS API endpoint
    console.log('[SavePaths] ✅ Success! Plugin will send telemetry to VPS.');
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
// IPC HANDLERS - DEVPANEL & GIT FLOW
// ============================================

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

    // Get current branch name
    const { stdout: branchName } = await execAsync('git branch --show-current');
    const branch = branchName.trim();
    console.log('[PushRelease] Current branch:', branch);

    // Delete existing tag if it exists (local and remote)
    try {
      await execAsync(`git tag -d v${version}`);
      console.log('[PushRelease] Deleted existing local tag v' + version);
    } catch (err) {
      // Tag doesn't exist locally, that's fine
    }

    try {
      await execAsync(`git push origin :refs/tags/v${version}`);
      console.log('[PushRelease] Deleted existing remote tag v' + version);
    } catch (err) {
      // Tag doesn't exist on remote, that's fine
    }

    // Git commit + tag + push
    await execAsync('git add .');
    await execAsync(`git commit -m "Release v${version}"`);
    await execAsync(`git tag -a v${version} -m "${releaseNotes.replace(/"/g, '\\"')}"`);
    
    // Push with upstream setup (handles first push)
    try {
      await execAsync('git push');
    } catch (err) {
      // If push fails due to no upstream, set it up
      console.log('[PushRelease] Setting up upstream branch...');
      await execAsync(`git push --set-upstream origin ${branch}`);
    }
    
    await execAsync(`git push origin v${version}`);
    console.log('[PushRelease] Pushed tag v' + version);

    // Build and publish
    console.log('[PushRelease] Building and publishing to GitHub...');
    await execAsync('npm run publish');
    console.log('[PushRelease] ✅ Published to GitHub and marked as latest release');

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

        // Delete current DLL (enigma_telemetry_core.dll)
        const currentDll = join(pluginsDir, 'enigma_telemetry_core.dll');
        if (fs.existsSync(currentDll)) {
          fs.unlinkSync(currentDll);
          console.log('[Uninstall] Deleted:', currentDll);
        }

        // Delete legacy DLL (scs-telemetry.dll)
        const legacyDll = join(pluginsDir, 'scs-telemetry.dll');
        if (fs.existsSync(legacyDll)) {
          fs.unlinkSync(legacyDll);
          console.log('[Uninstall] Deleted legacy DLL:', legacyDll);
        }

        // Delete legacy folder
        const legacyFolder = join(pluginsDir, 'enigma');
        if (fs.existsSync(legacyFolder)) {
          fs.rmSync(legacyFolder, { recursive: true, force: true });
          console.log('[Uninstall] Deleted legacy folder:', legacyFolder);
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

app.whenReady().then(async () => {
  console.log('[App] App is ready');

  // Function to kill process on a given port
  const killProcessOnPort = async (port) => {
    console.log(`[Port Cleanup] Checking for processes on port ${port}...`);
    try {
      const { stdout: netstatOutput } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = netstatOutput.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          console.log(`[Port Cleanup] Found process with PID ${pid} on port ${port}. Attempting to terminate...`);
          try {
            await execAsync(`taskkill /F /PID ${pid}`);
            console.log(`[Port Cleanup] Successfully terminated process with PID ${pid}.`);
          } catch (taskkillError) {
            console.error(`[Port Cleanup] Failed to terminate process with PID ${pid}: ${taskkillError.message}`);
          }
        }
      }
    } catch (error) {
      if (error.message.includes('No rows were found') || error.message.includes('findstr')) {
        console.log(`[Port Cleanup] No process found on port ${port}.`);
      } else {
        console.error(`[Port Cleanup] Error checking port ${port}: ${error.message}`);
      }
    }
  };

  // Ensure port 25555 is free before starting telemetry server
  await killProcessOnPort(25555);

  // Cleanup old update files
  cleanupOldUpdates();

  // Check backend reachability
  checkBackendReachability();

  // Check and reinstall plugins if app version changed
  checkAndReinstallPlugins();

  // Telemetry server moved to VPS - plugin sends directly to API
  // No longer need to start local telemetry server
  console.log('[App] Telemetry handled by VPS at:', API_URL);

  createWindow();
  createOverlay();

  // Check for custom updates every 2 hours
  setInterval(checkForPortableUpdate, UPDATE_CHECK_INTERVAL);

  // Register global shortcut for overlay toggle
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    toggleOverlay();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on app quit
app.on('before-quit', () => {
  console.log('[App] Cleaning up before quit...');

  // Disconnect socket
  if (socket && socket.connected) {
    socket.disconnect();
  }

  // Close all windows properly
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    try {
      if (!window.isDestroyed()) {
        window.close();
      }
    } catch (err) {
      console.error('[Cleanup] Error closing window:', err);
    }
  });
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