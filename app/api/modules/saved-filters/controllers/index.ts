import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createSavedFilterSchema, updateSavedFilterSchema } from '../types';
import * as savedFilterService from '../services';

export async function CreateSavedFilter(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createSavedFilterSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const filter = await savedFilterService.createSavedFilter(session.userId, validation.data);
    return successResponse(filter, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadSavedFilter(request: NextRequest, filterId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const filter = await savedFilterService.readSavedFilter(filterId, session.userId);
    return successResponse(filter);
  } catch (error: any) {
    if (error.message === 'Saved filter not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadSavedFilters(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const filters = await savedFilterService.readSavedFilters(organizationId, session.userId);
    return successResponse(filters);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditSavedFilter(request: NextRequest, filterId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateSavedFilterSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const filter = await savedFilterService.editSavedFilter(filterId, session.userId, validation.data);
    return successResponse(filter);
  } catch (error: any) {
    if (error.message === 'Saved filter not found') return notFoundResponse();
    if (error.message === 'Only the owner can edit this filter') return forbiddenResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveSavedFilter(request: NextRequest, filterId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await savedFilterService.removeSavedFilter(filterId, session.userId);
    return successResponse({ message: 'Saved filter deleted' });
  } catch (error: any) {
    if (error.message === 'Saved filter not found') return notFoundResponse();
    if (error.message === 'Only the owner or an admin can delete this filter' || error.message === 'Not a member of this organization') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}
