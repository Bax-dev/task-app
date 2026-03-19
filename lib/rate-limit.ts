interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function rateLimit(config: RateLimitConfig) {
  return {
    check(key: string): { success: boolean; remaining: number; resetIn: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetTime) {
        store.set(key, { count: 1, resetTime: now + config.windowMs });
        return { success: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
      }

      if (entry.count >= config.maxRequests) {
        return { success: false, remaining: 0, resetIn: entry.resetTime - now };
      }

      entry.count++;
      return { success: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetTime - now };
    },
  };
}

// Pre-configured limiters
export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }); // 10 per 15 min
export const inviteLimiter = rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 20 }); // 20 per hour
export const apiLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 100 }); // 100 per minute
