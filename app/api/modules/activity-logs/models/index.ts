import { prisma } from '@/lib/db/client';
import { ActivityStatus } from '@prisma/client';

const activityLogInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  task: { select: { id: true, title: true, projectId: true } },
  organization: { select: { id: true, name: true } },
  attachments: {
    select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true },
    orderBy: { createdAt: 'desc' as const },
  },
};

export async function createActivityLog(data: {
  description: string;
  status: ActivityStatus;
  note?: string | null;
  taskId?: string | null;
  organizationId: string;
  createdById: string;
}) {
  return prisma.activityLog.create({
    data: {
      description: data.description,
      status: data.status,
      note: data.note,
      taskId: data.taskId,
      organizationId: data.organizationId,
      createdById: data.createdById,
    },
    include: activityLogInclude,
  });
}

export async function findActivityLogById(id: string) {
  return prisma.activityLog.findUnique({
    where: { id },
    include: activityLogInclude,
  });
}

export async function findActivityLogsByOrg(organizationId: string) {
  return prisma.activityLog.findMany({
    where: { organizationId },
    include: activityLogInclude,
    orderBy: { loggedAt: 'desc' },
  });
}

export async function findActivityLogsByUser(userId: string) {
  return prisma.activityLog.findMany({
    where: { createdById: userId },
    include: activityLogInclude,
    orderBy: { loggedAt: 'desc' },
  });
}

export async function updateActivityLog(id: string, data: {
  description?: string;
  status?: ActivityStatus;
  note?: string | null;
  taskId?: string | null;
}) {
  return prisma.activityLog.update({
    where: { id },
    data,
    include: activityLogInclude,
  });
}

export async function deleteActivityLog(id: string) {
  return prisma.activityLog.delete({ where: { id } });
}
