import { prisma } from '@/lib/db/client';
import { HttpError } from '@/lib/api-response';
import { verifyOrgMembership, requireNonGuest } from './org-guard';
import { canAccessSpace, requireTaskWrite } from './space-guard';

export type AttachmentParents = { taskId?: string | null; noteId?: string | null; activityLogId?: string | null };

async function parentOrgId({ noteId, activityLogId }: AttachmentParents): Promise<string | null> {
  const parent = noteId
    ? await prisma.note.findUnique({ where: { id: noteId }, select: { organizationId: true } })
    : activityLogId
      ? await prisma.activityLog.findUnique({ where: { id: activityLogId }, select: { organizationId: true } })
      : null;
  return parent?.organizationId ?? null;
}

/** Viewer needs access to whatever the file is attached to; orphans (e.g. avatars) are uploader-only. */
export async function canViewAttachment(userId: string, a: AttachmentParents & { uploadedById: string }): Promise<boolean> {
  if (a.uploadedById === userId) return true;
  if (a.taskId) {
    const task = await prisma.task.findUnique({ where: { id: a.taskId }, select: { project: { select: { spaceId: true } } } });
    return !!task && canAccessSpace(userId, task.project.spaceId);
  }
  const orgId = await parentOrgId(a);
  return !!orgId && (await verifyOrgMembership(userId, orgId)).isMember;
}

/** Attaching a file to a task/note/log requires write access to it. No parent = personal upload. */
export async function requireAttachmentParentWrite(userId: string, a: AttachmentParents): Promise<void> {
  if (a.taskId) {
    await requireTaskWrite(userId, a.taskId);
    return;
  }
  if (!a.noteId && !a.activityLogId) return;
  const orgId = await parentOrgId(a);
  if (!orgId) throw new HttpError(a.noteId ? 'Note not found' : 'Activity log not found', 404);
  await requireNonGuest(userId, orgId);
}
