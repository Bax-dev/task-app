import { prisma } from '@/lib/db/client';

export async function createSubtask(data: {
  title: string;
  taskId: string;
  createdById: string;
  position: number;
}) {
  return prisma.subtask.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findSubtasksByTask(taskId: string) {
  return prisma.subtask.findMany({
    where: { taskId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { position: 'asc' },
  });
}

export async function findSubtaskById(id: string) {
  return prisma.subtask.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      task: {
        select: {
          id: true,
          projectId: true,
          project: {
            select: { space: { select: { organizationId: true } } },
          },
        },
      },
    },
  });
}

export async function updateSubtask(id: string, data: {
  title?: string;
  completed?: boolean;
  position?: number;
}) {
  return prisma.subtask.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteSubtask(id: string) {
  return prisma.subtask.delete({ where: { id } });
}

export async function getMaxPosition(taskId: string) {
  const result = await prisma.subtask.aggregate({
    where: { taskId },
    _max: { position: true },
  });
  return result._max.position ?? -1;
}

export async function reorderSubtasks(taskId: string, subtaskIds: string[]) {
  const updates = subtaskIds.map((id, index) =>
    prisma.subtask.update({
      where: { id },
      data: { position: index },
    })
  );
  return prisma.$transaction(updates);
}
