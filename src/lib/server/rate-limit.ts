// =============================================================
// Lnksy — Rate limiter (in-memory, per-action)
// =============================================================

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, Bucket>();

const CONFIGS: Record<string, RateLimitConfig> = {
  // Auth-specific limits
  "auth:login": { windowMs: 60_000, maxRequests: 5 },
  "auth:signup": { windowMs: 60_000, maxRequests: 3 },
  "auth:resend": { windowMs: 60_000, maxRequests: 1 },
  "auth:resend:hour": { windowMs: 3_600_000, maxRequests: 5 },
  "auth:forgot": { windowMs: 60_000, maxRequests: 3 },
  // General fallback
  default: { windowMs: 60_000, maxRequests: 60 },
};

/**
 * Check (and consume) a rate limit.
 * @param action - Action name (e.g. "auth:login")
 * @param key    - Unique key (e.g. IP or IP+email)
 * @returns true if allowed, false if limited
 */
export function rateLimit(
  action: string,
  key: string,
): boolean {
  const cfg = CONFIGS[action] ?? CONFIGS["default"];
  const fullKey = `${action}:${key}`;
  const now = Date.now();
  const entry = store.get(fullKey);

  if (!entry || now > entry.resetAt) {
    store.set(fullKey, {
      count: 1,
      resetAt: now + cfg.windowMs,
    });
    return true;
  }

  if (entry.count >= cfg.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 300_000);
