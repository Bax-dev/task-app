import { prisma } from '@/lib/db/client';

export async function createProject(data: {
  name: string;
  description?: string;
  spaceId: string;
  createdById: string;
}) {
  return prisma.project.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      space: { select: { id: true, name: true, organizationId: true, organization: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function findProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      space: { select: { id: true, name: true, color: true, organizationId: true, organization: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function findProjectsBySpace(spaceId: string) {
  return prisma.project.findMany({
    where: { spaceId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where: {
      space: {
        organization: {
          memberships: { some: { userId } },
        },
      },
    },
    include: {
      space: { select: { id: true, name: true, color: true, organizationId: true, organization: { select: { id: true, name: true, slug: true } } } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateProject(id: string, data: { name?: string; description?: string | null }) {
  return prisma.project.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      space: { select: { id: true, name: true, organizationId: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}
