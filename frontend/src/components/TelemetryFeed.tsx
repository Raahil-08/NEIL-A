import { useState, useEffect } from 'react';

interface TelemetryFeedProps {
  demoState: 'normal' | 'credential-stuffing' | 'data-exfiltration';
}

type LogLevel = 'info' | 'warning' | 'error';

type LogTemplate = {
  level: LogLevel;
  message: string;
};

interface LogEntry extends LogTemplate {
  id: string;
  timestamp: string;
}

export function TelemetryFeed({ demoState }: TelemetryFeedProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const generateLog = (): LogEntry => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString();

      const normalLogs: LogTemplate[] = [
        { level: 'info', message: 'User authentication successful' },
        { level: 'info', message: 'Query executed successfully (12ms)' },
        { level: 'info', message: 'Payment processed' },
        { level: 'info', message: 'Health check passed' },
      ];

      const credentialStuffingLogs: LogTemplate[] = [
        { level: 'warning', message: 'High velocity login attempts detected' },
        { level: 'error', message: 'Credential stuffing attack - 2847 req/min' },
        { level: 'error', message: 'IP 203.45.167.89 blocked' },
        { level: 'warning', message: 'Isolating /auth/login endpoint' },
        { level: 'info', message: 'Rate limiting enabled' },
      ];

      const dataExfiltrationLogs: LogTemplate[] = [
        { level: 'warning', message: 'Unusual export volume detected' },
        { level: 'error', message: 'Admin account exporting 4.7 GB (47x normal)' },
        { level: 'error', message: 'Data exfiltration from 198.51.100.42' },
        { level: 'warning', message: 'Rate limiting /data/export' },
        { level: 'info', message: 'Data export isolated' },
      ];

      const logPool: LogTemplate[] =
        demoState === 'credential-stuffing'
          ? credentialStuffingLogs
          : demoState === 'data-exfiltration'
            ? dataExfiltrationLogs
            : normalLogs;

      const log = logPool[Math.floor(Math.random() * logPool.length)];

      return {
        id: `${Date.now()}-${Math.random()}`,
        timestamp,
        ...log,
      };
    };

    const interval = setInterval(() => {
      const newLog = generateLog();
      setLogs((prev) => [newLog, ...prev].slice(0, 15));
    }, demoState === 'normal' ? 2000 : 1000);

    return () => clearInterval(interval);
  }, [demoState]);

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <section>
      <h2 className="text-sm font-medium text-neutral-300 mb-4 uppercase tracking-wide flex items-center gap-2">
        <span>Activity Feed</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </h2>

      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 h-64 overflow-auto">
        <div className="space-y-2 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <span className="text-neutral-400 whitespace-nowrap">{log.timestamp}</span>
              <span className={`font-medium uppercase ${getLevelStyle(log.level)} whitespace-nowrap`}>
                [{log.level}]
              </span>
              <span className="text-white">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}