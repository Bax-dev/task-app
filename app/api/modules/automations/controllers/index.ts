import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createAutomationSchema, updateAutomationSchema } from '../types';
import * as automationService from '../services';

export async function CreateAutomation(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createAutomationSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const automation = await automationService.createAutomation(session.userId, validation.data);
    return successResponse(automation, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadAutomation(request: NextRequest, automationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const automation = await automationService.readAutomation(automationId, session.userId);
    return successResponse(automation);
  } catch (error: any) {
    if (error.message === 'Automation not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadAutomations(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const automations = await automationService.readAutomations(organizationId, session.userId);
    return successResponse(automations);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditAutomation(request: NextRequest, automationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateAutomationSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const automation = await automationService.editAutomation(automationId, session.userId, validation.data);
    return successResponse(automation);
  } catch (error: any) {
    if (error.message === 'Automation not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveAutomation(request: NextRequest, automationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await automationService.removeAutomation(automationId, session.userId);
    return successResponse({ message: 'Automation deleted' });
  } catch (error: any) {
    if (error.message === 'Automation not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
