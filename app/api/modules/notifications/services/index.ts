import { NotificationType } from '@prisma/client';
import * as notificationModel from '../models';
import { publishEvent } from '@/lib/redis-pubsub';

export async function getUserNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    notificationModel.findUserNotifications(userId),
    notificationModel.findUnreadCount(userId),
  ]);
  return { notifications, unreadCount };
}

export async function getUnreadCount(userId: string) {
  return notificationModel.findUnreadCount(userId);
}

export async function markAsRead(userId: string, notificationIds: string[]) {
  await notificationModel.markAsRead(notificationIds, userId);
  return { message: 'Notifications marked as read' };
}

export async function markAllAsRead(userId: string) {
  await notificationModel.markAllAsRead(userId);
  return { message: 'All notifications marked as read' };
}

// ─── Notification Creators (called from other modules) ────

export async function notifyTaskAssigned(params: {
  assigneeId: string;
  taskTitle: string;
  projectName: string;
  assignedByName: string;
  taskLink: string;
}) {
  const result = await notificationModel.createNotification({
    userId: params.assigneeId,
    type: NotificationType.TASK_ASSIGNED,
    title: 'Task Assigned',
    message: `${params.assignedByName} assigned you to "${params.taskTitle}" in ${params.projectName}`,
    link: params.taskLink,
  });
  publishEvent(`events:user:${params.assigneeId}`, { type: 'NOTIFICATION', tags: ['Notifications'] }).catch(() => {});
  return result;
}

export async function notifyTaskAssignedToMany(params: {
  assigneeIds: string[];
  taskTitle: string;
  projectName: string;
  assignedByName: string;
  taskLink: string;
  spaceName?: string;
}) {
  const notifications = params.assigneeIds.map((userId) => ({
    userId,
    type: NotificationType.TASK_ASSIGNED as NotificationType,
    title: 'Task Assigned',
    message: params.spaceName
      ? `${params.assignedByName} assigned "${params.taskTitle}" to the whole ${params.spaceName} space in ${params.projectName}`
      : `${params.assignedByName} assigned you to "${params.taskTitle}" in ${params.projectName}`,
    link: params.taskLink,
  }));
  const result = await notificationModel.createManyNotifications(notifications);
  for (const userId of params.assigneeIds) {
    publishEvent(`events:user:${userId}`, { type: 'NOTIFICATION', tags: ['Notifications'] }).catch(() => {});
  }
  return result;
}

export async function notifyInvitationReceived(params: {
  userId: string;
  orgName: string;
  invitedByName: string;
  inviteLink: string;
}) {
  return notificationModel.createNotification({
    userId: params.userId,
    type: NotificationType.INVITATION_RECEIVED,
    title: 'Invitation Received',
    message: `${params.invitedByName} invited you to join ${params.orgName}`,
    link: params.inviteLink,
  });
}

export async function notifyMemberJoined(params: {
  orgMemberIds: string[];
  memberName: string;
  orgName: string;
  orgLink: string;
}) {
  const notifications = params.orgMemberIds.map((userId) => ({
    userId,
    type: NotificationType.MEMBER_JOINED as NotificationType,
    title: 'New Member',
    message: `${params.memberName} joined ${params.orgName}`,
    link: params.orgLink,
  }));
  const result = await notificationModel.createManyNotifications(notifications);
  for (const userId of params.orgMemberIds) {
    publishEvent(`events:user:${userId}`, { type: 'NOTIFICATION', tags: ['Notifications'] }).catch(() => {});
  }
  return result;
}

export async function notifyTaskUpdated(params: {
  assigneeIds: string[];
  updatedByName: string;
  taskTitle: string;
  change: string;
  taskLink: string;
}) {
  const notifications = params.assigneeIds.map((userId) => ({
    userId,
    type: NotificationType.TASK_UPDATED as NotificationType,
    title: 'Task Updated',
    message: `${params.updatedByName} ${params.change} on "${params.taskTitle}"`,
    link: params.taskLink,
  }));
  const result = await notificationModel.createManyNotifications(notifications);
  for (const userId of params.assigneeIds) {
    publishEvent(`events:user:${userId}`, { type: 'NOTIFICATION', tags: ['Notifications'] }).catch(() => {});
  }
  return result;
}

export async function notifyDailyReportReminder(params: {
  userIds: string[];
  organizationId: string;
  reportDate: string;
}) {
  const link = `/daily-reports?organizationId=${params.organizationId}`;
  const notifications = params.userIds.map((userId) => ({
    userId,
    type: NotificationType.DAILY_REPORT_REMINDER as NotificationType,
    title: 'Daily Report Reminder',
    message: `Please submit your daily report for ${params.reportDate}`,
    link,
  }));
  const result = await notificationModel.createManyNotifications(notifications);
  for (const userId of params.userIds) {
    publishEvent(`events:user:${userId}`, { type: 'NOTIFICATION', tags: ['Notifications'] }).catch(() => {});
  }
  return result;
}

export async function notifyDailyReportSubmitted(params: {
  adminIds: string[];
  memberName: string;
  reportDate: string;
  organizationId: string;
}) {
  const link = `/daily-reports?organizationId=${params.organizationId}`;
  const displayDate = new Date(params.reportDate).toISOString().slice(0, 10);
  const notifications = params.adminIds.map((userId) => ({
    userId,
    type: NotificationType.DAILY_REPORT_SUBMITTED as NotificationType,
    title: 'Daily Report Submitted',
    message: `${params.memberName} submitted a daily report for ${displayDate}`,
    link,
  }));
  const result = await notificationModel.createManyNotifications(notifications);
  for (const userId of params.adminIds) {
    publishEvent(`events:user:${userId}`, { type: 'NOTIFICATION', tags: ['Notifications'] }).catch(() => {});
  }
  return result;
}

export async function notifyTaskOverdue(params: {
  userIds: string[];
  taskTitle: string;
  projectName: string;
  taskLink: string;
  scopeLabel?: string;
}) {
  const notifications = params.userIds.map((userId) => ({
    userId,
    type: NotificationType.TASK_UPDATED as NotificationType,
    title: 'Task Overdue',
    message: params.scopeLabel
      ? `"${params.taskTitle}" is overdue in ${params.projectName} for ${params.scopeLabel}`
      : `"${params.taskTitle}" is overdue in ${params.projectName}`,
    link: params.taskLink,
  }));
  const result = await notificationModel.createManyNotifications(notifications);
  for (const userId of params.userIds) {
    publishEvent(`events:user:${userId}`, { type: 'NOTIFICATION', tags: ['Notifications'] }).catch(() => {});
  }
  return result;
}
