import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth/jwt';

export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | null> {
  // Check cookie first
  const cookieToken = request.cookies.get('session')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }

  return null;
}

/** True when the request carries the configured cron secret (constant-time compare; false if unset). */
export function isCronRequest(request: NextRequest): boolean {
  const expected = process.env.TASKFLOW_CRON_SECRET;
  const provided = request.headers.get('x-taskflow-cron-secret');
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}
