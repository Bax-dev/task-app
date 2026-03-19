import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { requireOrgMembership, requireOrgAdmin } from '@/lib/guards/org-guard';
import { validateBody } from '@/lib/guards/validate';
import { updateUserSchema, addMemberSchema } from '../types';
import * as userService from '../services';

export async function handleGetProfile(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const user = await userService.getUserProfile(session.userId);
    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateProfile(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateUserSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const user = await userService.updateUserProfile(session.userId, validation.data);
    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleGetOrgMembers(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await requireOrgMembership(session.userId, organizationId);
    const members = await userService.getOrganizationMembers(organizationId);
    return successResponse(members);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') {
      return errorResponse(error.message, 403);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleAddMember(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(addMemberSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    await requireOrgAdmin(session.userId, validation.data.organizationId);

    const result = await userService.addMemberDirectly(validation.data);
    return successResponse(result, 201);
  } catch (error: any) {
    if (error.message === 'Admin access required') return forbiddenResponse();
    if (error.message === 'USER_NOT_FOUND') {
      return errorResponse('No account found with this email. Send an invitation instead.', 404);
    }
    if (error.message === 'User is already a member of this organization') {
      return errorResponse(error.message, 409);
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleRemoveMember(request: NextRequest, organizationId: string, userId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await requireOrgAdmin(session.userId, organizationId);

    const result = await userService.removeMember(session.userId, userId, organizationId);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Admin access required') return forbiddenResponse();
    if (error.message === 'You cannot remove yourself') return errorResponse(error.message, 400);
    return errorResponse(error.message, 500);
  }
}
