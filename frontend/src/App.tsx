import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Incidents } from './components/Incidents';
import Squares from './components/Squares';

type Screen = 'dashboard' | 'incidents';

export interface Incident {
  id: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3';
  type: string;
  status: 'Active' | 'Contained' | 'Resolved';
  sourceIp: string;
  user: string;
  startTime: Date;
  lastSeen: Date;
  reasons: Array<{
    rule: string;
    observed: string;
    threshold: string;
    timeWindow: string;
    delta: string;
    explanation: string;
  }>;
  actions: Array<{
    action: string;
    timestamp: Date;
    type: 'Auto' | 'Manual';
  }>;
  timeline: Array<{
    phase: string;
    active: boolean;
    completed: boolean;
  }>;
}

export interface ServiceStatus {
  name: string;
  status: 'Healthy' | 'Suspicious' | 'Isolated';
  metrics: number[];
}

function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const navigateToIncidents = (incident?: Incident) => {
    if (incident) {
      setSelectedIncident(incident);
    }
    setScreen('incidents');
  };

  const navigateToDashboard = () => {
    setScreen('dashboard');
    setSelectedIncident(null);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="rgba(138, 43, 226, 0.15)"
          squareSize={50}
          hoverFillColor="rgba(138, 43, 226, 0.15)"
        />
      </div>
      <div className="relative z-10">
        {screen === 'dashboard' ? (
          <Dashboard onNavigateToIncidents={navigateToIncidents} />
        ) : (
          <Incidents
            onNavigateToDashboard={navigateToDashboard}
            selectedIncident={selectedIncident}
          />
        )}
      </div>
    </div>
  );
}

export default App;