import { describe, it, expect, beforeEach, vi } from 'vitest';

// Redis down: exercises the in-memory fallback without a server.
vi.mock('@/lib/redis', () => ({ redis: {}, safeRedisCall: async () => null }));

describe('Rate Limit', () => {
  let rateLimit: typeof import('@/lib/rate-limit').rateLimit;
  let clientIp: typeof import('@/lib/rate-limit').clientIp;

  beforeEach(async () => {
    vi.resetModules();
    ({ rateLimit, clientIp } = await import('@/lib/rate-limit'));
  });

  it('allows requests within the limit', async () => {
    const result = await rateLimit({ windowMs: 60000, maxRequests: 5 }).check('test-key');
    expect(result).toMatchObject({ success: true, remaining: 4 });
  });

  it('blocks requests exceeding the limit', async () => {
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 3 });
    for (let i = 0; i < 3; i++) await limiter.check('test-key');
    expect(await limiter.check('test-key')).toMatchObject({ success: false, remaining: 0 });
  });

  it('tracks different keys independently', async () => {
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 1 });
    expect((await limiter.check('key1')).success).toBe(true);
    expect((await limiter.check('key2')).success).toBe(true);
    expect((await limiter.check('key1')).success).toBe(false);
  });

  it('decrements remaining count', async () => {
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 3 });
    expect((await limiter.check('key')).remaining).toBe(2);
    expect((await limiter.check('key')).remaining).toBe(1);
    expect((await limiter.check('key')).remaining).toBe(0);
  });

  it('uses the proxy-set IP, never the client-supplied first XFF hop', () => {
    const req = (h: Record<string, string>) => new Request('http://x', { headers: h });
    expect(clientIp(req({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1' }))).toBe('9.9.9.9');
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('2.2.2.2');
    expect(clientIp(req({}))).toBe('unknown');
  });
});
