import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, rateLimitResponse } from '@/lib/api-response';
import { setSessionCookie, deleteSessionCookie } from '@/lib/auth/session';
import { setRefreshTokenCookie, getRefreshTokenFromCookie, deleteRefreshTokenCookie } from '@/lib/auth/refresh-token';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { loginLimiter } from '@/lib/rate-limit';
import { registerSchema, loginSchema, forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema, resendOTPSchema, googleAuthSchema, mfaPasswordSchema, mfaEnableSchema, mfaReauthSchema, mfaVerifySchema } from '../types';
import * as authService from '../services';
import * as mfaService from '../services/mfa';

export async function handleRegister(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`register:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(registerSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await authService.register(validation.data);
    await setSessionCookie(result.token);
    await setRefreshTokenCookie(result.refreshToken);

    return successResponse({ user: result.user }, 201);
  } catch (error: any) {
    if (error.message === 'A user with this email already exists') {
      return errorResponse(error.message, 409);
    }
    return errorResponse('Registration failed', 500);
  }
}

export async function handleLogin(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`login:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(loginSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await authService.login(validation.data);
    if (mfaService.isMfaChallenge(result)) return successResponse(result);
    await setSessionCookie(result.token);
    await setRefreshTokenCookie(result.refreshToken);

    return successResponse({ user: result.user });
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Login failed', 500);
  }
}

export async function handleLogout(request: NextRequest) {
  try {
    
    const session = await authenticateRequest(request);
    const refreshToken = await getRefreshTokenFromCookie();

    // The refresh token can revoke its own session even if the access token expired.
    await authService.logoutUser({
      userId: session?.userId,
      refreshToken,
    });

    await deleteSessionCookie();
    await deleteRefreshTokenCookie();

    return successResponse({ message: 'Logged out successfully' });
  } catch {

    await deleteSessionCookie();
    await deleteRefreshTokenCookie();
    return successResponse({ message: 'Logged out successfully' });
  }
}

export async function handleRefresh() {
  try {
    const refreshToken = await getRefreshTokenFromCookie();
    if (!refreshToken) {
      return unauthorizedResponse('No refresh token provided');
    }

    const result = await authService.refreshSession(refreshToken);

    // Set new cookies
    await setSessionCookie(result.token);
    await setRefreshTokenCookie(result.refreshToken);

    return successResponse({ message: 'Token refreshed successfully' });
  } catch (error: any) {
    if (error.message === 'Invalid or expired refresh token') {
      // Clear stale cookies
      await deleteSessionCookie();
      await deleteRefreshTokenCookie();
      return unauthorizedResponse('Invalid or expired refresh token');
    }
    return errorResponse('Token refresh failed', 500);
  }
}

export async function handleForgotPassword(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`forgot:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(forgotPasswordSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await authService.forgotPassword(validation.data);
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleVerifyOTP(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`verify-otp:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(verifyOTPSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await authService.verifyOTP(
      validation.data.email,
      validation.data.otp,
      validation.data.purpose
    );
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Invalid or expired OTP') {
      return errorResponse(error.message, 400);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleResetPassword(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`reset:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(resetPasswordSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await authService.resetPassword(validation.data);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Invalid or expired OTP' || error.message === 'User not found') {
      return errorResponse('Invalid or expired OTP', 400);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleResendOTP(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`resend:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(resendOTPSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await authService.resendOTP(validation.data);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Please wait before requesting another OTP') {
      return errorResponse(error.message, 429);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleGoogleAuth(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`google:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(googleAuthSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await authService.googleAuth(validation.data.idToken);
    if (mfaService.isMfaChallenge(result)) return successResponse(result);
    await setSessionCookie(result.token);
    await setRefreshTokenCookie(result.refreshToken);

    return successResponse({ user: result.user });
  } catch (error: any) {
    if (error.message === 'Invalid Google token') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Google authentication failed', 500);
  }
}

export async function handleGetMe(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const user = await authService.getMe(session.userId);
    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// ---------------------------------------------------------------- two-step verification

// Malformed JSON becomes a 400 validation error, not a 500.
const readJson = (request: NextRequest) => request.json().catch(() => null);

function mfaErrorResponse(error: any, fallback: string) {
  if (error instanceof mfaService.MfaError) return errorResponse(error.message, error.status);
  console.error(`[mfa] ${fallback}`, error?.message ?? error);
  return errorResponse(fallback, 500);
}

export async function handleMfaStatus(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    return successResponse(await mfaService.status(session.userId));
  } catch (error: any) {
    return mfaErrorResponse(error, 'Failed to load two-step verification status');
  }
}

export async function handleMfaSetup(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = loginLimiter.check(`mfa-manage:${session.userId}`); // checks the password
    if (!limit.success) return rateLimitResponse(limit.resetIn);
    const validation = validateBody(mfaPasswordSchema, await readJson(request));
    if (!validation.success) return errorResponse(validation.error);
    return successResponse(await mfaService.beginSetup(session.userId, validation.data.password));
  } catch (error: any) {
    return mfaErrorResponse(error, 'Failed to start two-step verification setup');
  }
}

export async function handleMfaEnable(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = loginLimiter.check(`mfa-enable:${session.userId}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);
    const validation = validateBody(mfaEnableSchema, await readJson(request));
    if (!validation.success) return errorResponse(validation.error);
    return successResponse(await mfaService.enable(session.userId, validation.data.code));
  } catch (error: any) {
    return mfaErrorResponse(error, 'Failed to turn on two-step verification');
  }
}

export async function handleMfaDisable(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = loginLimiter.check(`mfa-manage:${session.userId}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);
    const validation = validateBody(mfaReauthSchema, await readJson(request));
    if (!validation.success) return errorResponse(validation.error);
    return successResponse(await mfaService.disable(session.userId, validation.data.password, validation.data.code));
  } catch (error: any) {
    return mfaErrorResponse(error, 'Failed to turn off two-step verification');
  }
}

export async function handleMfaRecoveryCodes(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = loginLimiter.check(`mfa-manage:${session.userId}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);
    const validation = validateBody(mfaReauthSchema, await readJson(request));
    if (!validation.success) return errorResponse(validation.error);
    return successResponse(
      await mfaService.regenerateRecoveryCodes(session.userId, validation.data.password, validation.data.code),
    );
  } catch (error: any) {
    return mfaErrorResponse(error, 'Failed to regenerate recovery codes');
  }
}

export async function handleMfaVerify(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = loginLimiter.check(`mfa-verify:${ip}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const validation = validateBody(mfaVerifySchema, await readJson(request));
    if (!validation.success) return errorResponse(validation.error);
    const { mfaToken, code, recoveryCode } = validation.data;

    const result = await mfaService.verifyChallenge(mfaToken, { code, recoveryCode });
    await setSessionCookie(result.token);
    await setRefreshTokenCookie(result.refreshToken);
    return successResponse({ user: result.user, recoveryCodesRemaining: result.recoveryCodesRemaining });
  } catch (error: any) {
    return mfaErrorResponse(error, 'Verification failed');
  }
}
