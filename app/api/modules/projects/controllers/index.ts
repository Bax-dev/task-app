import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createProjectSchema, updateProjectSchema } from '../types';
import * as projectService from '../services';

export async function handleCreateProject(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createProjectSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const project = await projectService.createProject(session.userId, validation.data);
    return successResponse(project, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetProject(request: NextRequest, projectId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const project = await projectService.getProject(projectId, session.userId);
    return successResponse(project);
  } catch (error: any) {
    if (error.message === 'Project not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetSpaceProjects(request: NextRequest, spaceId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const projects = await projectService.getSpaceProjects(spaceId, session.userId);
    return successResponse(projects);
  } catch (error: any) {
    if (error.message === 'Space not found') return notFoundResponse('Space not found');
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetUserProjects(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const projects = await projectService.getUserProjects(session.userId);
    return successResponse(projects);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateProject(request: NextRequest, projectId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateProjectSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const project = await projectService.updateProject(projectId, session.userId, validation.data);
    return successResponse(project);
  } catch (error: any) {
    if (error.message === 'Project not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleDeleteProject(request: NextRequest, projectId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await projectService.deleteProject(projectId, session.userId);
    return successResponse({ message: 'Project deleted' });
  } catch (error: any) {
    if (error.message === 'Project not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required' || error.message === 'Guest users have read-only access') {
      return forbiddenResponse();
    }
    return errorResponse(error.message, 500);
  }
}
