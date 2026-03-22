import { prisma } from '@/lib/db/client';
import { requireOrgMembership, requireNonGuest } from '@/lib/guards/org-guard';
import * as subtaskModel from '../models';
import { CreateSubtaskDTO, UpdateSubtaskDTO, ReorderSubtasksDTO } from '../types';

async function getTaskOrgId(taskId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { space: { select: { organizationId: true } } } } },
  });
  if (!task) throw new Error('Task not found');
  return task.project.space.organizationId;
}

export async function createSubtask(taskId: string, userId: string, dto: CreateSubtaskDTO) {
  const orgId = await getTaskOrgId(taskId);
  await requireNonGuest(userId, orgId);

  const maxPos = await subtaskModel.getMaxPosition(taskId);
  return subtaskModel.createSubtask({
    title: dto.title,
    taskId,
    createdById: userId,
    position: maxPos + 1,
  });
}

export async function getSubtasks(taskId: string, userId: string) {
  const orgId = await getTaskOrgId(taskId);
  await requireOrgMembership(userId, orgId);
  return subtaskModel.findSubtasksByTask(taskId);
}

export async function updateSubtask(subtaskId: string, userId: string, dto: UpdateSubtaskDTO) {
  const subtask = await subtaskModel.findSubtaskById(subtaskId);
  if (!subtask) throw new Error('Subtask not found');

  const orgId = subtask.task.project.space.organizationId;
  await requireNonGuest(userId, orgId);

  return subtaskModel.updateSubtask(subtaskId, {
    title: dto.title,
    completed: dto.completed,
    position: dto.position,
  });
}

export async function deleteSubtask(subtaskId: string, userId: string) {
  const subtask = await subtaskModel.findSubtaskById(subtaskId);
  if (!subtask) throw new Error('Subtask not found');

  const orgId = subtask.task.project.space.organizationId;
  await requireNonGuest(userId, orgId);

  return subtaskModel.deleteSubtask(subtaskId);
}

export async function reorderSubtasks(taskId: string, userId: string, dto: ReorderSubtasksDTO) {
  const orgId = await getTaskOrgId(taskId);
  await requireNonGuest(userId, orgId);
  return subtaskModel.reorderSubtasks(taskId, dto.subtaskIds);
}
