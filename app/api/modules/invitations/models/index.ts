import { prisma } from '@/lib/db/client';
import { InvitationStatus, Role } from '@prisma/client';

export async function createInvitation(data: {
  email: string;
  token: string;
  organizationId: string;
  invitedById: string;
  role: Role;
  expiresAt: Date;
}) {
  return prisma.invitation.create({
    data: {
      email: data.email,
      token: data.token,
      organizationId: data.organizationId,
      invitedById: data.invitedById,
      role: data.role,
      expiresAt: data.expiresAt,
    },
    include: {
      organization: { select: { name: true, slug: true } },
    },
  });
}

export async function findInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function findPendingInvitation(email: string, organizationId: string) {
  return prisma.invitation.findFirst({
    where: {
      email,
      organizationId,
      status: InvitationStatus.PENDING,
    },
  });
}

export async function findOrganizationInvitations(organizationId: string, statusFilter?: InvitationStatus) {
  return prisma.invitation.findMany({
    where: {
      organizationId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateInvitationStatus(id: string, status: InvitationStatus) {
  return prisma.invitation.update({
    where: { id },
    data: { status },
  });
}

export async function createMembership(data: { userId: string; organizationId: string; role: Role }) {
  return prisma.membership.create({ data });
}

export async function findExistingMembership(userId: string, organizationId: string) {
  return prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
}

export async function deleteInvitation(id: string) {
  return prisma.invitation.delete({ where: { id } });
}
