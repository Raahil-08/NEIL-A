import { Activity, Wifi } from 'lucide-react';
import { DemoState } from '@/types/security';

interface HeaderProps {
  demoState: DemoState;
}

export function Header({ demoState }: HeaderProps) {
  const getStatusColor = () => {
    if (demoState.currentPhase === 'normal') return 'text-cyber-green';
    if (demoState.currentPhase === 'stabilized') return 'text-cyber-green';
    if (demoState.currentPhase === 'isolated') return 'text-cyber-purple';
    if (demoState.currentPhase === 'detected') return 'text-cyber-red';
    return 'text-cyber-amber';
  };

  const getStatusText = () => {
    const statusMap: Record<string, string> = {
      normal: 'SYSTEM NOMINAL',
      suspicious: 'ANOMALY DETECTED',
      detected: 'THREAT CONFIRMED',
      isolated: 'CONTAINMENT ACTIVE',
      stabilized: 'SYSTEM STABILIZED',
    };
    return statusMap[demoState.currentPhase];
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sentira Logo" className="h-8 w-auto" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary text-glow-cyan">SENTIRA</span>
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              Sense. Think. Respond.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${demoState.isRunning ? 'text-cyber-amber animate-pulse' : 'text-cyber-green'}`} />
            <span className="text-xs font-mono text-muted-foreground">LIVE</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <Activity className="h-4 w-4 text-primary animate-pulse" />
        </div>

        {/* System Status */}
        <div className={`px-4 py-1.5 rounded border ${
          demoState.currentPhase === 'normal' || demoState.currentPhase === 'stabilized'
            ? 'border-cyber-green/30 bg-cyber-green/10'
            : demoState.currentPhase === 'isolated'
            ? 'border-cyber-purple/30 bg-cyber-purple/10'
            : demoState.currentPhase === 'detected'
            ? 'border-cyber-red/30 bg-cyber-red/10 animate-pulse-threat'
            : 'border-cyber-amber/30 bg-cyber-amber/10'
        }`}>
          <span className={`text-xs font-mono font-semibold tracking-wider ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Time */}
        <div className="text-right">
          <div className="text-xs font-mono text-primary">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>
    </header>
  );
}
