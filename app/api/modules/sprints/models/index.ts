import { prisma } from '@/lib/db/client';

const sprintInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  sprintTasks: {
    include: {
      task: {
        select: { id: true, title: true, taskNumber: true, status: true, priority: true, storyPoints: true },
      },
    },
  },
  _count: { select: { sprintTasks: true } },
};

export async function createSprint(data: {
  name: string;
  goal?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  organizationId: string;
  createdById: string;
}) {
  return prisma.sprint.create({
    data: {
      name: data.name,
      goal: data.goal,
      startDate: data.startDate,
      endDate: data.endDate,
      organizationId: data.organizationId,
      createdById: data.createdById,
    },
    include: sprintInclude,
  });
}

export async function findSprintById(id: string) {
  return prisma.sprint.findUnique({
    where: { id },
    include: {
      ...sprintInclude,
      organization: { select: { id: true } },
    },
  });
}

export async function findSprintsByOrganization(organizationId: string) {
  return prisma.sprint.findMany({
    where: { organizationId },
    include: sprintInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateSprint(id: string, data: {
  name?: string;
  goal?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
}) {
  return prisma.sprint.update({
    where: { id },
    data,
    include: sprintInclude,
  });
}

export async function deleteSprint(id: string) {
  return prisma.sprint.delete({ where: { id } });
}

export async function addSprintTask(data: {
  sprintId: string;
  taskId: string;
  storyPoints?: number;
}) {
  return prisma.sprintTask.create({
    data: {
      sprintId: data.sprintId,
      taskId: data.taskId,
      storyPoints: data.storyPoints,
    },
    include: {
      task: {
        select: { id: true, title: true, taskNumber: true, status: true, priority: true },
      },
    },
  });
}

export async function removeSprintTask(sprintId: string, taskId: string) {
  return prisma.sprintTask.delete({
    where: { sprintId_taskId: { sprintId, taskId } },
  });
}

export async function findSprintTask(sprintId: string, taskId: string) {
  return prisma.sprintTask.findUnique({
    where: { sprintId_taskId: { sprintId, taskId } },
  });
}
