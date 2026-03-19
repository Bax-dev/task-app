import { prisma } from '@/lib/db/client';
import { TaskStatus, TaskPriority } from '@prisma/client';

const taskInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  assignments: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  project: {
    select: { id: true, name: true, spaceId: true, space: { select: { id: true, name: true, organizationId: true } } },
  },
};

export async function createTask(data: {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  projectId: string;
  createdById: string;
}) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      projectId: data.projectId,
      createdById: data.createdById,
    },
    include: taskInclude,
  });
}

export async function findTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });
}

export async function findTasksByProject(projectId: string) {
  return prisma.task.findMany({
    where: { projectId },
    include: taskInclude,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function findTasksByUser(userId: string) {
  return prisma.task.findMany({
    where: {
      OR: [
        { createdById: userId },
        { assignments: { some: { userId } } },
      ],
    },
    include: taskInclude,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function updateTask(id: string, data: {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  rejectionReason?: string | null;
}) {
  return prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}

export async function assignUser(taskId: string, userId: string) {
  return prisma.taskAssignment.create({
    data: { taskId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function unassignUser(taskId: string, userId: string) {
  return prisma.taskAssignment.delete({
    where: { taskId_userId: { taskId, userId } },
  });
}

export async function findAssignment(taskId: string, userId: string) {
  return prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
}
