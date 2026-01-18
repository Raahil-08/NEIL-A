import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ThreatEvent, TrafficMetric, SystemNode, DemoState, ThreatLevel } from '@/types/security';
import { toast } from '@/hooks/use-toast';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sentira-api`;

interface BackendThreat {
  id: string;
  event_type: string;
  severity: string;
  source_ip: string;
  target_endpoint: string;
  description: string;
  status: string;
  anomaly_score: number;
  confidence: number;
  explanation: string;
  ip_reputation_score: number | null;
  ip_reputation_involved: boolean;
  weather_context_applied: boolean;
  weather_modifier: number | null;
  mitigation_applied: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendDemoState {
  id: string;
  is_running: boolean;
  current_phase: string;
  active_attack_id: string | null;
  auto_approve: boolean;
  pending_mitigation_id: string | null;
  updated_at: string;
}

interface BackendSystemNode {
  id: string;
  name: string;
  node_type: string;
  status: string;
  connections: string[];
  requests: number;
  latency: number;
  error_rate: number;
  updated_at: string;
}

interface BackendMetric {
  id: string;
  metric_type: string;
  value: number;
  baseline: number;
  anomaly_score: number;
  node_id: string | null;
  created_at: string;
}

interface WeatherInfo {
  condition: string;
  is_severe: boolean;
  severity_modifier: number;
  description: string;
}

// Transform backend threat to frontend format
function transformThreat(backend: BackendThreat): ThreatEvent {
  return {
    id: backend.id,
    timestamp: new Date(backend.created_at),
    type: backend.event_type as ThreatEvent['type'],
    severity: backend.severity as ThreatEvent['severity'],
    source: backend.source_ip,
    target: backend.target_endpoint,
    description: backend.description,
    status: backend.status as ThreatLevel,
    anomalyScore: backend.anomaly_score,
    confidence: backend.confidence,
    explanation: backend.explanation,
    mitigationApplied: backend.mitigation_applied || undefined,
  };
}

// Transform backend node to frontend format
function transformNode(backend: BackendSystemNode): SystemNode {
  return {
    id: backend.id,
    name: backend.name,
    type: backend.node_type as SystemNode['type'],
    status: backend.status as SystemNode['status'],
    connections: backend.connections,
    metrics: {
      requests: backend.requests,
      latency: backend.latency,
      errorRate: backend.error_rate,
    },
  };
}

// Transform backend metric to frontend format
function transformMetric(backend: BackendMetric): TrafficMetric {
  return {
    timestamp: new Date(backend.created_at),
    value: backend.value,
    baseline: backend.baseline,
    anomalyScore: backend.anomaly_score,
  };
}

export function useBackendSimulation() {
  const [trafficData, setTrafficData] = useState<TrafficMetric[]>([]);
  const [systemNodes, setSystemNodes] = useState<SystemNode[]>([]);
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [demoState, setDemoState] = useState<DemoState>({
    isRunning: false,
    currentPhase: 'normal',
    activeAttack: null,
    autoApprove: true,
  });
  const [pendingMitigation, setPendingMitigation] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const trafficInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial state from backend
  const fetchState = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke('sentira-api', {
        body: null,
        method: 'GET',
      });
      
      // Use direct fetch for GET requests since supabase.functions.invoke uses POST by default
      const res = await fetch(`${API_URL}/system/state`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch state');
      }
      
      const data = await res.json();
      
      // Update state from backend
      if (data.state) {
        const backendState = data.state as BackendDemoState;
        setDemoState({
          isRunning: backendState.is_running,
          currentPhase: backendState.current_phase as ThreatLevel,
          activeAttack: data.activeAttack ? transformThreat(data.activeAttack) : null,
          autoApprove: backendState.auto_approve,
        });
        setPendingMitigation(backendState.pending_mitigation_id);
      }
      
      if (data.threats) {
        setThreats(data.threats.map(transformThreat));
      }
      
      if (data.weather) {
        setWeather({
          condition: data.weather.condition,
          is_severe: data.weather.is_severe,
          severity_modifier: data.weather.severity_modifier,
          description: data.weather.description,
        });
      }
      
      setIsConnected(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch state:', error);
      setIsConnected(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch nodes
  const fetchNodes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_nodes')
        .select('*');
      
      if (error) throw error;
      if (data) {
        setSystemNodes(data.map(transformNode));
      }
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    }
  }, []);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);
      
      if (error) throw error;
      if (data) {
        setTrafficData(data.map(transformMetric).reverse());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchState();
    fetchNodes();
    fetchMetrics();

    // Subscribe to demo_state changes
    const stateChannel = supabase
      .channel('demo_state_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_state' },
        async (payload) => {
          console.log('[REALTIME] Demo state changed:', payload);
          await fetchState();
        }
      )
      .subscribe();

    // Subscribe to threat_events changes
    const threatChannel = supabase
      .channel('threat_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threat_events' },
        async (payload) => {
          console.log('[REALTIME] Threat event changed:', payload);
          await fetchState();
        }
      )
      .subscribe();

    // Subscribe to system_nodes changes
    const nodesChannel = supabase
      .channel('system_nodes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_nodes' },
        (payload) => {
          console.log('[REALTIME] System node changed:', payload);
          if (payload.new) {
            setSystemNodes(prev => 
              prev.map(node => 
                node.id === (payload.new as BackendSystemNode).id 
                  ? transformNode(payload.new as BackendSystemNode)
                  : node
              )
            );
          }
        }
      )
      .subscribe();

    // Subscribe to system_metrics changes
    const metricsChannel = supabase
      .channel('system_metrics_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_metrics' },
        (payload) => {
          console.log('[REALTIME] New metric:', payload);
          if (payload.new) {
            const newMetric = transformMetric(payload.new as BackendMetric);
            setTrafficData(prev => [...prev, newMetric].slice(-60));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
      supabase.removeChannel(threatChannel);
      supabase.removeChannel(nodesChannel);
      supabase.removeChannel(metricsChannel);
    };
  }, [fetchState, fetchNodes, fetchMetrics]);

  // Generate traffic periodically
  useEffect(() => {
    trafficInterval.current = setInterval(async () => {
      try {
        await fetch(`${API_URL}/traffic/generate`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
      } catch (error) {
        console.error('Failed to generate traffic:', error);
      }
    }, 1000);

    return () => {
      if (trafficInterval.current) clearInterval(trafficInterval.current);
    };
  }, []);

  // Auto-advance phases when auto-approve is on
  useEffect(() => {
    if (demoState.isRunning && demoState.autoApprove && demoState.currentPhase !== 'normal') {
      const phaseDurations: Record<string, number> = {
        suspicious: 2000,
        detected: 3000,
        isolated: 2500,
        stabilized: 2000,
      };

      phaseTimeout.current = setTimeout(async () => {
        try {
          await fetch(`${API_URL}/phase/advance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          });
        } catch (error) {
          console.error('Failed to advance phase:', error);
        }
      }, phaseDurations[demoState.currentPhase] || 2000);

      return () => {
        if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
      };
    }
  }, [demoState.isRunning, demoState.autoApprove, demoState.currentPhase]);

  // Trigger attack
  const triggerAttack = useCallback(async (type: ThreatEvent['type']) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/simulate/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to trigger attack');
      }

      const data = await response.json();
      console.log('[ATTACK] Triggered:', data);

      // Update weather info if provided
      if (data.weather) {
        setWeather({
          condition: data.weather.condition,
          is_severe: data.weather.isSevere,
          severity_modifier: data.weather.severityModifier,
          description: data.weather.description,
        });
      }

      toast({
        title: 'Attack Detected',
        description: data.explanation,
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Failed to trigger attack:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger attack. Backend may be offline.',
        variant: 'destructive',
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Approve mitigation
  const approveMitigation = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/mitigation/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve mitigation');
      }

      const data = await response.json();
      console.log('[MITIGATION] Approved:', data);

      toast({
        title: 'Mitigation Applied',
        description: data.mitigation,
      });
    } catch (error) {
      console.error('Failed to approve mitigation:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve mitigation.',
        variant: 'destructive',
      });
    }
  }, []);

  // Toggle auto-approve
  const toggleAutoApprove = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/demo/toggle-auto-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle auto-approve');
      }

      const data = await response.json();
      setDemoState(prev => ({ ...prev, autoApprove: data.auto_approve }));
    } catch (error) {
      console.error('Failed to toggle auto-approve:', error);
    }
  }, []);

  // Reset demo
  const resetDemo = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/demo/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset demo');
      }

      // Clear local state
      setTrafficData([]);
      setThreats([]);
      setPendingMitigation(null);
      setWeather(null);
      
      await fetchNodes();
      await fetchState();

      toast({
        title: 'Demo Reset',
        description: 'All systems returned to normal state.',
      });
    } catch (error) {
      console.error('Failed to reset demo:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset demo.',
        variant: 'destructive',
      });
    }
  }, [fetchNodes, fetchState]);

  return {
    trafficData,
    systemNodes,
    threats,
    demoState,
    pendingMitigation,
    weather,
    isConnected,
    isLoading,
    triggerAttack,
    approveMitigation,
    toggleAutoApprove,
    resetDemo,
  };
}