import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const protectedRoutes = ['/dashboard', '/organizations', '/projects', '/tasks', '/team', '/settings', '/spaces', '/notes', '/notifications', '/boards', '/labels', '/sprints', '/workflows', '/automations', '/integrations', '/saved-filters', '/dashboards', '/issue-types', '/custom-fields', '/reports', '/calendar', '/favorites', '/activity-logs'];
const authRoutes = ['/login', '/signup', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!token && !refreshToken) {
      // No tokens at all — redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (token) {
      try {
        await jwtVerify(token, SECRET);
        // Access token is valid, proceed
      } catch {
        // Access token expired but refresh token exists — let client-side handle refresh
        if (!refreshToken) {
          const url = new URL('/login', request.url);
          url.searchParams.set('redirect', pathname);
          return NextResponse.redirect(url);
        }
        // Has refresh token, allow through so RTK Query can auto-refresh
      }
    }
    // If no access token but has refresh token, allow through for client-side refresh
  }

  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, SECRET);
      // If there's a redirect param, go there instead of dashboard
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch {
      // Token is invalid, let them access auth pages
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
