-- Create table for threat events
CREATE TABLE public.threat_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('api_abuse', 'token_misuse', 'session_anomaly', 'data_exfiltration')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip TEXT NOT NULL,
  target_endpoint TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'suspicious' CHECK (status IN ('suspicious', 'detected', 'isolated', 'stabilized', 'mitigated')),
  anomaly_score INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL,
  ip_reputation_score INTEGER,
  ip_reputation_involved BOOLEAN DEFAULT false,
  weather_context_applied BOOLEAN DEFAULT false,
  weather_modifier DECIMAL(4,2),
  mitigation_applied TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for system metrics
CREATE TABLE public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('traffic', 'anomaly', 'latency', 'requests')),
  value DECIMAL NOT NULL,
  baseline DECIMAL NOT NULL,
  anomaly_score DECIMAL NOT NULL DEFAULT 0,
  node_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for system nodes state
CREATE TABLE public.system_nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('api', 'database', 'auth', 'storage', 'gateway')),
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'isolated', 'recovering')),
  connections TEXT[] NOT NULL DEFAULT '{}',
  requests INTEGER NOT NULL DEFAULT 0,
  latency INTEGER NOT NULL DEFAULT 0,
  error_rate DECIMAL NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for demo state
CREATE TABLE public.demo_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_running BOOLEAN NOT NULL DEFAULT false,
  current_phase TEXT NOT NULL DEFAULT 'normal' CHECK (current_phase IN ('normal', 'suspicious', 'detected', 'isolated', 'stabilized')),
  active_attack_id UUID REFERENCES public.threat_events(id) ON DELETE SET NULL,
  auto_approve BOOLEAN NOT NULL DEFAULT true,
  pending_mitigation_id UUID REFERENCES public.threat_events(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for IP reputation cache
CREATE TABLE public.ip_reputation_cache (
  ip_address TEXT PRIMARY KEY,
  abuse_confidence INTEGER NOT NULL,
  country_code TEXT,
  isp TEXT,
  domain TEXT,
  is_tor BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  total_reports INTEGER DEFAULT 0,
  last_reported_at TIMESTAMP WITH TIME ZONE,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Create table for weather context cache
CREATE TABLE public.weather_cache (
  location TEXT PRIMARY KEY DEFAULT 'default',
  condition TEXT NOT NULL,
  temperature DECIMAL,
  humidity INTEGER,
  wind_speed DECIMAL,
  is_severe BOOLEAN DEFAULT false,
  severity_modifier DECIMAL(4,2) DEFAULT 1.0,
  description TEXT,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.threat_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demo_state;

-- Create index for faster queries
CREATE INDEX idx_threat_events_created_at ON public.threat_events(created_at DESC);
CREATE INDEX idx_system_metrics_created_at ON public.system_metrics(created_at DESC);
CREATE INDEX idx_ip_cache_expires ON public.ip_reputation_cache(expires_at);
CREATE INDEX idx_weather_cache_expires ON public.weather_cache(expires_at);

-- Insert default demo state
INSERT INTO public.demo_state (id) VALUES ('default');

-- Insert initial system nodes
INSERT INTO public.system_nodes (id, name, node_type, status, connections, latency) VALUES
  ('gateway', 'API Gateway', 'gateway', 'healthy', ARRAY['auth', 'api-patients', 'api-appointments'], 45),
  ('auth', 'Auth Service', 'auth', 'healthy', ARRAY['database', 'gateway'], 35),
  ('api-patients', 'Patient Records API', 'api', 'healthy', ARRAY['database', 'gateway', 'storage'], 120),
  ('api-appointments', 'Appointments API', 'api', 'healthy', ARRAY['database', 'gateway'], 80),
  ('database', 'PostgreSQL DB', 'database', 'healthy', ARRAY['auth', 'api-patients', 'api-appointments'], 15),
  ('storage', 'File Storage', 'storage', 'healthy', ARRAY['api-patients'], 200);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_threat_events_updated_at
  BEFORE UPDATE ON public.threat_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_nodes_updated_at
  BEFORE UPDATE ON public.system_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demo_state_updated_at
  BEFORE UPDATE ON public.demo_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Since this is a public demo, enable public read access
ALTER TABLE public.threat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_reputation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (public access)
CREATE POLICY "Public read access for threat_events" ON public.threat_events FOR SELECT USING (true);
CREATE POLICY "Public insert access for threat_events" ON public.threat_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for threat_events" ON public.threat_events FOR UPDATE USING (true);
CREATE POLICY "Public delete access for threat_events" ON public.threat_events FOR DELETE USING (true);

CREATE POLICY "Public read access for system_metrics" ON public.system_metrics FOR SELECT USING (true);
CREATE POLICY "Public insert access for system_metrics" ON public.system_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for system_nodes" ON public.system_nodes FOR SELECT USING (true);
CREATE POLICY "Public update access for system_nodes" ON public.system_nodes FOR UPDATE USING (true);

CREATE POLICY "Public read access for demo_state" ON public.demo_state FOR SELECT USING (true);
CREATE POLICY "Public update access for demo_state" ON public.demo_state FOR UPDATE USING (true);

CREATE POLICY "Public access for ip_reputation_cache" ON public.ip_reputation_cache FOR ALL USING (true);
CREATE POLICY "Public access for weather_cache" ON public.weather_cache FOR ALL USING (true);