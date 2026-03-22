import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createSubtaskSchema, updateSubtaskSchema, reorderSubtasksSchema } from '../types';
import * as subtaskService from '../services';

export async function handleGetSubtasks(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const subtasks = await subtaskService.getSubtasks(taskId, session.userId);
    return successResponse(subtasks);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleCreateSubtask(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createSubtaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const subtask = await subtaskService.createSubtask(taskId, session.userId, validation.data);
    return successResponse(subtask, 201);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateSubtask(request: NextRequest, subtaskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateSubtaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const subtask = await subtaskService.updateSubtask(subtaskId, session.userId, validation.data);
    return successResponse(subtask);
  } catch (error: any) {
    if (error.message === 'Subtask not found') return notFoundResponse('Subtask not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleDeleteSubtask(request: NextRequest, subtaskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await subtaskService.deleteSubtask(subtaskId, session.userId);
    return successResponse({ message: 'Subtask deleted' });
  } catch (error: any) {
    if (error.message === 'Subtask not found') return notFoundResponse('Subtask not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleReorderSubtasks(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(reorderSubtasksSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    await subtaskService.reorderSubtasks(taskId, session.userId, validation.data);
    return successResponse({ message: 'Subtasks reordered' });
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
