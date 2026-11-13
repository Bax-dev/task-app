import { FieldType } from '@prisma/client';
import { requireOrgMembership, requireOrgAdmin, assertIssueTypeInOrg } from '@/lib/guards/org-guard';
import { requireTaskAccess, requireTaskWrite } from '@/lib/guards/space-guard';
import { HttpError } from '@/lib/api-response';
import * as customFieldModel from '../models';
import { CreateCustomFieldDTO, UpdateCustomFieldDTO, SetCustomFieldValueDTO } from '../types';

export async function createCustomField(userId: string, dto: CreateCustomFieldDTO) {
  await requireOrgAdmin(userId, dto.organizationId);
  await assertIssueTypeInOrg(dto.issueTypeId, dto.organizationId);
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
  const { organizationId } = await requireTaskWrite(userId, taskId);
  const field = await customFieldModel.findCustomFieldById(dto.customFieldId);
  if (!field || field.organizationId !== organizationId) throw new HttpError('Custom field not found', 404);
  return customFieldModel.setFieldValue({
    value: dto.value,
    customFieldId: dto.customFieldId,
    taskId,
  });
}

export async function readFieldValues(taskId: string, userId: string) {
  await requireTaskAccess(userId, taskId);
  return customFieldModel.findFieldValuesByTask(taskId);
}
