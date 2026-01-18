import { ThreatLevel, DemoState } from '@/types/security';
import { CheckCircle2, AlertTriangle, XCircle, Shield, Activity } from 'lucide-react';

interface AttackTimelineProps {
  demoState: DemoState;
}

const phases: { id: ThreatLevel; label: string; icon: React.ReactNode }[] = [
  { id: 'normal', label: 'Normal', icon: <Activity className="h-4 w-4" /> },
  { id: 'suspicious', label: 'Suspicious', icon: <AlertTriangle className="h-4 w-4" /> },
  { id: 'detected', label: 'Detected', icon: <XCircle className="h-4 w-4" /> },
  { id: 'isolated', label: 'Isolated', icon: <Shield className="h-4 w-4" /> },
  { id: 'stabilized', label: 'Stabilized', icon: <CheckCircle2 className="h-4 w-4" /> },
];

export function AttackTimeline({ demoState }: AttackTimelineProps) {
  const currentPhaseIndex = phases.findIndex(p => p.id === demoState.currentPhase);

  return (
    <div className="cyber-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-6">Attack Lifecycle</h3>
      
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-secondary">
          <div 
            className="h-full bg-gradient-to-r from-cyber-green via-cyber-amber to-cyber-red transition-all duration-500"
            style={{ 
              width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%`,
              background: currentPhaseIndex >= 3 
                ? 'linear-gradient(90deg, hsl(142, 76%, 45%), hsl(280, 100%, 65%))'
                : currentPhaseIndex >= 2
                ? 'linear-gradient(90deg, hsl(38, 100%, 55%), hsl(0, 85%, 55%))'
                : 'linear-gradient(90deg, hsl(142, 76%, 45%), hsl(38, 100%, 55%))'
            }}
          />
        </div>

        {/* Phase nodes */}
        <div className="flex justify-between relative">
          {phases.map((phase, index) => {
            const isActive = index === currentPhaseIndex;
            const isPast = index < currentPhaseIndex;
            const isFuture = index > currentPhaseIndex;

            let colorClass = 'text-muted-foreground border-muted';
            let bgClass = 'bg-background';
            
            if (isActive) {
              if (phase.id === 'detected') {
                colorClass = 'text-cyber-red border-cyber-red';
                bgClass = 'bg-cyber-red/20';
              } else if (phase.id === 'suspicious') {
                colorClass = 'text-cyber-amber border-cyber-amber';
                bgClass = 'bg-cyber-amber/20';
              } else if (phase.id === 'isolated') {
                colorClass = 'text-cyber-purple border-cyber-purple';
                bgClass = 'bg-cyber-purple/20';
              } else {
                colorClass = 'text-cyber-green border-cyber-green';
                bgClass = 'bg-cyber-green/20';
              }
            } else if (isPast) {
              colorClass = 'text-cyber-green border-cyber-green/50';
              bgClass = 'bg-cyber-green/10';
            }

            return (
              <div key={phase.id} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300
                  ${colorClass} ${bgClass}
                  ${isActive ? 'scale-125 shadow-lg' : ''}
                  ${isActive && phase.id === 'detected' ? 'animate-pulse-threat' : ''}
                  ${isActive && phase.id === 'isolated' ? 'glow-purple' : ''}
                `}>
                  {phase.icon}
                </div>
                <span className={`
                  text-xs font-medium transition-colors duration-300
                  ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                `}>
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status description */}
      <div className="mt-6 p-3 rounded-lg bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground text-center">
          {demoState.currentPhase === 'normal' && 'All systems operating within normal parameters'}
          {demoState.currentPhase === 'suspicious' && 'Anomalous behavior detected, analyzing patterns...'}
          {demoState.currentPhase === 'detected' && 'Threat confirmed! Preparing containment response...'}
          {demoState.currentPhase === 'isolated' && 'Affected components quarantined. System protected.'}
          {demoState.currentPhase === 'stabilized' && 'Threat neutralized. System returning to normal operations.'}
        </p>
      </div>
    </div>
  );
}
