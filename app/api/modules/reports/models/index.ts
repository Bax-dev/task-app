import { prisma } from '@/lib/db/client';

export async function getSprintWithTasks(sprintId: string) {
  return prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      organization: { select: { id: true, name: true } },
      sprintTasks: {
        include: {
          task: {
            select: { id: true, title: true, status: true, storyPoints: true, updatedAt: true, createdAt: true },
          },
        },
      },
    },
  });
}

export async function getCompletedSprints(organizationId: string, limit: number) {
  return prisma.sprint.findMany({
    where: { organizationId, status: 'COMPLETED' },
    include: {
      sprintTasks: {
        include: {
          task: { select: { id: true, status: true, storyPoints: true } },
        },
      },
    },
    orderBy: { endDate: 'desc' },
    take: limit,
  });
}

export async function getTasksByOrganization(organizationId: string) {
  return prisma.task.findMany({
    where: {
      project: { space: { organizationId } },
    },
    select: { id: true, status: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  });
}
