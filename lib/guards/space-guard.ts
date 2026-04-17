import { prisma } from '@/lib/db/client';
import { Role } from '@prisma/client';
import { verifyOrgMembership } from './org-guard';

export async function canAccessSpace(userId: string, spaceId: string): Promise<boolean> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { organizationId: true },
  });
  if (!space) return false;

  const { isMember, role } = await verifyOrgMembership(userId, space.organizationId);
  if (!isMember) return false;
  if (role === Role.ADMIN) return true;

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { id: true },
  });
  return !!membership;
}

export async function requireSpaceAccess(userId: string, spaceId: string): Promise<Role> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { organizationId: true },
  });
  if (!space) throw new Error('Space not found');

  const { isMember, role } = await verifyOrgMembership(userId, space.organizationId);
  if (!isMember || !role) throw new Error('Not a member of this organization');
  if (role === Role.ADMIN) return role;

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { id: true },
  });
  if (!membership) throw new Error('Not a member of this space');
  return role;
}

export async function getAccessibleSpaceIds(userId: string, organizationId: string): Promise<{ all: true } | { all: false; ids: string[] }> {
  const { isMember, role } = await verifyOrgMembership(userId, organizationId);
  if (!isMember) return { all: false, ids: [] };
  if (role === Role.ADMIN) return { all: true };

  const memberships = await prisma.spaceMember.findMany({
    where: { userId, space: { organizationId } },
    select: { spaceId: true },
  });
  return { all: false, ids: memberships.map((m) => m.spaceId) };
}
