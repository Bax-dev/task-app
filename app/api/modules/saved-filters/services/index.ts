import { requireOrgMembership, requireOrgAdmin } from '@/lib/guards/org-guard';
import * as savedFilterModel from '../models';
import { CreateSavedFilterDTO, UpdateSavedFilterDTO } from '../types';

export async function createSavedFilter(userId: string, dto: CreateSavedFilterDTO) {
  await requireOrgMembership(userId, dto.organizationId);

  return savedFilterModel.createSavedFilter({
    name: dto.name,
    query: dto.query,
    shared: dto.shared,
    organizationId: dto.organizationId,
    createdById: userId,
  });
}

export async function readSavedFilter(filterId: string, userId: string) {
  const filter = await savedFilterModel.findSavedFilterById(filterId);
  if (!filter) throw new Error('Saved filter not found');

  await requireOrgMembership(userId, filter.organization.id);

  if (filter.createdById !== userId && !filter.shared) {
    throw new Error('Saved filter not found');
  }

  return filter;
}

export async function readSavedFilters(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return savedFilterModel.findSavedFiltersByOrganization(organizationId, userId);
}

export async function editSavedFilter(filterId: string, userId: string, dto: UpdateSavedFilterDTO) {
  const filter = await savedFilterModel.findSavedFilterById(filterId);
  if (!filter) throw new Error('Saved filter not found');

  if (filter.createdById !== userId) {
    throw new Error('Only the owner can edit this filter');
  }

  return savedFilterModel.updateSavedFilter(filterId, dto);
}

export async function removeSavedFilter(filterId: string, userId: string) {
  const filter = await savedFilterModel.findSavedFilterById(filterId);
  if (!filter) throw new Error('Saved filter not found');

  if (filter.createdById !== userId) {
    try {
      await requireOrgAdmin(userId, filter.organization.id);
    } catch {
      throw new Error('Only the owner or an admin can delete this filter');
    }
  }

  return savedFilterModel.deleteSavedFilter(filterId);
}
