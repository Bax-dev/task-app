import { prisma } from '@/lib/db/client';
import { FieldType } from '@prisma/client';

export async function createCustomField(data: {
  name: string;
  fieldType: FieldType;
  options?: any;
  required?: boolean;
  issueTypeId?: string | null;
  organizationId: string;
}) {
  return prisma.customField.create({
    data,
    include: {
      issueType: { select: { id: true, name: true } },
      _count: { select: { values: true } },
    },
  });
}

export async function findCustomFieldById(id: string) {
  return prisma.customField.findUnique({
    where: { id },
    include: {
      issueType: true,
      organization: { select: { id: true } },
      _count: { select: { values: true } },
    },
  });
}

export async function findCustomFieldsByOrganization(organizationId: string) {
  return prisma.customField.findMany({
    where: { organizationId },
    include: {
      issueType: { select: { id: true, name: true } },
      _count: { select: { values: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateCustomField(
  id: string,
  data: { name?: string; fieldType?: FieldType; options?: any; required?: boolean }
) {
  return prisma.customField.update({
    where: { id },
    data,
    include: {
      issueType: true,
      _count: { select: { values: true } },
    },
  });
}

export async function deleteCustomField(id: string) {
  return prisma.customField.delete({ where: { id } });
}

export async function setFieldValue(data: {
  value: string;
  customFieldId: string;
  taskId: string;
}) {
  return prisma.customFieldValue.upsert({
    where: {
      customFieldId_taskId: {
        customFieldId: data.customFieldId,
        taskId: data.taskId,
      },
    },
    create: data,
    update: { value: data.value },
    include: { customField: true },
  });
}

export async function findFieldValuesByTask(taskId: string) {
  return prisma.customFieldValue.findMany({
    where: { taskId },
    include: { customField: true },
  });
}
