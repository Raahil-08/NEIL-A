interface MetricsGridProps {
  demoState: 'normal' | 'credential-stuffing' | 'data-exfiltration';
}

export function MetricsGrid({ demoState }: MetricsGridProps) {
  const getMetrics = () => {
    switch (demoState) {
      case 'credential-stuffing':
        return {
          eventsPerSec: 2847,
          rps: 3250,
          latency: 45,
          errorRate: 15.3,
          detectionLatency: 1.2,
          responseLatency: 0.8,
        };
      case 'data-exfiltration':
        return {
          eventsPerSec: 347,
          rps: 1850,
          latency: 78,
          errorRate: 8.7,
          detectionLatency: 2.1,
          responseLatency: 1.5,
        };
      default:
        return {
          eventsPerSec: 125,
          rps: 1200,
          latency: 12,
          errorRate: 0.2,
          detectionLatency: 5.4,
          responseLatency: 3.2,
        };
    }
  };

  const metrics = getMetrics();

  return (
    <section>
      <h2 className="text-sm font-medium text-neutral-300 mb-4 uppercase tracking-wide">
        System Metrics
      </h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Events/sec</div>
          <div className={`text-2xl font-semibold ${demoState !== 'normal' ? 'text-red-400' : 'text-white'}`}>
            {metrics.eventsPerSec.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Current RPS</div>
          <div className="text-2xl font-semibold text-white">
            {metrics.rps.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Avg Latency</div>
          <div className={`text-2xl font-semibold ${metrics.latency > 50 ? 'text-amber-400' : 'text-white'}`}>
            {metrics.latency}ms
          </div>
        </div>

        <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Error Rate</div>
          <div className={`text-2xl font-semibold ${metrics.errorRate > 5 ? 'text-red-400' : 'text-white'}`}>
            {metrics.errorRate}%
          </div>
        </div>

        <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Detection Time</div>
          <div className="text-2xl font-semibold text-white">
            {metrics.detectionLatency}s
          </div>
        </div>

        <div className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Response Time</div>
          <div className="text-2xl font-semibold text-white">
            {metrics.responseLatency}s
          </div>
        </div>
      </div>
    </section>
  );
}