import { prisma } from '@/lib/db/client';

export async function createLabel(data: {
  name: string;
  color?: string;
  organizationId: string;
}) {
  return prisma.label.create({
    data,
    include: {
      _count: { select: { taskLabels: true } },
    },
  });
}

export async function findLabelById(id: string) {
  return prisma.label.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true } },
    },
  });
}

export async function findLabelsByOrganization(organizationId: string) {
  return prisma.label.findMany({
    where: { organizationId },
    include: {
      _count: { select: { taskLabels: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateLabel(id: string, data: { name?: string; color?: string }) {
  return prisma.label.update({
    where: { id },
    data,
    include: {
      _count: { select: { taskLabels: true } },
    },
  });
}

export async function deleteLabel(id: string) {
  return prisma.label.delete({ where: { id } });
}

export async function addTaskLabel(taskId: string, labelId: string) {
  return prisma.taskLabel.create({
    data: { taskId, labelId },
    include: { label: true },
  });
}

export async function removeTaskLabel(taskId: string, labelId: string) {
  return prisma.taskLabel.delete({
    where: { taskId_labelId: { taskId, labelId } },
  });
}

export async function findTaskLabels(taskId: string) {
  return prisma.taskLabel.findMany({
    where: { taskId },
    include: { label: true },
  });
}
