import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { markReadSchema } from '../types';
import * as notificationService from '../services';

export async function handleGetNotifications(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const result = await notificationService.getUserNotifications(session.userId);
    return successResponse(result);
  } catch {
    return successResponse({ notifications: [], unreadCount: 0 });
  }
}

export async function handleGetUnreadCount(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const count = await notificationService.getUnreadCount(session.userId);
    return successResponse({ count });
  } catch {
    return successResponse({ count: 0 });
  }
}

export async function handleMarkAsRead(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(markReadSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await notificationService.markAsRead(session.userId, validation.data.notificationIds);
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleMarkAllAsRead(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const result = await notificationService.markAllAsRead(session.userId);
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
