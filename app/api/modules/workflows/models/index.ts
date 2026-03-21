import { prisma } from '@/lib/db/client';

const workflowInclude = {
  issueType: { select: { id: true, name: true } },
  steps: { orderBy: { position: 'asc' as const } },
  transitions: {
    include: {
      fromStep: { select: { id: true, name: true } },
      toStep: { select: { id: true, name: true } },
    },
  },
};

export async function createWorkflow(data: {
  name: string;
  description?: string;
  issueTypeId?: string | null;
  organizationId: string;
}) {
  return prisma.workflow.create({
    data,
    include: workflowInclude,
  });
}

export async function findWorkflowById(id: string) {
  return prisma.workflow.findUnique({
    where: { id },
    include: {
      ...workflowInclude,
      organization: { select: { id: true } },
    },
  });
}

export async function findWorkflowsByOrganization(organizationId: string) {
  return prisma.workflow.findMany({
    where: { organizationId },
    include: workflowInclude,
    orderBy: { name: 'asc' },
  });
}

export async function updateWorkflow(id: string, data: {
  name?: string;
  description?: string | null;
}) {
  return prisma.workflow.update({
    where: { id },
    data,
    include: workflowInclude,
  });
}

export async function deleteWorkflow(id: string) {
  return prisma.workflow.delete({ where: { id } });
}

export async function createWorkflowStep(data: {
  name: string;
  position: number;
  workflowId: string;
}) {
  return prisma.workflowStep.create({ data });
}

export async function findWorkflowStepById(id: string) {
  return prisma.workflowStep.findUnique({
    where: { id },
    include: { workflow: true },
  });
}

export async function updateWorkflowStep(id: string, data: {
  name?: string;
  position?: number;
}) {
  return prisma.workflowStep.update({
    where: { id },
    data,
  });
}

export async function deleteWorkflowStep(id: string) {
  return prisma.workflowStep.delete({ where: { id } });
}

export async function createWorkflowTransition(data: {
  name: string;
  fromStepId: string;
  toStepId: string;
  conditions?: any;
  workflowId: string;
}) {
  return prisma.workflowTransition.create({
    data,
    include: {
      fromStep: { select: { id: true, name: true } },
      toStep: { select: { id: true, name: true } },
    },
  });
}

export async function deleteWorkflowTransition(id: string) {
  return prisma.workflowTransition.delete({ where: { id } });
}
