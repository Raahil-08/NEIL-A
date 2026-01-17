/**
 * ResiliWatch Gateway Service
 * - Simulates SaaS APIs (Auth, Data, Billing)
 * - Enforces containment rules from Detector
 * - Emits telemetry to Detector
 */

const express = require('express');
const cors = require('cors');
const { enforcementMiddleware, applyEnforcement, getEnforcementState, clearEnforcement } = require('./enforcement');
const { telemetryMiddleware, issueToken, resolveToken } = require('./telemetry');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Parse IP before enforcement
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '127.0.0.1';
    req.clientIp = ip.split(',')[0].trim();
    next();
});

// Enforcement middleware (must be before routes)
app.use(enforcementMiddleware);

// Telemetry middleware (captures all requests)
app.use(telemetryMiddleware);

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post('/auth/login', (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ ok: false, error: 'userId and password required' });
    }

    // Demo: password "pass123" is always correct
    if (password === 'pass123') {
        const token = issueToken(userId);
        console.log(`[Auth] Login success: ${userId} -> ${token}`);
        return res.json({ ok: true, token });
    }

    console.log(`[Auth] Login failed: ${userId}`);
    return res.status(401).json({ ok: false, error: 'invalid credentials' });
});

// ============================================================================
// DATA ROUTES
// ============================================================================

// Auth check middleware for data/billing routes
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const apiKey = req.headers['x-api-key'];
    const token = authHeader.replace('Bearer ', '');

    if (token && resolveToken(token)) {
        req.resolvedUserId = resolveToken(token);
        return next();
    }

    if (apiKey) {
        // Demo: accept any API key
        req.resolvedUserId = `apikey_${apiKey.substring(0, 8)}`;
        return next();
    }

    return res.status(401).json({ ok: false, error: 'authentication required' });
}

app.get('/data/item/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    // Return a small JSON item
    res.json({
        ok: true,
        item: {
            id,
            name: `Item ${id}`,
            description: `This is data item ${id}`,
            createdAt: new Date().toISOString(),
            metadata: { version: 1, category: 'general' }
        }
    });
});

app.get('/data/export', requireAuth, (req, res) => {
    // Simulate large export - generate rows and large bytesOut
    const exportId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const numRows = 1000;

    const rows = [];
    for (let i = 0; i < numRows; i++) {
        rows.push({
            id: i + 1,
            email: `user${i + 1}@example.com`,
            name: `User ${i + 1}`,
            ssn: `XXX-XX-${String(i).padStart(4, '0')}`,
            balance: Math.floor(Math.random() * 100000) / 100
        });
    }

    // Calculate size - simulate 500KB-1MB per export
    const sizeBytes = 500000 + Math.floor(Math.random() * 500000);

    console.log(`[Data] Export ${exportId}: ${numRows} rows, ${sizeBytes} bytes`);

    res.json({
        ok: true,
        exportId,
        rows,
        sizeBytes
    });
});

// ============================================================================
// BILLING ROUTES
// ============================================================================

app.post('/billing/pay', requireAuth, (req, res) => {
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const { amount = 99.99, currency = 'USD' } = req.body;

    console.log(`[Billing] Payment processed: ${receiptId} - ${amount} ${currency}`);

    res.json({
        ok: true,
        receiptId,
        amount,
        currency,
        processedAt: new Date().toISOString()
    });
});

// ============================================================================
// ENFORCEMENT CONTROL API
// ============================================================================

app.post('/enforcement/apply', (req, res) => {
    const { blockedIPs, isolatedEndpoints, rateLimits } = req.body;

    applyEnforcement({
        blockedIPs: blockedIPs || [],
        isolatedEndpoints: isolatedEndpoints || [],
        rateLimits: rateLimits || []
    });

    res.json({ ok: true, applied: true, state: getEnforcementState() });
});

app.get('/enforcement/state', (req, res) => {
    res.json(getEnforcementState());
});

app.post('/enforcement/clear', (req, res) => {
    clearEnforcement();
    res.json({ ok: true, cleared: true });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'gateway', uptime: process.uptime() });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║         ResiliWatch Gateway Service                            ║
║         Running on http://localhost:${PORT}                        ║
╠════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                    ║
║    POST /auth/login           - User authentication            ║
║    GET  /data/item/:id        - Get data item                  ║
║    GET  /data/export          - Export data (large payload)    ║
║    POST /billing/pay          - Process payment                ║
║    POST /enforcement/apply    - Apply enforcement rules        ║
║    GET  /enforcement/state    - Get enforcement state          ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
