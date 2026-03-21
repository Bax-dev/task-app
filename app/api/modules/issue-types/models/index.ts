import { prisma } from '@/lib/db/client';

export async function createIssueType(data: {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  organizationId: string;
}) {
  return prisma.issueType.create({
    data,
    include: {
      _count: { select: { tasks: true, customFields: true } },
    },
  });
}

export async function findIssueTypeById(id: string) {
  return prisma.issueType.findUnique({
    where: { id },
    include: {
      customFields: true,
      organization: { select: { id: true } },
      _count: { select: { tasks: true } },
    },
  });
}

export async function findIssueTypesByOrganization(organizationId: string) {
  return prisma.issueType.findMany({
    where: { organizationId },
    include: {
      _count: { select: { tasks: true, customFields: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateIssueType(id: string, data: {
  name?: string;
  icon?: string;
  color?: string;
  description?: string | null;
}) {
  return prisma.issueType.update({
    where: { id },
    data,
    include: {
      _count: { select: { tasks: true, customFields: true } },
    },
  });
}

export async function deleteIssueType(id: string) {
  return prisma.issueType.delete({ where: { id } });
}
