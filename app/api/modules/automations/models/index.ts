import { prisma } from '@/lib/db/client';
import { AutomationTrigger, AutomationAction } from '@prisma/client';

export async function createAutomation(data: {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: any;
  action: AutomationAction;
  actionConfig?: any;
  enabled?: boolean;
  organizationId: string;
  createdById: string;
}) {
  return prisma.automation.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findAutomationById(id: string) {
  return prisma.automation.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true } },
    },
  });
}

export async function findAutomationsByOrganization(organizationId: string) {
  return prisma.automation.findMany({
    where: { organizationId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAutomation(id: string, data: {
  name?: string;
  description?: string | null;
  trigger?: AutomationTrigger;
  conditions?: any;
  action?: AutomationAction;
  actionConfig?: any;
  enabled?: boolean;
}) {
  return prisma.automation.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteAutomation(id: string) {
  return prisma.automation.delete({ where: { id } });
}
