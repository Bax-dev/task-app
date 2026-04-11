import { NotificationType } from '@prisma/client';

export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    TASK_ASSIGNED: 'user-plus',
    TASK_UPDATED: 'edit',
    TASK_COMMENTED: 'message-circle',
    INVITATION_RECEIVED: 'mail',
    INVITATION_ACCEPTED: 'check-circle',
    PROJECT_CREATED: 'folder-plus',
    SPACE_CREATED: 'layout',
    MEMBER_JOINED: 'user-check',
    DAILY_REPORT_REMINDER: 'calendar-clock',
    DAILY_REPORT_SUBMITTED: 'calendar-check',
  };
  return icons[type] || 'bell';
}
