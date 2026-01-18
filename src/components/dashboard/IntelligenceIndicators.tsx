import { Shield, Cloud, AlertTriangle, CheckCircle } from 'lucide-react';
import { ThreatEvent } from '@/types/security';

interface IntelligenceIndicatorsProps {
  threat: ThreatEvent | null;
}

interface ExtendedThreat extends ThreatEvent {
  ipReputationInvolved?: boolean;
  ipReputationScore?: number;
  weatherContextApplied?: boolean;
  weatherModifier?: number;
}

export function IntelligenceIndicators({ threat }: IntelligenceIndicatorsProps) {
  const extThreat = threat as ExtendedThreat | null;

  if (!threat) {
    return (
      <div className="cyber-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">INTELLIGENCE SOURCES</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded bg-muted/50 border border-border text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-muted-foreground opacity-50" />
            <span className="text-[10px] text-muted-foreground">AbuseIPDB</span>
            <p className="text-xs text-muted-foreground mt-1">No data</p>
          </div>
          <div className="p-3 rounded bg-muted/50 border border-border text-center">
            <Cloud className="h-5 w-5 mx-auto mb-1 text-muted-foreground opacity-50" />
            <span className="text-[10px] text-muted-foreground">Weather</span>
            <p className="text-xs text-muted-foreground mt-1">No data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">INTELLIGENCE SOURCES</h4>
      <div className="grid grid-cols-2 gap-2">
        {/* IP Reputation */}
        <div className={`p-3 rounded border text-center transition-all ${
          extThreat?.ipReputationInvolved
            ? 'bg-cyber-red/10 border-cyber-red/50'
            : 'bg-cyber-green/10 border-cyber-green/50'
        }`}>
          {extThreat?.ipReputationInvolved ? (
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-cyber-red" />
          ) : (
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-cyber-green" />
          )}
          <span className="text-[10px] text-muted-foreground">AbuseIPDB</span>
          <p className={`text-sm font-bold mt-1 ${
            extThreat?.ipReputationInvolved ? 'text-cyber-red' : 'text-cyber-green'
          }`}>
            {extThreat?.ipReputationInvolved ? 'FLAGGED' : 'CLEAN'}
          </p>
          {extThreat?.ipReputationScore !== undefined && (
            <p className="text-[10px] text-muted-foreground">
              Score: {extThreat.ipReputationScore}%
            </p>
          )}
        </div>

        {/* Weather Context */}
        <div className={`p-3 rounded border text-center transition-all ${
          extThreat?.weatherContextApplied
            ? 'bg-cyber-amber/10 border-cyber-amber/50'
            : 'bg-muted border-border'
        }`}>
          <Cloud className={`h-5 w-5 mx-auto mb-1 ${
            extThreat?.weatherContextApplied ? 'text-cyber-amber' : 'text-muted-foreground'
          }`} />
          <span className="text-[10px] text-muted-foreground">Weather</span>
          <p className={`text-sm font-bold mt-1 ${
            extThreat?.weatherContextApplied ? 'text-cyber-amber' : 'text-muted-foreground'
          }`}>
            {extThreat?.weatherContextApplied ? 'APPLIED' : 'NORMAL'}
          </p>
          {extThreat?.weatherModifier !== undefined && extThreat?.weatherModifier !== 1.0 && (
            <p className="text-[10px] text-muted-foreground">
              Modifier: {((1 - extThreat.weatherModifier) * 100).toFixed(0)}% relaxed
            </p>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-3 p-2 rounded bg-background border border-border">
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
          {extThreat?.ipReputationInvolved && (
            <span className="text-cyber-red">⚠ IP flagged by threat intelligence. </span>
          )}
          {extThreat?.weatherContextApplied && (
            <span className="text-cyber-amber">☁ Weather thresholds adjusted. </span>
          )}
          {!extThreat?.ipReputationInvolved && !extThreat?.weatherContextApplied && (
            <span>Standard detection parameters applied.</span>
          )}
        </p>
      </div>
    </div>
  );
}