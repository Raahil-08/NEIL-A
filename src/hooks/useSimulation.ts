import { useState, useCallback, useRef, useEffect } from 'react';
import { ThreatEvent, TrafficMetric, SystemNode, DemoState, ThreatLevel } from '@/types/security';
import { detectAnomaly } from '@/lib/anomalyDetection';
import {
  generateNormalTraffic,
  generateAttackTraffic,
  simulateApiAbuse,
  simulateTokenMisuse,
  simulateSessionAnomaly,
  simulateDataExfiltration,
  initializeSystemNodes,
  updateNodeStatus,
  generateMitigationAction,
} from '@/lib/simulationEngine';

const PHASE_DURATIONS = {
  normal: 0,
  suspicious: 2000,
  detected: 3000,
  isolated: 2500,
  stabilized: 2000,
};

export function useSimulation() {
  const [trafficData, setTrafficData] = useState<TrafficMetric[]>([]);
  const [systemNodes, setSystemNodes] = useState<SystemNode[]>(initializeSystemNodes());
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [demoState, setDemoState] = useState<DemoState>({
    isRunning: false,
    currentPhase: 'normal',
    activeAttack: null,
    autoApprove: true,
  });
  const [pendingMitigation, setPendingMitigation] = useState<string | null>(null);

  const trafficInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoApproveRef = useRef(demoState.autoApprove);

  // Keep ref in sync with state
  useEffect(() => {
    autoApproveRef.current = demoState.autoApprove;
  }, [demoState.autoApprove]);

  // Generate continuous traffic data
  useEffect(() => {
    trafficInterval.current = setInterval(() => {
      setTrafficData(prev => {
        const newMetric = demoState.activeAttack 
          ? generateAttackTraffic(demoState.activeAttack.type)
          : generateNormalTraffic();
        
        const updated = [...prev, newMetric].slice(-60);
        return updated;
      });
    }, 1000);

    return () => {
      if (trafficInterval.current) clearInterval(trafficInterval.current);
    };
  }, [demoState.activeAttack]);

  // Clean up phase timeout on unmount
  useEffect(() => {
    return () => {
      if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
    };
  }, []);

  const progressPhase = useCallback((currentPhase: ThreatLevel, threat: ThreatEvent) => {
    const phases: ThreatLevel[] = ['suspicious', 'detected', 'isolated', 'stabilized', 'normal'];
    const currentIndex = phases.indexOf(currentPhase);
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      
      // Update phase
      setDemoState(prev => ({
        ...prev,
        currentPhase: nextPhase,
        activeAttack: nextPhase === 'normal' ? null : prev.activeAttack,
        isRunning: nextPhase !== 'normal',
      }));

      // Update threat status
      setThreats(prev => 
        prev.map(t => 
          t.id === threat.id ? { ...t, status: nextPhase } : t
        )
      );

      // Update node status
      setSystemNodes(prev => updateNodeStatus(prev, threat.type, nextPhase));

      // Apply mitigation at isolated phase
      if (nextPhase === 'isolated') {
        const mitigation = generateMitigationAction(threat);
        setThreats(prev =>
          prev.map(t =>
            t.id === threat.id ? { ...t, mitigationApplied: mitigation } : t
          )
        );
      }

      // Schedule next phase
      if (nextPhase !== 'normal') {
        phaseTimeout.current = setTimeout(() => {
          progressPhase(nextPhase, threat);
        }, PHASE_DURATIONS[nextPhase]);
      }
    }
  }, []);

  const triggerAttack = useCallback((type: ThreatEvent['type']) => {
    // Clear any existing attack
    if (phaseTimeout.current) clearTimeout(phaseTimeout.current);

    // Generate threat data based on type
    const attackGenerators = {
      api_abuse: simulateApiAbuse,
      token_misuse: simulateTokenMisuse,
      session_anomaly: simulateSessionAnomaly,
      data_exfiltration: simulateDataExfiltration,
    };

    const attackData = attackGenerators[type]();
    
    // Get anomaly detection results
    const detection = detectAnomaly({
      requestRate: type === 'api_abuse' ? 250 : 45,
      latency: type === 'data_exfiltration' ? 500 : 150,
      payloadSize: type === 'data_exfiltration' ? 150000 : 5000,
      tokenReuse: type === 'token_misuse' ? 0.8 : 0.1,
      sessionBehavior: type === 'session_anomaly' ? 'abnormal' : 'normal',
    });

    const threat: ThreatEvent = {
      id: `threat-${Date.now()}`,
      timestamp: new Date(),
      type,
      severity: attackData.severity || 'medium',
      source: '192.168.1.' + Math.floor(Math.random() * 255),
      target: type === 'api_abuse' ? '/api/patients/records' : '/api/auth/session',
      description: attackData.description || 'Unknown threat detected',
      status: 'suspicious',
      anomalyScore: detection.score,
      confidence: detection.confidence,
      explanation: attackData.explanation || detection.explanation,
    };

    // Add threat to list
    setThreats(prev => [threat, ...prev].slice(0, 10));

    // Update demo state
    setDemoState(prev => ({
      ...prev,
      isRunning: true,
      currentPhase: 'suspicious',
      activeAttack: threat,
    }));

    // Update nodes to suspicious
    setSystemNodes(prev => updateNodeStatus(prev, type, 'suspicious'));

    // Use ref to get current autoApprove value
    if (autoApproveRef.current) {
      phaseTimeout.current = setTimeout(() => {
        progressPhase('suspicious', threat);
      }, PHASE_DURATIONS.suspicious);
    } else {
      setPendingMitigation(threat.id);
    }
  }, [progressPhase]);

  const approveMitigation = useCallback(() => {
    if (pendingMitigation && demoState.activeAttack) {
      setPendingMitigation(null);
      progressPhase('suspicious', demoState.activeAttack);
    }
  }, [pendingMitigation, demoState.activeAttack, progressPhase]);

  const toggleAutoApprove = useCallback(() => {
    setDemoState(prev => ({ ...prev, autoApprove: !prev.autoApprove }));
  }, []);

  const resetDemo = useCallback(() => {
    if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
    setDemoState(prev => ({
      isRunning: false,
      currentPhase: 'normal',
      activeAttack: null,
      autoApprove: prev.autoApprove, // preserve auto-approve setting
    }));
    setSystemNodes(initializeSystemNodes());
    setThreats([]);
    setPendingMitigation(null);
  }, []);

  return {
    trafficData,
    systemNodes,
    threats,
    demoState,
    pendingMitigation,
    triggerAttack,
    approveMitigation,
    toggleAutoApprove,
    resetDemo,
  };
}
