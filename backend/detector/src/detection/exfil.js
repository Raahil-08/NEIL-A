/**
 * Data Exfiltration Detection Module
 * 
 * Detection criteria (60s window per IP + userId):
 * - exportCalls >= 30 OR bytesOut >= 20MB
 */

const store = require('../store');
const { pushEnforcement } = require('../enforcementPush');

// Track export calls per IP+userId
const exportsByKey = new Map();
const WINDOW_SIZE_MS = 60000; // 60 seconds
const EXPORT_CALL_THRESHOLD = 30;
const BYTES_OUT_THRESHOLD = 20 * 1024 * 1024; // 20MB

// Track processed incidents to avoid duplicates
const processedIncidents = new Set();

/**
 * Analyze telemetry event for data exfiltration
 */
function analyze(event) {
    // Only process data/export events
    if (event.route !== '/data/export' || event.method !== 'GET') {
        return null;
    }

    // Skip failed requests
    if (event.status !== 200) {
        return null;
    }

    const ip = event.ip;
    const userId = event.userId || 'unknown';
    const key = `${ip}:${userId}`;
    const now = event.ts;

    // Initialize tracking for this key
    if (!exportsByKey.has(key)) {
        exportsByKey.set(key, []);
    }

    const exports = exportsByKey.get(key);

    // Add this export
    exports.push({
        ts: now,
        bytesOut: event.bytesOut || 0
    });

    // Clean old exports outside window
    const cutoff = now - WINDOW_SIZE_MS;
    while (exports.length > 0 && exports[0].ts < cutoff) {
        exports.shift();
    }

    // Calculate metrics
    const exportCount = exports.length;
    const totalBytes = exports.reduce((sum, e) => sum + e.bytesOut, 0);

    // Check thresholds
    const exceededCalls = exportCount >= EXPORT_CALL_THRESHOLD;
    const exceededBytes = totalBytes >= BYTES_OUT_THRESHOLD;

    if (exceededCalls || exceededBytes) {
        // Generate unique incident ID for this attack
        const incidentId = `exfil_${key.replace(':', '_')}_${Math.floor(now / WINDOW_SIZE_MS)}`;

        // Check if we already processed this incident
        if (processedIncidents.has(incidentId)) {
            // Update existing incident
            const existing = store.getIncident(incidentId);
            if (existing) {
                existing.lastSeenAt = now;
                store.updateIncident(incidentId, { lastSeenAt: now });
            }
            return null;
        }

        processedIncidents.add(incidentId);

        // Calculate detection latency from first malicious event
        const firstExportTs = exports[0].ts;
        const detectionLatencyMs = now - firstExportTs;

        // Build reasons
        const reasons = [];
        if (exceededCalls) {
            reasons.push({
                rule: 'export_call_threshold',
                explanation: `${exportCount} export calls from ${key} in 60s window`,
                observed: exportCount,
                threshold: EXPORT_CALL_THRESHOLD,
                windowSec: 60,
                deltaPct: Math.round((exportCount / EXPORT_CALL_THRESHOLD - 1) * 100)
            });
        }
        if (exceededBytes) {
            const mbOut = Math.round(totalBytes / 1024 / 1024 * 100) / 100;
            reasons.push({
                rule: 'bytes_out_threshold',
                explanation: `${mbOut} MB exported by ${key} in 60s window`,
                observed: totalBytes,
                threshold: BYTES_OUT_THRESHOLD,
                windowSec: 60,
                deltaPct: Math.round((totalBytes / BYTES_OUT_THRESHOLD - 1) * 100)
            });
        }

        // Create incident
        const incident = {
            id: incidentId,
            type: 'Data Exfiltration',
            severity: 'SEV1',
            status: 'active',
            ip,
            userId,
            tenantId: event.tenantId,
            route: '/data/export',
            startedAt: firstExportTs,
            lastSeenAt: now,
            phases: [
                { phase: 'normal', at: firstExportTs - 5000 },
                { phase: 'suspicious', at: firstExportTs },
                { phase: 'confirmed', at: now }
            ],
            reasons,
            actions: [],
            pendingActions: false
        };

        // Define containment action - isolate endpoint for this ip/user
        const isolateAction = {
            action: 'ISOLATE_ENDPOINT',
            target: { route: '/data/export', ip, userId },
            at: null,
            result: 'pending',
            mode: store.getSettings().autoResponse ? 'auto' : 'manual'
        };

        if (store.getSettings().autoResponse) {
            // Auto-apply containment
            incident.actions.push(isolateAction);
            incident.pendingActions = false;

            // Apply immediately
            applyContainment(incident, detectionLatencyMs);
        } else {
            // Queue for manual approval
            incident.actions.push({ ...isolateAction, result: 'pending' });
            incident.pendingActions = true;
        }

        // Update detection latency metric
        store.state.metrics.detectionLatencyMs = detectionLatencyMs;

        store.createIncident(incident);

        const mbOut = Math.round(totalBytes / 1024 / 1024 * 100) / 100;
        console.log(`[Detection] Data Exfiltration detected from ${key}: ${exportCount} calls, ${mbOut} MB`);

        return incident;
    }

    return null;
}

/**
 * Apply containment actions
 */
async function applyContainment(incident, detectionLatencyMs) {
    const startTime = Date.now();

    // Get current mitigations
    const state = store.getFullState();
    const mitigations = { ...state.mitigations };

    // Add isolated endpoint (surgical - only for offending ip/user)
    mitigations.isolatedEndpoints.push({
        route: '/data/export',
        ip: incident.ip,
        userId: incident.userId
    });

    // Push to gateway
    const success = await pushEnforcement(mitigations);

    const responseLatencyMs = Date.now() - startTime;

    // Update incident with action results
    incident.actions.forEach(action => {
        action.at = Date.now();
        action.result = success ? 'success' : 'fail';
    });

    // Update incident status
    incident.status = 'contained';
    incident.phases.push({ phase: 'isolated', at: Date.now() });

    // Update metrics
    store.state.metrics.responseLatencyMs = responseLatencyMs;

    // Update store
    store.updateMitigations(mitigations);
    store.updateIncident(incident.id, incident);

    console.log(`[Containment] Data Exfiltration contained in ${responseLatencyMs}ms`);
}

/**
 * Manually approve and apply pending actions for an incident
 */
async function approveIncident(incidentId) {
    const incident = store.getIncident(incidentId);
    if (!incident || !incident.pendingActions) {
        return false;
    }

    const detectionLatencyMs = incident.lastSeenAt - incident.startedAt;
    await applyContainment(incident, detectionLatencyMs);
    incident.pendingActions = false;
    store.updateIncident(incidentId, incident);

    return true;
}

/**
 * Reset detection state
 */
function reset() {
    exportsByKey.clear();
    processedIncidents.clear();
}

module.exports = {
    analyze,
    approveIncident,
    reset
};
