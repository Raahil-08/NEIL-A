import { useEffect, useRef } from 'react';
import { SystemNode } from '@/types/security';
import { Database, Shield, Server, HardDrive, Router } from 'lucide-react';

interface NetworkTopologyProps {
  nodes: SystemNode[];
}

const nodePositions: Record<string, { x: number; y: number }> = {
  gateway: { x: 50, y: 15 },
  auth: { x: 25, y: 45 },
  'api-patients': { x: 50, y: 45 },
  'api-appointments': { x: 75, y: 45 },
  database: { x: 37.5, y: 80 },
  storage: { x: 62.5, y: 80 },
};

const statusColors: Record<string, string> = {
  healthy: 'cyber-green',
  warning: 'cyber-amber',
  critical: 'cyber-red',
  isolated: 'cyber-purple',
  recovering: 'cyber-cyan',
};

const NodeIcon = ({ type }: { type: SystemNode['type'] }) => {
  const iconClass = "h-5 w-5";
  switch (type) {
    case 'gateway': return <Router className={iconClass} />;
    case 'auth': return <Shield className={iconClass} />;
    case 'api': return <Server className={iconClass} />;
    case 'database': return <Database className={iconClass} />;
    case 'storage': return <HardDrive className={iconClass} />;
    default: return <Server className={iconClass} />;
  }
};

export function NetworkTopology({ nodes }: NetworkTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw connections
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    nodes.forEach(node => {
      const fromPos = nodePositions[node.id];
      if (!fromPos) return;

      node.connections.forEach(connId => {
        const toPos = nodePositions[connId];
        if (!toPos) return;

        const fromX = (fromPos.x / 100) * canvas.width;
        const fromY = (fromPos.y / 100) * canvas.height;
        const toX = (toPos.x / 100) * canvas.width;
        const toY = (toPos.y / 100) * canvas.height;

        // Get connection color based on node statuses
        const toNode = nodes.find(n => n.id === connId);
        const isAffected = node.status !== 'healthy' || (toNode && toNode.status !== 'healthy');

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        
        if (isAffected) {
          ctx.strokeStyle = node.status === 'critical' || toNode?.status === 'critical'
            ? 'rgba(239, 68, 68, 0.6)'
            : node.status === 'isolated' || toNode?.status === 'isolated'
            ? 'rgba(167, 139, 250, 0.6)'
            : 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(0, 230, 230, 0.2)';
          ctx.lineWidth = 1;
        }
        
        ctx.stroke();
      });
    });
  }, [nodes]);

  return (
    <div className="cyber-card p-4 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-4">Network Topology</h3>
      
      <div className="relative h-[280px]">
        {/* Connection lines canvas */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Nodes */}
        {nodes.map(node => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const color = statusColors[node.status];
          const isAnimating = node.status === 'critical' || node.status === 'isolated';

          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {/* Ripple effect for affected nodes */}
              {isAnimating && (
                <div className={`absolute inset-0 rounded-full bg-${color}/30 animate-ripple`} />
              )}
              
              <div className={`
                relative flex flex-col items-center gap-1.5 p-2 rounded-lg
                border transition-all duration-300
                ${node.status === 'healthy' ? 'border-cyber-green/30 bg-cyber-green/5' : ''}
                ${node.status === 'warning' ? 'border-cyber-amber/30 bg-cyber-amber/10' : ''}
                ${node.status === 'critical' ? 'border-cyber-red/50 bg-cyber-red/20 glow-red animate-pulse-threat' : ''}
                ${node.status === 'isolated' ? 'border-cyber-purple/50 bg-cyber-purple/20 glow-purple' : ''}
                ${node.status === 'recovering' ? 'border-cyber-cyan/30 bg-cyber-cyan/10 animate-pulse-glow' : ''}
              `}>
                <div className={`text-${color}`}>
                  <NodeIcon type={node.type} />
                </div>
                <span className="text-[10px] font-mono text-foreground whitespace-nowrap">
                  {node.name.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full bg-${color}`} />
            <span className="text-[10px] text-muted-foreground capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
