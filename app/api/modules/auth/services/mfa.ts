/**
 * Two-step verification flows (pattern from stocklogs' api/authentication/mfa.py).
 *
 * Setup     POST /api/auth/mfa/setup {password}  -> secret + otpauth:// URL (pending)
 *           POST /api/auth/mfa/enable {code}     -> recovery codes (shown once); MFA is on
 * Sign-in   POST /api/auth/login                 -> {mfaRequired, mfaToken} instead of cookies
 *           POST /api/auth/mfa/verify {mfaToken, code | recoveryCode} -> session cookies
 * Manage    POST /api/auth/mfa/disable, /api/auth/mfa/recovery-codes {password, code}
 *
 * Replay and double-use are blocked with conditional updateMany calls (atomic, no row locks).
 */
import { randomBytes } from 'node:crypto';
import { loginLimiter } from '@/lib/rate-limit';
import { prisma } from '@/lib/db/client';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { signRefreshToken } from '@/lib/auth/refresh-token';
import { sendEmail, buildMfaChangedEmail } from '@/lib/email';
import {
  DIGITS, PERIOD, generateSecret, encryptMfaSecret, decryptMfaSecret, matchingCounter,
  otpauthUrl, looksLikeTotp, newRecoveryCodes, recoveryHash, hashToken,
} from '@/lib/auth/totp';
import type { AuthResponse } from '../types';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;
const METHODS = ['totp', 'recovery_code'] as const;

export class MfaError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export type MfaChallengeResponse = { mfaRequired: true; mfaToken: string; methods: typeof METHODS; expiresAt: Date };
export const isMfaChallenge = (r: unknown): r is MfaChallengeResponse => (r as MfaChallengeResponse)?.mfaRequired === true;

const invalidCode = () => new MfaError('That code is not right. Check your authenticator app and try again.', 400);
const wrongPassword = () => new MfaError('Your password is incorrect.', 400);
const notifyChanged = (email: string, enabled: boolean) =>
  sendEmail({ to: email, ...buildMfaChangedEmail(enabled) }).catch((e) => console.error('[mfa] email failed', e?.message));

async function loadUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true, mfaSecretEncrypted: true, mfaConfirmedAt: true, mfaLastUsedCounter: true },
  });
  if (!user) throw new MfaError('User not found', 404);
  return user;
}

type MfaUser = Awaited<ReturnType<typeof loadUser>>;

async function checkPassword(user: MfaUser, password: string) {
  if (!user.passwordHash) throw new MfaError('Set a password on your account before turning on two-step verification.', 400);
  if (!(await verifyPassword(password, user.passwordHash))) throw wrongPassword();
}

/** Verifies a TOTP or recovery code and consumes it. Returns the method used. */
async function checkCode(user: MfaUser, { code, recoveryCode }: { code?: string; recoveryCode?: string }) {
  if (recoveryCode) {
    const { count } = await prisma.mfaRecoveryCode.updateMany({
      where: { userId: user.id, codeHash: recoveryHash(user.id, recoveryCode), usedAt: null },
      data: { usedAt: new Date() },
    });
    if (!count) throw invalidCode();
    return 'recovery_code' as const;
  }
  const counter = matchingCounter(secretOf(user), code ?? '');
  if (counter === null) throw invalidCode();
  // Only succeeds if this time-step is newer than the last accepted one: a code can't be replayed.
  const { count } = await prisma.user.updateMany({
    where: { id: user.id, mfaLastUsedCounter: { lt: counter } },
    data: { mfaLastUsedCounter: counter },
  });
  if (!count) throw invalidCode();
  return 'totp' as const;
}

async function replaceRecoveryCodes(userId: string) {
  const codes = newRecoveryCodes();
  await prisma.$transaction([
    prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    prisma.mfaRecoveryCode.createMany({ data: codes.map((c) => ({ userId, codeHash: recoveryHash(userId, c) })) }),
  ]);
  return codes;
}

function secretOf(user: MfaUser) {
  if (!user.mfaSecretEncrypted) throw invalidCode();
  try {
    return decryptMfaSecret(user.mfaSecretEncrypted);
  } catch {
    // MFA_ENCRYPTION_KEY / JWT_SECRET changed since enrolment.
    throw new MfaError('Two-step verification needs to be set up again. Contact support.', 500);
  }
}

/** Password + a current code (TOTP or recovery) for sensitive changes. */
async function reauthenticate(userId: string, password: string, code: string) {
  const user = await loadUser(userId);
  await checkPassword(user, password);
  if (!user.mfaConfirmedAt) throw new MfaError('Two-step verification is off.', 409);
  await checkCode(user, looksLikeTotp(code) ? { code } : { recoveryCode: code });
  return user;
}

// ---------------------------------------------------------------- status & enrolment

export async function status(userId: string) {
  const user = await loadUser(userId);
  const enabled = !!user.mfaConfirmedAt;
  return {
    enabled,
    pendingSetup: !enabled && !!user.mfaSecretEncrypted,
    confirmedAt: user.mfaConfirmedAt,
    recoveryCodesRemaining: enabled ? await prisma.mfaRecoveryCode.count({ where: { userId, usedAt: null } }) : 0,
    methods: enabled ? METHODS : [],
    hasPassword: !!user.passwordHash, // Google-only accounts can't pass the password re-auth step
  };
}

const alreadyOn = () => new MfaError('Two-step verification is already on.', 409);

export async function beginSetup(userId: string, password: string) {
  const user = await loadUser(userId);
  await checkPassword(user, password);
  if (user.mfaConfirmedAt) throw alreadyOn();
  const secret = generateSecret();
  // Conditional: a concurrent enable must not get its live secret swapped for one nobody scanned.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, mfaConfirmedAt: null },
    data: { mfaSecretEncrypted: encryptMfaSecret(secret), mfaLastUsedCounter: 0 },
  });
  if (!count) throw alreadyOn();
  return { secret, otpauthUrl: otpauthUrl(secret, user.email), digits: DIGITS, period: PERIOD };
}

export async function enable(userId: string, code: string) {
  const user = await loadUser(userId);
  if (user.mfaConfirmedAt) throw alreadyOn();
  if (!user.mfaSecretEncrypted) throw new MfaError('Start setup first.', 409);
  await checkCode(user, { code });
  const codes = newRecoveryCodes();
  // One transaction, conditional on the secret the code was checked against: a double submit or a
  // setup restarted in another tab can't enable the wrong secret or leave MFA on without codes.
  const enabled = await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: userId, mfaConfirmedAt: null, mfaSecretEncrypted: user.mfaSecretEncrypted },
      data: { mfaConfirmedAt: new Date() },
    });
    if (!count) return false;
    await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
    await tx.mfaRecoveryCode.createMany({ data: codes.map((c) => ({ userId, codeHash: recoveryHash(userId, c) })) });
    return true;
  });
  if (!enabled) throw new MfaError('Setup changed or finished in another window. Reload and try again.', 409);
  notifyChanged(user.email, true);
  return { recoveryCodes: codes, ...(await status(userId)) };
}

export async function disable(userId: string, password: string, code: string) {
  const user = await reauthenticate(userId, password, code);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { mfaSecretEncrypted: null, mfaConfirmedAt: null, mfaLastUsedCounter: 0 } }),
    prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    prisma.mfaChallenge.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  notifyChanged(user.email, false);
  return status(userId);
}

export async function regenerateRecoveryCodes(userId: string, password: string, code: string) {
  await reauthenticate(userId, password, code);
  const recoveryCodes = await replaceRecoveryCodes(userId);
  return { recoveryCodes, ...(await status(userId)) };
}

// ---------------------------------------------------------------- sign-in challenge

/** Returns a challenge when the user has MFA on, else null (caller issues the session). */
export async function challengeIfEnabled(user: { id: string; mfaConfirmedAt?: Date | null }): Promise<MfaChallengeResponse | null> {
  if (!user.mfaConfirmedAt) return null;
  // Each challenge allows 5 guesses; capping challenges per user caps guesses per user, whatever the IP.
  const limit = await loginLimiter.check(`mfa-challenge:${user.id}`);
  if (!limit.success) throw new MfaError('Too many sign-in attempts. Try again later.', 429);
  // Prune this user's finished challenges so the table doesn't grow with every sign-in.
  await prisma.mfaChallenge.deleteMany({
    where: { userId: user.id, OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }] },
  });
  const token = randomBytes(32).toString('base64url');
  const challenge = await prisma.mfaChallenge.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) },
  });
  return { mfaRequired: true, mfaToken: token, methods: METHODS, expiresAt: challenge.expiresAt };
}

export async function verifyChallenge(
  token: string,
  input: { code?: string; recoveryCode?: string },
): Promise<AuthResponse & { recoveryCodesRemaining: number; method: string }> {
  const challenge = await prisma.mfaChallenge.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date()) {
    throw new MfaError('Your sign-in timed out. Sign in again.', 401);
  }
  const user = await loadUser(challenge.userId);

  // MFA turned off after the password step: the password already proved it's them.
  let method: string = 'none';
  if (user.mfaConfirmedAt) {
    // Claim the attempt before checking: parallel guesses must not each slip under the cap.
    const { count: claimed } = await prisma.mfaChallenge.updateMany({
      where: { id: challenge.id, usedAt: null, attempts: { lt: MAX_CHALLENGE_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (!claimed) {
      await prisma.mfaChallenge.updateMany({ where: { id: challenge.id, usedAt: null }, data: { usedAt: new Date() } });
      throw new MfaError('Too many wrong codes. Sign in again.', 429);
    }
    method = await checkCode(user, input);
  }

  // Single use: only the first concurrent verify wins.
  const { count } = await prisma.mfaChallenge.updateMany({ where: { id: challenge.id, usedAt: null }, data: { usedAt: new Date() } });
  if (!count) throw new MfaError('Your sign-in timed out. Sign in again.', 401);

  const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, name: true, email: true, avatar: true } });
  const sessionToken = await createSession(full.id, full.email);
  const { token: refreshToken } = await signRefreshToken(full.id, full.email);
  const recoveryCodesRemaining = await prisma.mfaRecoveryCode.count({ where: { userId: user.id, usedAt: null } });
  return { user: full, token: sessionToken, refreshToken, recoveryCodesRemaining, method };
}
