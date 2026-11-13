import { HttpError } from '@/lib/api-response';
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
    throw new HttpError('Not a member of this organization', 403);
  }
  return role;
}

export async function requireOrgAdmin(
  userId: string,
  organizationId: string
): Promise<void> {
  const role = await requireOrgMembership(userId, organizationId);
  if (role !== 'ADMIN') {
    throw new HttpError('Admin access required', 403);
  }
}

export async function requireNonGuest(
  userId: string,
  organizationId: string
): Promise<Role> {
  const role = await requireOrgMembership(userId, organizationId);
  if (role === 'GUEST') {
    throw new HttpError('Guest users have read-only access', 403);
  }
  return role;
}

/** Ids from request bodies must not point into another org. Throws 404 so existence isn't leaked. */
export async function assertIssueTypeInOrg(issueTypeId: string | null | undefined, organizationId: string): Promise<void> {
  if (!issueTypeId) return;
  const found = await prisma.issueType.findFirst({ where: { id: issueTypeId, organizationId }, select: { id: true } });
  if (!found) throw new HttpError('Issue type not found', 404);
}
