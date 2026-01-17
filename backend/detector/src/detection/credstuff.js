/**
 * Credential Stuffing Detection Module
 * 
 * Detection criteria (60s window per IP):
 * - failedLoginCount >= 12 AND distinctUserIdsTargeted >= 5
 */

const store = require('../store');
const { pushEnforcement } = require('../enforcementPush');

// Track login attempts per IP
const loginAttemptsByIP = new Map();
const WINDOW_SIZE_MS = 60000; // 60 seconds
const FAILED_LOGIN_THRESHOLD = 12;
const DISTINCT_USER_THRESHOLD = 5;

// Track processed incidents to avoid duplicates
const processedIncidents = new Set();

/**
 * Analyze telemetry event for credential stuffing
 */
function analyze(event) {
    // Only process auth/login events
    if (event.route !== '/auth/login' || event.method !== 'POST') {
        return null;
    }

    const ip = event.ip;
    const now = event.ts;

    // Initialize tracking for this IP
    if (!loginAttemptsByIP.has(ip)) {
        loginAttemptsByIP.set(ip, []);
    }

    const attempts = loginAttemptsByIP.get(ip);

    // Add this attempt
    attempts.push({
        ts: now,
        userId: event.userId,
        authResult: event.authResult
    });

    // Clean old attempts outside window
    const cutoff = now - WINDOW_SIZE_MS;
    while (attempts.length > 0 && attempts[0].ts < cutoff) {
        attempts.shift();
    }

    // Count failed logins and distinct users
    const failedLogins = attempts.filter(a => a.authResult === 'fail');
    const distinctUsers = new Set(failedLogins.map(a => a.userId).filter(Boolean));

    const failedCount = failedLogins.length;
    const distinctUserCount = distinctUsers.size;

    // Check thresholds
    if (failedCount >= FAILED_LOGIN_THRESHOLD && distinctUserCount >= DISTINCT_USER_THRESHOLD) {
        // Generate unique incident ID for this attack
        const incidentId = `cred_${ip}_${Math.floor(now / WINDOW_SIZE_MS)}`;

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
        const firstMaliciousTs = failedLogins[0].ts;
        const detectionLatencyMs = now - firstMaliciousTs;

        // Create incident
        const incident = {
            id: incidentId,
            type: 'Credential Stuffing',
            severity: 'SEV1',
            status: 'active',
            ip,
            userId: null,
            tenantId: event.tenantId,
            route: '/auth/login',
            startedAt: firstMaliciousTs,
            lastSeenAt: now,
            phases: [
                { phase: 'normal', at: firstMaliciousTs - 5000 },
                { phase: 'suspicious', at: firstMaliciousTs },
                { phase: 'confirmed', at: now }
            ],
            reasons: [
                {
                    rule: 'failed_login_threshold',
                    explanation: `${failedCount} failed login attempts from IP ${ip} in 60s window`,
                    observed: failedCount,
                    threshold: FAILED_LOGIN_THRESHOLD,
                    windowSec: 60,
                    deltaPct: Math.round((failedCount / FAILED_LOGIN_THRESHOLD - 1) * 100)
                },
                {
                    rule: 'distinct_user_threshold',
                    explanation: `${distinctUserCount} distinct user IDs targeted`,
                    observed: distinctUserCount,
                    threshold: DISTINCT_USER_THRESHOLD,
                    windowSec: 60,
                    deltaPct: Math.round((distinctUserCount / DISTINCT_USER_THRESHOLD - 1) * 100)
                }
            ],
            actions: [],
            pendingActions: false
        };

        // Define containment actions
        const blockAction = {
            action: 'BLOCK_IP',
            target: ip,
            duration: 15 * 60 * 1000, // 15 minutes
            at: null,
            result: 'pending',
            mode: store.getSettings().autoResponse ? 'auto' : 'manual'
        };

        const rateLimitAction = {
            action: 'RATE_LIMIT',
            target: { ip, route: '/auth/login', limitRps: 1 },
            at: null,
            result: 'pending',
            mode: store.getSettings().autoResponse ? 'auto' : 'manual'
        };

        if (store.getSettings().autoResponse) {
            // Auto-apply containment
            incident.actions.push(blockAction, rateLimitAction);
            incident.pendingActions = false;

            // Apply immediately
            applyContainment(incident, detectionLatencyMs);
        } else {
            // Queue for manual approval
            incident.actions.push({ ...blockAction, result: 'pending' }, { ...rateLimitAction, result: 'pending' });
            incident.pendingActions = true;
        }

        // Update detection latency metric
        store.state.metrics.detectionLatencyMs = detectionLatencyMs;

        store.createIncident(incident);

        console.log(`[Detection] Credential Stuffing detected from IP ${ip}: ${failedCount} failures, ${distinctUserCount} users`);

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

    // Add blocked IP
    if (!mitigations.blockedIPs.includes(incident.ip)) {
        mitigations.blockedIPs.push(incident.ip);
    }

    // Add rate limit
    const rateLimitKey = `${incident.ip}:/auth/login`;
    if (!mitigations.rateLimits.some(rl => rl.key === rateLimitKey)) {
        mitigations.rateLimits.push({
            key: rateLimitKey,
            ip: incident.ip,
            route: '/auth/login',
            limitRps: 1
        });
    }

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

    console.log(`[Containment] Credential Stuffing contained in ${responseLatencyMs}ms`);
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
    loginAttemptsByIP.clear();
    processedIncidents.clear();
}

module.exports = {
    analyze,
    approveIncident,
    reset
};
