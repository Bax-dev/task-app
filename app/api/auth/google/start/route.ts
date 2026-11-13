import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { safeRedirect } from '@/lib/utils';
import { useSecureCookies } from '@/lib/auth/refresh-token';
import { OAUTH_STATE_COOKIE } from '@/lib/auth/constants';

/**
 * Starts the Google redirect flow. The nonce in `state` must match an httpOnly cookie set here, so a
 * callback URL carrying someone else's code can't sign this browser into their account (login CSRF).
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (!clientId) return NextResponse.redirect(new URL('/login?error=google_not_configured', appUrl));

  const nonce = randomBytes(24).toString('base64url');
  const redirect = safeRedirect(request.nextUrl.searchParams.get('redirect'));
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: `${nonce}:${redirect}`,
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  response.cookies.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: 'lax', // must survive the top-level redirect back from Google
    maxAge: 600,
    path: '/api/auth/google',
  });
  return response;
}
