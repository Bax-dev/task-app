import { prisma } from '@/lib/db/client';

export async function createSavedFilter(data: {
  name: string;
  query: any;
  shared?: boolean;
  organizationId: string;
  createdById: string;
}) {
  return prisma.savedFilter.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findSavedFilterById(id: string) {
  return prisma.savedFilter.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true } },
    },
  });
}

export async function findSavedFiltersByOrganization(organizationId: string, userId: string) {
  return prisma.savedFilter.findMany({
    where: {
      organizationId,
      OR: [
        { createdById: userId },
        { shared: true },
      ],
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateSavedFilter(id: string, data: { name?: string; query?: any; shared?: boolean }) {
  return prisma.savedFilter.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteSavedFilter(id: string) {
  return prisma.savedFilter.delete({ where: { id } });
}
