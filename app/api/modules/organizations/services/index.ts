import * as orgModel from '../models';
import { CreateOrgDTO, UpdateOrgDTO } from '../types';

export async function createOrganization(userId: string, dto: CreateOrgDTO) {
  // Check slug uniqueness
  const existing = await orgModel.findOrganizationBySlug(dto.slug);
  if (existing) {
    throw new Error('An organization with this slug already exists');
  }

  return orgModel.createOrganization({
    name: dto.name,
    slug: dto.slug,
    createdById: userId,
  });
}

export async function getOrganization(orgId: string, userId: string) {
  const org = await orgModel.findOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  // Verify membership
  const isMember = org.memberships.some((m) => m.userId === userId);
  if (!isMember) throw new Error('Not a member of this organization');

  return org;
}

export async function getUserOrganizations(userId: string) {
  return orgModel.findUserOrganizations(userId);
}

export async function updateOrganization(orgId: string, userId: string, dto: UpdateOrgDTO) {
  const org = await orgModel.findOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  const membership = org.memberships.find((m) => m.userId === userId);
  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return orgModel.updateOrganization(orgId, dto);
}

export async function deleteOrganization(orgId: string, userId: string) {
  const org = await orgModel.findOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  const membership = org.memberships.find((m) => m.userId === userId);
  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return orgModel.deleteOrganization(orgId);
}
