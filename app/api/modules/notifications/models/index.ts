import { prisma } from '@/lib/db/client';
import { NotificationType } from '@prisma/client';

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data });
}

export async function createManyNotifications(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}[]) {
  return prisma.notification.createMany({ data });
}

export async function findUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function findUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(ids: string[], userId: string) {
  return prisma.notification.updateMany({
    where: { id: { in: ids }, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(id: string, userId: string) {
  return prisma.notification.deleteMany({
    where: { id, userId },
  });
}
