import { randomBytes } from 'crypto';
import { hashPassword, verifyPassword, verifyPasswordAgainstNothing } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { signRefreshToken, consumeRefreshToken, revokeRefreshTokenValue, revokeAllRefreshTokens } from '@/lib/auth/refresh-token';
import { generateOTP, storeOTP, verifyOTP as verifyStoredOTP, canResendOTP } from '@/lib/otp';
import { sendEmail, buildOTPEmail } from '@/lib/email';
import { verifyGoogleToken } from '@/lib/google-auth';
import * as authModel from '../models';
import { challengeIfEnabled, type MfaChallengeResponse } from './mfa';
import { RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO, ResendOTPDTO, AuthResponse, VerificationRequiredResponse } from '../types';

/** Emails a verify-email code unless one was sent in the last minute (the resend cooldown). */
async function sendVerificationCode(email: string) {
  if (!(await canResendOTP('verify-email', email))) return;
  const otp = generateOTP();
  await storeOTP('verify-email', email, otp);
  const content = buildOTPEmail(otp, 'verify-email');
  await sendEmail({ to: email, subject: content.subject, html: content.html });
}

async function issueSession(user: { id: string; name: string | null; email: string; avatar?: string | null }): Promise<AuthResponse> {
  const token = await createSession(user.id, user.email);
  const { token: refreshToken } = await signRefreshToken(user.id, user.email);
  return { user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }, token, refreshToken };
}

export async function register(dto: RegisterDTO): Promise<VerificationRequiredResponse> {
  const existing = await authModel.findUserByEmail(dto.email);
  if (existing?.emailVerifiedAt) {
    throw new Error('A user with this email already exists');
  }

  const passwordHash = await hashPassword(dto.password);
  if (existing) {
    // Unverified (abandoned or squatted) signup: the inbox owner proves it with the code, so let them restart.
    await authModel.resetPendingSignup(dto.email, dto.name, passwordHash);
  } else {
    await authModel.createUser({ name: dto.name, email: dto.email, passwordHash });
  }

  await sendVerificationCode(dto.email);
  return { verificationRequired: true, email: dto.email };
}

export async function login(dto: LoginDTO): Promise<AuthResponse | MfaChallengeResponse | VerificationRequiredResponse> {
  const user = await authModel.findUserByEmail(dto.email);
  if (!user?.passwordHash) {
    await verifyPasswordAgainstNothing(dto.password);
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(dto.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  if (!user.emailVerifiedAt) {
    await sendVerificationCode(user.email);
    return { verificationRequired: true, email: user.email };
  }

  const challenge = await challengeIfEnabled(user);
  if (challenge) return challenge;

  return issueSession(user);
}

export async function googleAuth(idToken: string): Promise<AuthResponse | MfaChallengeResponse> {
  const googleUser = await verifyGoogleToken(idToken);

  // Check if user already exists by Google ID
  let user = await authModel.findUserByGoogleId(googleUser.googleId);
  if (user) {
    const challenge = await challengeIfEnabled(user);
    if (challenge) return challenge;
    const token = await createSession(user.id, user.email);
    const { token: refreshToken } = await signRefreshToken(user.id, user.email);
    return { user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }, token, refreshToken };
  }

  // Check if user exists by email (link Google account)
  const existingUser = await authModel.findUserByEmail(googleUser.email);
  if (existingUser) {
    const wasVerified = !!existingUser.emailVerifiedAt;
    const linked = await authModel.linkGoogleAccount(googleUser.email, googleUser.googleId, googleUser.avatar, wasVerified);
    if (!wasVerified) await revokeAllRefreshTokens(linked.id); // sessions of whoever squatted the address
    const challenge = await challengeIfEnabled(linked);
    if (challenge) return challenge;
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
    emailVerifiedAt: new Date(), // verifyGoogleToken requires email_verified
  });

  const token = await createSession(newUser.id, newUser.email);
  const { token: refreshToken } = await signRefreshToken(newUser.id, newUser.email);
  return { user: { id: newUser.id, name: newUser.name, email: newUser.email, avatar: newUser.avatar }, token, refreshToken };
}

export async function refreshSession(refreshTokenValue: string): Promise<{ token: string; refreshToken: string }> {
  // Consuming first makes refresh tokens strictly one-time use, even under races.
  const payload = await consumeRefreshToken(refreshTokenValue);
  if (!payload) {
    throw new Error('Invalid or expired refresh token');
  }

  // Confirm the account still exists before minting another session.
  const user = await authModel.findUserById(payload.userId);
  if (!user || user.email !== payload.email) {
    throw new Error('Invalid or expired refresh token');
  }

  const token = await createSession(payload.userId, payload.email);
  const { token: refreshToken } = await signRefreshToken(payload.userId, payload.email);

  return { token, refreshToken };
}

export async function logoutUser({
  userId,
  refreshToken,
}: {
  userId?: string;
  refreshToken?: string | null;
}): Promise<void> {
  if (refreshToken) {
    await revokeRefreshTokenValue(refreshToken);
    return;
  }

  // If only an authenticated access session remains, revoke all user sessions.
  if (userId) await revokeAllRefreshTokens(userId);
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

  // Proving the inbox finishes signup: mark verified, then sign in (2FA still applies if somehow on).
  if (purpose === 'verify-email') {
    if (!(await authModel.markEmailVerified(email))) throw new Error('Invalid or expired OTP');
    const user = await authModel.findUserByEmail(email);
    if (!user) throw new Error('Invalid or expired OTP');
    const challenge = await challengeIfEnabled(user);
    if (challenge) return { valid: true, ...challenge };
    return { valid: true, ...(await issueSession(user)) };
  }

  // For forgot-password, generate a short-lived reset token stored in Redis
  if (purpose === 'forgot-password') {
    // Unguessable, unlike the 6-digit code: it's the only thing that authorizes the reset.
    const resetToken = randomBytes(32).toString('base64url');
    await storeOTP('reset-token', email, resetToken);
    return { valid: true, resetToken };
  }

  return { valid: true };
}

export async function resetPassword(dto: ResetPasswordDTO) {
  // Only the token from verifyOTP: accepting the raw 6-digit code here would double the guessing surface.
  const isResetToken = await verifyStoredOTP('reset-token', dto.email, dto.otp);
  if (!isResetToken) {
    throw new Error('Invalid or expired OTP');
  }

  const user = await authModel.findUserByEmail(dto.email);
  if (!user) {
    throw new Error('User not found');
  }

  const passwordHash = await hashPassword(dto.newPassword);
  await authModel.updateUserPassword(dto.email, passwordHash);
  await authModel.markEmailVerified(dto.email); // the reset code proved the inbox
  await revokeAllRefreshTokens(user.id);

  return { message: 'Password reset successfully' };
}

export async function resendOTP(dto: ResendOTPDTO) {
  const canResend = await canResendOTP(dto.purpose, dto.email);
  if (!canResend) {
    throw new Error('Please wait before requesting another OTP');
  }

  // Only send if user exists (but don't reveal this); verify-email codes only for unverified accounts.
  const user = await authModel.findUserByEmail(dto.email);
  if (!user || (dto.purpose === 'verify-email' && user.emailVerifiedAt)) {
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
