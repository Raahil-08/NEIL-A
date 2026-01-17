import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { ServiceStatus } from '../App';

interface ServiceCardProps {
  service: ServiceStatus;
  index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  const data = service.metrics.map((value, i) => ({ value, index: i }));

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Healthy':
        return {
          border: 'border-emerald-500/30',
          bg: 'bg-card/80 backdrop-blur-sm',
          statusColor: 'text-emerald-400',
          dotColor: 'bg-emerald-500',
          lineColor: '#10b981'
        };
      case 'Suspicious':
        return {
          border: 'border-amber-500/30',
          bg: 'bg-amber-900/20 backdrop-blur-sm',
          statusColor: 'text-amber-400',
          dotColor: 'bg-amber-500',
          lineColor: '#f59e0b'
        };
      case 'Isolated':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-900/20 backdrop-blur-sm',
          statusColor: 'text-red-400',
          dotColor: 'bg-red-500',
          lineColor: '#ef4444'
        };
      default:
        return {
          border: 'border-border',
          bg: 'bg-card/80 backdrop-blur-sm',
          statusColor: 'text-muted-foreground',
          dotColor: 'bg-muted-foreground',
          lineColor: '#6b7280'
        };
    }
  };

  const style = getStatusStyle(service.status);

  return (
    <div className={`p-5 rounded-lg border ${style.border} ${style.bg}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-white mb-1">{service.name}</h3>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
            <span className={`text-sm ${style.statusColor}`}>
              {service.status}
            </span>
          </div>
        </div>
      </div>

      <div className="h-16 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={style.lineColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {service.status === 'Isolated' && (
        <div className="mt-4 pt-4 border-t border-red-500/30">
          <p className="text-xs text-red-400">
            Component isolated • Other services operational
          </p>
        </div>
      )}
    </div>
  );
}