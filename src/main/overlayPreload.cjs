// src/main/overlayPreload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronOverlay', {
    onTelemetryUpdate: (callback) => {
        ipcRenderer.on('telemetry:update', (_event, data) => callback(data));
    },
    
    onJobUpdate: (callback) => {
        ipcRenderer.on('job:update', (_event, data) => callback(data));
    },

    toggle: () => ipcRenderer.invoke('overlay:toggle'),
    
    getVisible: () => ipcRenderer.invoke('overlay:get-visible')
});
