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
## Demo Workflow: Executing and Containing an Attack

This project includes a built-in **safe attack simulation mode** for demonstration purposes.
All attacks are simulated and do not affect real systems.

---

### Step 1: Start in Normal State

1. Open the dashboard.
2. Verify the following indicators:
   - System Health: 100%
   - Attack Lifecycle: **Normal**
   - Network Topology: All nodes GREEN
   - Recent Threats: None detected
3. Ensure **Backend Connected** status is visible.
4. Confirm the system status shows **READY FOR DEMO**.

This represents normal SaaS platform behavior.

---

### Step 2: Choose Attack Simulation Mode

On the left panel under **Demo Mode**, select one of the following simulated attacks:

- **API Abuse**  
  Simulates high-frequency API calls using valid credentials.

- **Token Misuse**  
  Simulates abnormal reuse of a stolen API token.

- **Session Anomaly**  
  Simulates unusual session behavior from a valid user.

- **Data Exfiltration**  
  Simulates large-volume authorized data exports.

Click **one** attack type only.

---

### Step 3: Observe Live Detection

Immediately after triggering the attack:

1. Traffic Volume begins to spike.
2. Anomaly Score increases in real time.
3. Attack Lifecycle progresses through:
   - Normal → Suspicious → Detected
4. The affected service node changes color in the Network Topology view.
5. A new entry appears in **Recent Threats**.

No manual input is required during detection.

---

### Step 4: Response Execution

#### Auto-Response Enabled (Default)
- The system automatically applies containment actions.
- Attack Lifecycle advances to **Isolated**.
- Only the affected service is isolated.
- All other services remain operational.

#### Auto-Response Disabled (Manual Mode)
1. Toggle **Auto-approve** OFF before triggering the attack.
2. The system detects the threat but pauses response.
3. A pending action is displayed in the threat details.
4. Click **Approve Action** to execute containment.

This demonstrates human-in-the-loop security control.

---

### Step 5: Verify Zero Downtime

After containment:

1. Attack Lifecycle reaches **Stabilized**.
2. Isolated service remains contained.
3. Other services remain GREEN and operational.
4. System Health returns to normal values.
5. No platform-wide outage occurs.

This demonstrates surgical containment with zero downtime.

---

### Step 6: Reset the Demo

1. Click **Reset Demo** in the Demo Mode panel.
2. All metrics return to baseline.
3. Network topology returns to normal state.
4. System status returns to **READY FOR DEMO**.

The system is now ready for the next demonstration.

---

## Important Notes

- All attacks are simulated for defensive security demonstration only.
- No real data is accessed or modified.
- The system does not perform offensive actions.
- The demo can be repeated safely multiple times.

---

## Demo Objective

The goal of this workflow is to demonstrate that the system:
- Detects abnormal but authorized behavior
- Explains why the behavior is risky
- Contains the threat in real time
- Maintains service availability

