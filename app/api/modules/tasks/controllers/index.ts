import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createTaskSchema, updateTaskSchema, assignTaskSchema } from '../types';
import * as taskService from '../services';

export async function handleCreateTask(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createTaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const task = await taskService.createTask(session.userId, validation.data);
    return successResponse(task, 201);
  } catch (error: any) {
    if (error.message === 'Project not found') return notFoundResponse('Project not found');
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetTask(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const task = await taskService.getTask(taskId, session.userId);
    return successResponse(task);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetProjectTasks(request: NextRequest, projectId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const tasks = await taskService.getProjectTasks(projectId, session.userId);
    return successResponse(tasks);
  } catch (error: any) {
    if (error.message === 'Project not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetUserTasks(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const tasks = await taskService.getUserTasks(session.userId);
    return successResponse(tasks);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateTask(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateTaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const task = await taskService.updateTask(taskId, session.userId, validation.data);
    return successResponse(task);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleDeleteTask(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await taskService.deleteTask(taskId, session.userId);
    return successResponse({ message: 'Task deleted' });
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required' || error.message === 'Guest users have read-only access') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}

export async function handleToggleAssignment(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(assignTaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = await taskService.toggleAssignment(taskId, session.userId, validation.data);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
