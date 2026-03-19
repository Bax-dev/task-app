import { describe, it, expect, beforeEach, vi } from 'vitest';

// We'll test the rate limit logic directly
describe('Rate Limit', () => {
  let rateLimit: (config: { windowMs: number; maxRequests: number }) => {
    check(key: string): { success: boolean; remaining: number; resetIn: number };
  };

  beforeEach(async () => {
    // Dynamic import to get fresh module each time
    vi.resetModules();
    const mod = await import('@/lib/rate-limit');
    rateLimit = mod.rateLimit;
  });

  it('should allow requests within the limit', () => {
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 5 });
    const result = limiter.check('test-key');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should block requests exceeding the limit', () => {
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 3 });

    limiter.check('test-key');
    limiter.check('test-key');
    limiter.check('test-key');

    const result = limiter.check('test-key');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should track different keys independently', () => {
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 1 });

    const result1 = limiter.check('key1');
    const result2 = limiter.check('key2');

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    const result3 = limiter.check('key1');
    expect(result3.success).toBe(false);
  });

  it('should decrement remaining count correctly', () => {
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 5 });

    expect(limiter.check('key').remaining).toBe(4);
    expect(limiter.check('key').remaining).toBe(3);
    expect(limiter.check('key').remaining).toBe(2);
    expect(limiter.check('key').remaining).toBe(1);
    expect(limiter.check('key').remaining).toBe(0);
  });
});
