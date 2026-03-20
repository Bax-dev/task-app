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
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createUser(data: { name: string; email: string; passwordHash?: string; googleId?: string; avatar?: string }) {
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
    },
  });
}

export async function linkGoogleAccount(email: string, googleId: string, avatar?: string | null) {
  return prisma.user.update({
    where: { email },
    data: { googleId, ...(avatar ? { avatar } : {}) },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
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
