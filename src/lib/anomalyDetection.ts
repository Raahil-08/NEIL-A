import { ThreatEvent, AnomalyDetection } from '@/types/security';

// Baseline metrics for normal behavior
const BASELINE = {
  requestsPerMinute: 30,
  avgLatency: 150,
  avgPayloadSize: 5000,
  tokenReuseRate: 0.1,
  sessionDuration: 1800000, // 30 mins
};

// Z-score threshold for anomaly detection
const Z_THRESHOLD = 2.5;

interface MetricSample {
  value: number;
  timestamp: number;
}

class RollingAverage {
  private samples: MetricSample[] = [];
  private windowSize: number;

  constructor(windowSize: number = 60) {
    this.windowSize = windowSize;
  }

  add(value: number): void {
    const now = Date.now();
    this.samples.push({ value, timestamp: now });
    // Remove old samples
    const cutoff = now - this.windowSize * 1000;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
  }

  getMean(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((sum, s) => sum + s.value, 0) / this.samples.length;
  }

  getStdDev(): number {
    if (this.samples.length < 2) return 0;
    const mean = this.getMean();
    const variance = this.samples.reduce((sum, s) => sum + Math.pow(s.value - mean, 2), 0) / this.samples.length;
    return Math.sqrt(variance);
  }

  getZScore(value: number): number {
    const mean = this.getMean();
    const stdDev = this.getStdDev();
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }
}

// Metric trackers
const requestRateTracker = new RollingAverage(60);
const latencyTracker = new RollingAverage(60);
const payloadTracker = new RollingAverage(60);

export function detectAnomaly(metrics: {
  requestRate: number;
  latency: number;
  payloadSize: number;
  tokenReuse: number;
  sessionBehavior: 'normal' | 'abnormal';
}): AnomalyDetection {
  const indicators: string[] = [];
  let totalScore = 0;
  let classification = 'Normal Traffic';

  // Add samples to trackers
  requestRateTracker.add(metrics.requestRate);
  latencyTracker.add(metrics.latency);
  payloadTracker.add(metrics.payloadSize);

  // Check request rate (API abuse detection)
  const requestZScore = Math.abs(requestRateTracker.getZScore(metrics.requestRate));
  if (requestZScore > Z_THRESHOLD || metrics.requestRate > BASELINE.requestsPerMinute * 3) {
    const severity = metrics.requestRate > BASELINE.requestsPerMinute * 5 ? 30 : 20;
    totalScore += severity;
    indicators.push(`Request rate ${(metrics.requestRate / BASELINE.requestsPerMinute * 100).toFixed(0)}% above baseline`);
    classification = 'API Abuse Detected';
  }

  // Check token reuse (Token misuse detection)
  if (metrics.tokenReuse > BASELINE.tokenReuseRate * 2) {
    totalScore += 25;
    indicators.push(`Abnormal token reuse pattern: ${(metrics.tokenReuse * 100).toFixed(1)}% reuse rate`);
    if (classification === 'Normal Traffic') classification = 'Token Misuse Detected';
  }

  // Check session behavior
  if (metrics.sessionBehavior === 'abnormal') {
    totalScore += 20;
    indicators.push('Session behavior deviates from established patterns');
    if (classification === 'Normal Traffic') classification = 'Session Anomaly Detected';
  }

  // Check payload size (Data exfiltration detection)
  const payloadZScore = Math.abs(payloadTracker.getZScore(metrics.payloadSize));
  if (payloadZScore > Z_THRESHOLD || metrics.payloadSize > BASELINE.avgPayloadSize * 10) {
    const severity = metrics.payloadSize > BASELINE.avgPayloadSize * 20 ? 35 : 25;
    totalScore += severity;
    indicators.push(`Data transfer ${(metrics.payloadSize / BASELINE.avgPayloadSize).toFixed(1)}x larger than normal`);
    classification = 'Data Exfiltration Suspected';
  }

  // Clamp score to 0-100
  const anomalyScore = Math.min(100, Math.max(0, totalScore));

  // Calculate confidence based on sample size and indicator consistency
  const sampleWeight = Math.min(1, requestRateTracker.getMean() > 0 ? 1 : 0.5);
  const confidence = Math.round(
    sampleWeight * (60 + indicators.length * 10) * (anomalyScore > 50 ? 1.1 : 1)
  );

  // Generate human-readable explanation
  const explanation = generateExplanation(classification, indicators, anomalyScore, confidence);

  return {
    score: anomalyScore,
    classification,
    confidence: Math.min(98, confidence),
    explanation,
    indicators,
  };
}

function generateExplanation(
  classification: string,
  indicators: string[],
  score: number,
  confidence: number
): string {
  if (indicators.length === 0) {
    return 'All metrics within normal parameters. System operating normally.';
  }

  const severity = score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
  
  let explanation = `[${severity}] ${classification}\n\n`;
  explanation += `Anomaly Score: ${score}/100 | Confidence: ${confidence}%\n\n`;
  explanation += 'Detected Indicators:\n';
  indicators.forEach((ind, i) => {
    explanation += `  ${i + 1}. ${ind}\n`;
  });

  if (score >= 50) {
    explanation += '\nRecommended Action: Immediate containment advised.';
  } else if (score >= 30) {
    explanation += '\nRecommended Action: Continue monitoring, prepare containment.';
  }

  return explanation;
}

export function classifyThreat(score: number): ThreatEvent['type'] {
  if (score >= 70) return 'data_exfiltration';
  if (score >= 50) return 'api_abuse';
  if (score >= 30) return 'token_misuse';
  return 'session_anomaly';
}

export function generateMitigationRecommendation(threat: ThreatEvent): string[] {
  const recommendations: string[] = [];

  switch (threat.type) {
    case 'api_abuse':
      recommendations.push('Apply rate limiting to source IP');
      recommendations.push('Enable request throttling on affected endpoint');
      break;
    case 'token_misuse':
      recommendations.push('Invalidate compromised authentication tokens');
      recommendations.push('Force session renewal for affected users');
      break;
    case 'session_anomaly':
      recommendations.push('Flag session for manual review');
      recommendations.push('Enable enhanced logging for session');
      break;
    case 'data_exfiltration':
      recommendations.push('Quarantine affected service immediately');
      recommendations.push('Block outbound data transfers');
      recommendations.push('Isolate database connections');
      break;
  }

  return recommendations;
}

export { BASELINE };
