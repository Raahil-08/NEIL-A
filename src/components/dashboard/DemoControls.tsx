import { ThreatEvent } from '@/types/security';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Key, 
  Cookie, 
  Database, 
  RotateCcw, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface DemoControlsProps {
  isRunning: boolean;
  autoApprove: boolean;
  pendingMitigation: string | null;
  hasThreats: boolean;
  onTriggerAttack: (type: ThreatEvent['type']) => void;
  onApproveMitigation: () => void;
  onToggleAutoApprove: () => void;
  onReset: () => void;
}

export function DemoControls({
  isRunning,
  autoApprove,
  pendingMitigation,
  hasThreats,
  onTriggerAttack,
  onApproveMitigation,
  onToggleAutoApprove,
  onReset,
}: DemoControlsProps) {
  const attacks = [
    { type: 'api_abuse' as const, label: 'API Abuse', icon: Zap, description: 'High-frequency requests' },
    { type: 'token_misuse' as const, label: 'Token Misuse', icon: Key, description: 'Abnormal token reuse' },
    { type: 'session_anomaly' as const, label: 'Session Anomaly', icon: Cookie, description: 'Unusual behavior' },
    { type: 'data_exfiltration' as const, label: 'Data Exfil', icon: Database, description: 'Large data transfer' },
  ];

  return (
    <div className="cyber-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Demo Mode</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Auto-approve</span>
          <Switch 
            checked={autoApprove} 
            onCheckedChange={onToggleAutoApprove}
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Simulated Attack Warning */}
      <div className="p-2 rounded bg-cyber-amber/10 border border-cyber-amber/30">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-cyber-amber flex-shrink-0" />
          <span className="text-[10px] text-cyber-amber font-mono">
            SIMULATED ATTACKS — FOR DEMONSTRATION ONLY
          </span>
        </div>
      </div>

      {/* Attack Triggers */}
      <div className="grid grid-cols-2 gap-2">
        {attacks.map(attack => {
          const isCritical = attack.type === 'data_exfiltration';
          return (
            <Button
              key={attack.type}
              variant="outline"
              size="sm"
              className={`
                h-auto py-3 flex flex-col items-center gap-1 relative overflow-hidden
                border-border transition-all duration-200 group
                ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyber-amber/50 hover:bg-cyber-amber/5'}
                ${isCritical && !isRunning ? 'hover:border-cyber-red/50 hover:bg-cyber-red/5' : ''}
              `}
              disabled={isRunning}
              onClick={() => onTriggerAttack(attack.type)}
            >
              <attack.icon className={`h-5 w-5 ${isCritical ? 'text-cyber-red' : 'text-cyber-amber'} transition-transform group-hover:scale-110`} />
              <span className="text-xs font-medium">{attack.label}</span>
              <span className="text-[9px] text-muted-foreground">{attack.description}</span>
            </Button>
          );
        })}
      </div>

      {/* Human-in-the-loop approval */}
      {pendingMitigation && !autoApprove && (
        <div className="animate-scale-in">
          <Button
            variant="default"
            size="lg"
            className="w-full bg-cyber-green hover:bg-cyber-green/90 text-background font-semibold glow-green"
            onClick={onApproveMitigation}
          >
            <ShieldCheck className="h-5 w-5 mr-2" />
            Approve Mitigation
          </Button>
        </div>
      )}

      {/* Reset */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full hover:bg-secondary"
        onClick={onReset}
        disabled={!isRunning && !pendingMitigation && !hasThreats}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset Demo
      </Button>

      {/* Status indicator */}
      <div className="text-center">
        <span className={`text-xs font-mono ${isRunning ? 'text-cyber-amber animate-pulse' : 'text-cyber-green'}`}>
          {isRunning ? '● ATTACK IN PROGRESS' : '○ READY FOR DEMO'}
        </span>
      </div>
    </div>
  );
}
