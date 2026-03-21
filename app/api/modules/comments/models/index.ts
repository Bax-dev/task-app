import { prisma } from '@/lib/db/client';

export async function createComment(data: {
  content: string;
  taskId: string;
  createdById: string;
}) {
  return prisma.comment.create({
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findCommentById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      task: {
        select: {
          project: {
            select: {
              space: {
                select: { organizationId: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function findCommentsByTask(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateComment(id: string, data: { content: string }) {
  return prisma.comment.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteComment(id: string) {
  return prisma.comment.delete({ where: { id } });
}
