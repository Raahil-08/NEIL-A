/**
 * Enforcement Module - Manages blockedIPs, isolatedEndpoints, rateLimits
 */

// In-memory enforcement state
let enforcementState = {
  blockedIPs: [],
  isolatedEndpoints: [], // { route, ip?, userId? }
  rateLimits: []         // { key, ip?, userId?, route, limitRps, tokens, lastRefill }
};

// Token bucket store for rate limiting
const tokenBuckets = new Map();

/**
 * Apply new enforcement rules from Detector
 */
function applyEnforcement(rules) {
  if (rules.blockedIPs) {
    enforcementState.blockedIPs = rules.blockedIPs;
  }
  if (rules.isolatedEndpoints) {
    enforcementState.isolatedEndpoints = rules.isolatedEndpoints;
  }
  if (rules.rateLimits) {
    enforcementState.rateLimits = rules.rateLimits;
    // Reset token buckets for new rate limits
    tokenBuckets.clear();
    for (const rl of rules.rateLimits) {
      const key = rl.key || `${rl.ip || '*'}:${rl.userId || '*'}:${rl.route}`;
      tokenBuckets.set(key, {
        tokens: rl.limitRps,
        lastRefill: Date.now(),
        limitRps: rl.limitRps
      });
    }
  }
  console.log('[Enforcement] Applied:', JSON.stringify(enforcementState, null, 2));
}

/**
 * Get current enforcement state
 */
function getEnforcementState() {
  return { ...enforcementState };
}

/**
 * Clear all enforcement rules
 */
function clearEnforcement() {
  enforcementState = {
    blockedIPs: [],
    isolatedEndpoints: [],
    rateLimits: []
  };
  tokenBuckets.clear();
}

/**
 * Check if IP is blocked
 */
function isIPBlocked(ip) {
  return enforcementState.blockedIPs.includes(ip);
}

/**
 * Check if endpoint is isolated for given request
 */
function isEndpointIsolated(route, ip, userId) {
  for (const iso of enforcementState.isolatedEndpoints) {
    if (iso.route === route) {
      // If no specific ip/userId, isolate for everyone
      if (!iso.ip && !iso.userId) return true;
      // If specific ip matches
      if (iso.ip && iso.ip === ip) return true;
      // If specific userId matches
      if (iso.userId && iso.userId === userId) return true;
    }
  }
  return false;
}

/**
 * Check rate limit - returns true if allowed, false if limited
 */
function checkRateLimit(route, ip, userId) {
  for (const rl of enforcementState.rateLimits) {
    // Check if this rate limit applies
    const ipMatch = !rl.ip || rl.ip === ip;
    const userMatch = !rl.userId || rl.userId === userId;
    const routeMatch = rl.route === route || rl.route === '*';
    
    if (ipMatch && userMatch && routeMatch) {
      const key = rl.key || `${rl.ip || '*'}:${rl.userId || '*'}:${rl.route}`;
      let bucket = tokenBuckets.get(key);
      
      if (!bucket) {
        bucket = {
          tokens: rl.limitRps,
          lastRefill: Date.now(),
          limitRps: rl.limitRps
        };
        tokenBuckets.set(key, bucket);
      }
      
      // Refill tokens based on time elapsed
      const now = Date.now();
      const elapsed = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(bucket.limitRps, bucket.tokens + elapsed * bucket.limitRps);
      bucket.lastRefill = now;
      
      // Consume token
      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return true; // Allowed
      } else {
        return false; // Rate limited
      }
    }
  }
  return true; // No matching rate limit, allow
}

/**
 * Enforcement middleware - runs before all routes
 */
function enforcementMiddleware(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '127.0.0.1';
  const cleanIp = ip.split(',')[0].trim();
  
  // Extract userId from token if available
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  const { resolveToken } = require('./telemetry');
  const userId = resolveToken(token);
  
  // Store for later use
  req.clientIp = cleanIp;
  req.resolvedUserId = userId;
  
  // 1. Check blocked IPs
  if (isIPBlocked(cleanIp)) {
    console.log(`[Enforcement] Blocked IP: ${cleanIp}`);
    return res.status(403).json({ error: 'IP blocked', ip: cleanIp });
  }
  
  // 2. Check isolated endpoints
  const route = req.route?.path || req.path;
  if (isEndpointIsolated(req.path, cleanIp, userId)) {
    console.log(`[Enforcement] Isolated endpoint: ${req.path} for ip=${cleanIp} userId=${userId}`);
    return res.status(423).json({ error: 'isolated', route: req.path });
  }
  
  // 3. Check rate limits
  if (!checkRateLimit(req.path, cleanIp, userId)) {
    console.log(`[Enforcement] Rate limited: ${req.path} for ip=${cleanIp}`);
    return res.status(429).json({ error: 'rate limited', route: req.path });
  }
  
  next();
}

module.exports = {
  applyEnforcement,
  getEnforcementState,
  clearEnforcement,
  enforcementMiddleware,
  isIPBlocked,
  isEndpointIsolated,
  checkRateLimit
};
