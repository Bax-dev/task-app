import { NotificationType } from '@prisma/client';
import * as notificationModel from '../models';

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
  return notificationModel.createNotification({
    userId: params.assigneeId,
    type: NotificationType.TASK_ASSIGNED,
    title: 'Task Assigned',
    message: `${params.assignedByName} assigned you to "${params.taskTitle}" in ${params.projectName}`,
    link: params.taskLink,
  });
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
  return notificationModel.createManyNotifications(notifications);
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
  return notificationModel.createManyNotifications(notifications);
}
