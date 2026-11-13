import { redis, safeRedisCall } from './redis';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

const store = new Map<string, RateLimitEntry>();

function result(count: number, resetIn: number, max: number): RateLimitResult {
  return { success: count <= max, remaining: Math.max(0, max - count), resetIn };
}

function memoryCheck(key: string, { windowMs, maxRequests }: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return result(1, windowMs, maxRequests);
  }
  if (entry.count < maxRequests) entry.count++;
  else return result(maxRequests + 1, entry.resetTime - now, maxRequests);
  return result(entry.count, entry.resetTime - now, maxRequests);
}

/** Fixed-window limiter shared across instances via Redis; per-instance memory when Redis is down. */
export function rateLimit(config: RateLimitConfig) {
  return {
    async check(key: string): Promise<RateLimitResult> {
      const k = `rl:${key}`;
      const res = await safeRedisCall(() =>
        // SET NX starts the window once; INCR keeps that TTL.
        redis.multi().set(k, 0, 'PX', config.windowMs, 'NX').incr(k).pttl(k).exec(),
      );
      if (res && !res.some(([err]) => err)) {
        const count = res[1][1] as number;
        const ttl = res[2][1] as number;
        return result(count, ttl > 0 ? ttl : config.windowMs, config.maxRequests);
      }
      return memoryCheck(key, config);
    },
  };
}

/**
 * Client IP for rate-limit keys. nginx (deploy/nginx-taskflow.conf) overwrites X-Real-IP with the peer
 * address, and appends the peer to X-Forwarded-For, so the *last* XFF hop is the one nginx saw. The first
 * hop is client-controlled and must not be used.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const lastHop = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim();
  return lastHop || 'unknown';
}

// Pre-configured limiters
export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }); // 10 per 15 min
export const inviteLimiter = rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 20 }); // 20 per hour
export const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }); // per email: guesses at a 6-digit code
export const aiLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 20 }); // per user: each call costs Bedrock tokens
