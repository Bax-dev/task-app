import { prisma } from '@/lib/db/client';
import { LinkType } from '@prisma/client';
import { requireOrgMembership, requireNonGuest } from '@/lib/guards/org-guard';
import * as issueLinkModel from '../models';
import { CreateIssueLinkDTO } from '../types';

async function getOrgIdFromTask(taskId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { space: { select: { organizationId: true } } } } },
  });
  if (!task) throw new Error('Task not found');
  return task.project.space.organizationId;
}

export async function createIssueLink(userId: string, dto: CreateIssueLinkDTO) {
  if (dto.sourceTaskId === dto.targetTaskId) {
    throw new Error('Cannot link a task to itself');
  }

  const sourceOrgId = await getOrgIdFromTask(dto.sourceTaskId);
  const targetOrgId = await getOrgIdFromTask(dto.targetTaskId);

  if (sourceOrgId !== targetOrgId) {
    throw new Error('Tasks must belong to the same organization');
  }

  await requireNonGuest(userId, sourceOrgId);

  return issueLinkModel.createIssueLink({
    sourceTaskId: dto.sourceTaskId,
    targetTaskId: dto.targetTaskId,
    linkType: dto.linkType as LinkType,
  });
}

export async function readIssueLink(linkId: string, userId: string) {
  const link = await issueLinkModel.findIssueLinkById(linkId);
  if (!link) throw new Error('Issue link not found');

  const orgId = link.sourceTask.project.space.organizationId;
  await requireOrgMembership(userId, orgId);

  return link;
}

export async function readIssueLinks(taskId: string, userId: string) {
  const orgId = await getOrgIdFromTask(taskId);
  await requireOrgMembership(userId, orgId);

  return issueLinkModel.findIssueLinksByTask(taskId);
}

export async function removeIssueLink(linkId: string, userId: string) {
  const link = await issueLinkModel.findIssueLinkById(linkId);
  if (!link) throw new Error('Issue link not found');

  const orgId = link.sourceTask.project.space.organizationId;
  await requireNonGuest(userId, orgId);

  return issueLinkModel.deleteIssueLink(linkId);
}
