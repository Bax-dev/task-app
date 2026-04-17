import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createSpaceSchema, updateSpaceSchema, addSpaceMemberSchema } from '../types';
import * as spaceService from '../services';

const SPACE_ACCESS_FORBIDDEN = [
  'Not a member of this organization',
  'Not a member of this space',
  'Guest users have read-only access',
  'Admin access required',
];

export async function handleCreateSpace(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createSpaceSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const space = await spaceService.createSpace(session.userId, validation.data);
    return successResponse(space, 201);
  } catch (error: any) {
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetSpace(request: NextRequest, spaceId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const space = await spaceService.getSpace(spaceId, session.userId);
    return successResponse(space);
  } catch (error: any) {
    if (error.message === 'Space not found') return notFoundResponse();
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetOrgSpaces(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const spaces = await spaceService.getOrganizationSpaces(organizationId, session.userId);
    return successResponse(spaces);
  } catch (error: any) {
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateSpace(request: NextRequest, spaceId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateSpaceSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const space = await spaceService.updateSpace(spaceId, session.userId, validation.data);
    return successResponse(space);
  } catch (error: any) {
    if (error.message === 'Space not found') return notFoundResponse();
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleDeleteSpace(request: NextRequest, spaceId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await spaceService.deleteSpace(spaceId, session.userId);
    return successResponse({ message: 'Space deleted' });
  } catch (error: any) {
    if (error.message === 'Space not found') return notFoundResponse();
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleListSpaceMembers(request: NextRequest, spaceId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const members = await spaceService.listSpaceMembers(spaceId, session.userId);
    return successResponse(members);
  } catch (error: any) {
    if (error.message === 'Space not found') return notFoundResponse();
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleAddSpaceMember(request: NextRequest, spaceId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(addSpaceMemberSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const member = await spaceService.addSpaceMember(spaceId, session.userId, validation.data.userId);
    return successResponse(member, 201);
  } catch (error: any) {
    if (error.message === 'Space not found') return notFoundResponse();
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleRemoveSpaceMember(request: NextRequest, spaceId: string, targetUserId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await spaceService.removeSpaceMember(spaceId, session.userId, targetUserId);
    return successResponse({ message: 'Member removed' });
  } catch (error: any) {
    if (error.message === 'Space not found') return notFoundResponse();
    if (SPACE_ACCESS_FORBIDDEN.includes(error.message)) return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
