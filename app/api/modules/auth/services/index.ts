import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { signRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllRefreshTokens } from '@/lib/auth/refresh-token';
import { generateOTP, storeOTP, verifyOTP as verifyStoredOTP, canResendOTP } from '@/lib/otp';
import { sendEmail, buildOTPEmail } from '@/lib/email';
import { verifyGoogleToken } from '@/lib/google-auth';
import * as authModel from '../models';
import { RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO, ResendOTPDTO, AuthResponse } from '../types';

export async function register(dto: RegisterDTO): Promise<AuthResponse> {
  const existing = await authModel.findUserByEmail(dto.email);
  if (existing) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = await hashPassword(dto.password);
  const user = await authModel.createUser({
    name: dto.name,
    email: dto.email,
    passwordHash,
  });

  const token = await createSession(user.id, user.email);
  const { token: refreshToken } = await signRefreshToken(user.id, user.email);

  return { user, token, refreshToken };
}

export async function login(dto: LoginDTO): Promise<AuthResponse> {
  const user = await authModel.findUserByEmail(dto.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(dto.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = await createSession(user.id, user.email);
  const { token: refreshToken } = await signRefreshToken(user.id, user.email);

  return {
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    token,
    refreshToken,
  };
}

export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const googleUser = await verifyGoogleToken(idToken);

  // Check if user already exists by Google ID
  let user = await authModel.findUserByGoogleId(googleUser.googleId);
  if (user) {
    const token = await createSession(user.id, user.email);
    const { token: refreshToken } = await signRefreshToken(user.id, user.email);
    return { user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }, token, refreshToken };
  }

  // Check if user exists by email (link Google account)
  const existingUser = await authModel.findUserByEmail(googleUser.email);
  if (existingUser) {
    const linked = await authModel.linkGoogleAccount(googleUser.email, googleUser.googleId, googleUser.avatar);
    const token = await createSession(linked.id, linked.email);
    const { token: refreshToken } = await signRefreshToken(linked.id, linked.email);
    return { user: { id: linked.id, name: linked.name, email: linked.email, avatar: linked.avatar }, token, refreshToken };
  }

  // Create new user
  const newUser = await authModel.createUser({
    name: googleUser.name,
    email: googleUser.email,
    googleId: googleUser.googleId,
    avatar: googleUser.avatar || undefined,
  });

  const token = await createSession(newUser.id, newUser.email);
  const { token: refreshToken } = await signRefreshToken(newUser.id, newUser.email);
  return { user: { id: newUser.id, name: newUser.name, email: newUser.email, avatar: newUser.avatar }, token, refreshToken };
}

export async function refreshSession(refreshTokenValue: string): Promise<{ token: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(refreshTokenValue);
  if (!payload) {
    throw new Error('Invalid or expired refresh token');
  }

  // Revoke old refresh token (token rotation)
  await revokeRefreshToken(payload.userId, payload.tokenId);

  // Issue new access token + new refresh token
  const token = await createSession(payload.userId, payload.email);
  const { token: refreshToken } = await signRefreshToken(payload.userId, payload.email);

  return { token, refreshToken };
}

export async function logoutUser(userId: string, refreshTokenValue?: string): Promise<void> {
  if (refreshTokenValue) {
    // Revoke the specific refresh token
    const payload = await verifyRefreshToken(refreshTokenValue);
    if (payload) {
      await revokeRefreshToken(payload.userId, payload.tokenId);
    }
  } else {
    // If no refresh token provided, revoke all for safety
    await revokeAllRefreshTokens(userId);
  }
}

export async function getMe(userId: string) {
  const user = await authModel.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

export async function forgotPassword(dto: ForgotPasswordDTO) {
  const user = await authModel.findUserByEmail(dto.email);
  if (!user) {
    // Don't reveal whether email exists - always return success
    return { message: 'If an account exists with this email, an OTP has been sent.' };
  }

  const otp = generateOTP();
  await storeOTP('forgot-password', dto.email, otp);

  const emailContent = buildOTPEmail(otp, 'forgot-password');
  await sendEmail({
    to: dto.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  return { message: 'If an account exists with this email, an OTP has been sent.' };
}

export async function verifyOTP(email: string, otp: string, purpose: 'forgot-password' | 'verify-email') {
  const isValid = await verifyStoredOTP(purpose, email, otp);
  if (!isValid) {
    throw new Error('Invalid or expired OTP');
  }

  // For forgot-password, generate a short-lived reset token stored in Redis
  if (purpose === 'forgot-password') {
    const resetToken = generateOTP(); // reuse OTP generator for simplicity
    await storeOTP('reset-token', email, resetToken);
    return { valid: true, resetToken };
  }

  return { valid: true };
}

export async function resetPassword(dto: ResetPasswordDTO) {
  const isResetToken = await verifyStoredOTP('reset-token', dto.email, dto.otp);
  const isDirectOtp = !isResetToken && await verifyStoredOTP('forgot-password', dto.email, dto.otp);
  if (!isResetToken && !isDirectOtp) {
    throw new Error('Invalid or expired OTP');
  }

  const user = await authModel.findUserByEmail(dto.email);
  if (!user) {
    throw new Error('User not found');
  }

  const passwordHash = await hashPassword(dto.newPassword);
  await authModel.updateUserPassword(dto.email, passwordHash);

  return { message: 'Password reset successfully' };
}

export async function resendOTP(dto: ResendOTPDTO) {
  const canResend = await canResendOTP(dto.purpose, dto.email);
  if (!canResend) {
    throw new Error('Please wait before requesting another OTP');
  }

  // Only send if user exists (but don't reveal this)
  const user = await authModel.findUserByEmail(dto.email);
  if (!user) {
    return { message: 'If an account exists, a new OTP has been sent.' };
  }

  const otp = generateOTP();
  await storeOTP(dto.purpose, dto.email, otp);

  const emailContent = buildOTPEmail(otp, dto.purpose);
  await sendEmail({
    to: dto.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  return { message: 'If an account exists, a new OTP has been sent.' };
}
