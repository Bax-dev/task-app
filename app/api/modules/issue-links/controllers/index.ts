import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createIssueLinkSchema } from '../types';
import * as issueLinkService from '../services';

export async function CreateIssueLink(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createIssueLinkSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const link = await issueLinkService.createIssueLink(session.userId, validation.data);
    return successResponse(link, 201);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Issue link not found') return notFoundResponse('Issue link not found');
    if (error.message === 'Cannot link a task to itself') return errorResponse('Cannot link a task to itself', 400);
    if (error.message === 'Tasks must belong to the same organization') return errorResponse('Tasks must belong to the same organization', 400);
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadIssueLink(request: NextRequest, linkId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const link = await issueLinkService.readIssueLink(linkId, session.userId);
    return successResponse(link);
  } catch (error: any) {
    if (error.message === 'Issue link not found') return notFoundResponse('Issue link not found');
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadIssueLinks(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const links = await issueLinkService.readIssueLinks(taskId, session.userId);
    return successResponse(links);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveIssueLink(request: NextRequest, linkId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await issueLinkService.removeIssueLink(linkId, session.userId);
    return successResponse({ message: 'Issue link deleted' });
  } catch (error: any) {
    if (error.message === 'Issue link not found') return notFoundResponse('Issue link not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
