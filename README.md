# ResiliWatch

A 2-service Node.js system for cyber-resilience monitoring and automated threat response.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            ResiliWatch                                   │
├─────────────────────────────────┬───────────────────────────────────────┤
│     Gateway Service (:3000)     │      Detector Service (:4000)         │
├─────────────────────────────────┼───────────────────────────────────────┤
│  • SaaS API Endpoints           │  • Telemetry Ingestion                │
│    - POST /auth/login           │  • Detection Engine                   │
│    - GET /data/item/:id         │    - Credential Stuffing              │
│    - GET /data/export           │    - Data Exfiltration                │
│    - POST /billing/pay          │  • Incident Management                │
│                                 │  • Enforcement Orchestration          │
│  • Enforcement Middleware       │  • Socket.IO Realtime                 │
│    - Blocked IPs (403)          │  • Simulation Endpoints               │
│    - Isolated Endpoints (423)   │                                       │
│    - Rate Limits (429)          │  Events:                              │
│                                 │    state_update, telemetry_event,     │
│  • Telemetry Emission           │    incident_update, metric_update     │
│    → POST to Detector           │                                       │
└─────────────────────────────────┴───────────────────────────────────────┘
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run both services
npm run dev
```

Or run services individually:

```bash
# Terminal 1 - Gateway
npm run gateway

# Terminal 2 - Detector
npm run detector
```

## API Reference

### Gateway Service (http://localhost:3000)

#### Authentication
```bash
# Login (password "pass123" always works)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","password":"pass123"}'

# Response: {"ok":true,"token":"tok_xxx"}
```

#### Data Access
```bash
# Get item (requires token)
curl http://localhost:3000/data/item/123 \
  -H "Authorization: Bearer <token>"

# Export data (large payload)
curl http://localhost:3000/data/export \
  -H "Authorization: Bearer <token>"
```

#### Billing
```bash
curl -X POST http://localhost:3000/billing/pay \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":99.99}'
```

#### Enforcement State
```bash
curl http://localhost:3000/enforcement/state
```

### Detector Service (http://localhost:4000)

#### State & Metrics
```bash
# Full state snapshot
curl http://localhost:4000/state

# Metrics only
curl http://localhost:4000/metrics.json

# Settings
curl http://localhost:4000/settings
curl -X POST http://localhost:4000/settings \
  -H "Content-Type: application/json" \
  -d '{"autoResponse":true}'
```

#### Simulations (Demo)
```bash
# Normal traffic (30 seconds)
curl -X POST http://localhost:4000/simulate/normal

# Credential stuffing attack
curl -X POST http://localhost:4000/simulate/credstuff

# Data exfiltration attack
curl -X POST http://localhost:4000/simulate/exfil

# Stop all simulations
curl -X POST http://localhost:4000/simulate/stop
```

#### Incident Management
```bash
# List incidents
curl http://localhost:4000/incidents

# Approve pending actions (when autoResponse=false)
curl -X POST http://localhost:4000/incidents/<id>/approve

# Reset everything
curl -X POST http://localhost:4000/admin/reset
```

### Socket.IO (ws://localhost:4000)

Connect and listen for realtime events:

```javascript
const socket = io('http://localhost:4000');

socket.on('state_update', (state) => console.log('State:', state));
socket.on('telemetry_event', (event) => console.log('Telemetry:', event));
socket.on('incident_update', (incident) => console.log('Incident:', incident));
socket.on('metric_update', (metrics) => console.log('Metrics:', metrics));
socket.on('mitigation_update', (mitigations) => console.log('Mitigations:', mitigations));
```

## Detection Rules

### 1. Credential Stuffing (SEV1)
- **Window**: 60 seconds per IP
- **Triggers when**:
  - Failed login count ≥ 12 AND
  - Distinct user IDs targeted ≥ 5
- **Containment**:
  - BLOCK_IP for 15 minutes
  - RATE_LIMIT /auth/login to 1 RPS

### 2. Data Exfiltration (SEV1)
- **Window**: 60 seconds per IP+userId
- **Triggers when**:
  - Export calls ≥ 30 OR
  - Bytes exported ≥ 20MB
- **Containment**:
  - ISOLATE_ENDPOINT /data/export (surgical - only for offending IP/user)

## Project Structure

```
/
├── package.json          # Root with concurrently scripts
├── README.md
├── gateway/
│   ├── package.json
│   └── src/
│       ├── index.js      # Express server, routes
│       ├── enforcement.js # Blocked IPs, isolation, rate limits
│       └── telemetry.js   # Token mapping, telemetry forwarding
└── detector/
    ├── package.json
    └── src/
        ├── index.js       # Express + Socket.IO server
        ├── store.js       # Centralized state management
        ├── enforcementPush.js # Push rules to Gateway
        ├── simulate.js    # Traffic generators
        └── detection/
            ├── credstuff.js # Credential stuffing detector
            └── exfil.js     # Data exfiltration detector
```

## Demo Flow

1. **Start services**: `npm run dev`
2. **Check state**: `curl http://localhost:4000/state`
3. **Normal traffic**: `curl -X POST http://localhost:4000/simulate/normal`
4. **Credential stuffing attack**: `curl -X POST http://localhost:4000/simulate/credstuff`
   - Watch incidents appear
   - IP gets blocked automatically (if autoResponse=true)
5. **Data exfiltration attack**: `curl -X POST http://localhost:4000/simulate/exfil`
   - Export endpoint gets isolated for attacker
6. **Reset**: `curl -X POST http://localhost:4000/admin/reset`