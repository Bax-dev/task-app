import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createActivityLogSchema, updateActivityLogSchema } from '../types';
import * as activityLogService from '../services';

export async function handleCreateActivityLog(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createActivityLogSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const log = await activityLogService.createActivityLog(session.userId, validation.data);
    return successResponse(log, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetActivityLog(request: NextRequest, logId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const log = await activityLogService.getActivityLog(logId, session.userId);
    return successResponse(log);
  } catch (error: any) {
    if (error.message === 'Activity log not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetUserActivityLogs(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const logs = await activityLogService.getUserActivityLogs(session.userId);
    return successResponse(logs);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleGetOrgActivityLogs(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const logs = await activityLogService.getOrgActivityLogs(organizationId, session.userId);
    return successResponse(logs);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateActivityLog(request: NextRequest, logId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateActivityLogSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const log = await activityLogService.updateActivityLog(logId, session.userId, validation.data);
    return successResponse(log);
  } catch (error: any) {
    if (error.message === 'Activity log not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access' || error.message === 'You can only update your own activity logs') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleDeleteActivityLog(request: NextRequest, logId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await activityLogService.deleteActivityLog(logId, session.userId);
    return successResponse({ message: 'Activity log deleted' });
  } catch (error: any) {
    if (error.message === 'Activity log not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access' || error.message === 'You can only delete your own activity logs') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
