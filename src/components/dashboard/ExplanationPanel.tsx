import { ThreatEvent } from '@/types/security';
import { Brain, ChevronRight } from 'lucide-react';

interface ExplanationPanelProps {
  threat: ThreatEvent | null;
}

export function ExplanationPanel({ threat }: ExplanationPanelProps) {
  return (
    <div className="cyber-card h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Brain className="h-5 w-5 text-cyber-purple" />
        <h3 className="text-sm font-semibold text-foreground">AI Analysis</h3>
        {threat && (
          <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-purple/20 text-cyber-purple">
            EXPLAINABLE AI
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {threat ? (
          <div className="space-y-4 animate-fade-in">
            {/* Confidence meter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Detection Confidence</span>
                <span className="text-xs font-mono font-bold text-foreground">{threat.confidence}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all duration-500 rounded-full"
                  style={{ width: `${threat.confidence}%` }}
                />
              </div>
            </div>

            {/* Anomaly score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Anomaly Score</span>
                <span className={`text-xs font-mono font-bold ${
                  threat.anomalyScore >= 70 ? 'text-cyber-red' :
                  threat.anomalyScore >= 50 ? 'text-cyber-amber' : 'text-cyber-green'
                }`}>
                  {threat.anomalyScore}/100
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    threat.anomalyScore >= 70 ? 'bg-cyber-red' :
                    threat.anomalyScore >= 50 ? 'bg-cyber-amber' : 'bg-cyber-green'
                  }`}
                  style={{ width: `${threat.anomalyScore}%` }}
                />
              </div>
            </div>

            {/* Explanation text */}
            <div className="mt-4 p-3 rounded-lg bg-background border border-border">
              <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {threat.explanation}
              </pre>
            </div>

            {/* Key indicators */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Key Indicators:</span>
              <ul className="space-y-1">
                {threat.type === 'api_abuse' && (
                  <>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-amber" />
                      Request frequency 850% above baseline
                    </li>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-amber" />
                      Automated behavior patterns detected
                    </li>
                  </>
                )}
                {threat.type === 'token_misuse' && (
                  <>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-amber" />
                      Token used from 12 different IPs
                    </li>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-amber" />
                      Geographic impossibility detected
                    </li>
                  </>
                )}
                {threat.type === 'data_exfiltration' && (
                  <>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-red" />
                      Data transfer 2,400% larger than normal
                    </li>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-red" />
                      Bulk record queries detected
                    </li>
                  </>
                )}
                {threat.type === 'session_anomaly' && (
                  <>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-amber" />
                      Privilege escalation attempts
                    </li>
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 text-cyber-amber" />
                      Session duration 340% above average
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Brain className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">No active threat</p>
            <p className="text-xs mt-1">AI analysis will appear here during an attack</p>
          </div>
        )}
      </div>
    </div>
  );
}
