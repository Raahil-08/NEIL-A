import { ThreatEvent } from '@/types/security';
import { AlertTriangle, Shield, Clock, Target, Zap } from 'lucide-react';

interface ThreatCardProps {
  threat: ThreatEvent;
  isActive: boolean;
}

const severityConfig = {
  low: { color: 'cyber-green', label: 'LOW' },
  medium: { color: 'cyber-amber', label: 'MEDIUM' },
  high: { color: 'cyber-red', label: 'HIGH' },
  critical: { color: 'cyber-red', label: 'CRITICAL' },
};

const typeLabels: Record<ThreatEvent['type'], string> = {
  api_abuse: 'API ABUSE',
  token_misuse: 'TOKEN MISUSE',
  session_anomaly: 'SESSION ANOMALY',
  data_exfiltration: 'DATA EXFILTRATION',
};

export function ThreatCard({ threat, isActive }: ThreatCardProps) {
  const severity = severityConfig[threat.severity];

  return (
    <div className={`
      cyber-card overflow-hidden transition-all duration-300
      ${isActive ? 'ring-2 ring-cyber-red/50' : ''}
    `}>
      {/* Header with severity indicator */}
      <div className={`
        px-4 py-2 flex items-center justify-between
        ${threat.severity === 'critical' || threat.severity === 'high' 
          ? 'bg-cyber-red/10' 
          : 'bg-cyber-amber/10'
        }
      `}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 text-${severity.color}`} />
          <span className={`text-xs font-bold text-${severity.color}`}>
            {severity.label}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {typeLabels[threat.type]}
          </span>
        </div>
        <div className={`
          px-2 py-0.5 rounded text-[10px] font-mono uppercase
          ${threat.status === 'isolated' ? 'bg-cyber-purple/20 text-cyber-purple' : ''}
          ${threat.status === 'stabilized' ? 'bg-cyber-green/20 text-cyber-green' : ''}
          ${threat.status === 'detected' ? 'bg-cyber-red/20 text-cyber-red animate-pulse' : ''}
          ${threat.status === 'suspicious' ? 'bg-cyber-amber/20 text-cyber-amber' : ''}
        `}>
          {threat.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Metrics row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Score:</span>
            <span className={`text-xs font-mono font-bold text-${
              threat.anomalyScore >= 70 ? 'cyber-red' : 
              threat.anomalyScore >= 50 ? 'cyber-amber' : 'cyber-green'
            }`}>
              {threat.anomalyScore}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <span className="text-xs font-mono font-bold text-foreground">
              {threat.confidence}%
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/90">
          {threat.description}
        </p>

        {/* Source/Target */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Source:</span>
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-foreground">
              {threat.source}
            </code>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Target:</span>
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-foreground">
              {threat.target}
            </code>
          </div>
        </div>

        {/* Mitigation applied */}
        {threat.mitigationApplied && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-cyber-green mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-cyber-green">Response Applied:</span>
                <p className="text-xs text-foreground/80 mt-0.5">{threat.mitigationApplied}</p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {threat.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {/* SIMULATED label */}
      <div className="px-4 py-1.5 bg-secondary/50 border-t border-border">
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
          ⚠️ SIMULATED ATTACK — DEFENSIVE DEMO ONLY
        </span>
      </div>
    </div>
  );
}
