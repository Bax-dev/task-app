import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createCommentSchema, updateCommentSchema } from '../types';
import * as commentService from '../services';

export async function CreateComment(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createCommentSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const comment = await commentService.createComment(session.userId, validation.data);
    return successResponse(comment, 201);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadComment(request: NextRequest, commentId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const comment = await commentService.readComment(commentId, session.userId);
    return successResponse(comment);
  } catch (error: any) {
    if (error.message === 'Comment not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadComments(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const comments = await commentService.readComments(taskId, session.userId);
    return successResponse(comments);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditComment(request: NextRequest, commentId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateCommentSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const comment = await commentService.editComment(commentId, session.userId, validation.data);
    return successResponse(comment);
  } catch (error: any) {
    if (error.message === 'Comment not found') return notFoundResponse();
    if (error.message === 'Only the author can edit this comment') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveComment(request: NextRequest, commentId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await commentService.removeComment(commentId, session.userId);
    return successResponse({ message: 'Comment deleted' });
  } catch (error: any) {
    if (error.message === 'Comment not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
