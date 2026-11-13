import { requireOrgAdmin } from '@/lib/guards/org-guard';
import { requireTaskAccess, requireTaskWrite } from '@/lib/guards/space-guard';
import * as commentModel from '../models';
import { CreateCommentDTO, UpdateCommentDTO } from '../types';

export async function createComment(userId: string, dto: CreateCommentDTO) {
  await requireTaskWrite(userId, dto.taskId);
  return commentModel.createComment({
    content: dto.content,
    taskId: dto.taskId,
    createdById: userId,
  });
}

export async function readComment(commentId: string, userId: string) {
  const comment = await commentModel.findCommentById(commentId);
  if (!comment) throw new Error('Comment not found');
  await requireTaskAccess(userId, comment.taskId);
  return comment;
}

export async function readComments(taskId: string, userId: string) {
  await requireTaskAccess(userId, taskId);
  return commentModel.findCommentsByTask(taskId);
}

export async function editComment(commentId: string, userId: string, dto: UpdateCommentDTO) {
  const comment = await commentModel.findCommentById(commentId);
  if (!comment) throw new Error('Comment not found');
  if (comment.createdById !== userId) throw new Error('Only the author can edit this comment');
  await requireTaskWrite(userId, comment.taskId); // authors who lost access can't keep editing
  return commentModel.updateComment(commentId, { content: dto.content });
}

export async function removeComment(commentId: string, userId: string) {
  const comment = await commentModel.findCommentById(commentId);
  if (!comment) throw new Error('Comment not found');
  const { organizationId } = await requireTaskAccess(userId, comment.taskId);
  if (comment.createdById !== userId) await requireOrgAdmin(userId, organizationId);
  return commentModel.deleteComment(commentId);
}
