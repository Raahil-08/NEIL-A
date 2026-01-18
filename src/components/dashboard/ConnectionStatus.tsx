import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  weather?: {
    condition: string;
    is_severe: boolean;
    description: string;
  } | null;
}

export function ConnectionStatus({ isConnected, weather }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Connection Status */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${
        isConnected 
          ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' 
          : 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30 animate-pulse'
      }`}>
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>BACKEND CONNECTED</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>DATA STREAM OFFLINE</span>
          </>
        )}
      </div>

      {/* Weather Context */}
      {weather && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${
          weather.is_severe
            ? 'bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30'
            : 'bg-muted text-muted-foreground border border-border'
        }`}>
          <span>
            {weather.is_severe ? '⚠️ ' : '☀️ '}
            {weather.condition.toUpperCase()}
          </span>
          {weather.is_severe && (
            <span className="text-[10px] opacity-75">| THRESHOLDS RELAXED</span>
          )}
        </div>
      )}
    </div>
  );
}