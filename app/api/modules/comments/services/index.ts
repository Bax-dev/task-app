import { requireOrgMembership, requireNonGuest, requireOrgAdmin } from '@/lib/guards/org-guard';
import { prisma } from '@/lib/db/client';
import * as commentModel from '../models';
import { CreateCommentDTO, UpdateCommentDTO } from '../types';

async function getOrgIdFromTask(taskId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { space: { select: { organizationId: true } } } } },
  });
  if (!task) throw new Error('Task not found');
  return task.project.space.organizationId;
}

export async function createComment(userId: string, dto: CreateCommentDTO) {
  const orgId = await getOrgIdFromTask(dto.taskId);
  await requireNonGuest(userId, orgId);
  return commentModel.createComment({
    content: dto.content,
    taskId: dto.taskId,
    createdById: userId,
  });
}

export async function readComment(commentId: string, userId: string) {
  const comment = await commentModel.findCommentById(commentId);
  if (!comment) throw new Error('Comment not found');
  const orgId = comment.task.project.space.organizationId;
  await requireOrgMembership(userId, orgId);
  return comment;
}

export async function readComments(taskId: string, userId: string) {
  const orgId = await getOrgIdFromTask(taskId);
  await requireOrgMembership(userId, orgId);
  return commentModel.findCommentsByTask(taskId);
}

export async function editComment(commentId: string, userId: string, dto: UpdateCommentDTO) {
  const comment = await commentModel.findCommentById(commentId);
  if (!comment) throw new Error('Comment not found');
  if (comment.createdById !== userId) throw new Error('Only the author can edit this comment');
  return commentModel.updateComment(commentId, { content: dto.content });
}

export async function removeComment(commentId: string, userId: string) {
  const comment = await commentModel.findCommentById(commentId);
  if (!comment) throw new Error('Comment not found');
  if (comment.createdById !== userId) {
    const orgId = comment.task.project.space.organizationId;
    await requireOrgAdmin(userId, orgId);
  }
  return commentModel.deleteComment(commentId);
}
