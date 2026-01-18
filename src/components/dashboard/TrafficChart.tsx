import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrafficMetric } from '@/types/security';
import { BASELINE } from '@/lib/anomalyDetection';

interface TrafficChartProps {
  data: TrafficMetric[];
  title: string;
  type: 'traffic' | 'anomaly';
}

export function TrafficChart({ data, title, type }: TrafficChartProps) {
  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      index: i,
      time: d.timestamp.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }),
      value: type === 'traffic' ? d.value : d.anomalyScore,
      baseline: type === 'traffic' ? d.baseline : 30,
    }));
  }, [data, type]);

  const maxValue = type === 'traffic' ? 300 : 100;
  const thresholdValue = type === 'traffic' ? BASELINE.requestsPerMinute * 2 : 50;
  
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const isAnomalous = currentValue > thresholdValue;

  const gradientId = type === 'traffic' ? 'trafficGradient' : 'anomalyGradient';
  const primaryColor = type === 'traffic' 
    ? (isAnomalous ? 'hsl(0, 85%, 55%)' : 'hsl(187, 100%, 50%)') 
    : (isAnomalous ? 'hsl(0, 85%, 55%)' : 'hsl(38, 100%, 55%)');

  return (
    <div className="cyber-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className={`px-2 py-0.5 rounded text-xs font-mono ${
          isAnomalous 
            ? 'bg-cyber-red/20 text-cyber-red' 
            : 'bg-cyber-green/20 text-cyber-green'
        }`}>
          {currentValue.toFixed(0)}{type === 'anomaly' ? '%' : '/min'}
        </div>
      </div>

      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }}
              width={30}
            />
            <ReferenceLine 
              y={thresholdValue} 
              stroke="hsl(38, 100%, 55%)" 
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>Baseline: {type === 'traffic' ? `${BASELINE.requestsPerMinute}/min` : '30%'}</span>
        <span className="text-cyber-amber">Threshold: {type === 'traffic' ? `${thresholdValue}/min` : '50%'}</span>
      </div>
    </div>
  );
}
