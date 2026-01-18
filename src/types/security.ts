export type ThreatLevel = 'normal' | 'suspicious' | 'detected' | 'isolated' | 'stabilized';
export type SystemStatus = 'healthy' | 'warning' | 'critical' | 'isolated' | 'recovering';

export interface SystemNode {
  id: string;
  name: string;
  type: 'api' | 'database' | 'auth' | 'storage' | 'gateway';
  status: SystemStatus;
  connections: string[];
  metrics: {
    requests: number;
    latency: number;
    errorRate: number;
  };
}

export interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: 'api_abuse' | 'token_misuse' | 'session_anomaly' | 'data_exfiltration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  status: ThreatLevel;
  anomalyScore: number;
  confidence: number;
  explanation: string;
  mitigationApplied?: string;
}

export interface TrafficMetric {
  timestamp: Date;
  value: number;
  baseline: number;
  anomalyScore: number;
}

export interface AnomalyDetection {
  score: number;
  classification: string;
  confidence: number;
  explanation: string;
  indicators: string[];
}

export interface MitigationAction {
  id: string;
  type: 'rate_limit' | 'token_invalidate' | 'ip_block' | 'quarantine';
  target: string;
  status: 'pending' | 'approved' | 'applied' | 'reverted';
  timestamp: Date;
}

export interface DemoState {
  isRunning: boolean;
  currentPhase: ThreatLevel;
  activeAttack: ThreatEvent | null;
  autoApprove: boolean;
}
