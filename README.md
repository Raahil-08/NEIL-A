# Sentira  
Real-Time Cyber Resilience for SaaS Platforms

Sentira is a real-time cyber-resilience system designed for modern SaaS platforms.  
It detects abnormal but authorized behavior (such as credential stuffing and silent data exfiltration) and **surgically isolates only the affected component**, while keeping the rest of the platform fully operational.

The project demonstrates:
- Live attack detection
- Explainable anomaly analysis
- Targeted containment (zero downtime)
- Human-in-the-loop security control
- Real-time SOC-style visualization

---

## Problem Statement

Modern SaaS platforms rely on authentication, authorization, and perimeter security.  
However, attackers increasingly abuse **valid credentials, API tokens, and authorized access paths**, allowing them to operate silently without triggering traditional security tools.

Current systems verify:
- Who is accessing the system
- What permissions they have

They fail to evaluate:
- Whether the observed behavior makes sense in real time

Sentira addresses this gap by introducing **continuous behavioral monitoring and real-time containment**.

---

    ## System Architecture
    
    ┌────────────┐ Telemetry ┌─────────────┐
    │ Gateway │ ───────────▶ │   Detector  │
    │ (SaaS API) │           │   (Brain)   │    
    └────────────┘           └─────────────┘
    ▲ │
    │ │ Realtime state
    │ ▼
    ┌─────────────────┐
    │ Frontend UI     │
    │ (SOC Dashboard) │
    └─────────────────┘

### Gateway
- Simulates a SaaS platform (Auth, Data API, Billing)
- Generates telemetry for every request
- Enforces mitigation actions
- Represents the external attack surface

### Detector
- Collects telemetry from the gateway
- Performs rule-based + anomaly detection
- Creates explainable incidents
- Orchestrates surgical containment
- Streams live updates via Socket.IO

### Frontend
- SOC-style dashboard (designed in Figma AI)
- Live service health and metrics
- Incident investigation and timelines
- Manual approval for mitigations

---

## Simulated Attack Scenarios

### 1. Credential Stuffing
- Multiple failed login attempts from a single IP
- Targets multiple user accounts
- Detected via abnormal login patterns
- Mitigation: **Block attacker IP only**

### 2. Data Exfiltration (Authorized API Abuse)
- Valid user repeatedly calls `/data/export`
- High request frequency and data volume
- Detected via behavioral anomalies
- Mitigation: **Isolate export endpoint only**
- Billing and other services remain unaffected

---

    ## Project Structure
    
    Sentira/
    ├── frontend/ # UI (designed in Figma AI)
    │
    ├── gateway/ # SaaS Gateway Service
    │ └── src/
    │ ├── index.js
    │ ├── telemetry.js
    │ └── enforcement.js
    │
    ├── detector/ # Detection & Response Engine
    │ └── src/
    │ ├── index.js
    │ ├── store.js
    │ ├── simulate.js
    │ ├── enforcementPush.js
    │ └── detection/
    │ ├── credstuff.js
    │ └── exfil.js
    │
    ├── package.json
    └── README.md

---

## Installation

### Prerequisites
- Node.js v18 or later
- npm

### Install dependencies
```bash
npm install
```

###Running the System
  Start all services (Gateway + Detector)
```bash
npm run dev
```

