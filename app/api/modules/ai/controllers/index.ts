import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, exceptionResponse, rateLimitResponse } from '@/lib/api-response';
import { aiLimiter } from '@/lib/rate-limit';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { suggestTaskSchema, generateSubtasksSchema, summarizeSchema, chatSchema } from '../types';
import * as aiService from '../services';

export async function handleSuggestTask(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = await aiLimiter.check(`ai:${session.userId}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(suggestTaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await aiService.suggestTask(session.userId, validation.data);
    return successResponse(result);
  } catch (error: any) {
    console.error('[AI suggest-task]', error);
    if (error.message === 'Project not found') return notFoundResponse('Project not found');
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}

export async function handleGenerateSubtasks(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = await aiLimiter.check(`ai:${session.userId}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(generateSubtasksSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const subtasks = await aiService.generateSubtasks(session.userId, validation.data);
    return successResponse(subtasks);
  } catch (error: any) {
    return exceptionResponse(error);
  }
}

export async function handleSummarize(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = await aiLimiter.check(`ai:${session.userId}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(summarizeSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await aiService.summarize(session.userId, validation.data);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}

export async function handleChat(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();
    const limit = await aiLimiter.check(`ai:${session.userId}`);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const body = await request.json();
    const validation = validateBody(chatSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await aiService.chat(session.userId, validation.data);
    return successResponse(result);
  } catch (error: any) {
    console.error('[AI chat]', error);
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return exceptionResponse(error);
  }
}
