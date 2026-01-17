/**
 * Simulation Module - Generates realistic traffic for demo
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

// Track active simulations
const activeSimulations = new Map();

/**
 * Helper to make gateway requests
 */
async function gatewayRequest(method, path, body = null, headers = {}) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            signal: AbortSignal.timeout(5000)
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${GATEWAY_URL}${path}`, options);
        return { status: response.status, data: await response.json().catch(() => ({})) };
    } catch (err) {
        console.log(`[Simulate] Request failed: ${err.message}`);
        return { status: 0, error: err.message };
    }
}

/**
 * Simulate normal traffic
 * - Mixed GET /data/item, POST /billing/pay, occasional login
 */
async function simulateNormal(durationMs = 30000) {
    const simId = 'normal_' + Date.now();
    activeSimulations.set(simId, { running: true });

    console.log('[Simulate] Starting normal traffic simulation');

    const startTime = Date.now();
    const normalIp = '192.168.1.100';
    let token = null;

    // Login first
    const loginResult = await gatewayRequest('POST', '/auth/login',
        { userId: 'normal_user', password: 'pass123' },
        { 'x-forwarded-for': normalIp }
    );

    if (loginResult.data?.token) {
        token = loginResult.data.token;
    }

    // Generate mixed traffic
    while (Date.now() - startTime < durationMs && activeSimulations.get(simId)?.running) {
        const rand = Math.random();

        if (rand < 0.5) {
            // GET /data/item/:id
            const itemId = Math.floor(Math.random() * 100) + 1;
            await gatewayRequest('GET', `/data/item/${itemId}`, null, {
                'Authorization': token ? `Bearer ${token}` : '',
                'x-forwarded-for': normalIp
            });
        } else if (rand < 0.8) {
            // POST /billing/pay
            await gatewayRequest('POST', '/billing/pay',
                { amount: Math.floor(Math.random() * 100) + 10 },
                {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-forwarded-for': normalIp
                }
            );
        } else {
            // Occasional login (success)
            await gatewayRequest('POST', '/auth/login',
                { userId: `user_${Math.floor(Math.random() * 10)}`, password: 'pass123' },
                { 'x-forwarded-for': normalIp }
            );
        }

        // Wait 200-500ms between requests
        await sleep(200 + Math.random() * 300);
    }

    activeSimulations.delete(simId);
    console.log('[Simulate] Normal traffic simulation complete');
    return { simId, completed: true };
}

/**
 * Simulate credential stuffing attack
 * - Repeated failed logins from attacker IP targeting multiple users
 */
async function simulateCredStuff(attackerIp = '203.0.113.10') {
    const simId = 'credstuff_' + Date.now();
    activeSimulations.set(simId, { running: true });

    console.log(`[Simulate] Starting credential stuffing from ${attackerIp}`);

    const userIds = [
        'admin', 'root', 'user', 'test', 'demo',
        'john', 'jane', 'mike', 'sarah', 'david',
        'customer1', 'customer2', 'support', 'billing', 'sales'
    ];

    const wrongPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein'];

    let attemptCount = 0;
    const maxAttempts = 20;

    // Send failed login attempts
    for (let i = 0; i < maxAttempts && activeSimulations.get(simId)?.running; i++) {
        const userId = userIds[i % userIds.length];
        const password = wrongPasswords[Math.floor(Math.random() * wrongPasswords.length)];

        await gatewayRequest('POST', '/auth/login',
            { userId, password },
            { 'x-forwarded-for': attackerIp }
        );

        attemptCount++;

        // Rapid fire - 50-100ms between attempts
        await sleep(50 + Math.random() * 50);
    }

    // Optionally try one success (simulating found credentials)
    if (activeSimulations.get(simId)?.running) {
        await gatewayRequest('POST', '/auth/login',
            { userId: 'compromised_user', password: 'pass123' },
            { 'x-forwarded-for': attackerIp }
        );
    }

    activeSimulations.delete(simId);
    console.log(`[Simulate] Credential stuffing complete: ${attemptCount} attempts`);
    return { simId, attempts: attemptCount, completed: true };
}

/**
 * Simulate data exfiltration attack
 * - Login as legitimate user, then spam exports
 */
async function simulateExfil(attackerIp = '203.0.113.20') {
    const simId = 'exfil_' + Date.now();
    activeSimulations.set(simId, { running: true });

    console.log(`[Simulate] Starting data exfiltration from ${attackerIp}`);

    const userId = 'customer_admin_1';

    // Login first
    const loginResult = await gatewayRequest('POST', '/auth/login',
        { userId, password: 'pass123' },
        { 'x-forwarded-for': attackerIp }
    );

    if (!loginResult.data?.token) {
        console.log('[Simulate] Exfil login failed');
        activeSimulations.delete(simId);
        return { simId, error: 'login failed', completed: false };
    }

    const token = loginResult.data.token;
    let exportCount = 0;
    const maxExports = 40;

    // Spam exports
    for (let i = 0; i < maxExports && activeSimulations.get(simId)?.running; i++) {
        const result = await gatewayRequest('GET', '/data/export', null, {
            'Authorization': `Bearer ${token}`,
            'x-forwarded-for': attackerIp
        });

        if (result.status === 423 || result.status === 403) {
            console.log(`[Simulate] Export blocked: ${result.status}`);
            break;
        }

        exportCount++;

        // Rapid exports - 30-80ms between
        await sleep(30 + Math.random() * 50);
    }

    activeSimulations.delete(simId);
    console.log(`[Simulate] Data exfiltration complete: ${exportCount} exports`);
    return { simId, exports: exportCount, completed: true };
}

/**
 * Stop all simulations
 */
function stopAllSimulations() {
    for (const [id, sim] of activeSimulations.entries()) {
        sim.running = false;
    }
    activeSimulations.clear();
    console.log('[Simulate] All simulations stopped');
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    simulateNormal,
    simulateCredStuff,
    simulateExfil,
    stopAllSimulations
};
