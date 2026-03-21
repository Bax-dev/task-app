import { prisma } from '@/lib/db/client';
import { LinkType } from '@prisma/client';

export async function createIssueLink(data: {
  sourceTaskId: string;
  targetTaskId: string;
  linkType: LinkType;
}) {
  return prisma.issueLink.create({
    data,
    include: {
      sourceTask: { select: { id: true, title: true, taskNumber: true } },
      targetTask: { select: { id: true, title: true, taskNumber: true } },
    },
  });
}

export async function findIssueLinkById(id: string) {
  return prisma.issueLink.findUnique({
    where: { id },
    include: {
      sourceTask: {
        select: {
          id: true,
          title: true,
          taskNumber: true,
          project: { select: { space: { select: { organizationId: true } } } },
        },
      },
      targetTask: { select: { id: true, title: true, taskNumber: true } },
    },
  });
}

export async function findIssueLinksByTask(taskId: string) {
  return prisma.issueLink.findMany({
    where: {
      OR: [{ sourceTaskId: taskId }, { targetTaskId: taskId }],
    },
    include: {
      sourceTask: { select: { id: true, title: true, taskNumber: true, status: true } },
      targetTask: { select: { id: true, title: true, taskNumber: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteIssueLink(id: string) {
  return prisma.issueLink.delete({ where: { id } });
}
