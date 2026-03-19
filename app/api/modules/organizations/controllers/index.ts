import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createOrgSchema, updateOrgSchema } from '../types';
import * as orgService from '../services';

export async function handleCreateOrg(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createOrgSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const org = await orgService.createOrganization(session.userId, validation.data);
    return successResponse(org, 201);
  } catch (error: any) {
    if (error.message.includes('slug already exists')) {
      return errorResponse(error.message, 409);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleGetOrg(request: NextRequest, orgId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const org = await orgService.getOrganization(orgId, session.userId);
    return successResponse(org);
  } catch (error: any) {
    if (error.message === 'Organization not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetUserOrgs(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const orgs = await orgService.getUserOrganizations(session.userId);
    return successResponse(orgs);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateOrg(request: NextRequest, orgId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateOrgSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const org = await orgService.updateOrganization(orgId, session.userId, validation.data);
    return successResponse(org);
  } catch (error: any) {
    if (error.message === 'Organization not found') return notFoundResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleDeleteOrg(request: NextRequest, orgId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await orgService.deleteOrganization(orgId, session.userId);
    return successResponse({ message: 'Organization deleted' });
  } catch (error: any) {
    if (error.message === 'Organization not found') return notFoundResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
