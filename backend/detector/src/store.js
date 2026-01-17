/**
 * Store Module - Centralized in-memory state management
 */

// Central state
const state = {
    services: {
        auth: { status: 'green', message: 'Operational' },
        data: { status: 'green', message: 'Operational' },
        billing: { status: 'green', message: 'Operational' }
    },
    incidents: [],
    mitigations: {
        blockedIPs: [],
        isolatedEndpoints: [],
        rateLimits: [],
        degradedMode: false
    },
    telemetry: {
        recent: []
    },
    metrics: {
        ingestEps: 0,
        rps: 0,
        errorRate: 0,
        avgLatencyMs: 0,
        anomalyScore: 0,
        detectionLatencyMs: 0,
        responseLatencyMs: 0
    },
    settings: {
        autoResponse: true
    }
};

// Telemetry window for metrics calculation
const telemetryWindow = [];
const WINDOW_SIZE_MS = 60000; // 60 seconds

// Socket.IO instance (set by index.js)
let io = null;

function setIO(socketIO) {
    io = socketIO;
}

function emit(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

/**
 * Add telemetry event
 */
function addTelemetryEvent(event) {
    // Add to recent (keep last 100)
    state.telemetry.recent.push(event);
    if (state.telemetry.recent.length > 100) {
        state.telemetry.recent.shift();
    }

    // Add to window for metrics
    telemetryWindow.push(event);

    // Clean old events from window
    const cutoff = Date.now() - WINDOW_SIZE_MS;
    while (telemetryWindow.length > 0 && telemetryWindow[0].ts < cutoff) {
        telemetryWindow.shift();
    }

    emit('telemetry_event', event);
}

/**
 * Get telemetry window for detection
 */
function getTelemetryWindow() {
    return [...telemetryWindow];
}

/**
 * Update metrics based on telemetry window
 */
function updateMetrics() {
    const now = Date.now();
    const cutoff = now - WINDOW_SIZE_MS;

    // Clean old events
    while (telemetryWindow.length > 0 && telemetryWindow[0].ts < cutoff) {
        telemetryWindow.shift();
    }

    const windowEvents = telemetryWindow;
    const windowDurationSec = WINDOW_SIZE_MS / 1000;

    if (windowEvents.length === 0) {
        state.metrics = {
            ...state.metrics,
            ingestEps: 0,
            rps: 0,
            errorRate: 0,
            avgLatencyMs: 0
        };
    } else {
        const errorCount = windowEvents.filter(e => e.status >= 400).length;
        const totalLatency = windowEvents.reduce((sum, e) => sum + (e.latencyMs || 0), 0);

        state.metrics.ingestEps = Math.round(windowEvents.length / windowDurationSec * 100) / 100;
        state.metrics.rps = Math.round(windowEvents.length / windowDurationSec * 100) / 100;
        state.metrics.errorRate = Math.round((errorCount / windowEvents.length) * 100 * 100) / 100;
        state.metrics.avgLatencyMs = Math.round(totalLatency / windowEvents.length);
    }

    // Calculate anomaly score based on patterns
    calculateAnomalyScore();

    emit('metric_update', state.metrics);
}

/**
 * Calculate anomaly score based on heuristics
 */
function calculateAnomalyScore() {
    let score = 0;

    // Factor 1: High error rate
    if (state.metrics.errorRate > 50) {
        score += 40;
    } else if (state.metrics.errorRate > 20) {
        score += 20;
    }

    // Factor 2: Active severe incidents
    const activeIncidents = state.incidents.filter(i => i.status === 'active' || i.status === 'contained');
    if (activeIncidents.some(i => i.severity === 'SEV1')) {
        score += 40;
    } else if (activeIncidents.length > 0) {
        score += 20;
    }

    // Factor 3: Mitigations active
    if (state.mitigations.blockedIPs.length > 0 || state.mitigations.isolatedEndpoints.length > 0) {
        score += 20;
    }

    state.metrics.anomalyScore = Math.min(100, score);
}

/**
 * Create or update incident
 */
function createIncident(incident) {
    const existing = state.incidents.find(i => i.id === incident.id);
    if (existing) {
        Object.assign(existing, incident);
        emit('incident_update', existing);
    } else {
        state.incidents.push(incident);
        emit('incident_update', incident);
    }

    // Update service status based on incidents
    updateServiceStatus();
    emitStateUpdate();
}

/**
 * Get incident by ID
 */
function getIncident(id) {
    return state.incidents.find(i => i.id === id);
}

/**
 * Update incident
 */
function updateIncident(id, updates) {
    const incident = state.incidents.find(i => i.id === id);
    if (incident) {
        Object.assign(incident, updates);
        emit('incident_update', incident);
        updateServiceStatus();
        emitStateUpdate();
    }
    return incident;
}

/**
 * Update service status based on active incidents and mitigations
 */
function updateServiceStatus() {
    // Reset to green
    state.services.auth = { status: 'green', message: 'Operational' };
    state.services.data = { status: 'green', message: 'Operational' };
    state.services.billing = { status: 'green', message: 'Operational' };

    // Check for credential stuffing affecting auth
    const credStuffIncident = state.incidents.find(i =>
        i.type === 'Credential Stuffing' && (i.status === 'active' || i.status === 'contained')
    );
    if (credStuffIncident) {
        state.services.auth = {
            status: credStuffIncident.status === 'contained' ? 'yellow' : 'red',
            message: credStuffIncident.status === 'contained' ? 'Attack Contained' : 'Under Attack'
        };
    }

    // Check for data exfil affecting data
    const exfilIncident = state.incidents.find(i =>
        i.type === 'Data Exfiltration' && (i.status === 'active' || i.status === 'contained')
    );
    if (exfilIncident) {
        state.services.data = {
            status: exfilIncident.status === 'contained' ? 'yellow' : 'red',
            message: exfilIncident.status === 'contained' ? 'Export Isolated' : 'Exfiltration Detected'
        };
    }

    // Check if /data/export is isolated
    if (state.mitigations.isolatedEndpoints.some(e => e.route === '/data/export')) {
        state.services.data = { status: 'yellow', message: 'Export Endpoint Isolated' };
    }

    // Billing always green in demo
}

/**
 * Update mitigations
 */
function updateMitigations(mitigations) {
    Object.assign(state.mitigations, mitigations);
    emit('mitigation_update', state.mitigations);
    updateServiceStatus();
    emitStateUpdate();
}

/**
 * Get full state snapshot
 */
function getFullState() {
    return JSON.parse(JSON.stringify(state));
}

/**
 * Emit full state update
 */
function emitStateUpdate() {
    emit('state_update', getFullState());
}

/**
 * Reset all state
 */
function reset() {
    state.services = {
        auth: { status: 'green', message: 'Operational' },
        data: { status: 'green', message: 'Operational' },
        billing: { status: 'green', message: 'Operational' }
    };
    state.incidents = [];
    state.mitigations = {
        blockedIPs: [],
        isolatedEndpoints: [],
        rateLimits: [],
        degradedMode: false
    };
    state.telemetry.recent = [];
    state.metrics = {
        ingestEps: 0,
        rps: 0,
        errorRate: 0,
        avgLatencyMs: 0,
        anomalyScore: 0,
        detectionLatencyMs: 0,
        responseLatencyMs: 0
    };

    // Clear telemetry window
    telemetryWindow.length = 0;

    emitStateUpdate();
}

/**
 * Get/set settings
 */
function getSettings() {
    return { ...state.settings };
}

function setSettings(settings) {
    Object.assign(state.settings, settings);
    emitStateUpdate();
}

module.exports = {
    setIO,
    emit,
    addTelemetryEvent,
    getTelemetryWindow,
    updateMetrics,
    createIncident,
    getIncident,
    updateIncident,
    updateMitigations,
    getFullState,
    emitStateUpdate,
    reset,
    getSettings,
    setSettings,
    state
};
