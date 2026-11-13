import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    task: { findUnique: vi.fn() },
    project: { findUnique: vi.fn() },
    space: { findUnique: vi.fn() },
    spaceMember: { findUnique: vi.fn() },
    membership: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/guards/org-guard', () => ({ verifyOrgMembership: vi.fn() }));

describe('requireTaskAccess / requireTaskWrite', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('@/lib/db/client');
    (prisma.task.findUnique as any).mockResolvedValue({ projectId: 'p1' });
    (prisma.project.findUnique as any).mockResolvedValue({ spaceId: 's1', space: { organizationId: 'o1' } });
    (prisma.space.findUnique as any).mockResolvedValue({ organizationId: 'o1' });
  });

  const asRole = async (role: string | null, inSpace: boolean) => {
    const { verifyOrgMembership } = await import('@/lib/guards/org-guard');
    const { prisma } = await import('@/lib/db/client');
    (verifyOrgMembership as any).mockResolvedValue({ isMember: !!role, role });
    (prisma.spaceMember.findUnique as any).mockResolvedValue(inSpace ? { id: 'm' } : null);
  };

  it('rejects an org member who is not in the private space (403)', async () => {
    await asRole('MEMBER', false);
    const { requireTaskAccess } = await import('@/lib/guards/space-guard');
    await expect(requireTaskAccess('u', 't')).rejects.toMatchObject({ status: 403, message: 'Not a member of this space' });
  });

  it('lets space members and org admins in, returning the scope', async () => {
    const { requireTaskAccess } = await import('@/lib/guards/space-guard');
    await asRole('MEMBER', true);
    await expect(requireTaskAccess('u', 't')).resolves.toMatchObject({ organizationId: 'o1', spaceId: 's1', projectId: 'p1' });
    await asRole('ADMIN', false);
    await expect(requireTaskAccess('u', 't')).resolves.toMatchObject({ role: 'ADMIN' });
  });

  it('rejects non-members and missing tasks', async () => {
    const { requireTaskAccess } = await import('@/lib/guards/space-guard');
    await asRole(null, false);
    await expect(requireTaskAccess('u', 't')).rejects.toMatchObject({ status: 403 });
    const { prisma } = await import('@/lib/db/client');
    (prisma.task.findUnique as any).mockResolvedValue(null);
    await expect(requireTaskAccess('u', 't')).rejects.toMatchObject({ status: 404 });
  });

  it('keeps guests read-only', async () => {
    await asRole('GUEST', true);
    const { requireTaskAccess, requireTaskWrite } = await import('@/lib/guards/space-guard');
    await expect(requireTaskAccess('u', 't')).resolves.toBeTruthy();
    await expect(requireTaskWrite('u', 't')).rejects.toMatchObject({ status: 403 });
  });
});
