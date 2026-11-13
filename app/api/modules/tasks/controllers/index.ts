import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, exceptionResponse } from '@/lib/api-response';
import { authenticateRequest, isCronRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createTaskSchema, updateTaskSchema, assignTaskSchema } from '../types';
import * as taskService from '../services';
import { prisma } from '@/lib/db/client';

function isTaskSchemaMismatch(error: any) {
  const message = String(error?.message || '');
  return message.includes('assignToSpace') || message.includes('column') || message.includes('schema');
}

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
    return exceptionResponse(error);
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
    return exceptionResponse(error);
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
    return exceptionResponse(error);
  }
}

export async function handleGetUserTasks(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const tasks = await taskService.getUserTasks(session.userId);
    return successResponse(tasks);
  } catch (error: any) {
    if (isTaskSchemaMismatch(error)) {
      return errorResponse('Database schema is out of date. Apply the latest Prisma migration for task assignment.', 500);
    }
    return exceptionResponse(error);
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
    return exceptionResponse(error);
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
    return exceptionResponse(error);
  }
}

export async function handleToggleAssignment(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(assignTaskSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const result = validation.data.userIds
      ? await taskService.assignUsers(taskId, session.userId, validation.data.userIds)
      : await taskService.toggleAssignment(taskId, session.userId, validation.data);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Task is assigned to the whole space') return errorResponse(error.message, 400);
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access' || error.message === 'Admin access required') return forbiddenResponse();
    return exceptionResponse(error);
  }
}

export async function handleSendOverdueReminders(request: NextRequest) {
  try {
    if (isCronRequest(request)) {
      const result = await taskService.sendOverdueReminders();
      return successResponse(result);
    }

    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const membership = await prisma.membership.findFirst({
      where: { userId: session.userId, role: 'ADMIN' },
      select: { id: true },
    });

    if (!membership) return forbiddenResponse('Admin access required');

    const result = await taskService.sendOverdueReminders();
    return successResponse(result);
  } catch (error: any) {
    return exceptionResponse(error);
  }
}
