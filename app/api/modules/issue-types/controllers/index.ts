import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createIssueTypeSchema, updateIssueTypeSchema } from '../types';
import * as issueTypeService from '../services';

export async function CreateIssueType(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createIssueTypeSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const issueType = await issueTypeService.createIssueType(session.userId, validation.data);
    return successResponse(issueType, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadIssueType(request: NextRequest, issueTypeId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const issueType = await issueTypeService.readIssueType(issueTypeId, session.userId);
    return successResponse(issueType);
  } catch (error: any) {
    if (error.message === 'Issue type not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadIssueTypes(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const issueTypes = await issueTypeService.readIssueTypes(organizationId, session.userId);
    return successResponse(issueTypes);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditIssueType(request: NextRequest, issueTypeId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateIssueTypeSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const issueType = await issueTypeService.editIssueType(issueTypeId, session.userId, validation.data);
    return successResponse(issueType);
  } catch (error: any) {
    if (error.message === 'Issue type not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveIssueType(request: NextRequest, issueTypeId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await issueTypeService.removeIssueType(issueTypeId, session.userId);
    return successResponse({ message: 'Issue type deleted' });
  } catch (error: any) {
    if (error.message === 'Issue type not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
