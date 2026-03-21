import { prisma } from '@/lib/db/client';

export async function createDashboard(data: {
  name: string;
  layout?: any;
  organizationId: string;
  createdById: string;
}) {
  return prisma.dashboard.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findDashboardById(id: string) {
  return prisma.dashboard.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findDashboardsByUser(userId: string, organizationId: string) {
  return prisma.dashboard.findMany({
    where: { createdById: userId, organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateDashboard(id: string, data: { name?: string; layout?: any }) {
  return prisma.dashboard.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteDashboard(id: string) {
  return prisma.dashboard.delete({ where: { id } });
}
