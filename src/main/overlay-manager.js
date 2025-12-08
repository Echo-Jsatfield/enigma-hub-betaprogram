// src/main/overlay-manager.js
import { BrowserWindow, screen, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let overlayWindow = null;
let overlayVisible = false;

// ✅ Store latest telemetry data
let lastTelemetryData = {
    speed: 0,
    gear: 0,
    rpm: 0,
    fuel: 0,
    fuelCapacity: 100,
    damage: 0,
    gameTime: '00:00',
    connected: false
};


let lastAchievementToast = null;

const CONFIG_PATH = path.join(app.getPath('userData'), 'overlay-config.json');

function loadOverlayConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        }
    } catch (error) {
        console.error('[Overlay] Failed to load config:', error);
    }
    return { x: 100, y: 100, width: 400, height: 600, visible: false };
}

function saveOverlayConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('[Overlay] Failed to save config:', error);
    }
}

export function createOverlay() {
    console.log('[Overlay] createOverlay() called');
    
    if (overlayWindow) {
        console.log('[Overlay] Window already exists');
        return;
    }

    try {
        const config = loadOverlayConfig();
        console.log('[Overlay] Config loaded:', config);
        
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        console.log('[Overlay] Screen size:', screenWidth, 'x', screenHeight);

        const preloadPath = join(__dirname, 'overlayPreload.cjs');
        console.log('[Overlay] Preload path:', preloadPath);
        console.log('[Overlay] Preload exists:', fs.existsSync(preloadPath));

        overlayWindow = new BrowserWindow({
            x: config.x,
            y: config.y,
            width: config.width,
            height: config.height,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: true,
            minimizable: false,
            maximizable: false,
            webPreferences: {
                preload: preloadPath,
                nodeIntegration: false,
                contextIsolation: true,
                devTools: true
            },
            show: false
        });

        console.log('[Overlay] BrowserWindow created');

        const isDev = process.env.NODE_ENV === 'development';
        console.log('[Overlay] isDev:', isDev);
        console.log('[Overlay] VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);
        
        if (isDev && process.env.VITE_DEV_SERVER_URL) {
            const url = `${process.env.VITE_DEV_SERVER_URL}/overlay.html`;
            console.log('[Overlay] Loading DEV URL:', url);
            overlayWindow.loadURL(url);
            overlayWindow.webContents.openDevTools({ mode: 'detach' });
        } else {
            const htmlPath = join(__dirname, '../../dist/overlay.html');
            console.log('[Overlay] Loading PROD file:', htmlPath);
            console.log('[Overlay] File exists:', fs.existsSync(htmlPath));
            overlayWindow.loadFile(htmlPath);
        }

        overlayWindow.setIgnoreMouseEvents(false);
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');

        overlayWindow.webContents.on('did-finish-load', () => {
            console.log('[Overlay] ✅ Content loaded successfully');
        });

        overlayWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('[Overlay] ❌ Failed to load:', errorCode, errorDescription);
        });

        overlayWindow.on('closed', () => {
            console.log('[Overlay] Window closed');
            overlayWindow = null;
            overlayVisible = false;
        });

        overlayWindow.on('move', () => {
            if (overlayWindow) {
                const [x, y] = overlayWindow.getPosition();
                const [width, height] = overlayWindow.getSize();
                saveOverlayConfig({ x, y, width, height, visible: overlayVisible });
            }
        });

        overlayWindow.on('resize', () => {
            if (overlayWindow) {
                const [x, y] = overlayWindow.getPosition();
                const [width, height] = overlayWindow.getSize();
                saveOverlayConfig({ x, y, width, height, visible: overlayVisible });
            }
        });

        if (config.visible) {
            overlayWindow.show();
            overlayVisible = true;
            console.log('[Overlay] Window shown (from saved config)');
        }

        console.log('[Overlay] ✅ Window created successfully');
    } catch (error) {
        console.error('[Overlay] ❌ Error creating overlay:', error);
    }
}

export function toggleOverlay() {
    console.log('[Overlay] toggleOverlay() called');
    console.log('[Overlay] overlayWindow exists:', !!overlayWindow);
    console.log('[Overlay] overlayVisible:', overlayVisible);
    
    if (!overlayWindow) {
        console.log('[Overlay] Creating overlay window...');
        createOverlay();
        setTimeout(() => {
            if (overlayWindow) {
                overlayWindow.show();
                overlayVisible = true;
                console.log('[Overlay] Sending stored telemetry data to new window');
                overlayWindow.webContents.send('telemetry:update', lastTelemetryData);
                overlayWindow.webContents.send('job:update', lastJobData);
                if (lastAchievementToast) {
                    overlayWindow.webContents.send('achievement:unlock', lastAchievementToast);
                }
                console.log('[Overlay] Overlay shown');
            }
        }, 500);
        return;
    }

    if (overlayVisible) {
        console.log('[Overlay] Hiding overlay...');
        overlayWindow.hide();
        overlayVisible = false;
    } else {
        console.log('[Overlay] Showing overlay...');
        overlayWindow.show();
        overlayVisible = true;
        console.log('[Overlay] Sending stored telemetry data');
        overlayWindow.webContents.send('telemetry:update', lastTelemetryData);
        overlayWindow.webContents.send('job:update', lastJobData);
        if (lastAchievementToast) {
            overlayWindow.webContents.send('achievement:unlock', lastAchievementToast);
        }
    }

    const [x, y] = overlayWindow.getPosition();
    const [width, height] = overlayWindow.getSize();
    saveOverlayConfig({ x, y, width, height, visible: overlayVisible });

    console.log('[Overlay] Toggled to:', overlayVisible ? 'visible' : 'hidden');
}
export function sendToOverlay(channel, data) {
    // Store latest data
    if (channel === 'telemetry:update') {
        lastTelemetryData = { ...lastTelemetryData, ...data };
    } else if (channel === 'job:update') {
        lastJobData = { ...lastJobData, ...data };
    } else if (channel === 'achievement:unlock') {
        lastAchievementToast = data;
    }
    
    if (overlayWindow) {
        if (channel !== 'telemetry:update') {
            console.log('[Overlay] Sending to overlay:', channel);
        }
        overlayWindow.webContents.send(channel, data);
    } else {
        if (channel !== 'telemetry:update') {
            console.log('[Overlay] Cannot send - overlay window not created');
        }
    }
}
export function isOverlayVisible() {
    return overlayVisible;
}

ipcMain.handle('overlay:toggle', () => {
    toggleOverlay();
    return overlayVisible;
});

ipcMain.handle('overlay:get-visible', () => {
    return overlayVisible;
});








