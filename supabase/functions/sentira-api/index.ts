import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= IP REPUTATION SERVICE =============
interface IPReputationResult {
  ip: string;
  abuseConfidenceScore: number;
  countryCode: string;
  isp: string;
  domain: string;
  isTor: boolean;
  isPublic: boolean;
  totalReports: number;
  lastReportedAt: string | null;
  isKnownMalicious: boolean;
  riskScore: number;
}

async function checkIPReputation(ip: string, supabase: any): Promise<IPReputationResult> {
  console.log(`[IP_REPUTATION] Checking reputation for IP: ${ip}`);
  
  // Check cache first
  const { data: cached } = await supabase
    .from('ip_reputation_cache')
    .select('*')
    .eq('ip_address', ip)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (cached) {
    console.log(`[IP_REPUTATION] Cache hit for ${ip}, abuse confidence: ${cached.abuse_confidence}`);
    return {
      ip,
      abuseConfidenceScore: cached.abuse_confidence,
      countryCode: cached.country_code || 'Unknown',
      isp: cached.isp || 'Unknown',
      domain: cached.domain || 'Unknown',
      isTor: cached.is_tor,
      isPublic: cached.is_public,
      totalReports: cached.total_reports,
      lastReportedAt: cached.last_reported_at,
      isKnownMalicious: cached.abuse_confidence >= 50,
      riskScore: normalizeRiskScore(cached.abuse_confidence),
    };
  }
  
  // Query AbuseIPDB
  const apiKey = Deno.env.get('ABUSEIPDB_API_KEY');
  if (!apiKey) {
    console.log('[IP_REPUTATION] No API key configured, returning simulated data');
    return generateSimulatedIPReputation(ip);
  }
  
  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
      headers: {
        'Key': apiKey,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`[IP_REPUTATION] AbuseIPDB API error: ${response.status}`);
      return generateSimulatedIPReputation(ip);
    }
    
    const data = await response.json();
    const result = data.data;
    
    console.log(`[IP_REPUTATION] AbuseIPDB result for ${ip}: confidence=${result.abuseConfidenceScore}`);
    
    // Cache the result
    await supabase.from('ip_reputation_cache').upsert({
      ip_address: ip,
      abuse_confidence: result.abuseConfidenceScore,
      country_code: result.countryCode,
      isp: result.isp,
      domain: result.domain,
      is_tor: result.isTor,
      is_public: result.isPublic,
      total_reports: result.totalReports,
      last_reported_at: result.lastReportedAt,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour cache
    });
    
    return {
      ip,
      abuseConfidenceScore: result.abuseConfidenceScore,
      countryCode: result.countryCode || 'Unknown',
      isp: result.isp || 'Unknown',
      domain: result.domain || 'Unknown',
      isTor: result.isTor,
      isPublic: result.isPublic,
      totalReports: result.totalReports,
      lastReportedAt: result.lastReportedAt,
      isKnownMalicious: result.abuseConfidenceScore >= 50,
      riskScore: normalizeRiskScore(result.abuseConfidenceScore),
    };
  } catch (error) {
    console.error(`[IP_REPUTATION] Error querying AbuseIPDB:`, error);
    return generateSimulatedIPReputation(ip);
  }
}

function generateSimulatedIPReputation(ip: string): IPReputationResult {
  // Generate realistic simulated data for demo purposes
  const isSuspicious = Math.random() > 0.7;
  const confidence = isSuspicious ? Math.floor(Math.random() * 50) + 50 : Math.floor(Math.random() * 30);
  
  return {
    ip,
    abuseConfidenceScore: confidence,
    countryCode: ['US', 'RU', 'CN', 'DE', 'BR', 'GB'][Math.floor(Math.random() * 6)],
    isp: 'Simulated ISP',
    domain: 'simulated.net',
    isTor: Math.random() > 0.9,
    isPublic: true,
    totalReports: isSuspicious ? Math.floor(Math.random() * 100) : 0,
    lastReportedAt: isSuspicious ? new Date(Date.now() - Math.random() * 86400000 * 30).toISOString() : null,
    isKnownMalicious: confidence >= 50,
    riskScore: normalizeRiskScore(confidence),
  };
}

function normalizeRiskScore(abuseConfidence: number): number {
  // Normalize AbuseIPDB confidence (0-100) to risk score (0-100)
  return Math.min(100, Math.round(abuseConfidence * 1.2));
}

// ============= WEATHER CONTEXT SERVICE =============
interface WeatherContext {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  isSevere: boolean;
  severityModifier: number;
  description: string;
}

async function getWeatherContext(location: string = 'New York', supabase: any): Promise<WeatherContext> {
  console.log(`[WEATHER] Getting weather context for ${location}`);
  
  // Check cache first
  const { data: cached } = await supabase
    .from('weather_cache')
    .select('*')
    .eq('location', location)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (cached) {
    console.log(`[WEATHER] Cache hit for ${location}: ${cached.condition}, severe=${cached.is_severe}`);
    return {
      condition: cached.condition,
      temperature: cached.temperature,
      humidity: cached.humidity,
      windSpeed: cached.wind_speed,
      isSevere: cached.is_severe,
      severityModifier: cached.severity_modifier,
      description: cached.description,
    };
  }
  
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
  if (!apiKey) {
    console.log('[WEATHER] No API key configured, returning simulated data');
    return generateSimulatedWeather();
  }
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) {
      console.error(`[WEATHER] OpenWeather API error: ${response.status}`);
      return generateSimulatedWeather();
    }
    
    const data = await response.json();
    console.log(`[WEATHER] OpenWeather result: ${data.weather[0].main}`);
    
    const isSevere = isSevereWeather(data);
    const severityModifier = calculateSeverityModifier(data);
    
    const context: WeatherContext = {
      condition: data.weather[0].main,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      isSevere,
      severityModifier,
      description: generateWeatherDescription(data, isSevere),
    };
    
    // Cache the result
    await supabase.from('weather_cache').upsert({
      location,
      condition: context.condition,
      temperature: context.temperature,
      humidity: context.humidity,
      wind_speed: context.windSpeed,
      is_severe: context.isSevere,
      severity_modifier: context.severityModifier,
      description: context.description,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 min cache
    });
    
    return context;
  } catch (error) {
    console.error(`[WEATHER] Error querying OpenWeather:`, error);
    return generateSimulatedWeather();
  }
}

function isSevereWeather(data: any): boolean {
  const severeConditions = ['Thunderstorm', 'Tornado', 'Hurricane', 'Blizzard', 'Extreme'];
  const condition = data.weather[0].main;
  const windSpeed = data.wind.speed;
  
  return severeConditions.includes(condition) || windSpeed > 25;
}

function calculateSeverityModifier(data: any): number {
  // During severe weather, lower the sensitivity (higher modifier = more lenient)
  const condition = data.weather[0].main;
  const windSpeed = data.wind.speed;
  
  if (condition === 'Thunderstorm' || windSpeed > 30) return 0.7; // Much more lenient
  if (condition === 'Rain' || condition === 'Snow' || windSpeed > 20) return 0.85; // Slightly lenient
  if (condition === 'Clear' && windSpeed < 10) return 1.1; // Slightly stricter on calm days
  return 1.0; // Normal
}

function generateWeatherDescription(data: any, isSevere: boolean): string {
  if (isSevere) {
    return `SEVERE WEATHER ALERT: ${data.weather[0].description}. Anomaly thresholds adjusted to prevent false positives from weather-related traffic patterns.`;
  }
  return `Current conditions: ${data.weather[0].description}. Standard monitoring thresholds active.`;
}

function generateSimulatedWeather(): WeatherContext {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Snow'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const isSevere = condition === 'Thunderstorm' || Math.random() > 0.9;
  
  return {
    condition,
    temperature: 15 + Math.random() * 20,
    humidity: 40 + Math.random() * 40,
    windSpeed: 5 + Math.random() * 25,
    isSevere,
    severityModifier: isSevere ? 0.75 : 1.0,
    description: isSevere 
      ? 'Simulated severe weather - relaxed thresholds active'
      : 'Normal conditions - standard thresholds active',
  };
}

// ============= ANOMALY ENGINE =============
interface AnomalyResult {
  finalScore: number;
  trafficScore: number;
  tokenScore: number;
  sessionScore: number;
  dataExfilScore: number;
  ipReputationScore: number;
  weatherModifier: number;
  classification: string;
  confidence: number;
  explanation: string;
  indicators: string[];
  ipReputationInvolved: boolean;
  weatherContextApplied: boolean;
}

const BASELINE = {
  requestsPerMinute: 30,
  avgLatency: 150,
  avgPayloadSize: 5000,
  tokenReuseRate: 0.1,
};

function calculateAnomalyScore(
  attackType: string,
  ipReputation: IPReputationResult,
  weather: WeatherContext
): AnomalyResult {
  console.log(`[ANOMALY_ENGINE] Calculating score for ${attackType}`);
  
  const indicators: string[] = [];
  let trafficScore = 0;
  let tokenScore = 0;
  let sessionScore = 0;
  let dataExfilScore = 0;
  
  // Calculate component scores based on attack type
  switch (attackType) {
    case 'api_abuse':
      trafficScore = 35 + Math.random() * 20;
      indicators.push('Request frequency 850% above baseline');
      indicators.push('Automated behavior patterns detected');
      indicators.push('No legitimate session authentication');
      break;
    case 'token_misuse':
      tokenScore = 30 + Math.random() * 15;
      indicators.push('Token used from 12 different IPs');
      indicators.push('Geographic impossibility detected');
      indicators.push('Token replay attempts identified');
      break;
    case 'session_anomaly':
      sessionScore = 25 + Math.random() * 15;
      indicators.push('Privilege escalation attempts');
      indicators.push('Session duration 340% above average');
      indicators.push('Cookie manipulation detected');
      break;
    case 'data_exfiltration':
      dataExfilScore = 40 + Math.random() * 20;
      indicators.push('Data transfer 2,400% larger than normal');
      indicators.push('Bulk record queries detected');
      indicators.push('External destination on threat list');
      break;
  }
  
  // Apply IP reputation boost
  const ipBoost = ipReputation.isKnownMalicious ? ipReputation.riskScore * 0.3 : 0;
  if (ipReputation.isKnownMalicious) {
    indicators.push(`Known malicious IP signal (AbuseIPDB: ${ipReputation.abuseConfidenceScore}%)`);
    if (ipReputation.isTor) indicators.push('TOR exit node detected');
    if (ipReputation.totalReports > 10) indicators.push(`IP reported ${ipReputation.totalReports} times`);
  }
  
  // Calculate raw score
  const rawScore = trafficScore + tokenScore + sessionScore + dataExfilScore + ipBoost;
  
  // Apply weather modifier
  const adjustedScore = rawScore * weather.severityModifier;
  const finalScore = Math.min(100, Math.max(0, Math.round(adjustedScore)));
  
  if (weather.isSevere) {
    indicators.push(`Weather context: ${weather.condition} - thresholds relaxed`);
  }
  
  // Classification
  let classification = 'Normal Traffic';
  if (finalScore >= 70) classification = 'Critical Threat Detected';
  else if (finalScore >= 50) classification = 'High Risk Activity';
  else if (finalScore >= 30) classification = 'Suspicious Behavior';
  
  // Confidence based on indicators
  const confidence = Math.min(98, 70 + indicators.length * 4);
  
  const explanation = generateExplanation(
    attackType,
    finalScore,
    confidence,
    indicators,
    ipReputation,
    weather
  );
  
  console.log(`[ANOMALY_ENGINE] Final score: ${finalScore}, IP involved: ${ipReputation.isKnownMalicious}, Weather applied: ${weather.isSevere}`);
  
  return {
    finalScore,
    trafficScore,
    tokenScore,
    sessionScore,
    dataExfilScore,
    ipReputationScore: ipBoost,
    weatherModifier: weather.severityModifier,
    classification,
    confidence,
    explanation,
    indicators,
    ipReputationInvolved: ipReputation.isKnownMalicious,
    weatherContextApplied: weather.isSevere || weather.severityModifier !== 1.0,
  };
}

function generateExplanation(
  attackType: string,
  score: number,
  confidence: number,
  indicators: string[],
  ipReputation: IPReputationResult,
  weather: WeatherContext
): string {
  const severity = score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
  const attackNames: Record<string, string> = {
    api_abuse: 'API Abuse Attack',
    token_misuse: 'Token Misuse',
    session_anomaly: 'Session Anomaly',
    data_exfiltration: 'Data Exfiltration',
  };
  
  let explanation = `[${severity}] ${attackNames[attackType] || 'Unknown Threat'} Detected\n\n`;
  explanation += `Anomaly Score: ${score}/100 | Confidence: ${confidence}%\n\n`;
  
  explanation += '=== Detection Factors ===\n';
  indicators.forEach((ind, i) => {
    explanation += `${i + 1}. ${ind}\n`;
  });
  
  explanation += '\n=== Intelligence Sources ===\n';
  if (ipReputation.isKnownMalicious) {
    explanation += `• IP Reputation: FLAGGED (Score: ${ipReputation.abuseConfidenceScore}%)\n`;
    explanation += `  - Origin: ${ipReputation.countryCode}, ISP: ${ipReputation.isp}\n`;
    explanation += `  - Total Reports: ${ipReputation.totalReports}\n`;
  } else {
    explanation += `• IP Reputation: Clean (Score: ${ipReputation.abuseConfidenceScore}%)\n`;
  }
  
  explanation += `\n• Weather Context: ${weather.condition}\n`;
  if (weather.isSevere) {
    explanation += `  - SEVERE WEATHER DETECTED: Thresholds adjusted by ${((1 - weather.severityModifier) * 100).toFixed(0)}%\n`;
  } else {
    explanation += `  - Normal conditions, standard thresholds applied\n`;
  }
  
  if (score >= 50) {
    explanation += '\n=== Recommended Action ===\n';
    explanation += 'Immediate containment advised. Awaiting operator approval.';
  }
  
  return explanation;
}

// ============= MAIN HANDLER =============
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/sentira-api', '');
  
  console.log(`[SENTIRA_API] ${req.method} ${path}`);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // GET /metrics - Fetch current system metrics
    if (path === '/metrics' && req.method === 'GET') {
      const { data: metrics } = await supabase
        .from('system_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);
      
      const { data: nodes } = await supabase
        .from('system_nodes')
        .select('*');
      
      return new Response(JSON.stringify({ metrics, nodes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /system/state - Get current demo state
    if (path === '/system/state' && req.method === 'GET') {
      const { data: state } = await supabase
        .from('demo_state')
        .select('*')
        .eq('id', 'default')
        .single();
      
      let activeAttack = null;
      if (state?.active_attack_id) {
        const { data: attack } = await supabase
          .from('threat_events')
          .select('*')
          .eq('id', state.active_attack_id)
          .single();
        activeAttack = attack;
      }
      
      const { data: threats } = await supabase
        .from('threat_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data: weather } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('location', 'default')
        .maybeSingle();
      
      return new Response(JSON.stringify({ 
        state, 
        activeAttack, 
        threats,
        weather: weather || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /simulate/:attack_type - Trigger simulated attack
    if (path.startsWith('/simulate/') && req.method === 'POST') {
      const attackType = path.split('/')[2];
      console.log(`[SIMULATE] Triggering ${attackType} attack`);
      
      // Generate simulated IP
      const sourceIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      // Get external intelligence
      const [ipReputation, weather] = await Promise.all([
        checkIPReputation(sourceIP, supabase),
        getWeatherContext('default', supabase),
      ]);
      
      // Calculate anomaly score with all factors
      const anomaly = calculateAnomalyScore(attackType, ipReputation, weather);
      
      const severityMap: Record<string, string> = {
        api_abuse: 'high',
        token_misuse: 'high',
        session_anomaly: 'medium',
        data_exfiltration: 'critical',
      };
      
      const targetMap: Record<string, string> = {
        api_abuse: '/api/patients/records',
        token_misuse: '/api/auth/session',
        session_anomaly: '/api/admin/users',
        data_exfiltration: '/api/export/bulk',
      };
      
      const descriptionMap: Record<string, string> = {
        api_abuse: 'High-frequency automated requests targeting patient records API',
        token_misuse: 'Authentication token reused across multiple sessions and IP addresses',
        session_anomaly: 'Session behavior deviates significantly from established patterns',
        data_exfiltration: 'Unusually large data transfers detected from protected database',
      };
      
      // Insert threat event
      const { data: threat, error: threatError } = await supabase
        .from('threat_events')
        .insert({
          event_type: attackType,
          severity: severityMap[attackType] || 'medium',
          source_ip: sourceIP,
          target_endpoint: targetMap[attackType] || '/api/unknown',
          description: descriptionMap[attackType] || 'Unknown threat detected',
          status: 'suspicious',
          anomaly_score: anomaly.finalScore,
          confidence: anomaly.confidence,
          explanation: anomaly.explanation,
          ip_reputation_score: Math.round(ipReputation.riskScore),
          ip_reputation_involved: anomaly.ipReputationInvolved,
          weather_context_applied: anomaly.weatherContextApplied,
          weather_modifier: anomaly.weatherModifier,
        })
        .select()
        .single();
      
      if (threatError) {
        console.error('[SIMULATE] Error creating threat:', threatError);
        throw threatError;
      }
      
      // Update demo state
      await supabase
        .from('demo_state')
        .update({
          is_running: true,
          current_phase: 'suspicious',
          active_attack_id: threat.id,
          pending_mitigation_id: null,
        })
        .eq('id', 'default');
      
      // Update affected nodes
      const nodeMap: Record<string, string[]> = {
        api_abuse: ['gateway', 'api-patients'],
        token_misuse: ['auth', 'gateway'],
        session_anomaly: ['auth', 'api-appointments'],
        data_exfiltration: ['database', 'api-patients', 'storage'],
      };
      
      const affectedNodes = nodeMap[attackType] || [];
      for (const nodeId of affectedNodes) {
        await supabase
          .from('system_nodes')
          .update({ status: 'warning' })
          .eq('id', nodeId);
      }
      
      // Generate traffic spike
      await supabase.from('system_metrics').insert({
        metric_type: 'traffic',
        value: 30 * (attackType === 'api_abuse' ? 8 : attackType === 'data_exfiltration' ? 5 : 3),
        baseline: 30,
        anomaly_score: anomaly.finalScore,
        node_id: affectedNodes[0] || 'gateway',
      });
      
      console.log(`[SIMULATE] Attack ${attackType} created with ID ${threat.id}`);
      
      // Check auto-approve
      const { data: demoState } = await supabase
        .from('demo_state')
        .select('auto_approve')
        .eq('id', 'default')
        .single();
      
      // If not auto-approve, set pending mitigation
      if (!demoState?.auto_approve) {
        await supabase
          .from('demo_state')
          .update({ pending_mitigation_id: threat.id })
          .eq('id', 'default');
      }
      
      return new Response(JSON.stringify({
        event: 'ATTACK_DETECTED',
        timestamp: new Date().toISOString(),
        severity: severityMap[attackType],
        affected_component: affectedNodes,
        threat,
        anomaly,
        ipReputation,
        weather,
        explanation: `${attackType.toUpperCase()} detected. Score: ${anomaly.finalScore}. IP Reputation: ${ipReputation.isKnownMalicious ? 'FLAGGED' : 'Clean'}. Weather: ${weather.condition}.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /mitigation/approve - Approve pending mitigation
    if (path === '/mitigation/approve' && req.method === 'POST') {
      console.log('[MITIGATION] Approving mitigation');
      
      const { data: state } = await supabase
        .from('demo_state')
        .select('*')
        .eq('id', 'default')
        .single();
      
      if (!state?.active_attack_id) {
        return new Response(JSON.stringify({ error: 'No active attack to mitigate' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Get the active threat
      const { data: threat } = await supabase
        .from('threat_events')
        .select('*')
        .eq('id', state.active_attack_id)
        .single();
      
      if (!threat) {
        return new Response(JSON.stringify({ error: 'Threat not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const mitigationActions: Record<string, string> = {
        api_abuse: 'Rate limiting applied: 10 req/min | Source IP temporarily blocked',
        token_misuse: 'Affected tokens invalidated | Forced re-authentication initiated',
        session_anomaly: 'Session flagged for review | Enhanced monitoring enabled',
        data_exfiltration: 'Database quarantined | Outbound transfers blocked | Service isolated',
      };
      
      // Update threat status
      await supabase
        .from('threat_events')
        .update({
          status: 'isolated',
          mitigation_applied: mitigationActions[threat.event_type] || 'Mitigation applied',
        })
        .eq('id', threat.id);
      
      // Update demo state
      await supabase
        .from('demo_state')
        .update({
          current_phase: 'isolated',
          pending_mitigation_id: null,
        })
        .eq('id', 'default');
      
      // Update affected nodes to isolated
      const nodeMap: Record<string, string[]> = {
        api_abuse: ['gateway', 'api-patients'],
        token_misuse: ['auth', 'gateway'],
        session_anomaly: ['auth', 'api-appointments'],
        data_exfiltration: ['database', 'api-patients', 'storage'],
      };
      
      const affectedNodes = nodeMap[threat.event_type] || [];
      for (const nodeId of affectedNodes) {
        await supabase
          .from('system_nodes')
          .update({ status: 'isolated' })
          .eq('id', nodeId);
      }
      
      console.log(`[MITIGATION] Applied for ${threat.event_type}`);
      
      return new Response(JSON.stringify({
        event: 'MITIGATION_APPLIED',
        timestamp: new Date().toISOString(),
        severity: threat.severity,
        affected_component: affectedNodes,
        threat_id: threat.id,
        mitigation: mitigationActions[threat.event_type],
        explanation: `Mitigation approved and applied for ${threat.event_type}. ${threat.ip_reputation_involved ? 'IP was flagged by AbuseIPDB.' : ''} ${threat.weather_context_applied ? 'Weather context was applied.' : ''}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /demo/reset - Reset demo to initial state
    if (path === '/demo/reset' && req.method === 'POST') {
      console.log('[RESET] Resetting demo');
      
      // Get current state to preserve auto_approve
      const { data: currentState } = await supabase
        .from('demo_state')
        .select('auto_approve')
        .eq('id', 'default')
        .single();
      
      // Reset demo state
      await supabase
        .from('demo_state')
        .update({
          is_running: false,
          current_phase: 'normal',
          active_attack_id: null,
          pending_mitigation_id: null,
          auto_approve: currentState?.auto_approve ?? true,
        })
        .eq('id', 'default');
      
      // Reset all nodes to healthy
      const nodes = ['gateway', 'auth', 'api-patients', 'api-appointments', 'database', 'storage'];
      for (const nodeId of nodes) {
        await supabase
          .from('system_nodes')
          .update({ status: 'healthy', requests: 0 })
          .eq('id', nodeId);
      }
      
      // Delete old threats
      await supabase
        .from('threat_events')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete old metrics
      await supabase
        .from('system_metrics')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      console.log('[RESET] Demo reset complete');
      
      return new Response(JSON.stringify({
        event: 'SYSTEM_STABILIZED',
        timestamp: new Date().toISOString(),
        severity: 'info',
        affected_component: nodes,
        explanation: 'Demo reset to initial state. All systems nominal.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /demo/toggle-auto-approve
    if (path === '/demo/toggle-auto-approve' && req.method === 'POST') {
      const { data: state } = await supabase
        .from('demo_state')
        .select('auto_approve')
        .eq('id', 'default')
        .single();
      
      const newValue = !(state?.auto_approve ?? true);
      
      await supabase
        .from('demo_state')
        .update({ auto_approve: newValue })
        .eq('id', 'default');
      
      return new Response(JSON.stringify({
        auto_approve: newValue,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /phase/advance - Advance to next phase (for simulation)
    if (path === '/phase/advance' && req.method === 'POST') {
      const { data: state } = await supabase
        .from('demo_state')
        .select('*, threat_events(*)')
        .eq('id', 'default')
        .single();
      
      if (!state?.active_attack_id && state.current_phase !== 'isolated') {
        return new Response(JSON.stringify({ error: 'No active attack' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const phases = ['suspicious', 'detected', 'isolated', 'stabilized', 'normal'];
      const currentIndex = phases.indexOf(state.current_phase);
      
      if (currentIndex >= phases.length - 1) {
        return new Response(JSON.stringify({ error: 'Already at final phase' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const nextPhase = phases[currentIndex + 1];
      
      // Update demo state
      await supabase
        .from('demo_state')
        .update({
          current_phase: nextPhase,
          is_running: nextPhase !== 'normal',
          active_attack_id: nextPhase === 'normal' ? null : state.active_attack_id,
        })
        .eq('id', 'default');
      
      // Update threat status
      if (nextPhase !== 'normal') {
        await supabase
          .from('threat_events')
          .update({ status: nextPhase === 'stabilized' ? 'mitigated' : nextPhase })
          .eq('id', state.active_attack_id);
      }
      
      // Get threat for node updates
      const { data: threat } = await supabase
        .from('threat_events')
        .select('event_type')
        .eq('id', state.active_attack_id)
        .single();
      
      // Update node statuses
      const nodeMap: Record<string, string[]> = {
        api_abuse: ['gateway', 'api-patients'],
        token_misuse: ['auth', 'gateway'],
        session_anomaly: ['auth', 'api-appointments'],
        data_exfiltration: ['database', 'api-patients', 'storage'],
      };
      
      const statusMap: Record<string, string> = {
        suspicious: 'warning',
        detected: 'critical',
        isolated: 'isolated',
        stabilized: 'recovering',
        normal: 'healthy',
      };
      
      const affectedNodes = threat ? nodeMap[threat.event_type] || [] : [];
      for (const nodeId of affectedNodes) {
        await supabase
          .from('system_nodes')
          .update({ status: statusMap[nextPhase] || 'healthy' })
          .eq('id', nodeId);
      }
      
      // If going to normal, reset all nodes
      if (nextPhase === 'normal') {
        const allNodes = ['gateway', 'auth', 'api-patients', 'api-appointments', 'database', 'storage'];
        for (const nodeId of allNodes) {
          await supabase
            .from('system_nodes')
            .update({ status: 'healthy' })
            .eq('id', nodeId);
        }
      }
      
      return new Response(JSON.stringify({
        event: nextPhase === 'stabilized' ? 'SYSTEM_STABILIZED' : 
               nextPhase === 'isolated' ? 'MITIGATION_APPLIED' :
               nextPhase === 'detected' ? 'MITIGATION_RECOMMENDED' : 'ANOMALY_SCORE_UPDATE',
        timestamp: new Date().toISOString(),
        phase: nextPhase,
        affected_component: affectedNodes,
        explanation: `Phase advanced to ${nextPhase}.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /traffic/generate - Generate traffic metric
    if (path === '/traffic/generate' && req.method === 'GET') {
      const { data: state } = await supabase
        .from('demo_state')
        .select('*, threat_events(*)')
        .eq('id', 'default')
        .single();
      
      let threat = null;
      if (state?.active_attack_id) {
        const { data } = await supabase
          .from('threat_events')
          .select('*')
          .eq('id', state.active_attack_id)
          .single();
        threat = data;
      }
      
      const baseValue = 30;
      let value: number;
      let anomalyScore: number;
      
      if (threat) {
        const multipliers: Record<string, number> = {
          api_abuse: 8,
          token_misuse: 3,
          session_anomaly: 2,
          data_exfiltration: 5,
        };
        const multiplier = multipliers[threat.event_type] || 1;
        value = baseValue * multiplier * (0.8 + Math.random() * 0.4);
        anomalyScore = 60 + Math.random() * 40;
      } else {
        const variance = baseValue * 0.2;
        value = baseValue + (Math.random() - 0.5) * variance;
        anomalyScore = Math.random() * 10;
      }
      
      const { data: metric } = await supabase
        .from('system_metrics')
        .insert({
          metric_type: 'traffic',
          value: Math.round(value),
          baseline: baseValue,
          anomaly_score: anomalyScore,
          node_id: 'gateway',
        })
        .select()
        .single();
      
      return new Response(JSON.stringify({
        event: 'TRAFFIC_UPDATE',
        timestamp: new Date().toISOString(),
        metric,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SENTIRA_API] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});