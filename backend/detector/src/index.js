/**
 * ResiliWatch Detector Service
 * - Receives telemetry from Gateway
 * - Detects attacks (Credential Stuffing, Data Exfiltration)
 * - Manages incidents and containment
 * - Provides realtime Socket.IO events
 * - Provides REST API for frontend
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const store = require('./store');
const credstuffDetector = require('./detection/credstuff');
const exfilDetector = require('./detection/exfil');
const { clearEnforcement } = require('./enforcementPush');
const { simulateNormal, simulateCredStuff, simulateExfil, stopAllSimulations } = require('./simulate');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 4000;

// Set Socket.IO instance in store
store.setIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// TELEMETRY INGESTION
// ============================================================================

app.post('/telemetry', (req, res) => {
    const event = req.body;

    if (!event || !event.ts) {
        return res.status(400).json({ ok: false, error: 'Invalid telemetry event' });
    }

    // Add to store
    store.addTelemetryEvent(event);

    // Run detection
    credstuffDetector.analyze(event);
    exfilDetector.analyze(event);

    res.json({ ok: true, received: true });
});

// ============================================================================
// FRONTEND API
// ============================================================================

// GET /state - Full state snapshot
app.get('/state', (req, res) => {
    res.json(store.getFullState());
});

// GET /metrics.json - Metrics only
app.get('/metrics.json', (req, res) => {
    res.json(store.getFullState().metrics);
});

// GET /settings - Get settings
app.get('/settings', (req, res) => {
    res.json(store.getSettings());
});

// POST /settings - Update settings
app.post('/settings', (req, res) => {
    const { autoResponse } = req.body;

    if (typeof autoResponse === 'boolean') {
        store.setSettings({ autoResponse });
    }

    res.json({ ok: true, settings: store.getSettings() });
});

// POST /incidents/:id/approve - Approve pending incident actions
app.post('/incidents/:id/approve', async (req, res) => {
    const { id } = req.params;

    const incident = store.getIncident(id);
    if (!incident) {
        return res.status(404).json({ ok: false, error: 'Incident not found' });
    }

    if (!incident.pendingActions) {
        return res.status(400).json({ ok: false, error: 'No pending actions' });
    }

    // Determine which detector to use based on incident type
    let approved = false;
    if (incident.type === 'Credential Stuffing') {
        approved = await credstuffDetector.approveIncident(id);
    } else if (incident.type === 'Data Exfiltration') {
        approved = await exfilDetector.approveIncident(id);
    }

    if (approved) {
        res.json({ ok: true, approved: true, incident: store.getIncident(id) });
    } else {
        res.status(500).json({ ok: false, error: 'Approval failed' });
    }
});

// POST /admin/reset - Reset all state
app.post('/admin/reset', async (req, res) => {
    console.log('[Admin] Resetting detector state');

    // Stop any running simulations
    stopAllSimulations();

    // Reset detection state
    credstuffDetector.reset();
    exfilDetector.reset();

    // Reset store
    store.reset();

    // Clear gateway enforcement
    await clearEnforcement();

    res.json({ ok: true, reset: true });
});

// ============================================================================
// SIMULATION ENDPOINTS
// ============================================================================

app.post('/simulate/normal', async (req, res) => {
    const { duration = 30000 } = req.body;

    // Run simulation in background
    simulateNormal(duration).catch(err => {
        console.log('[Simulate] Normal error:', err.message);
    });

    res.json({ ok: true, simulation: 'normal', started: true });
});

app.post('/simulate/credstuff', async (req, res) => {
    const { attackerIp = '203.0.113.10' } = req.body;

    // Run simulation in background
    simulateCredStuff(attackerIp).catch(err => {
        console.log('[Simulate] Credstuff error:', err.message);
    });

    res.json({ ok: true, simulation: 'credstuff', started: true, attackerIp });
});

app.post('/simulate/exfil', async (req, res) => {
    const { attackerIp = '203.0.113.20' } = req.body;

    // Run simulation in background
    simulateExfil(attackerIp).catch(err => {
        console.log('[Simulate] Exfil error:', err.message);
    });

    res.json({ ok: true, simulation: 'exfil', started: true, attackerIp });
});

app.post('/simulate/stop', (req, res) => {
    stopAllSimulations();
    res.json({ ok: true, stopped: true });
});

// ============================================================================
// INCIDENTS API
// ============================================================================

app.get('/incidents', (req, res) => {
    res.json({ incidents: store.getFullState().incidents });
});

app.get('/incidents/:id', (req, res) => {
    const incident = store.getIncident(req.params.id);
    if (!incident) {
        return res.status(404).json({ ok: false, error: 'Not found' });
    }
    res.json(incident);
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'detector', uptime: process.uptime() });
});

// ============================================================================
// SOCKET.IO CONNECTION
// ============================================================================

io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Send current state on connect
    socket.emit('state_update', store.getFullState());

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});

// ============================================================================
// METRICS UPDATE INTERVAL
// ============================================================================

setInterval(() => {
    store.updateMetrics();
}, 1000);

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║         ResiliWatch Detector Service                           ║
║         Running on http://localhost:${PORT}                        ║
║         Socket.IO on ws://localhost:${PORT}                        ║
╠════════════════════════════════════════════════════════════════╣
║  API Endpoints:                                                ║
║    POST /telemetry            - Receive telemetry from Gateway ║
║    GET  /state                - Full state snapshot            ║
║    GET  /metrics.json         - Metrics only                   ║
║    GET  /settings             - Get settings                   ║
║    POST /settings             - Update settings                ║
║    POST /incidents/:id/approve - Approve pending actions       ║
║    POST /admin/reset          - Reset all state                ║
║                                                                ║
║  Simulation Endpoints:                                         ║
║    POST /simulate/normal      - Normal traffic simulation      ║
║    POST /simulate/credstuff   - Credential stuffing attack     ║
║    POST /simulate/exfil       - Data exfiltration attack       ║
║    POST /simulate/stop        - Stop all simulations           ║
║                                                                ║
║  Socket.IO Events:                                             ║
║    state_update, telemetry_event, incident_update,             ║
║    mitigation_update, metric_update                            ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
