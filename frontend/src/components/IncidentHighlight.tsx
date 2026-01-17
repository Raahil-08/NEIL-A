import { ArrowRight } from 'lucide-react';
import type { Incident } from '../App';

interface IncidentHighlightProps {
  incident: Incident;
  onViewIncident: () => void;
}

export function IncidentHighlight({ incident, onViewIncident }: IncidentHighlightProps) {
  return (
    <div className="p-5 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded mb-2">
            {incident.severity}
          </span>
          <h3 className="font-medium text-white">{incident.type}</h3>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div>
          <span className="text-neutral-400">Source: </span>
          <span className="font-mono text-white">{incident.sourceIp}</span>
        </div>
        <div>
          <span className="text-neutral-400">Status: </span>
          <span className="text-amber-400">{incident.status}</span>
        </div>
      </div>

      {incident.reasons[0] && (
        <div className="p-3 bg-secondary rounded mb-4">
          <p className="text-xs text-neutral-300 leading-relaxed">
            {incident.reasons[0].explanation}
          </p>
        </div>
      )}

      <button
        onClick={onViewIncident}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/80 transition-colors"
      >
        <span>View Details</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}