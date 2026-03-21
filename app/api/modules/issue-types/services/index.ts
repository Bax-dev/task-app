import { requireOrgMembership, requireNonGuest, requireOrgAdmin } from '@/lib/guards/org-guard';
import * as issueTypeModel from '../models';
import { CreateIssueTypeDTO, UpdateIssueTypeDTO } from '../types';

export async function createIssueType(userId: string, dto: CreateIssueTypeDTO) {
  await requireOrgAdmin(userId, dto.organizationId);

  return issueTypeModel.createIssueType({
    name: dto.name,
    icon: dto.icon,
    color: dto.color,
    description: dto.description,
    organizationId: dto.organizationId,
  });
}

export async function readIssueType(issueTypeId: string, userId: string) {
  const issueType = await issueTypeModel.findIssueTypeById(issueTypeId);
  if (!issueType) throw new Error('Issue type not found');

  await requireOrgMembership(userId, issueType.organization.id);
  return issueType;
}

export async function readIssueTypes(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return issueTypeModel.findIssueTypesByOrganization(organizationId);
}

export async function editIssueType(issueTypeId: string, userId: string, dto: UpdateIssueTypeDTO) {
  const issueType = await issueTypeModel.findIssueTypeById(issueTypeId);
  if (!issueType) throw new Error('Issue type not found');

  await requireOrgAdmin(userId, issueType.organization.id);
  return issueTypeModel.updateIssueType(issueTypeId, dto);
}

export async function removeIssueType(issueTypeId: string, userId: string) {
  const issueType = await issueTypeModel.findIssueTypeById(issueTypeId);
  if (!issueType) throw new Error('Issue type not found');

  await requireOrgAdmin(userId, issueType.organization.id);
  return issueTypeModel.deleteIssueType(issueTypeId);
}
