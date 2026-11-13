import { ActivityStatus } from '@prisma/client';
import { requireOrgMembership, requireNonGuest } from '@/lib/guards/org-guard';
import { requireTaskAccess } from '@/lib/guards/space-guard';
import { HttpError } from '@/lib/api-response';

/** A linked task must be one the user can see, in the log's org (the response echoes its title). */
async function assertTaskLinkable(userId: string, taskId: string | null | undefined, organizationId: string) {
  if (!taskId) return;
  const access = await requireTaskAccess(userId, taskId);
  if (access.organizationId !== organizationId) throw new HttpError('Task not found', 404);
}
import * as activityLogModel from '../models';
import { CreateActivityLogDTO, UpdateActivityLogDTO } from '../types';

export async function createActivityLog(userId: string, dto: CreateActivityLogDTO) {
  await requireNonGuest(userId, dto.organizationId);
  await assertTaskLinkable(userId, dto.taskId, dto.organizationId);

  return activityLogModel.createActivityLog({
    description: dto.description,
    status: dto.status as ActivityStatus,
    note: dto.note,
    taskId: dto.taskId,
    organizationId: dto.organizationId,
    createdById: userId,
  });
}

export async function getActivityLog(logId: string, userId: string) {
  const log = await activityLogModel.findActivityLogById(logId);
  if (!log) throw new Error('Activity log not found');

  await requireOrgMembership(userId, log.organizationId);
  return log;
}

export async function getOrgActivityLogs(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return activityLogModel.findActivityLogsByOrg(organizationId);
}

export async function getUserActivityLogs(userId: string) {
  return activityLogModel.findActivityLogsByUser(userId);
}

export async function updateActivityLog(logId: string, userId: string, dto: UpdateActivityLogDTO) {
  const log = await activityLogModel.findActivityLogById(logId);
  if (!log) throw new Error('Activity log not found');

  await requireNonGuest(userId, log.organizationId);

  if (log.createdById !== userId) {
    throw new Error('You can only update your own activity logs');
  }
  await assertTaskLinkable(userId, dto.taskId, log.organizationId);

  return activityLogModel.updateActivityLog(logId, {
    description: dto.description,
    status: dto.status as ActivityStatus | undefined,
    note: dto.note,
    taskId: dto.taskId,
  });
}

export async function deleteActivityLog(logId: string, userId: string) {
  const log = await activityLogModel.findActivityLogById(logId);
  if (!log) throw new Error('Activity log not found');

  await requireNonGuest(userId, log.organizationId);

  if (log.createdById !== userId) {
    throw new Error('You can only delete your own activity logs');
  }

  return activityLogModel.deleteActivityLog(logId);
}
