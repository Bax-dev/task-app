import { ActivityStatus } from '@prisma/client';
import { requireOrgMembership, requireNonGuest } from '@/lib/guards/org-guard';
import * as activityLogModel from '../models';
import { CreateActivityLogDTO, UpdateActivityLogDTO } from '../types';

export async function createActivityLog(userId: string, dto: CreateActivityLogDTO) {
  await requireNonGuest(userId, dto.organizationId);

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
