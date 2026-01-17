# SENTIRA

A 2-service Node.js system for cyber-resilience monitoring and automated threat response.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Sentira                                      │
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

## Running the Project

### Prerequisites
- Node.js v18 or later
- npm

### Install Dependencies
```bash
  npm install #both folders
```
```bash
npm run dev
```
# Services:
Gateway: http://localhost:3000
Detector: http://localhost:4000
Frontend: as configured in the frontend folder

# Demo Controls
The frontend provides safe, controlled demo actions:
Start normal traffic
Simulate credential stuffing
Simulate data exfiltration
Reset demo state
All simulations generate real HTTP traffic through the gateway to ensure realism.

# Human-in-the-Loop Security
When auto-response is disabled:
Threats are detected
Actions are queued
A human must approve containment from the Incidents page
This reflects real-world security practices in critical systems.

# Metrics Tracked
Telemetry ingest rate
Requests per second
Average latency
Error rate
Detection latency
Response latency
Anomaly score

# Design Philosophy
ResiliWatch prioritizes:
Resilience over shutdown
Precision over blanket blocking
Explainability over black-box decisions
Continuity over disruption
