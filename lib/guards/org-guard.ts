import { prisma } from '@/lib/db/client';
import { Role } from '@prisma/client';

export async function verifyOrgMembership(
  userId: string,
  organizationId: string
): Promise<{ isMember: boolean; role: Role | null }> {
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });

  return {
    isMember: !!membership,
    role: membership?.role ?? null,
  };
}

export async function requireOrgMembership(
  userId: string,
  organizationId: string
): Promise<Role> {
  const { isMember, role } = await verifyOrgMembership(userId, organizationId);
  if (!isMember || !role) {
    throw new Error('Not a member of this organization');
  }
  return role;
}

export async function requireOrgAdmin(
  userId: string,
  organizationId: string
): Promise<void> {
  const role = await requireOrgMembership(userId, organizationId);
  if (role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
}

export async function requireNonGuest(
  userId: string,
  organizationId: string
): Promise<Role> {
  const role = await requireOrgMembership(userId, organizationId);
  if (role === 'GUEST') {
    throw new Error('Guest users have read-only access');
  }
  return role;
}
