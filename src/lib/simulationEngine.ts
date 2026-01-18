import { ThreatEvent, TrafficMetric, SystemNode, ThreatLevel } from '@/types/security';
import { BASELINE } from './anomalyDetection';

// Generate normal traffic patterns
export function generateNormalTraffic(): TrafficMetric {
  const baseValue = BASELINE.requestsPerMinute;
  const variance = baseValue * 0.2;
  const value = baseValue + (Math.random() - 0.5) * variance;
  
  return {
    timestamp: new Date(),
    value: Math.round(value),
    baseline: baseValue,
    anomalyScore: Math.random() * 10,
  };
}

// Simulate API abuse attack
export function simulateApiAbuse(): Partial<ThreatEvent> {
  return {
    type: 'api_abuse',
    severity: 'high',
    description: 'Detected high-frequency automated requests targeting patient records API',
    explanation: `[CRITICAL] API Abuse Attack Detected

The system has identified abnormal request patterns consistent with automated scraping or brute-force attempts.

Key Observations:
• Request frequency 850% above baseline
• Requests originating from single source with rotating user agents
• Targeting /api/patients/records endpoint
• No legitimate session authentication

Impact Assessment:
• Service degradation for legitimate users
• Potential exposure of patient data
• Database connection pool exhaustion risk

Confidence: 94%`,
  };
}

// Simulate token misuse attack
export function simulateTokenMisuse(): Partial<ThreatEvent> {
  return {
    type: 'token_misuse',
    severity: 'high',
    description: 'Authentication token being reused across multiple sessions and IP addresses',
    explanation: `[HIGH] Token Misuse Detected

Abnormal authentication token behavior identified indicating potential credential compromise.

Key Observations:
• Single JWT token used from 12 different IP addresses
• Token replay attempts detected
• Geographic impossibility: requests from 3 continents within 5 minutes
• Token not refreshed despite extended session

Impact Assessment:
• Unauthorized access to patient appointments
• Session hijacking in progress
• HIPAA compliance violation risk

Confidence: 89%`,
  };
}

// Simulate session anomaly
export function simulateSessionAnomaly(): Partial<ThreatEvent> {
  return {
    type: 'session_anomaly',
    severity: 'medium',
    description: 'Session behavior deviates significantly from user\'s established patterns',
    explanation: `[MEDIUM] Session Anomaly Detected

User session exhibiting behavior inconsistent with historical patterns.

Key Observations:
• Access to admin-level endpoints (user has standard privileges)
• Navigation pattern suggests automated behavior
• Cookie manipulation attempts detected
• Session duration 340% longer than user average

Impact Assessment:
• Possible account takeover attempt
• Privilege escalation probing
• Lateral movement reconnaissance

Confidence: 76%`,
  };
}

// Simulate data exfiltration
export function simulateDataExfiltration(): Partial<ThreatEvent> {
  return {
    type: 'data_exfiltration',
    severity: 'critical',
    description: 'Unusually large data transfers detected from patient database',
    explanation: `[CRITICAL] Data Exfiltration In Progress

Massive unauthorized data transfer detected from protected health information systems.

Key Observations:
• Response payload 2,400% larger than baseline
• Bulk patient record queries in rapid succession
• Data compression signatures in outbound traffic
• External IP destination on threat intelligence list

Impact Assessment:
• IMMEDIATE: Protected health data leaving network
• Regulatory: HIPAA breach notification required
• Financial: Potential fines up to $1.5M per incident
• Reputational: Patient trust compromise

Confidence: 97%`,
  };
}

// Generate attack traffic spike
export function generateAttackTraffic(type: ThreatEvent['type']): TrafficMetric {
  const multipliers = {
    api_abuse: 8,
    token_misuse: 3,
    session_anomaly: 2,
    data_exfiltration: 5,
  };

  const baseValue = BASELINE.requestsPerMinute;
  const multiplier = multipliers[type];
  const value = baseValue * multiplier * (0.8 + Math.random() * 0.4);

  return {
    timestamp: new Date(),
    value: Math.round(value),
    baseline: baseValue,
    anomalyScore: 60 + Math.random() * 40,
  };
}

// Initialize system nodes for the network visualization
export function initializeSystemNodes(): SystemNode[] {
  return [
    {
      id: 'gateway',
      name: 'API Gateway',
      type: 'gateway',
      status: 'healthy',
      connections: ['auth', 'api-patients', 'api-appointments'],
      metrics: { requests: 0, latency: 45, errorRate: 0.1 },
    },
    {
      id: 'auth',
      name: 'Auth Service',
      type: 'auth',
      status: 'healthy',
      connections: ['database', 'gateway'],
      metrics: { requests: 0, latency: 35, errorRate: 0.05 },
    },
    {
      id: 'api-patients',
      name: 'Patient Records API',
      type: 'api',
      status: 'healthy',
      connections: ['database', 'gateway', 'storage'],
      metrics: { requests: 0, latency: 120, errorRate: 0.2 },
    },
    {
      id: 'api-appointments',
      name: 'Appointments API',
      type: 'api',
      status: 'healthy',
      connections: ['database', 'gateway'],
      metrics: { requests: 0, latency: 80, errorRate: 0.1 },
    },
    {
      id: 'database',
      name: 'PostgreSQL DB',
      type: 'database',
      status: 'healthy',
      connections: ['auth', 'api-patients', 'api-appointments'],
      metrics: { requests: 0, latency: 15, errorRate: 0.01 },
    },
    {
      id: 'storage',
      name: 'File Storage',
      type: 'storage',
      status: 'healthy',
      connections: ['api-patients'],
      metrics: { requests: 0, latency: 200, errorRate: 0.3 },
    },
  ];
}

// Update node status based on threat
export function updateNodeStatus(
  nodes: SystemNode[],
  threatType: ThreatEvent['type'],
  phase: ThreatLevel
): SystemNode[] {
  const targetMap: Record<ThreatEvent['type'], string[]> = {
    api_abuse: ['gateway', 'api-patients'],
    token_misuse: ['auth', 'gateway'],
    session_anomaly: ['auth', 'api-appointments'],
    data_exfiltration: ['database', 'api-patients', 'storage'],
  };

  const affectedNodes = targetMap[threatType];

  return nodes.map(node => {
    if (affectedNodes.includes(node.id)) {
      let status: SystemNode['status'] = 'healthy';
      switch (phase) {
        case 'suspicious':
          status = 'warning';
          break;
        case 'detected':
          status = 'critical';
          break;
        case 'isolated':
          status = 'isolated';
          break;
        case 'stabilized':
          status = 'recovering';
          break;
        default:
          status = 'healthy';
      }
      return { ...node, status };
    }
    return { ...node, status: phase === 'normal' ? 'healthy' : node.status };
  });
}

// Generate mitigation action based on threat
export function generateMitigationAction(threat: ThreatEvent): string {
  const actions: Record<ThreatEvent['type'], string> = {
    api_abuse: 'Rate limiting applied: 10 req/min | Source IP temporarily blocked',
    token_misuse: 'Affected tokens invalidated | Forced re-authentication initiated',
    session_anomaly: 'Session flagged for review | Enhanced monitoring enabled',
    data_exfiltration: 'Database quarantined | Outbound transfers blocked | Service isolated',
  };

  return actions[threat.type];
}
