import { prisma } from '@/lib/db/client';
import { IntegrationType } from '@prisma/client';

export async function createIntegration(data: {
  type: IntegrationType;
  name: string;
  config?: any;
  enabled?: boolean;
  organizationId: string;
  createdById: string;
}) {
  return prisma.integration.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findIntegrationById(id: string) {
  return prisma.integration.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true } },
    },
  });
}

export async function findIntegrationsByOrganization(organizationId: string) {
  return prisma.integration.findMany({
    where: { organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateIntegration(id: string, data: {
  name?: string;
  config?: any;
  enabled?: boolean;
}) {
  return prisma.integration.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteIntegration(id: string) {
  return prisma.integration.delete({ where: { id } });
}
