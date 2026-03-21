import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createIntegrationSchema, updateIntegrationSchema } from '../types';
import * as integrationService from '../services';

export async function CreateIntegration(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createIntegrationSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const integration = await integrationService.createIntegration(session.userId, validation.data);
    return successResponse(integration, 201);
  } catch (error: any) {
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadIntegration(request: NextRequest, integrationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const integration = await integrationService.readIntegration(integrationId, session.userId);
    return successResponse(integration);
  } catch (error: any) {
    if (error.message === 'Integration not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadIntegrations(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const integrations = await integrationService.readIntegrations(organizationId, session.userId);
    return successResponse(integrations);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditIntegration(request: NextRequest, integrationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateIntegrationSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const integration = await integrationService.editIntegration(integrationId, session.userId, validation.data);
    return successResponse(integration);
  } catch (error: any) {
    if (error.message === 'Integration not found') return notFoundResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveIntegration(request: NextRequest, integrationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await integrationService.removeIntegration(integrationId, session.userId);
    return successResponse({ message: 'Integration deleted' });
  } catch (error: any) {
    if (error.message === 'Integration not found') return notFoundResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
