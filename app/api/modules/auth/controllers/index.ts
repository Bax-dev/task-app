import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, rateLimitResponse } from '@/lib/api-response';
import { setSessionCookie, deleteSessionCookie } from '@/lib/auth/session';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { loginLimiter } from '@/lib/rate-limit';
import { registerSchema, loginSchema, forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema, resendOTPSchema } from '../types';
import * as authService from '../services';

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
    await setSessionCookie(result.token);

    return successResponse({ user: result.user });
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return errorResponse(error.message, 401);
    }
    return errorResponse('Login failed', 500);
  }
}

export async function handleLogout() {
  try {
    await deleteSessionCookie();
    return successResponse({ message: 'Logged out successfully' });
  } catch {
    return errorResponse('Logout failed', 500);
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
