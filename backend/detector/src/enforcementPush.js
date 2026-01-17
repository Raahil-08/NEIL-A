/**
 * Enforcement Push Module - Updates Gateway enforcement rules
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

/**
 * Push enforcement rules to Gateway
 */
async function pushEnforcement(mitigations) {
    try {
        const response = await fetch(`${GATEWAY_URL}/enforcement/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blockedIPs: mitigations.blockedIPs || [],
                isolatedEndpoints: mitigations.isolatedEndpoints || [],
                rateLimits: mitigations.rateLimits || []
            }),
            signal: AbortSignal.timeout(5000) // 5s timeout
        });

        if (!response.ok) {
            console.log(`[EnforcementPush] Gateway responded ${response.status}`);
            return false;
        }

        const result = await response.json();
        console.log('[EnforcementPush] Gateway enforcement updated:', result.applied);
        return true;
    } catch (err) {
        console.log(`[EnforcementPush] Failed: ${err.message}`);
        return false;
    }
}

/**
 * Clear Gateway enforcement
 */
async function clearEnforcement() {
    try {
        const response = await fetch(`${GATEWAY_URL}/enforcement/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blockedIPs: [],
                isolatedEndpoints: [],
                rateLimits: []
            }),
            signal: AbortSignal.timeout(5000)
        });

        return response.ok;
    } catch (err) {
        console.log(`[EnforcementPush] Clear failed: ${err.message}`);
        return false;
    }
}

module.exports = {
    pushEnforcement,
    clearEnforcement
};
