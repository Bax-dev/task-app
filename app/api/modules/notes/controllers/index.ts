import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createNoteSchema, updateNoteSchema } from '../types';
import * as noteService from '../services';

export async function handleCreateNote(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createNoteSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const note = await noteService.createNote(session.userId, validation.data);
    return successResponse(note, 201);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetNote(request: NextRequest, noteId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const note = await noteService.getNote(noteId, session.userId);
    return successResponse(note);
  } catch (error: any) {
    if (error.message === 'Note not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleGetOrgNotes(request: NextRequest, organizationId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const notes = await noteService.getOrganizationNotes(organizationId, session.userId);
    return successResponse(notes);
  } catch (error: any) {
    if (error.message === 'Not a member of this organization') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateNote(request: NextRequest, noteId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateNoteSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const note = await noteService.updateNote(noteId, session.userId, validation.data);
    return successResponse(note);
  } catch (error: any) {
    if (error.message === 'Note not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function handleDeleteNote(request: NextRequest, noteId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await noteService.deleteNote(noteId, session.userId);
    return successResponse({ message: 'Note deleted' });
  } catch (error: any) {
    if (error.message === 'Note not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
