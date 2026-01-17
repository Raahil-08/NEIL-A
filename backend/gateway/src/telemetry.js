/**
 * Telemetry Module - Captures request metrics and forwards to Detector
 */

// In-memory token -> userId mapping
const tokenMap = new Map();

/**
 * Generate a token for a user
 */
function issueToken(userId) {
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    tokenMap.set(token, userId);
    return token;
}

/**
 * Resolve token to userId
 */
function resolveToken(token) {
    return tokenMap.get(token) || null;
}

/**
 * Send telemetry event to Detector (non-blocking)
 */
async function sendTelemetry(event) {
    try {
        const response = await fetch('http://localhost:4000/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            signal: AbortSignal.timeout(2000) // 2s timeout
        });
        if (!response.ok) {
            console.log(`[Telemetry] Detector responded ${response.status}`);
        }
    } catch (err) {
        // Fail silently - detector might be down
        console.log(`[Telemetry] Failed to send: ${err.message}`);
    }
}

/**
 * Determine service target from route
 */
function getServiceTarget(path) {
    if (path.startsWith('/auth')) return 'auth';
    if (path.startsWith('/data')) return 'data';
    if (path.startsWith('/billing')) return 'billing';
    return null;
}

/**
 * Telemetry middleware - captures all request metrics
 */
function telemetryMiddleware(req, res, next) {
    const startTime = Date.now();

    // Capture original methods to intercept response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let bytesOut = 0;
    let responseBody = null;

    res.json = function (body) {
        responseBody = body;
        bytesOut = JSON.stringify(body).length;
        return originalJson(body);
    };

    res.send = function (body) {
        if (typeof body === 'string') {
            bytesOut = body.length;
        } else if (Buffer.isBuffer(body)) {
            bytesOut = body.length;
        }
        return originalSend(body);
    };

    // On response finish, send telemetry
    res.on('finish', () => {
        const latencyMs = Date.now() - startTime;
        const ip = req.clientIp || req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
        const cleanIp = ip.split(',')[0].trim();

        // Extract userId from token or body
        let userId = req.resolvedUserId || null;
        if (!userId && req.body?.userId) {
            userId = req.body.userId;
        }

        // Determine auth result for login attempts
        let authResult = null;
        if (req.path === '/auth/login') {
            if (res.statusCode === 200 && responseBody?.ok) {
                authResult = 'success';
            } else if (res.statusCode === 401 || (responseBody && !responseBody.ok)) {
                authResult = 'fail';
            }
        }

        // Check if this is an export and capture bytesOut
        if (req.path === '/data/export' && responseBody?.sizeBytes) {
            bytesOut = responseBody.sizeBytes;
        }

        const event = {
            ts: Date.now(),
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode,
            latencyMs,
            ip: cleanIp,
            userId,
            tenantId: req.headers['x-tenant-id'] || null,
            bytesOut,
            authResult,
            serviceTarget: getServiceTarget(req.path)
        };

        // Don't block on telemetry - fire and forget
        sendTelemetry(event);
    });

    next();
}

module.exports = {
    issueToken,
    resolveToken,
    sendTelemetry,
    telemetryMiddleware,
    getServiceTarget
};
