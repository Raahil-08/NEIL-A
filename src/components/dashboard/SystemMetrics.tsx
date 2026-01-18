import { SystemNode } from '@/types/security';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

interface SystemMetricsProps {
  nodes: SystemNode[];
}

export function SystemMetrics({ nodes }: SystemMetricsProps) {
  const healthyCount = nodes.filter(n => n.status === 'healthy' || n.status === 'recovering').length;
  const warningCount = nodes.filter(n => n.status === 'warning').length;
  const criticalCount = nodes.filter(n => n.status === 'critical' || n.status === 'isolated').length;
  
  const avgLatency = Math.round(nodes.reduce((sum, n) => sum + n.metrics.latency, 0) / nodes.length);
  const totalRequests = nodes.reduce((sum, n) => sum + n.metrics.requests, 0);

  const healthPercentage = Math.round((healthyCount / nodes.length) * 100);

  return (
    <div className="cyber-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">System Health</h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Health Status */}
        <div className="text-center">
          <div className={`text-3xl font-bold font-mono ${
            healthPercentage >= 80 ? 'text-cyber-green' :
            healthPercentage >= 50 ? 'text-cyber-amber' : 'text-cyber-red'
          }`}>
            {healthPercentage}%
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Uptime</span>
          </div>
        </div>

        {/* Average Latency */}
        <div className="text-center">
          <div className={`text-3xl font-bold font-mono ${
            avgLatency < 100 ? 'text-cyber-green' :
            avgLatency < 200 ? 'text-cyber-amber' : 'text-cyber-red'
          }`}>
            {avgLatency}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Latency (ms)</span>
          </div>
        </div>

        {/* Alerts */}
        <div className="text-center">
          <div className={`text-3xl font-bold font-mono ${
            criticalCount > 0 ? 'text-cyber-red animate-pulse' :
            warningCount > 0 ? 'text-cyber-amber' : 'text-cyber-green'
          }`}>
            {criticalCount + warningCount}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Alerts</span>
          </div>
        </div>
      </div>

      {/* Node status breakdown */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-green" />
            <span className="text-xs text-muted-foreground">Healthy: {healthyCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-amber" />
            <span className="text-xs text-muted-foreground">Warning: {warningCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-red" />
            <span className="text-xs text-muted-foreground">Critical: {criticalCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
