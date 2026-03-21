import { prisma } from '@/lib/db/client';
import { FieldType } from '@prisma/client';
import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import * as customFieldModel from '../models';
import { CreateCustomFieldDTO, UpdateCustomFieldDTO, SetCustomFieldValueDTO } from '../types';

async function getOrgIdFromTask(taskId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { space: { select: { organizationId: true } } } } },
  });
  if (!task) throw new Error('Task not found');
  return task.project.space.organizationId;
}

export async function createCustomField(userId: string, dto: CreateCustomFieldDTO) {
  await requireOrgAdmin(userId, dto.organizationId);
  return customFieldModel.createCustomField({
    name: dto.name,
    fieldType: dto.fieldType as FieldType,
    options: dto.options,
    required: dto.required,
    issueTypeId: dto.issueTypeId,
    organizationId: dto.organizationId,
  });
}

export async function readCustomField(fieldId: string, userId: string) {
  const field = await customFieldModel.findCustomFieldById(fieldId);
  if (!field) throw new Error('Custom field not found');
  await requireOrgMembership(userId, field.organizationId);
  return field;
}

export async function readCustomFields(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return customFieldModel.findCustomFieldsByOrganization(organizationId);
}

export async function editCustomField(fieldId: string, userId: string, dto: UpdateCustomFieldDTO) {
  const field = await customFieldModel.findCustomFieldById(fieldId);
  if (!field) throw new Error('Custom field not found');
  await requireOrgAdmin(userId, field.organizationId);
  return customFieldModel.updateCustomField(fieldId, {
    ...dto,
    ...(dto.fieldType && { fieldType: dto.fieldType as FieldType }),
  });
}

export async function removeCustomField(fieldId: string, userId: string) {
  const field = await customFieldModel.findCustomFieldById(fieldId);
  if (!field) throw new Error('Custom field not found');
  await requireOrgAdmin(userId, field.organizationId);
  return customFieldModel.deleteCustomField(fieldId);
}

export async function setFieldValue(taskId: string, userId: string, dto: SetCustomFieldValueDTO) {
  const organizationId = await getOrgIdFromTask(taskId);
  await requireNonGuest(userId, organizationId);
  return customFieldModel.setFieldValue({
    value: dto.value,
    customFieldId: dto.customFieldId,
    taskId,
  });
}

export async function readFieldValues(taskId: string, userId: string) {
  const organizationId = await getOrgIdFromTask(taskId);
  await requireOrgMembership(userId, organizationId);
  return customFieldModel.findFieldValuesByTask(taskId);
}
