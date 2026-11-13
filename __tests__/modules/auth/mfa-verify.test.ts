import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    mfaChallenge: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock('@/lib/auth/session', () => ({ createSession: vi.fn() }));
vi.mock('@/lib/auth/refresh-token', () => ({ signRefreshToken: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(), buildMfaChangedEmail: vi.fn() }));

describe('verifyChallenge attempt cap', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('@/lib/db/client');
    (prisma.mfaChallenge.findUnique as any).mockResolvedValue({
      id: 'c1', userId: 'u1', usedAt: null, attempts: 5, expiresAt: new Date(Date.now() + 60_000),
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1', email: 'a@b.c', mfaConfirmedAt: new Date(), mfaSecretEncrypted: 'x', mfaLastUsedCounter: 0,
    });
  });

  it('refuses before checking the code once the cap is reached, and burns the challenge', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.mfaChallenge.updateMany as any).mockResolvedValue({ count: 0 }); // claim fails: attempts >= MAX
    const { verifyChallenge } = await import('@/app/api/modules/auth/services/mfa');

    await expect(verifyChallenge('tok', { code: '123456' })).rejects.toMatchObject({ status: 429 });

    const calls = (prisma.mfaChallenge.updateMany as any).mock.calls;
    expect(calls[0][0].where).toMatchObject({ id: 'c1', usedAt: null, attempts: { lt: 5 } });
    expect(calls[1][0].data).toHaveProperty('usedAt');
    expect(prisma.user.updateMany).not.toHaveBeenCalled(); // TOTP counter never touched
  });
});
