import { prisma } from '@/lib/db/client';

export async function createBoard(data: {
  name: string;
  description?: string;
  projectId: string;
  createdById: string;
  columns?: { name: string; position: number; wipLimit?: number }[];
}) {
  const { columns, ...boardData } = data;
  return prisma.board.create({
    data: {
      ...boardData,
      columns: columns ? { create: columns } : undefined,
    },
    include: {
      columns: { orderBy: { position: 'asc' } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function findBoardById(id: string) {
  return prisma.board.findUnique({
    where: { id },
    include: {
      columns: { orderBy: { position: 'asc' } },
      createdBy: { select: { id: true, name: true, email: true } },
      project: {
        select: {
          id: true,
          name: true,
          space: { select: { id: true, name: true, organizationId: true } },
        },
      },
    },
  });
}

export async function findBoardsByProject(projectId: string) {
  return prisma.board.findMany({
    where: { projectId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { columns: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateBoard(id: string, data: { name?: string; description?: string | null }) {
  return prisma.board.update({
    where: { id },
    data,
    include: {
      columns: { orderBy: { position: 'asc' } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteBoard(id: string) {
  return prisma.board.delete({ where: { id } });
}

export async function createBoardColumn(data: {
  name: string;
  position: number;
  wipLimit?: number;
  boardId: string;
}) {
  return prisma.boardColumn.create({ data });
}

export async function findBoardColumnById(id: string) {
  return prisma.boardColumn.findUnique({
    where: { id },
    include: {
      board: {
        include: {
          project: {
            select: {
              space: { select: { organizationId: true } },
            },
          },
        },
      },
    },
  });
}

export async function updateBoardColumn(id: string, data: { name?: string; position?: number; wipLimit?: number | null }) {
  return prisma.boardColumn.update({ where: { id }, data });
}

export async function deleteBoardColumn(id: string) {
  return prisma.boardColumn.delete({ where: { id } });
}
