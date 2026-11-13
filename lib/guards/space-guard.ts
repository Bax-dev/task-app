import { HttpError } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { Role } from '@prisma/client';
import { verifyOrgMembership } from './org-guard';

export async function canAccessSpace(userId: string, spaceId: string): Promise<boolean> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { organizationId: true },
  });
  if (!space) return false;

  const { isMember, role } = await verifyOrgMembership(userId, space.organizationId);
  if (!isMember) return false;
  if (role === Role.ADMIN) return true;

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { id: true },
  });
  return !!membership;
}

export async function requireSpaceAccess(userId: string, spaceId: string): Promise<Role> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { organizationId: true },
  });
  if (!space) throw new HttpError('Space not found', 404);

  const { isMember, role } = await verifyOrgMembership(userId, space.organizationId);
  if (!isMember || !role) throw new HttpError('Not a member of this organization', 403);
  if (role === Role.ADMIN) return role;

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { id: true },
  });
  if (!membership) throw new HttpError('Not a member of this space', 403);
  return role;
}

export async function getAccessibleSpaceIds(userId: string, organizationId: string): Promise<{ all: true } | { all: false; ids: string[] }> {
  const { isMember, role } = await verifyOrgMembership(userId, organizationId);
  if (!isMember) return { all: false, ids: [] };
  if (role === Role.ADMIN) return { all: true };

  const memberships = await prisma.spaceMember.findMany({
    where: { userId, space: { organizationId } },
    select: { spaceId: true },
  });
  return { all: false, ids: memberships.map((m) => m.spaceId) };
}

export type ResourceAccess = { role: Role; organizationId: string; spaceId: string; projectId: string };

/** Space-level access to a project (org admins, or members of its space). Throws HttpError 403/404. */
export async function requireProjectAccess(userId: string, projectId: string): Promise<ResourceAccess> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { spaceId: true, space: { select: { organizationId: true } } },
  });
  if (!project) throw new HttpError('Project not found', 404);
  const role = await requireSpaceAccess(userId, project.spaceId);
  return { role, organizationId: project.space.organizationId, spaceId: project.spaceId, projectId };
}

/** Space-level access to a task. Use this, not org membership, for anything reached by task id. */
export async function requireTaskAccess(userId: string, taskId: string): Promise<ResourceAccess> {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) throw new HttpError('Task not found', 404);
  return requireProjectAccess(userId, task.projectId);
}

/** requireTaskAccess plus the guest read-only rule. */
export async function requireTaskWrite(userId: string, taskId: string): Promise<ResourceAccess> {
  const access = await requireTaskAccess(userId, taskId);
  if (access.role === Role.GUEST) throw new HttpError('Guest users have read-only access', 403);
  return access;
}

/** requireProjectAccess plus the guest read-only rule. */
export async function requireProjectWrite(userId: string, projectId: string): Promise<ResourceAccess> {
  const access = await requireProjectAccess(userId, projectId);
  if (access.role === Role.GUEST) throw new HttpError('Guest users have read-only access', 403);
  return access;
}
