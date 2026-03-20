import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redis, safeRedisCall } from '@/lib/redis';
import crypto from 'crypto';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const REDIS_PREFIX = 'refresh:';

// In-memory fallback for when Redis is unavailable
const memoryStore = new Map<string, { token: string; expiresAt: number }>();

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  tokenId: string;
}

/**
 * Generate a unique token ID for tracking refresh tokens
 */
function generateTokenId(): string {
  return crypto.randomUUID();
}

/**
 * Sign a refresh token JWT (30 days expiry)
 */
export async function signRefreshToken(userId: string, email: string): Promise<{ token: string; tokenId: string }> {
  const tokenId = generateTokenId();

  const token = await new SignJWT({ userId, email, tokenId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);

  // Store in Redis (or memory fallback) so we can revoke it
  const key = `${REDIS_PREFIX}${userId}:${tokenId}`;
  const stored = await safeRedisCall(() =>
    redis.set(key, token, 'EX', REFRESH_MAX_AGE)
  );

  if (!stored) {
    // Fallback to in-memory
    memoryStore.set(key, {
      token,
      expiresAt: Date.now() + REFRESH_MAX_AGE * 1000,
    });
  }

  return { token, tokenId };
}

/**
 * Verify a refresh token and check it hasn't been revoked
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const { userId, email, tokenId } = payload as unknown as RefreshTokenPayload;

    if (!userId || !email || !tokenId) return null;

    // Check if token is still valid in store (not revoked)
    const key = `${REDIS_PREFIX}${userId}:${tokenId}`;
    const storedToken = await safeRedisCall(() => redis.get(key));

    if (storedToken === null) {
      // Check in-memory fallback
      const memEntry = memoryStore.get(key);
      if (!memEntry || memEntry.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return null;
      }
    }

    return { userId, email, tokenId };
  } catch {
    return null;
  }
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
  const key = `${REDIS_PREFIX}${userId}:${tokenId}`;
  await safeRedisCall(() => redis.del(key));
  memoryStore.delete(key);
}

/**
 * Revoke all refresh tokens for a user (e.g., on password change)
 */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  // Redis: scan and delete all keys for this user
  const pattern = `${REDIS_PREFIX}${userId}:*`;
  const keys = await safeRedisCall(() => redis.keys(pattern));
  if (keys && keys.length > 0) {
    await safeRedisCall(() => redis.del(...keys));
  }

  // In-memory fallback: delete matching keys
  for (const key of memoryStore.keys()) {
    if (key.startsWith(`${REDIS_PREFIX}${userId}:`)) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Set refresh token as httpOnly cookie
 */
export async function setRefreshTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https'),
    sameSite: 'lax',
    maxAge: REFRESH_MAX_AGE,
    path: '/',
  });
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

/**
 * Delete refresh token cookie
 */
export async function deleteRefreshTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(REFRESH_COOKIE_NAME);
}
