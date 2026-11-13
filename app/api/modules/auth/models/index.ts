import { prisma } from '@/lib/db/client';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      passwordHash: true,
      mfaConfirmedAt: true,
      emailVerifiedAt: true,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createUser(data: { name: string; email: string; passwordHash?: string; googleId?: string; avatar?: string; emailVerifiedAt?: Date }) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });
}

export async function findUserByGoogleId(googleId: string) {
  return prisma.user.findUnique({
    where: { googleId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      passwordHash: true,
      mfaConfirmedAt: true,
    },
  });
}

/**
 * Links Google to an existing account. If the address was never verified, whoever registered it may not own
 * it: Google just proved who does, so their password, 2FA and pending challenges are wiped in the same write.
 */
export async function linkGoogleAccount(email: string, googleId: string, avatar: string | null | undefined, wasVerified: boolean) {
  return prisma.user.update({
    where: { email },
    data: {
      googleId,
      ...(avatar ? { avatar } : {}),
      ...(!wasVerified && {
        emailVerifiedAt: new Date(),
        passwordHash: null,
        mfaSecretEncrypted: null,
        mfaConfirmedAt: null,
        mfaLastUsedCounter: 0,
        mfaRecoveryCodes: { deleteMany: {} },
        mfaChallenges: { deleteMany: {} },
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      mfaConfirmedAt: true,
    },
  });
}

export async function updateUserPassword(email: string, passwordHash: string) {
  return prisma.user.update({
    where: { email },
    data: { passwordHash },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function markEmailVerified(email: string) {
  // Conditional: verifying twice is a no-op and never re-stamps an already verified account.
  const { count } = await prisma.user.updateMany({ where: { email, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
  return count === 1;
}

/** Restarts an unverified signup with new details; never touches a verified account. */
export async function resetPendingSignup(email: string, name: string, passwordHash: string) {
  const { count } = await prisma.user.updateMany({ where: { email, emailVerifiedAt: null }, data: { name, passwordHash } });
  if (!count) throw new Error('A user with this email already exists');
}
