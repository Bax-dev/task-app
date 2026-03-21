import { NextRequest } from 'next/server';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { validateBody } from '@/lib/guards/validate';
import { createBoardSchema, updateBoardSchema, createBoardColumnSchema, updateBoardColumnSchema } from '../types';
import * as boardService from '../services';

export async function CreateBoard(request: NextRequest) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createBoardSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const board = await boardService.createBoard(session.userId, validation.data);
    return successResponse(board, 201);
  } catch (error: any) {
    if (error.message === 'Board not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadBoard(request: NextRequest, boardId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const board = await boardService.readBoard(boardId, session.userId);
    return successResponse(board);
  } catch (error: any) {
    if (error.message === 'Board not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function ReadBoards(request: NextRequest, projectId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const boards = await boardService.readBoards(projectId, session.userId);
    return successResponse(boards);
  } catch (error: any) {
    if (error.message === 'Board not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditBoard(request: NextRequest, boardId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateBoardSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const board = await boardService.editBoard(boardId, session.userId, validation.data);
    return successResponse(board);
  } catch (error: any) {
    if (error.message === 'Board not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveBoard(request: NextRequest, boardId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await boardService.removeBoard(boardId, session.userId);
    return successResponse({ message: 'Board deleted' });
  } catch (error: any) {
    if (error.message === 'Board not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function CreateBoardColumn(request: NextRequest, boardId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(createBoardColumnSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const column = await boardService.createColumn(boardId, session.userId, validation.data);
    return successResponse(column, 201);
  } catch (error: any) {
    if (error.message === 'Board not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function EditBoardColumn(request: NextRequest, columnId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const validation = validateBody(updateBoardColumnSchema, body);
    if (!validation.success) return errorResponse(validation.error);

    const column = await boardService.editColumn(columnId, session.userId, validation.data);
    return successResponse(column);
  } catch (error: any) {
    if (error.message === 'Board column not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}

export async function RemoveBoardColumn(request: NextRequest, columnId: string) {
  try {
    const session = await authenticateRequest(request);
    if (!session) return unauthorizedResponse();

    await boardService.removeColumn(columnId, session.userId);
    return successResponse({ message: 'Board column deleted' });
  } catch (error: any) {
    if (error.message === 'Board column not found') return notFoundResponse();
    if (error.message === 'Not a member of this organization' || error.message === 'Guest users have read-only access') return forbiddenResponse();
    if (error.message === 'Admin access required') return forbiddenResponse();
    return errorResponse(error.message, 500);
  }
}
