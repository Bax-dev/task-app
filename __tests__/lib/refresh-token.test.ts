import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  values: new Map<string, string>(),
  sets: new Map<string, Set<string>>(),
  setArguments: [] as unknown[][],
}));

vi.mock('@/lib/redis', () => {
  const redis = {
    get: vi.fn(async (key: string) => state.values.get(key) ?? null),
    getdel: vi.fn(async (key: string) => {
      const value = state.values.get(key) ?? null;
      state.values.delete(key);
      return value;
    }),
    srem: vi.fn(async (key: string, member: string) => Number(state.sets.get(key)?.delete(member) ?? false)),
    smembers: vi.fn(async (key: string) => [...(state.sets.get(key) ?? [])]),
    multi: vi.fn(() => {
      const operations: Array<() => unknown> = [];
      const transaction: any = {
        set(key: string, value: string, ...args: unknown[]) {
          state.setArguments.push([key, value, ...args]);
          operations.push(() => state.values.set(key, value));
          return transaction;
        },
        sadd(key: string, member: string) { operations.push(() => {
          const set = state.sets.get(key) ?? new Set<string>(); set.add(member); state.sets.set(key, set);
        }); return transaction; },
        expire() { operations.push(() => 1); return transaction; },
        del(key: string) { operations.push(() => state.values.delete(key)); return transaction; },
        srem(key: string, member: string) { operations.push(() => state.sets.get(key)?.delete(member)); return transaction; },
        async exec() { return operations.map((operation) => [null, operation()]); },
      };
      return transaction;
    }),
  };
  return { redis };
});

describe('refresh token store', () => {
  beforeEach(() => {
    state.values.clear();
    state.sets.clear();
    state.setArguments.length = 0;
    vi.clearAllMocks();
  });

  it('stores only a fingerprint and consumes a token exactly once', async () => {
    const { signRefreshToken, consumeRefreshToken } = await import('@/lib/auth/refresh-token');
    const { REFRESH_TOKEN_MAX_AGE } = await import('@/lib/auth/constants');
    const { token } = await signRefreshToken('user-1', 'user@example.com');

    expect([...state.values.values()].join('')).not.toContain(token);
    expect(state.setArguments[0]?.slice(2)).toEqual(['EX', REFRESH_TOKEN_MAX_AGE, 'NX']);
    await expect(consumeRefreshToken(token)).resolves.toMatchObject({
      userId: 'user-1',
      email: 'user@example.com',
    });
    await expect(consumeRefreshToken(token)).resolves.toBeNull();
  });

  it('rejects malformed and oversized tokens without a Redis lookup', async () => {
    const { consumeRefreshToken } = await import('@/lib/auth/refresh-token');
    const { redis } = await import('@/lib/redis');
    await expect(consumeRefreshToken('')).resolves.toBeNull();
    await expect(consumeRefreshToken('x'.repeat(513))).resolves.toBeNull();
    expect(redis.getdel).not.toHaveBeenCalled();
  });

  it('revokes all indexed sessions for a user', async () => {
    const { signRefreshToken, revokeAllRefreshTokens, verifyRefreshToken } = await import('@/lib/auth/refresh-token');
    const first = await signRefreshToken('user-1', 'user@example.com');
    const second = await signRefreshToken('user-1', 'user@example.com');
    await revokeAllRefreshTokens('user-1');
    await expect(verifyRefreshToken(first.token)).resolves.toBeNull();
    await expect(verifyRefreshToken(second.token)).resolves.toBeNull();
  });
});
