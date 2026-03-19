import { prisma } from '@/lib/db/client';

export async function createSpace(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  organizationId: string;
  createdById: string;
}) {
  return prisma.space.create({
    data,
    include: {
      _count: { select: { projects: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findSpaceById(id: string) {
  return prisma.space.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      projects: {
        include: {
          _count: { select: { tasks: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { projects: true } },
    },
  });
}

export async function findSpacesByOrganization(organizationId: string) {
  return prisma.space.findMany({
    where: { organizationId },
    include: {
      _count: { select: { projects: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateSpace(id: string, data: {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
}) {
  return prisma.space.update({
    where: { id },
    data,
    include: { _count: { select: { projects: true } } },
  });
}

export async function deleteSpace(id: string) {
  return prisma.space.delete({ where: { id } });
}
