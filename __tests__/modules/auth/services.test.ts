import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    mfaChallenge: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock auth utilities
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  verifyPassword: vi.fn(),
  verifyPasswordAgainstNothing: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn().mockResolvedValue('mock-token'),
}));

vi.mock('@/lib/auth/refresh-token', () => ({
  signRefreshToken: vi.fn().mockResolvedValue({ token: 'mock-refresh', tokenId: 'refresh-id' }),
  consumeRefreshToken: vi.fn(),
  revokeRefreshTokenValue: vi.fn(),
  revokeAllRefreshTokens: vi.fn(),
}));

// Mock email module to avoid Resend API key requirement
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildOTPEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h' }),
}));

vi.mock('@/lib/otp', () => ({
  generateOTP: vi.fn().mockReturnValue('123456'),
  storeOTP: vi.fn(),
  verifyOTP: vi.fn(),
  canResendOTP: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/rate-limit', () => ({
  loginLimiter: { check: vi.fn().mockResolvedValue({ success: true, remaining: 9, resetIn: 0 }) },
}));

vi.mock('@/lib/google-auth', () => ({ verifyGoogleToken: vi.fn() }));

const verified = { emailVerifiedAt: new Date('2026-01-01') };

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers without a session and emails a verification code', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { sendEmail } = await import('@/lib/email');
    const { createSession } = await import('@/lib/auth/session');
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: 'user-1', name: 'Test User', email: 'test@example.com' });

    const { register } = await import('@/app/api/modules/auth/services');
    const result = await register({ name: 'Test User', email: 'test@example.com', password: 'Password1' });

    expect(result).toEqual({ verificationRequired: true, email: 'test@example.com' });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'test@example.com' }));
    expect(createSession).not.toHaveBeenCalled();
  });

  it('lets the inbox owner restart a squatted, unverified signup', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1', email: 'test@example.com', emailVerifiedAt: null });
    (prisma.user.updateMany as any).mockResolvedValue({ count: 1 });

    const { register } = await import('@/app/api/modules/auth/services');
    const result = await register({ name: 'Real Owner', email: 'test@example.com', password: 'Password1' });

    expect(result.verificationRequired).toBe(true);
    expect((prisma.user.updateMany as any).mock.calls[0][0].where).toEqual({ email: 'test@example.com', emailVerifiedAt: null });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should reject registration with existing email', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      ...verified,
    });

    const { register } = await import('@/app/api/modules/auth/services');

    await expect(
      register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1',
      })
    ).rejects.toThrow('A user with this email already exists');
  });

  it('should login with correct credentials', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { verifyPassword } = await import('@/lib/auth/password');

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed',
      ...verified,
    });
    (verifyPassword as any).mockResolvedValue(true);

    const { login } = await import('@/app/api/modules/auth/services');

    const result = await login({
      email: 'test@example.com',
      password: 'Password1',
    });

    if (!('token' in result)) throw new Error('expected a session');
    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBe('mock-token');
  });

  it('should return an MFA challenge instead of a session when 2FA is on', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { verifyPassword } = await import('@/lib/auth/password');
    const { createSession } = await import('@/lib/auth/session');

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1', name: 'Test User', email: 'test@example.com', passwordHash: 'hashed', mfaConfirmedAt: new Date(), ...verified,
    });
    (verifyPassword as any).mockResolvedValue(true);
    (prisma.mfaChallenge.create as any).mockImplementation(({ data }: any) => Promise.resolve(data));

    const { login } = await import('@/app/api/modules/auth/services');
    const result = await login({ email: 'test@example.com', password: 'Password1' });

    expect(result).toMatchObject({ mfaRequired: true, methods: ['totp', 'recovery_code'] });
    expect('token' in result).toBe(false);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('should reject login with wrong password', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { verifyPassword } = await import('@/lib/auth/password');

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed',
    });
    (verifyPassword as any).mockResolvedValue(false);

    const { login } = await import('@/app/api/modules/auth/services');

    await expect(
      login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('rotates a refresh token and rejects replay', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { consumeRefreshToken } = await import('@/lib/auth/refresh-token');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });
    (consumeRefreshToken as any)
      .mockResolvedValueOnce({ userId: 'user-1', email: 'test@example.com', tokenHash: 'old' })
      .mockResolvedValueOnce(null);

    const { refreshSession } = await import('@/app/api/modules/auth/services');
    await expect(refreshSession('old-refresh')).resolves.toEqual({
      token: 'mock-token',
      refreshToken: 'mock-refresh',
    });
    await expect(refreshSession('old-refresh')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('logs out a refresh-token session without requiring a valid access session', async () => {
    const { revokeRefreshTokenValue, revokeAllRefreshTokens } = await import('@/lib/auth/refresh-token');
    const { logoutUser } = await import('@/app/api/modules/auth/services');

    await logoutUser({ refreshToken: 'refresh-token' });

    expect(revokeRefreshTokenValue).toHaveBeenCalledWith('refresh-token');
    expect(revokeAllRefreshTokens).not.toHaveBeenCalled();
  });

  it('revokes all user sessions when logout has only an access session', async () => {
    const { revokeAllRefreshTokens } = await import('@/lib/auth/refresh-token');
    const { logoutUser } = await import('@/app/api/modules/auth/services');

    await logoutUser({ userId: 'user-1' });

    expect(revokeAllRefreshTokens).toHaveBeenCalledWith('user-1');
  });

  it('revokes every refresh token after a password reset', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { revokeAllRefreshTokens } = await import('@/lib/auth/refresh-token');
    const otp = await import('@/lib/otp');
    vi.spyOn(otp, 'verifyOTP').mockResolvedValueOnce(true);
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    (prisma.user as any).update = vi.fn().mockResolvedValue({});

    const { resetPassword } = await import('@/app/api/modules/auth/services');
    await resetPassword({ email: 'test@example.com', otp: '123456', newPassword: 'NewPassword1' });
    expect(revokeAllRefreshTokens).toHaveBeenCalledWith('user-1');
  });

  it('asks an unverified account for the emailed code instead of signing in', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { verifyPassword } = await import('@/lib/auth/password');
    const { createSession } = await import('@/lib/auth/session');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1', name: 'T', email: 'test@example.com', passwordHash: 'hashed', emailVerifiedAt: null,
    });
    (verifyPassword as any).mockResolvedValue(true);

    const { login } = await import('@/app/api/modules/auth/services');
    const result = await login({ email: 'test@example.com', password: 'Password1' });

    expect(result).toEqual({ verificationRequired: true, email: 'test@example.com' });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('Google sign-in to an unverified account wipes the squatter\'s password, 2FA and sessions', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { verifyGoogleToken } = await import('@/lib/google-auth');
    const { revokeAllRefreshTokens } = await import('@/lib/auth/refresh-token');
    (verifyGoogleToken as any).mockResolvedValue({ googleId: 'g1', email: 'victim@example.com', name: 'V', avatar: null });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce({ id: 'user-1', email: 'victim@example.com', passwordHash: 'attacker', emailVerifiedAt: null });
    (prisma.user.update as any).mockResolvedValue({ id: 'user-1', name: 'V', email: 'victim@example.com', avatar: null, mfaConfirmedAt: null });

    const { googleAuth } = await import('@/app/api/modules/auth/services');
    const result = await googleAuth('id-token');

    const data = (prisma.user.update as any).mock.calls[0][0].data;
    expect(data).toMatchObject({ googleId: 'g1', passwordHash: null, mfaSecretEncrypted: null, mfaConfirmedAt: null });
    expect(data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(revokeAllRefreshTokens).toHaveBeenCalledWith('user-1');
    expect(result).toHaveProperty('token');
  });

  it('Google sign-in to a verified account links without touching the password', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { verifyGoogleToken } = await import('@/lib/google-auth');
    (verifyGoogleToken as any).mockResolvedValue({ googleId: 'g1', email: 'me@example.com', name: 'M', avatar: null });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'user-1', email: 'me@example.com', passwordHash: 'mine', ...verified });
    (prisma.user.update as any).mockResolvedValue({ id: 'user-1', name: 'M', email: 'me@example.com', avatar: null, mfaConfirmedAt: null });

    const { googleAuth } = await import('@/app/api/modules/auth/services');
    await googleAuth('id-token');

    expect((prisma.user.update as any).mock.calls[0][0].data).not.toHaveProperty('passwordHash');
  });
});
