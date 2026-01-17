import { CheckCircle, Circle } from 'lucide-react';
import type { Incident } from '../App';

interface IncidentDetailsProps {
  incident: Incident;
}

export function IncidentDetails({ incident }: IncidentDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Incident Summary */}
      <div className="p-5 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{incident.type}</h3>
            <p className="text-sm text-neutral-400 font-mono">{incident.id}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            incident.severity === 'SEV1'
              ? 'bg-red-500/20 text-red-400'
              : incident.severity === 'SEV2'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            {incident.severity}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-400 mb-1">Source IP</p>
            <p className="font-mono text-white">{incident.sourceIp}</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">User</p>
            <p className="font-mono text-white">{incident.user}</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Started</p>
            <p className="text-white">{incident.startTime.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Status</p>
            <p className={`font-medium ${
              incident.status === 'Active' ? 'text-red-400' :
              incident.status === 'Contained' ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              {incident.status}
            </p>
          </div>
        </div>
      </div>

      {/* Detection Reasons */}
      <div>
        <h4 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wide">
          Detection Reasons
        </h4>
        <div className="space-y-3">
          {incident.reasons.map((reason, index) => (
            <div key={index} className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
              <h5 className="font-medium text-white mb-3">{reason.rule}</h5>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-neutral-400">Observed: </span>
                  <span className="text-red-400 font-medium">{reason.observed}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Threshold: </span>
                  <span className="text-white">{reason.threshold}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Time Window: </span>
                  <span className="text-white">{reason.timeWindow}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Delta: </span>
                  <span className="text-red-400 font-medium">{reason.delta}</span>
                </div>
              </div>
              <div className="p-3 bg-secondary rounded">
                <p className="text-xs text-neutral-300 leading-relaxed">{reason.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wide">
          Timeline
        </h4>
        <div className="p-5 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
          <div className="flex items-center justify-between">
            {incident.timeline.map((phase, index) => (
              <div key={index} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    phase.completed
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : phase.active
                      ? 'bg-primary border-primary'
                      : 'bg-card border-border'
                  }`}>
                    {phase.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className={`w-4 h-4 ${phase.active ? 'text-white' : 'text-neutral-500'}`} />
                    )}
                  </div>
                  <p className={`mt-2 text-xs font-medium ${
                    phase.completed ? 'text-emerald-400' :
                    phase.active ? 'text-white' :
                    'text-neutral-500'
                  }`}>
                    {phase.phase}
                  </p>
                </div>
                {index < incident.timeline.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    phase.completed ? 'bg-emerald-500' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Taken */}
      <div>
        <h4 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wide">
          Actions Taken
        </h4>
        <div className="space-y-2">
          {incident.actions.map((action, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
              <div className="flex-1">
                <p className="text-sm text-white">{action.action}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{action.timestamp.toLocaleString()}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                action.type === 'Auto'
                  ? 'bg-secondary text-neutral-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {action.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mitigations */}
      <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-4">Active Mitigations</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-400 mb-1">Blocked IPs</p>
            <p className="text-lg font-semibold text-white">1</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Isolated Endpoints</p>
            <p className="text-lg font-semibold text-white">1</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Rate Limits</p>
            <p className="text-lg font-semibold text-white">Active</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">System Status</p>
            <p className="text-sm font-medium text-emerald-400">Operational</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-emerald-500/30">
          <p className="text-xs text-emerald-400">
            ✓ Affected component isolated • Other services operational
          </p>
        </div>
      </div>
    </div>
  );
}