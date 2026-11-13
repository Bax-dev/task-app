import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    boardColumn: { findFirst: vi.fn() },
    task: { update: vi.fn() },
  },
}));

vi.mock('@/lib/guards/space-guard', () => ({
  requireSpaceAccess: vi.fn(),
  requireTaskWrite: vi.fn().mockResolvedValue({ role: 'MEMBER', organizationId: 'org-1', spaceId: 'space-1', projectId: 'project-1' }),
}));

vi.mock('@/lib/redis-pubsub', () => ({ publishEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(), buildTaskAssignedEmail: vi.fn(), buildTaskOverdueEmail: vi.fn() }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('@/app/api/modules/notifications/services', () => ({
  notifyTaskAssigned: vi.fn(),
  notifyTaskAssignedToMany: vi.fn(),
  notifyTaskOverdue: vi.fn(),
  notifyTaskUpdated: vi.fn(),
}));

const TASK_ID = '11111111-1111-4111-8111-111111111111';
const COLUMN_ID = '22222222-2222-4222-8222-222222222222';

describe('moveTask service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('404s when the target column is not on a board of the task project', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.boardColumn.findFirst as any).mockResolvedValue(null);
    const { moveTask } = await import('@/app/api/modules/tasks/services');

    await expect(moveTask(TASK_ID, 'user-1', { boardColumnId: COLUMN_ID, position: 1 }))
      .rejects.toMatchObject({ status: 404, message: 'Board column not found' });

    expect(prisma.boardColumn.findFirst).toHaveBeenCalledWith({
      where: { id: COLUMN_ID, board: { projectId: 'project-1' } },
      select: { id: true },
    });
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('saves column and position when the column belongs to the same project', async () => {
    const { prisma } = await import('@/lib/db/client');
    const { publishEvent } = await import('@/lib/redis-pubsub');
    (prisma.boardColumn.findFirst as any).mockResolvedValue({ id: COLUMN_ID });
    (prisma.task.update as any).mockResolvedValue({ id: TASK_ID, projectId: 'project-1' });
    const { moveTask } = await import('@/app/api/modules/tasks/services');

    await moveTask(TASK_ID, 'user-1', { boardColumnId: COLUMN_ID, position: 2.5 });

    expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: TASK_ID },
      data: { boardPosition: 2.5, boardColumnId: COLUMN_ID },
    }));
    expect(publishEvent).toHaveBeenCalledWith('events:project:project-1', expect.objectContaining({ type: 'TASK_UPDATED' }));
  });

  it('skips the column check when only reordering', async () => {
    const { prisma } = await import('@/lib/db/client');
    (prisma.task.update as any).mockResolvedValue({ id: TASK_ID, projectId: 'project-1' });
    const { moveTask } = await import('@/app/api/modules/tasks/services');

    await moveTask(TASK_ID, 'user-1', { position: 0 });

    expect(prisma.boardColumn.findFirst).not.toHaveBeenCalled();
  });
});
