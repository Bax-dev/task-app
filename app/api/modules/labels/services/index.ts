import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import { requireTaskWrite } from '@/lib/guards/space-guard';
import { HttpError } from '@/lib/api-response';
import * as labelModel from '../models';
import { CreateLabelDTO, UpdateLabelDTO, TaskLabelDTO } from '../types';

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
  const { organizationId } = await requireTaskWrite(userId, taskId);
  // Labels from another org must not be attachable (and leak their name/colour back).
  const label = await labelModel.findLabelById(dto.labelId);
  if (!label || label.organization.id !== organizationId) throw new HttpError('Label not found', 404);

  return labelModel.addTaskLabel(taskId, dto.labelId);
}

export async function removeTaskLabel(taskId: string, userId: string, labelId: string) {
  await requireTaskWrite(userId, taskId);

  return labelModel.removeTaskLabel(taskId, labelId);
}
