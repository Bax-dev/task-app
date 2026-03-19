import { prisma } from '@/lib/db/client';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
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
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createUser(data: { name: string; email: string; passwordHash: string }) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
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
