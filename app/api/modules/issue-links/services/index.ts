import { LinkType } from '@prisma/client';
import { requireTaskAccess, requireTaskWrite } from '@/lib/guards/space-guard';
import * as issueLinkModel from '../models';
import { CreateIssueLinkDTO } from '../types';

export async function createIssueLink(userId: string, dto: CreateIssueLinkDTO) {
  if (dto.sourceTaskId === dto.targetTaskId) {
    throw new Error('Cannot link a task to itself');
  }

  const source = await requireTaskWrite(userId, dto.sourceTaskId);
  const target = await requireTaskAccess(userId, dto.targetTaskId);

  if (source.organizationId !== target.organizationId) {
    throw new Error('Tasks must belong to the same organization');
  }

  return issueLinkModel.createIssueLink({
    sourceTaskId: dto.sourceTaskId,
    targetTaskId: dto.targetTaskId,
    linkType: dto.linkType as LinkType,
  });
}

export async function readIssueLink(linkId: string, userId: string) {
  const link = await issueLinkModel.findIssueLinkById(linkId);
  if (!link) throw new Error('Issue link not found');

  await requireTaskAccess(userId, link.sourceTaskId);

  return link;
}

export async function readIssueLinks(taskId: string, userId: string) {
  await requireTaskAccess(userId, taskId);

  return issueLinkModel.findIssueLinksByTask(taskId);
}

export async function removeIssueLink(linkId: string, userId: string) {
  const link = await issueLinkModel.findIssueLinkById(linkId);
  if (!link) throw new Error('Issue link not found');

  await requireTaskWrite(userId, link.sourceTaskId);

  return issueLinkModel.deleteIssueLink(linkId);
}
