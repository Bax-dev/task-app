import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createDashboardSchema, updateDashboardSchema } from '../types';
import * as dashboardService from '../services';

export async function CreateDashboard(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createDashboardSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const dashboard = await dashboardService.createDashboard(session.userId, validation.data);
    return successResponse(dashboard, 201);
  } catch (error: any) {
    if (error.message === 'Dashboard not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Access denied') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadDashboard(request: NextRequest, dashboardId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const dashboard = await dashboardService.readDashboard(dashboardId, session.userId);
    return successResponse(dashboard);
  } catch (error: any) {
    if (error.message === 'Dashboard not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Access denied') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadDashboards(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const dashboards = await dashboardService.readDashboards(organizationId, session.userId);
    return successResponse(dashboards);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditDashboard(request: NextRequest, dashboardId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateDashboardSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const dashboard = await dashboardService.editDashboard(dashboardId, session.userId, validation.data);
    return successResponse(dashboard);
  } catch (error: any) {
    if (error.message === 'Dashboard not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Access denied') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveDashboard(request: NextRequest, dashboardId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await dashboardService.removeDashboard(dashboardId, session.userId);
    return successResponse({ message: 'Dashboard deleted' });
  } catch (error: any) {
    if (error.message === 'Dashboard not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Access denied') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
