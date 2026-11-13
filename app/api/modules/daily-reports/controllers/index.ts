import { NextRequest } from 'next/server';
import {
  errorResponse,
  forbiddenResponse,
  successResponse,
  unauthorizedResponse,
  exceptionResponse,
} from '@/lib/api-response';
import { authenticateRequest, isCronRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import {
  createDailyReportSchema,
  dailyReportScheduleSchema,
} from '../types';
import * as dailyReportService from '../services';

export async function handleGetDailyReportSchedule(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const schedule = await dailyReportService.getDailyReportSchedule(organizationId, session.userId);
    return successResponse(schedule);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}

export async function handleUpdateDailyReportSchedule(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(dailyReportScheduleSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const schedule = await dailyReportService.updateDailyReportSchedule(
      organizationId,
      session.userId,
      validation.data
    );
    return successResponse(schedule);
  } catch (error: any) {
    if (
      error.message === 'Not a member of this organization' ||
      error.message === 'Admin access required'
    ) {
      return forbiddenResponse();
    }
    return exceptionResponse(error);
  }
}

export async function handleCreateDailyReport(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createDailyReportSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const report = await dailyReportService.submitDailyReport(session.userId, validation.data);
    return successResponse(report, 201);
  } catch (error: any) {
    if (
      error.message === 'Not a member of this organization' ||
      error.message === 'Guest users have read-only access'
    ) {
      return forbiddenResponse();
    }
    return exceptionResponse(error);
  }
}

export async function handleGetDailyReports(
  request: NextRequest,
  organizationId: string
) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const date = request.nextUrl.searchParams.get('date') || undefined;
    const result = await dailyReportService.getDailyReports(organizationId, session.userId, date);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}

export async function handleSendDailyReportReminders(request: NextRequest) {
  try {
    // Cron only: any signed-in user could otherwise trigger an org-wide email blast.
    if (!isCronRequest(request)) return unauthorizedResponse();

    const result = await dailyReportService.sendDailyReportReminders();
    return successResponse(result);
  } catch (error: any) {
    return exceptionResponse(error);
  }
}
