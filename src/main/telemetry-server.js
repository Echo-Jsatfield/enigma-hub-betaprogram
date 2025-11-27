// src/main/telemetry-server.js
// ✅ COMPLETE WORKING VERSION - Normalizes data and forwards to production API
import net from 'net';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { sendToOverlay } from './overlay-manager.js'; // ✅ Import overlay sender

const CONFIG = {
    TCP_PORT: 25555,
    TCP_HOST: '127.0.0.1',
    API_URL: 'https://enigmalogistics.org/api',
    OFFLINE_BUFFER_PATH: path.join(app.getPath('userData'), 'telemetry-buffer.json')
};

let currentUser = null;
let serverStopped = false;
let offlineBuffer = [];
let apiClient = null;

// ============================================================================
// API CLIENT WITH AUTH
// ============================================================================

function initAPIClient() {
    const token = currentUser?.token || null;
    
    apiClient = axios.create({
        baseURL: CONFIG.API_URL,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    });

    apiClient.interceptors.response.use(
        response => response,
        async error => {
            if (error.response?.status === 401) {
                console.error('[Telemetry] Authentication failed - user needs to re-login');
                currentUser = null;
            }
            return Promise.reject(error);
        }
    );

    console.log('[Telemetry] API client initialized, token present?:', !!token);
    if (token) {
        console.log('[Telemetry] token (first 16 chars):', token.substring(0, 16) + '...');
    }
}

export function setCurrentUser(userData) {
    currentUser = userData;
    if (userData) {
        console.log('[Telemetry] User logged in:', userData.username);
        initAPIClient();
    }
}

export function getCurrentUser() {
    return currentUser;
}

// ============================================================================
// OFFLINE BUFFERING
// ============================================================================

function loadOfflineBuffer() {
    try {
        if (fs.existsSync(CONFIG.OFFLINE_BUFFER_PATH)) {
            const data = fs.readFileSync(CONFIG.OFFLINE_BUFFER_PATH, 'utf8');
            offlineBuffer = JSON.parse(data);
            console.log(`[Telemetry] Loaded ${offlineBuffer.length} buffered events`);
        }
    } catch (error) {
        console.error('[Telemetry] Failed to load offline buffer:', error.message);
        offlineBuffer = [];
    }
}

function saveOfflineBuffer() {
    try {
        fs.writeFileSync(CONFIG.OFFLINE_BUFFER_PATH, JSON.stringify(offlineBuffer, null, 2));
    } catch (error) {
        console.error('[Telemetry] Failed to save offline buffer:', error.message);
    }
}

function addToBuffer(event) {
    offlineBuffer.push({
        ...event,
        bufferedAt: Date.now()
    });
    
    if (offlineBuffer.length > 100) {
        offlineBuffer = offlineBuffer.slice(-100);
    }
    
    saveOfflineBuffer();
    console.log(`[Telemetry] Event buffered (total: ${offlineBuffer.length})`);
}

async function flushOfflineBuffer() {
    if (offlineBuffer.length === 0) return;
    
    console.log(`[Telemetry] Flushing ${offlineBuffer.length} buffered events...`);
    
    const events = [...offlineBuffer];
    offlineBuffer = [];
    saveOfflineBuffer();
    
    for (const event of events) {
        try {
            await forwardToAPI(event.endpoint, event.data);
        } catch (error) {
            console.error('[Telemetry] Failed to flush event:', error.message);
            addToBuffer(event);
        }
    }
}

// ============================================================================
// API FORWARDING
// ============================================================================

async function forwardToAPI(endpoint, data) {
    if (!apiClient || !currentUser) {
        console.warn('[Telemetry] No user logged in, buffering event');
        addToBuffer({ endpoint, data });
        return null;
    }

    try {
        const response = await apiClient.post(endpoint, data);
        console.log(`[Telemetry] Forwarded to ${endpoint}:`, response.status);
        
        if (offlineBuffer.length > 0) {
            setTimeout(() => flushOfflineBuffer(), 1000);
        }
        
        return response.data;
    } catch (error) {
        console.error(`[Telemetry] API error (${endpoint}):`, error.response?.status || error.message);
        
        if (!error.response || error.response.status >= 500) {
            addToBuffer({ endpoint, data });
        }
        
        return null;
    }
}

// ============================================================================
// DATA NORMALIZATION UTILITIES
// ============================================================================

function normalizeCargo(rawCargoName) {
    if (!rawCargoName) return 'Unknown Cargo';

    let normalized = rawCargoName
        .toLowerCase()
        .replace(/^promods_/gi, '')
        .replace(/^tmp_/gi, '')
        .replace(/^wot_/gi, '')
        .replace(/^rusmap_/gi, '')
        .replace(/multiplayer_/gi, '')
        .replace(/_v\d+$/gi, '')
        .replace(/_/g, ' ');

    return normalized
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function normalizeCity(rawCityName) {
    if (!rawCityName) return 'Unknown';

    let normalized = rawCityName
        .toLowerCase()
        .replace(/^promods_city_/gi, '')
        .replace(/^rusmap_/gi, '')
        .replace(/_/g, ' ');

    return normalized
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function detectModSource(jobData) {
    const cargo = (jobData.cargo || '').toLowerCase();
    const pickup = (jobData.pickup_city || '').toLowerCase();
    const delivery = (jobData.delivery_city || '').toLowerCase();

    if (cargo.includes('promods') || pickup.includes('promods') || delivery.includes('promods')) {
        return 'ProMods';
    }
    if (cargo.includes('tmp') || cargo.includes('multiplayer')) {
        return 'TruckersMP';
    }
    if (cargo.includes('wot') || cargo.includes('event')) {
        return 'World of Trucks';
    }
    if (/[А-Яа-яЁё]/.test(pickup) || /[А-Яа-яЁё]/.test(delivery)) {
        return 'RusMap';
    }

    return null;
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

async function handleInitRequest(socket, message) {
    console.log('[Telemetry] ===== HANDLING INIT REQUEST =====');
    console.log('[Telemetry] currentUser:', currentUser ? {id: currentUser.id, username: currentUser.username} : 'NULL');
    
    if (!currentUser) {
        const errorResponse = JSON.stringify({
            type: 'init_response',
            verified: false,
            error: 'Not logged in'
        }) + '\n';
        console.log('[Telemetry] Sending ERROR response:', errorResponse);
        socket.write(errorResponse);
        return;
    }

    console.log('[DEBUG] Sending steam_id:', currentUser.steam_id);
    const successResponse = JSON.stringify({
        type: 'init_response',
        verified: true,
        steam_id: currentUser.steam_id || "",  // ✅ Use real steam_id or empty
        username: currentUser.username,
        user_id: currentUser.id,
        discord_id: currentUser.discord_id || "",
        electron_version: '1.0.0'
    }) + '\n';
    
    console.log('[Telemetry] Sending SUCCESS response:', successResponse);
    socket.write(successResponse);
    
    // ✅ Tell overlay plugin connected
    console.log('[Telemetry] 🎯 SENDING TO OVERLAY NOW...');
    sendToOverlay('telemetry:update', {
        speed: 0,
        gear: 0,
        rpm: 0,
        fuel: 0,
        fuelCapacity: 100,
        damage: 0,
        gameTime: '00:00',
        connected: true
    });
    console.log('[Telemetry] ✅ Sent connected status to overlay');
    
    console.log('[Telemetry] ===================================');
}

// UPDATED telemetry-server.js with debug logging
// This replaces the handleJobStarted function (lines 265-328)

async function handleJobStarted(socket, message) {
    if (!currentUser) {
        console.warn('[Telemetry] Job started but no user logged in');
        return;
    }

    console.log('[Telemetry] Raw job data received:', JSON.stringify(message, null, 2));

    // ✅ NORMALIZE DATA BEFORE SENDING TO API
    const cargoDisplay = normalizeCargo(message.cargo);
    const pickupCityDisplay = normalizeCity(message.pickup_city);
    const deliveryCityDisplay = normalizeCity(message.delivery_city);
    const modSource = detectModSource(message);

    // ✅ BUILD COMPLETE JOB DATA OBJECT (NO job_id - API generates it)
    const jobData = {
        // NO job_id here - API generates it server-side
        user_id: currentUser.id,
        game: message.game || 'Unknown',
        cargo: message.cargo || 'unknown',
        cargo_display: cargoDisplay,
        pickup_city: message.pickup_city || 'unknown',
        pickup_city_display: pickupCityDisplay,
        delivery_city: message.delivery_city || 'unknown',
        delivery_city_display: deliveryCityDisplay,
        source_company: message.source_company || '',
        destination_company: message.destination_company || '',
        cargo_mass: Number(message.cargo_mass) || 0,
        planned_distance: Number(message.planned_distance) || 0,
        mod_source: modSource,
        is_quick_job: !!message.is_quick_job
    };

    console.log('[Telemetry] Normalized job data:', JSON.stringify(jobData, null, 2));

    const result = await forwardToAPI('/telemetry/start', jobData);
    
    console.log('[Telemetry] 🔍 API Response received:', JSON.stringify(result, null, 2));

    // ✅ Forward to overlay
    sendToOverlay('job:update', {
        active: true,
        cargo: cargoDisplay,
        pickup: pickupCityDisplay,
        delivery: deliveryCityDisplay,
        distance: jobData.planned_distance,
        remainingDistance: jobData.planned_distance,
        income: 0
    });

    // ✅ Send back the real job_id from API to C++ plugin
    if (result && result.job_id) {
       const responseToPlugin = {
         success: true,
         job_id: result?.job_id || "FALLBACK-" + Date.now(),
         resumed: result?.resumed || false,
       };
        console.log('[Telemetry] 📤 Sending to C++ plugin:', JSON.stringify(responseToPlugin));
        socket.write(JSON.stringify(responseToPlugin) + '\n');
        console.log('[Telemetry] ✅ Response sent! Job started:', result.job_id, result.resumed ? '(resumed)' : '(new)');
    } else {
        console.log('[Telemetry] ❌ API did not return job_id! Result was:', JSON.stringify(result));
        socket.write(JSON.stringify({
            success: false,
            error: 'Failed to get job_id from API'
        }) + '\n');
        console.log('[Telemetry] Job start failed - no job_id from API');
    }
}

async function handleJobDelivered(socket, message) {
    if (!currentUser) {
        console.warn('[Telemetry] Job delivered but no user logged in');
        return;
    }

    console.log('[Telemetry] Job delivered data received:', JSON.stringify(message, null, 2));

    const jobData = {
        job_id: message.job_id,
        actual_distance: Number(message.actual_distance) || 0,
        normal_miles: Number(message.normal_miles) || 0,
        race_miles: Number(message.race_miles) || 0,
        race_percentage: Number(message.race_percentage) || 0,
        delivery_time_seconds: Number(message.delivery_time_seconds) || 0,
        income: Number(message.income) || 0,
        damage_percent: Number(message.damage_percent) || 0,
        flagged: !!message.flagged,
        flag_reasons: Array.isArray(message.flag_reasons) ? message.flag_reasons : []
    };

    const result = await forwardToAPI('/telemetry/deliver', jobData);

    // ✅ Clear job from overlay
    sendToOverlay('job:update', {
        active: false,
        cargo: null,
        pickup: null,
        delivery: null,
        distance: 0,
        remainingDistance: 0,
        income: 0
    });

    socket.write(JSON.stringify({
        type: 'job_saved',
        job_id: message.job_id,
        status: result ? 'ok' : 'buffered'
    }) + '\n');

    console.log('[Telemetry] Job delivered:', message.job_id);
}

async function handleJobCancelled(socket, message) {
    if (!currentUser) {
        console.warn('[Telemetry] Job cancelled but no user logged in');
        return;
    }

    console.log('[Telemetry] Job cancelled data received:', JSON.stringify(message, null, 2));

    const jobData = {
        job_id: message.job_id,
        reason: message.reason || 'Cancelled by driver'
    };

    const result = await forwardToAPI('/telemetry/cancel', jobData);

    // ✅ Clear job from overlay
    sendToOverlay('job:update', {
        active: false,
        cargo: null,
        pickup: null,
        delivery: null,
        distance: 0,
        remainingDistance: 0,
        income: 0
    });

    socket.write(JSON.stringify({
        type: 'job_saved',
        job_id: message.job_id,
        status: result ? 'ok' : 'buffered'
    }) + '\n');

    console.log('[Telemetry] Job cancelled:', message.job_id);
}

async function handleHeartbeat(socket) {
    socket.write(JSON.stringify({
        type: 'heartbeat_ack',
        timestamp: Date.now(),
        online: !!currentUser,
        buffered: offlineBuffer.length
    }) + '\n');
}

async function handleShutdown(socket) {
    console.log('[Telemetry] Plugin shutdown');
}

// ✅ Handle continuous telemetry updates
function handleTelemetryUpdate(socket, message) {
    // Forward to overlay
    sendToOverlay('telemetry:update', {
        speed: message.speed || 0,
        gear: message.gear || 0,
        rpm: message.rpm || 0,
        fuel: message.fuel || 0,
        fuelCapacity: message.fuel_capacity || 100,
        damage: message.damage || 0,
        gameTime: message.game_time || '00:00',
        connected: true
    });
}

function handleIncomingMessage(socket, rawMessage) {
    let message;
    try {
        message = JSON.parse(rawMessage);
    } catch (error) {
        console.error('[Telemetry] Invalid JSON:', rawMessage);
        return;
    }

    if (!message.type) {
        console.log('[Telemetry] No message type!');
        return;
    }

    // Only log important events (NOT telemetry_update)
    if (message.type !== 'telemetry_update') {
        console.log('[Telemetry] ===== MESSAGE RECEIVED =====');
        console.log('[Telemetry] Type:', message.type);
        console.log('[Telemetry] Data:', JSON.stringify(message, null, 2));
    }

    switch (message.type) {
        case 'init_request':
            handleInitRequest(socket, message);
            break;
        case 'job_started':
            handleJobStarted(socket, message);
            break;
        case 'job_delivered':
            handleJobDelivered(socket, message);
            break;
        case 'job_cancelled':
            handleJobCancelled(socket, message);
            break;
        case 'heartbeat':
            handleHeartbeat(socket);
            break;
        case 'shutdown':
            handleShutdown(socket);
            break;
        case 'telemetry_update':
            handleTelemetryUpdate(socket, message);
            break;
        default:
            console.log('[Telemetry] Unknown event:', message.type);
    }
    
    // Only log footer for important events
    if (message.type !== 'telemetry_update') {
        console.log('[Telemetry] ============================');
    }
}

// ============================================================================
// TCP SERVER
// ============================================================================

export function startTelemetryServer() {
    if (serverStopped) {
        console.log('[Telemetry] Server was stopped, not restarting');
        return;
    }

    initAPIClient();
    loadOfflineBuffer();

    const server = net.createServer((socket) => {
        console.log('[Telemetry] Plugin connected');

        let buffer = '';

        socket.on('data', (data) => {
            buffer += data.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.trim()) {
                    handleIncomingMessage(socket, line.trim());
                }
            }
        });

        socket.on('end', () => {
            console.log('[Telemetry] Plugin disconnected');
        });

        socket.on('error', (err) => {
            console.error('[Telemetry] Socket error:', err.message);
        });
    });

    server.listen(CONFIG.TCP_PORT, CONFIG.TCP_HOST, () => {
        console.log(`[Telemetry] Server listening on ${CONFIG.TCP_HOST}:${CONFIG.TCP_PORT}`);
    });

    server.on('error', (err) => {
        console.error('[Telemetry] Server error:', err.message);
    });
}

export function stopTelemetryServer() {
    serverStopped = true;
    saveOfflineBuffer();
    console.log('[Telemetry] Server stopped');
}