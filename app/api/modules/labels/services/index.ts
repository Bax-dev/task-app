import { prisma } from '@/lib/db/client';
import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import * as labelModel from '../models';
import { CreateLabelDTO, UpdateLabelDTO, TaskLabelDTO } from '../types';

async function getOrgIdFromTask(taskId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { space: { select: { organizationId: true } } } } },
  });
  if (!task) throw new Error('Task not found');
  return task.project.space.organizationId;
}

export async function createLabel(userId: string, dto: CreateLabelDTO) {
  await requireNonGuest(userId, dto.organizationId);

  return labelModel.createLabel({
    name: dto.name,
    color: dto.color,
    organizationId: dto.organizationId,
  });
}

export async function readLabel(labelId: string, userId: string) {
  const label = await labelModel.findLabelById(labelId);
  if (!label) throw new Error('Label not found');

  await requireOrgMembership(userId, label.organization.id);
  return label;
}

export async function readLabels(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return labelModel.findLabelsByOrganization(organizationId);
}

export async function editLabel(labelId: string, userId: string, dto: UpdateLabelDTO) {
  const label = await labelModel.findLabelById(labelId);
  if (!label) throw new Error('Label not found');

  await requireNonGuest(userId, label.organization.id);
  return labelModel.updateLabel(labelId, dto);
}

export async function removeLabel(labelId: string, userId: string) {
  const label = await labelModel.findLabelById(labelId);
  if (!label) throw new Error('Label not found');

  await requireOrgAdmin(userId, label.organization.id);
  return labelModel.deleteLabel(labelId);
}

export async function addTaskLabel(taskId: string, userId: string, dto: TaskLabelDTO) {
  const orgId = await getOrgIdFromTask(taskId);
  await requireNonGuest(userId, orgId);

  return labelModel.addTaskLabel(taskId, dto.labelId);
}

export async function removeTaskLabel(taskId: string, userId: string, labelId: string) {
  const orgId = await getOrgIdFromTask(taskId);
  await requireNonGuest(userId, orgId);

  return labelModel.removeTaskLabel(taskId, labelId);
}
