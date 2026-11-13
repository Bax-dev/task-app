import { requireOrgAdmin } from '@/lib/guards/org-guard';
import { requireProjectAccess, requireProjectWrite } from '@/lib/guards/space-guard';
import * as boardModel from '../models';
import { CreateBoardDTO, UpdateBoardDTO, CreateBoardColumnDTO, UpdateBoardColumnDTO } from '../types';

const DEFAULT_COLUMNS = [
  { name: 'TODO', position: 0 },
  { name: 'IN_PROGRESS', position: 1 },
  { name: 'DONE', position: 2 },
];

export async function createBoard(userId: string, dto: CreateBoardDTO) {
  await requireProjectWrite(userId, dto.projectId);

  return boardModel.createBoard({
    name: dto.name,
    description: dto.description,
    projectId: dto.projectId,
    createdById: userId,
    columns: dto.columns ?? DEFAULT_COLUMNS,
  });
}

export async function readBoard(boardId: string, userId: string) {
  const board = await boardModel.findBoardById(boardId);
  if (!board) throw new Error('Board not found');

  await requireProjectAccess(userId, board.projectId);
  return board;
}

export async function readBoards(projectId: string, userId: string) {
  await requireProjectAccess(userId, projectId);
  return boardModel.findBoardsByProject(projectId);
}

export async function editBoard(boardId: string, userId: string, dto: UpdateBoardDTO) {
  const board = await boardModel.findBoardById(boardId);
  if (!board) throw new Error('Board not found');

  await requireProjectWrite(userId, board.projectId);
  return boardModel.updateBoard(boardId, dto);
}

export async function removeBoard(boardId: string, userId: string) {
  const board = await boardModel.findBoardById(boardId);
  if (!board) throw new Error('Board not found');

  const { organizationId } = await requireProjectWrite(userId, board.projectId);
  if (board.createdById !== userId) await requireOrgAdmin(userId, organizationId);

  return boardModel.deleteBoard(boardId);
}

export async function createColumn(boardId: string, userId: string, dto: CreateBoardColumnDTO) {
  const board = await boardModel.findBoardById(boardId);
  if (!board) throw new Error('Board not found');

  await requireProjectWrite(userId, board.projectId);

  return boardModel.createBoardColumn({
    name: dto.name,
    position: dto.position,
    wipLimit: dto.wipLimit,
    boardId,
  });
}

export async function editColumn(columnId: string, userId: string, dto: UpdateBoardColumnDTO) {
  const column = await boardModel.findBoardColumnById(columnId);
  if (!column) throw new Error('Board column not found');

  await requireProjectWrite(userId, column.board.projectId);

  return boardModel.updateBoardColumn(columnId, dto);
}

export async function removeColumn(columnId: string, userId: string) {
  const column = await boardModel.findBoardColumnById(columnId);
  if (!column) throw new Error('Board column not found');

  await requireProjectWrite(userId, column.board.projectId);

  return boardModel.deleteBoardColumn(columnId);
}
