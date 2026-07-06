import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock auth utilities
vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  verifyPassword: vi.fn(),
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
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    });

    const { register } = await import('@/app/api/modules/auth/services');

    const result = await register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBe('mock-token');
  });

  it('should reject registration with existing email', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
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
    });
    (verifyPassword as any).mockResolvedValue(true);

    const { login } = await import('@/app/api/modules/auth/services');

    const result = await login({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBe('mock-token');
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
});
