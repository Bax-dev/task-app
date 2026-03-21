import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createWorkflowSchema, updateWorkflowSchema, createWorkflowStepSchema, updateWorkflowStepSchema, createWorkflowTransitionSchema } from '../types';
import * as workflowService from '../services';

export async function CreateWorkflow(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createWorkflowSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const workflow = await workflowService.createWorkflow(session.userId, validation.data);
    return successResponse(workflow, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadWorkflow(request: NextRequest, workflowId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const workflow = await workflowService.readWorkflow(workflowId, session.userId);
    return successResponse(workflow);
  } catch (error: any) {
    if (error.message === 'Workflow not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadWorkflows(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const workflows = await workflowService.readWorkflows(organizationId, session.userId);
    return successResponse(workflows);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditWorkflow(request: NextRequest, workflowId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateWorkflowSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const workflow = await workflowService.editWorkflow(workflowId, session.userId, validation.data);
    return successResponse(workflow);
  } catch (error: any) {
    if (error.message === 'Workflow not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveWorkflow(request: NextRequest, workflowId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await workflowService.removeWorkflow(workflowId, session.userId);
    return successResponse({ message: 'Workflow deleted' });
  } catch (error: any) {
    if (error.message === 'Workflow not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function CreateWorkflowStep(request: NextRequest, workflowId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createWorkflowStepSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const step = await workflowService.createStep(workflowId, session.userId, validation.data);
    return successResponse(step, 201);
  } catch (error: any) {
    if (error.message === 'Workflow not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditWorkflowStep(request: NextRequest, stepId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateWorkflowStepSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const step = await workflowService.editStep(stepId, session.userId, validation.data);
    return successResponse(step);
  } catch (error: any) {
    if (error.message === 'Workflow step not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveWorkflowStep(request: NextRequest, stepId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await workflowService.removeStep(stepId, session.userId);
    return successResponse({ message: 'Workflow step deleted' });
  } catch (error: any) {
    if (error.message === 'Workflow step not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function CreateWorkflowTransition(request: NextRequest, workflowId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createWorkflowTransitionSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const transition = await workflowService.createTransition(workflowId, session.userId, validation.data);
    return successResponse(transition, 201);
  } catch (error: any) {
    if (error.message === 'Workflow not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveWorkflowTransition(request: NextRequest, transitionId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await workflowService.removeTransition(transitionId, session.userId);
    return successResponse({ message: 'Workflow transition deleted' });
  } catch (error: any) {
    if (error.message === 'Workflow transition not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
