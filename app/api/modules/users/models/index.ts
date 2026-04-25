import { prisma } from '@/lib/db/client';

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

export async function updateUser(id: string, data: { name?: string; avatar?: string | null; timezone?: string }) {
  return prisma.user.update({
    where: { id },
    data,
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

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
}

export async function findUserPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  return user?.preferences ?? null;
}

export async function updateUserPreferences(userId: string, preferences: any) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { preferences },
    select: { preferences: true },
  });
  return user.preferences;
}

export async function findMembership(userId: string, organizationId: string) {
  return prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
}

export async function createMembership(data: { userId: string; organizationId: string; role: string }) {
  return prisma.membership.create({
    data: {
      userId: data.userId,
      organizationId: data.organizationId,
      role: data.role as any,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function removeMembership(userId: string, organizationId: string) {
  return prisma.membership.delete({
    where: { userId_organizationId: { userId, organizationId } },
  });
}

export async function findUsersByOrganization(organizationId: string) {
  return prisma.user.findMany({
    where: {
      memberships: {
        some: { organizationId },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      memberships: {
        where: { organizationId },
        select: { role: true },
      },
    },
  });
}
