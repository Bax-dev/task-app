import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_MARKER_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE,
} from './constants';

export const REFRESH_MAX_AGE = REFRESH_TOKEN_MAX_AGE;

const TOKEN_PREFIX = 'auth:refresh:token:';
const USER_PREFIX = 'auth:refresh:user:';

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  tokenHash: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function tokenKey(tokenHash: string): string {
  return `${TOKEN_PREFIX}${tokenHash}`;
}

function userKey(userId: string): string {
  return `${USER_PREFIX}${userId}`;
}

function newOpaqueToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function useSecureCookies(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return appUrl ? appUrl.startsWith('https://') : process.env.NODE_ENV === 'production';
}

/** Store only a SHA-256 fingerprint in Redis; a Redis leak does not expose live tokens. */
export async function signRefreshToken(
  userId: string,
  email: string
): Promise<{ token: string; tokenId: string }> {
  const token = newOpaqueToken();
  const tokenHash = hashToken(token);
  const value = JSON.stringify({ userId, email });

  const transaction = redis.multi();
  transaction.set(tokenKey(tokenHash), value, 'EX', REFRESH_MAX_AGE, 'NX');
  transaction.sadd(userKey(userId), tokenHash);
  transaction.expire(userKey(userId), REFRESH_MAX_AGE);
  const result = await transaction.exec();

  if (!result || result.some(([error]) => error)) {
    throw new Error('Refresh token store unavailable');
  }

  return { token, tokenId: tokenHash };
}

/**
 * Atomically consumes a refresh token. GETDEL guarantees that concurrent replay
 * attempts cannot both rotate the same token.
 */
export async function consumeRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  if (!token || token.length > 512) return null;

  const tokenHash = hashToken(token);
  const value = await redis.getdel(tokenKey(tokenHash));
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as { userId?: unknown; email?: unknown };
    if (typeof parsed.userId !== 'string' || typeof parsed.email !== 'string') return null;
    await redis.srem(userKey(parsed.userId), tokenHash);
    return { userId: parsed.userId, email: parsed.email, tokenHash };
  } catch {
    return null;
  }
}

/** Read-only validation is retained for callers that must inspect without rotating. */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  if (!token || token.length > 512) return null;
  const tokenHash = hashToken(token);
  const value = await redis.get(tokenKey(tokenHash));
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as { userId?: unknown; email?: unknown };
    if (typeof parsed.userId !== 'string' || typeof parsed.email !== 'string') return null;
    return { userId: parsed.userId, email: parsed.email, tokenHash };
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(userId: string, tokenHash: string): Promise<void> {
  await redis.multi().del(tokenKey(tokenHash)).srem(userKey(userId), tokenHash).exec();
}

export async function revokeRefreshTokenValue(token: string): Promise<void> {
  await consumeRefreshToken(token);
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  const key = userKey(userId);
  const hashes = await redis.smembers(key);
  const transaction = redis.multi();
  for (const hash of hashes) transaction.del(tokenKey(hash));
  transaction.del(key);
  await transaction.exec();
}

export async function setRefreshTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: 'strict',
    maxAge: REFRESH_MAX_AGE,
    path: '/api/auth',
  });
  // This root-scoped marker grants no API access. It only lets middleware know
  // that client-side refresh may be attempted after the access cookie expires.
  cookieStore.set(REFRESH_MARKER_COOKIE_NAME, '1', {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: 'strict',
    maxAge: REFRESH_MAX_AGE,
    path: '/',
  });
}

export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function deleteRefreshTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: 'strict',
    maxAge: 0,
    path: '/api/auth',
  });
  cookieStore.set(REFRESH_MARKER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}
