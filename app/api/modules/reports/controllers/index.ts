import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  exceptionResponse,
} from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import * as reportService from '../services';

export async function ReadBurndownChart(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get('sprintId');
    if (!sprintId) return errorResponse('sprintId is required');

    const data = await reportService.getBurndownChart(session.userId, sprintId);
    return successResponse(data);
  } catch (error: any) {
    if (error.message === 'Sprint not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}

export async function ReadVelocityChart(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    if (!organizationId) return errorResponse('organizationId is required');
    const sprintCount = Math.min(Math.max(parseInt(searchParams.get('sprintCount') || '5') || 5, 1), 20);

    const data = await reportService.getVelocityChart(session.userId, organizationId, sprintCount);
    return successResponse(data);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}

export async function ReadCumulativeFlow(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    if (!organizationId) return errorResponse('organizationId is required');
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30') || 30, 1), 365);

    const data = await reportService.getCumulativeFlow(session.userId, organizationId, days);
    return successResponse(data);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}
