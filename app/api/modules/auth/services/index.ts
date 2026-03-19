import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { generateOTP, storeOTP, verifyOTP as verifyStoredOTP, canResendOTP } from '@/lib/otp';
import { sendEmail, buildOTPEmail } from '@/lib/email';
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

  return { user, token };
}

export async function login(dto: LoginDTO): Promise<AuthResponse> {
  const user = await authModel.findUserByEmail(dto.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(dto.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = await createSession(user.id, user.email);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token,
  };
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
  // Verify the OTP directly (this is the combined verify+reset flow)
  const isValid = await verifyStoredOTP('forgot-password', dto.email, dto.otp);
  if (!isValid) {
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
