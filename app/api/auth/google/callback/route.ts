import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { setSessionCookie } from '@/lib/auth/session';
import { setRefreshTokenCookie } from '@/lib/auth/refresh-token';
import * as authService from '@/app/api/modules/auth/services';
import { isMfaChallenge } from '@/app/api/modules/auth/services/mfa';
import { safeRedirect } from '@/lib/utils';
import { cookies } from 'next/headers';
import { OAUTH_STATE_COOKIE } from '@/lib/auth/constants';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', baseUrl));
  }

  // state = "<nonce>:<redirect>" from /api/auth/google/start; the nonce must match this browser's cookie.
  const cookieStore = await cookies();
  const expectedNonce = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete({ name: OAUTH_STATE_COOKIE, path: '/api/auth/google' });
  const sep = state?.indexOf(':') ?? -1;
  const nonce = sep > 0 ? state!.slice(0, sep) : '';
  if (!expectedNonce || nonce !== expectedNonce) {
    return NextResponse.redirect(new URL('/login?error=google_state_mismatch', baseUrl));
  }
  const redirectPath = state!.slice(sep + 1);

  try {
    // Exchange authorization code for tokens
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return NextResponse.redirect(new URL('/login?error=no_id_token', baseUrl));
    }

    // Use existing googleAuth service which verifies the ID token
    const result = await authService.googleAuth(idToken);
    // Redirect to the original page (e.g. invite link) or dashboard
    const redirectTo = safeRedirect(redirectPath);

    if (isMfaChallenge(result)) {
      // Fragment, not query: the token never reaches server logs or Referer headers.
      const url = new URL(`/login?redirect=${encodeURIComponent(redirectTo)}`, baseUrl);
      url.hash = `mfaToken=${result.mfaToken}`;
      return NextResponse.redirect(url);
    }

    await setSessionCookie(result.token);
    await setRefreshTokenCookie(result.refreshToken);
    return NextResponse.redirect(new URL(redirectTo, baseUrl));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', baseUrl));
  }
}
