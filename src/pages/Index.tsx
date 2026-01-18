import { useBackendSimulation } from '@/hooks/useBackendSimulation';
import { Header } from '@/components/dashboard/Header';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { NetworkTopology } from '@/components/dashboard/NetworkTopology';
import { AttackTimeline } from '@/components/dashboard/AttackTimeline';
import { ThreatCard } from '@/components/dashboard/ThreatCard';
import { ExplanationPanel } from '@/components/dashboard/ExplanationPanel';
import { DemoControls } from '@/components/dashboard/DemoControls';
import { SystemMetrics } from '@/components/dashboard/SystemMetrics';
import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { IntelligenceIndicators } from '@/components/dashboard/IntelligenceIndicators';

const Index = () => {
  const {
    trafficData,
    systemNodes,
    threats,
    demoState,
    pendingMitigation,
    weather,
    isConnected,
    triggerAttack,
    approveMitigation,
    toggleAutoApprove,
    resetDemo,
  } = useBackendSimulation();

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      {/* Offline Overlay */}
      {!isConnected && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="cyber-card p-8 text-center max-w-md">
            <div className="text-cyber-red text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-cyber-red mb-2">DATA STREAM OFFLINE</h2>
            <p className="text-muted-foreground text-sm">
              Connection to backend lost. Charts frozen. No fake updates will be generated.
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <Header demoState={demoState} />

      {/* Connection Status Bar */}
      <div className="px-4 py-2 border-b border-border">
        <div className="max-w-[1920px] mx-auto">
          <ConnectionStatus isConnected={isConnected} weather={weather} />
        </div>
      </div>

      {/* Main Grid */}
      <main className="p-4 grid grid-cols-12 gap-4 max-w-[1920px] mx-auto">
        {/* Left Column - Metrics & Network */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <SystemMetrics nodes={systemNodes} />
          <DemoControls
            isRunning={demoState.isRunning}
            autoApprove={demoState.autoApprove}
            pendingMitigation={pendingMitigation}
            hasThreats={threats.length > 0}
            onTriggerAttack={triggerAttack}
            onApproveMitigation={approveMitigation}
            onToggleAutoApprove={toggleAutoApprove}
            onReset={resetDemo}
          />
          <IntelligenceIndicators threat={demoState.activeAttack} />
        </div>

        {/* Center Column - Charts & Timeline */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            <TrafficChart 
              data={trafficData} 
              title="Traffic Volume" 
              type="traffic" 
            />
            <TrafficChart 
              data={trafficData} 
              title="Anomaly Score" 
              type="anomaly" 
            />
          </div>

          {/* Attack Timeline */}
          <AttackTimeline demoState={demoState} />

          {/* Network Topology */}
          <NetworkTopology nodes={systemNodes} />
        </div>

        {/* Right Column - AI Analysis & Threats */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {/* AI Explanation Panel */}
          <div className="h-[320px]">
            <ExplanationPanel threat={demoState.activeAttack} />
          </div>

          {/* Recent Threats */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground px-1">Recent Threats</h3>
            {threats.length > 0 ? (
              threats.slice(0, 3).map(threat => (
                <ThreatCard 
                  key={threat.id} 
                  threat={threat}
                  isActive={demoState.activeAttack?.id === threat.id}
                />
              ))
            ) : (
              <div className="cyber-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No threats detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Trigger a simulated attack to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-border mt-8">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>SENTIRA v1.0 — Cyber Command Center Demo</span>
          <span className="font-mono">⚠️ All attacks are SIMULATED for defensive security demonstration</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
