import { prisma } from '@/lib/db/client';
import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import * as boardModel from '../models';
import { CreateBoardDTO, UpdateBoardDTO, CreateBoardColumnDTO, UpdateBoardColumnDTO } from '../types';

async function getOrgIdFromProject(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { space: { select: { organizationId: true } } },
  });
  if (!project) throw new Error('Project not found');
  return project.space.organizationId;
}

const DEFAULT_COLUMNS = [
  { name: 'TODO', position: 0 },
  { name: 'IN_PROGRESS', position: 1 },
  { name: 'DONE', position: 2 },
];

export async function createBoard(userId: string, dto: CreateBoardDTO) {
  const orgId = await getOrgIdFromProject(dto.projectId);
  await requireNonGuest(userId, orgId);

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

  await requireOrgMembership(userId, board.project.space.organizationId);
  return board;
}

export async function readBoards(projectId: string, userId: string) {
  const orgId = await getOrgIdFromProject(projectId);
  await requireOrgMembership(userId, orgId);
  return boardModel.findBoardsByProject(projectId);
}

export async function editBoard(boardId: string, userId: string, dto: UpdateBoardDTO) {
  const board = await boardModel.findBoardById(boardId);
  if (!board) throw new Error('Board not found');

  await requireNonGuest(userId, board.project.space.organizationId);
  return boardModel.updateBoard(boardId, dto);
}

export async function removeBoard(boardId: string, userId: string) {
  const board = await boardModel.findBoardById(boardId);
  if (!board) throw new Error('Board not found');

  const isCreator = board.createdById === userId;
  if (!isCreator) {
    await requireOrgAdmin(userId, board.project.space.organizationId);
  }

  return boardModel.deleteBoard(boardId);
}

export async function createColumn(boardId: string, userId: string, dto: CreateBoardColumnDTO) {
  const board = await boardModel.findBoardById(boardId);
  if (!board) throw new Error('Board not found');

  await requireNonGuest(userId, board.project.space.organizationId);

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

  const orgId = column.board.project.space.organizationId;
  await requireNonGuest(userId, orgId);

  return boardModel.updateBoardColumn(columnId, dto);
}

export async function removeColumn(columnId: string, userId: string) {
  const column = await boardModel.findBoardColumnById(columnId);
  if (!column) throw new Error('Board column not found');

  const orgId = column.board.project.space.organizationId;
  await requireNonGuest(userId, orgId);

  return boardModel.deleteBoardColumn(columnId);
}
