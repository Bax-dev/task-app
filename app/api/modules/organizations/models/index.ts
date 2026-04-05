import { prisma } from '@/lib/db/client';
import { Role } from '@prisma/client';

export async function createOrganization(data: { name: string; slug: string; createdById: string }) {
  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        createdById: data.createdById,
      },
    });

    // Creator becomes ADMIN
    await tx.membership.create({
      data: {
        userId: data.createdById,
        organizationId: org.id,
        role: Role.ADMIN,
      },
    });

    return org;
  });
}

export async function findOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: { select: { spaces: true, memberships: true } },
    },
  });
}

export async function findOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function findUserOrganizations(userId: string) {
  const orgs = await prisma.organization.findMany({
    where: {
      memberships: { some: { userId } },
    },
    include: {
      memberships: {
        where: { userId },
        select: { role: true },
      },
      _count: { select: { spaces: true, memberships: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orgs.map((org) => ({
    ...org,
    currentUserRole: org.memberships[0]?.role ?? null,
    memberships: undefined,
  }));
}

export async function updateOrganization(id: string, data: { name?: string }) {
  return prisma.organization.update({
    where: { id },
    data,
  });
}

export async function deleteOrganization(id: string) {
  return prisma.organization.delete({ where: { id } });
}
