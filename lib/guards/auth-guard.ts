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
