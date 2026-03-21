import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createSprintSchema, updateSprintSchema, sprintTaskSchema } from '../types';
import * as sprintService from '../services';

export async function CreateSprint(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createSprintSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const sprint = await sprintService.createSprint(session.userId, validation.data);
    return successResponse(sprint, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadSprint(request: NextRequest, sprintId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const sprint = await sprintService.readSprint(sprintId, session.userId);
    return successResponse(sprint);
  } catch (error: any) {
    if (error.message === 'Sprint not found') return notFoundResponse('Sprint not found');
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadSprints(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const sprints = await sprintService.readSprints(organizationId, session.userId);
    return successResponse(sprints);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditSprint(request: NextRequest, sprintId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateSprintSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const sprint = await sprintService.editSprint(sprintId, session.userId, validation.data);
    return successResponse(sprint);
  } catch (error: any) {
    if (error.message === 'Sprint not found') return notFoundResponse('Sprint not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveSprint(request: NextRequest, sprintId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await sprintService.removeSprint(sprintId, session.userId);
    return successResponse({ message: 'Sprint deleted' });
  } catch (error: any) {
    if (error.message === 'Sprint not found') return notFoundResponse('Sprint not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required' || error.message === 'Guest users have read-only access') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function AddSprintTask(request: NextRequest, sprintId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(sprintTaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const sprintTask = await sprintService.addSprintTask(sprintId, session.userId, validation.data);
    return successResponse(sprintTask, 201);
  } catch (error: any) {
    if (error.message === 'Sprint not found') return notFoundResponse('Sprint not found');
    if (error.message === 'Task not found') return notFoundResponse('Task not found');
    if (error.message === 'Task does not belong to this organization') return errorResponse('Task does not belong to this organization', 400);
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveSprintTask(request: NextRequest, sprintId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) return errorResponse('taskId is required');

    await sprintService.removeSprintTask(sprintId, session.userId, taskId);
    return successResponse({ message: 'Task removed from sprint' });
  } catch (error: any) {
    if (error.message === 'Sprint not found') return notFoundResponse('Sprint not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
