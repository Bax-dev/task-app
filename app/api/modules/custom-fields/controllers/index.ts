import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createCustomFieldSchema, updateCustomFieldSchema, setCustomFieldValueSchema } from '../types';
import * as customFieldService from '../services';

export async function CreateCustomField(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createCustomFieldSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const field = await customFieldService.createCustomField(session.userId, validation.data);
    return successResponse(field, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadCustomField(request: NextRequest, fieldId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const field = await customFieldService.readCustomField(fieldId, session.userId);
    return successResponse(field);
  } catch (error: any) {
    if (error.message === 'Custom field not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadCustomFields(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const fields = await customFieldService.readCustomFields(organizationId, session.userId);
    return successResponse(fields);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditCustomField(request: NextRequest, fieldId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateCustomFieldSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const field = await customFieldService.editCustomField(fieldId, session.userId, validation.data);
    return successResponse(field);
  } catch (error: any) {
    if (error.message === 'Custom field not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveCustomField(request: NextRequest, fieldId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await customFieldService.removeCustomField(fieldId, session.userId);
    return successResponse({ message: 'Custom field deleted' });
  } catch (error: any) {
    if (error.message === 'Custom field not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function SetCustomFieldValue(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(setCustomFieldValueSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const value = await customFieldService.setFieldValue(taskId, session.userId, validation.data);
    return successResponse(value);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadCustomFieldValues(request: NextRequest, taskId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const values = await customFieldService.readFieldValues(taskId, session.userId);
    return successResponse(values);
  } catch (error: any) {
    if (error.message === 'Task not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
