import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createLabelSchema, updateLabelSchema, taskLabelSchema } from '../types';
import * as labelService from '../services';

export async function CreateLabel(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createLabelSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const label = await labelService.createLabel(session.userId, validation.data);
    return successResponse(label, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadLabel(request: NextRequest, labelId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const label = await labelService.readLabel(labelId, session.userId);
    return successResponse(label);
  } catch (error: any) {
    if (error.message === 'Label not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadLabels(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const labels = await labelService.readLabels(organizationId, session.userId);
    return successResponse(labels);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditLabel(request: NextRequest, labelId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateLabelSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const label = await labelService.editLabel(labelId, session.userId, validation.data);
    return successResponse(label);
  } catch (error: any) {
    if (error.message === 'Label not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveLabel(request: NextRequest, labelId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await labelService.removeLabel(labelId, session.userId);
    return successResponse({ message: 'Label deleted' });
  } catch (error: any) {
    if (error.message === 'Label not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required' || error.message === 'Guest users have read-only access') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function AddTaskLabel(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(taskLabelSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const taskLabel = await labelService.addTaskLabel(taskId, session.userId, validation.data);
    return successResponse(taskLabel, 201);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveTaskLabel(request: NextRequest, taskId: string, labelId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await labelService.removeTaskLabel(taskId, session.userId, labelId);
    return successResponse({ message: 'Label removed from task' });
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
