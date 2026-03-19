import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import * as spaceModel from '../models';
import { CreateSpaceDTO, UpdateSpaceDTO } from '../types';

export async function createSpace(userId: string, dto: CreateSpaceDTO) {
  await requireNonGuest(userId, dto.organizationId);

  return spaceModel.createSpace({
    name: dto.name,
    description: dto.description,
    color: dto.color,
    icon: dto.icon,
    organizationId: dto.organizationId,
    createdById: userId,
  });
}

export async function getSpace(spaceId: string, userId: string) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  await requireOrgMembership(userId, space.organizationId);
  return space;
}

export async function getOrganizationSpaces(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return spaceModel.findSpacesByOrganization(organizationId);
}

export async function updateSpace(spaceId: string, userId: string, dto: UpdateSpaceDTO) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  await requireNonGuest(userId, space.organizationId);
  return spaceModel.updateSpace(spaceId, dto);
}

export async function deleteSpace(spaceId: string, userId: string) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  // Only admins or creator can delete
  if (space.createdBy.id !== userId) {
    await requireOrgAdmin(userId, space.organizationId);
  }

  return spaceModel.deleteSpace(spaceId);
}
