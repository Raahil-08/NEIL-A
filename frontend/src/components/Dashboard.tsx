import { useState, useEffect } from "react";
import { ServiceCard } from "./ServiceCard";
import { DemoControls } from "./DemoControls";
import { MetricsGrid } from "./MetricsGrid";
import { IncidentHighlight } from "./IncidentHighlight";
import { TelemetryFeed } from "./TelemetryFeed";
import type { Incident, ServiceStatus } from "../App";

interface DashboardProps {
  onNavigateToIncidents: (incident?: Incident) => void;
}

export function Dashboard({
  onNavigateToIncidents,
}: DashboardProps) {
  const [time, setTime] = useState(new Date());
  const [demoState, setDemoState] = useState<
    "normal" | "credential-stuffing" | "data-exfiltration"
  >("normal");
  const [autoResponse, setAutoResponse] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "Auth Service",
      status: "Healthy",
      metrics: [85, 87, 86, 88, 90, 89, 91, 90],
    },
    {
      name: "Data API",
      status: "Healthy",
      metrics: [92, 93, 91, 94, 93, 95, 94, 96],
    },
    {
      name: "Billing Service",
      status: "Healthy",
      metrics: [88, 89, 90, 88, 87, 89, 90, 91],
    },
  ]);
  const [activeIncident, setActiveIncident] =
    useState<Incident | null>(null);

  useEffect(() => {
    const interval = setInterval(
      () => setTime(new Date()),
      1000,
    );
    return () => clearInterval(interval);
  }, []);

  const handleDemoAction = (action: string) => {
    if (action === "credential-stuffing") {
      setDemoState("credential-stuffing");
      setServices([
        {
          name: "Auth Service",
          status: "Isolated",
          metrics: [85, 87, 50, 45, 40, 38, 35, 30],
        },
        {
          name: "Data API",
          status: "Healthy",
          metrics: [92, 93, 91, 94, 93, 95, 94, 96],
        },
        {
          name: "Billing Service",
          status: "Healthy",
          metrics: [88, 89, 90, 88, 87, 89, 90, 91],
        },
      ]);
      setActiveIncident({
        id: "INC-2025-001",
        severity: "SEV1",
        type: "Credential Stuffing",
        status: "Contained",
        sourceIp: "203.45.167.89",
        user: "automated-bot-network",
        startTime: new Date(Date.now() - 120000),
        lastSeen: new Date(),
        reasons: [
          {
            rule: "High-Velocity Login Attempts",
            observed: "2,847 requests/min",
            threshold: "50 requests/min",
            timeWindow: "5 minutes",
            delta: "+5594%",
            explanation:
              "Detected 56x normal login rate from single IP address",
          },
          {
            rule: "Distributed User Enumeration",
            observed: "1,203 unique usernames",
            threshold: "10 unique users/IP",
            timeWindow: "10 minutes",
            delta: "+12030%",
            explanation:
              "Single IP attempting to authenticate as 1,203 different users",
          },
        ],
        actions: [
          {
            action: "Block source IP: 203.45.167.89",
            timestamp: new Date(Date.now() - 60000),
            type: "Auto",
          },
          {
            action: "Isolate /auth/login endpoint",
            timestamp: new Date(Date.now() - 55000),
            type: "Auto",
          },
          {
            action: "Enable aggressive rate limiting",
            timestamp: new Date(Date.now() - 50000),
            type: "Auto",
          },
        ],
        timeline: [
          { phase: "Normal", active: false, completed: true },
          {
            phase: "Suspicious",
            active: false,
            completed: true,
          },
          {
            phase: "Confirmed",
            active: false,
            completed: true,
          },
          { phase: "Isolated", active: true, completed: false },
          {
            phase: "Stabilized",
            active: false,
            completed: false,
          },
        ],
      });
    } else if (action === "data-exfiltration") {
      setDemoState("data-exfiltration");
      setServices([
        {
          name: "Auth Service",
          status: "Healthy",
          metrics: [85, 87, 86, 88, 90, 89, 91, 90],
        },
        {
          name: "Data API",
          status: "Isolated",
          metrics: [92, 93, 91, 94, 110, 125, 98, 65],
        },
        {
          name: "Billing Service",
          status: "Healthy",
          metrics: [88, 89, 90, 88, 87, 89, 90, 91],
        },
      ]);
      setActiveIncident({
        id: "INC-2025-002",
        severity: "SEV1",
        type: "Data Exfiltration",
        status: "Contained",
        sourceIp: "198.51.100.42",
        user: "admin@company.com",
        startTime: new Date(Date.now() - 180000),
        lastSeen: new Date(),
        reasons: [
          {
            rule: "Anomalous Data Export Volume",
            observed: "4.7 GB exported",
            threshold: "100 MB/hour",
            timeWindow: "15 minutes",
            delta: "+4700%",
            explanation:
              "Legitimate admin account exporting 47x normal data volume",
          },
          {
            rule: "Unusual Export Endpoint Usage",
            observed: "347 requests to /data/export",
            threshold: "5 requests/hour",
            timeWindow: "30 minutes",
            delta: "+6940%",
            explanation:
              "Authorized user making bulk export requests at unprecedented rate",
          },
        ],
        actions: [
          {
            action: "Rate limit /data/export endpoint",
            timestamp: new Date(Date.now() - 90000),
            type: "Auto",
          },
          {
            action: "Isolate data export functionality",
            timestamp: new Date(Date.now() - 75000),
            type: "Auto",
          },
          {
            action: "Notify security team",
            timestamp: new Date(Date.now() - 60000),
            type: "Auto",
          },
        ],
        timeline: [
          { phase: "Normal", active: false, completed: true },
          {
            phase: "Suspicious",
            active: false,
            completed: true,
          },
          {
            phase: "Confirmed",
            active: false,
            completed: true,
          },
          { phase: "Isolated", active: true, completed: false },
          {
            phase: "Stabilized",
            active: false,
            completed: false,
          },
        ],
      });
    } else if (action === "reset") {
      setDemoState("normal");
      setServices([
        {
          name: "Auth Service",
          status: "Healthy",
          metrics: [85, 87, 86, 88, 90, 89, 91, 90],
        },
        {
          name: "Data API",
          status: "Healthy",
          metrics: [92, 93, 91, 94, 93, 95, 94, 96],
        },
        {
          name: "Billing Service",
          status: "Healthy",
          metrics: [88, 89, 90, 88, 87, 89, 90, 91],
        },
      ]);
      setActiveIncident(null);
    }
  };

  return (
    <div className="min-h-screen relative">
      
      <header className="bg-card/80 backdrop-blur-sm border-b border-border relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Sentira
            </h1>
            <p className="text-sm text-neutral-300">
              Cyber Resilience Platform
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-sm text-neutral-300">
                Connected
              </span>
            </div>
            <div className="text-sm text-neutral-300">
              {time.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Service Status Grid */}
        <section>
          <h2 className="text-sm font-medium text-neutral-300 mb-4 uppercase tracking-wide">
            Service Status
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {services.map((service, index) => (
              <ServiceCard
                key={service.name}
                service={service}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Demo Controls */}
        <DemoControls
          autoResponse={autoResponse}
          onAutoResponseToggle={() =>
            setAutoResponse(!autoResponse)
          }
          onDemoAction={handleDemoAction}
          currentState={demoState}
        />

        {!autoResponse && (
          <div className="p-4 bg-amber-900/30 border border-amber-600/50 rounded-lg">
            <p className="text-sm text-amber-200">
              ⚠️ Human approval required for containment actions
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Metrics */}
          <div className="col-span-2 space-y-6">
            <MetricsGrid demoState={demoState} />
            <TelemetryFeed demoState={demoState} />
          </div>

          {/* Active Incident */}
          <div>
            {activeIncident && (
              <IncidentHighlight
                incident={activeIncident}
                onViewIncident={() =>
                  onNavigateToIncidents(activeIncident)
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}