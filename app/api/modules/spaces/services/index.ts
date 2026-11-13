import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import { requireSpaceAccess, getAccessibleSpaceIds } from '@/lib/guards/space-guard';
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

  await requireSpaceAccess(userId, spaceId);
  return space;
}

export async function getOrganizationSpaces(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  const access = await getAccessibleSpaceIds(userId, organizationId);
  if (access.all) return spaceModel.findSpacesByOrganization(organizationId);
  return spaceModel.findSpacesByOrganization(organizationId, access.ids);
}

export async function updateSpace(spaceId: string, userId: string, dto: UpdateSpaceDTO) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  await requireNonGuest(userId, space.organizationId);
  await requireSpaceAccess(userId, spaceId);
  return spaceModel.updateSpace(spaceId, dto);
}

export async function deleteSpace(spaceId: string, userId: string) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  // Creators may delete only while still a (non-guest) member: this cascades to every project and task.
  if (space.createdBy.id !== userId) {
    await requireOrgAdmin(userId, space.organizationId);
  } else {
    await requireNonGuest(userId, space.organizationId);
  }

  return spaceModel.deleteSpace(spaceId);
}

export async function listSpaceMembers(spaceId: string, userId: string) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  await requireSpaceAccess(userId, spaceId);
  return spaceModel.findSpaceMembers(spaceId);
}

export async function addSpaceMember(spaceId: string, userId: string, targetUserId: string) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  await requireOrgAdmin(userId, space.organizationId);
  await requireOrgMembership(targetUserId, space.organizationId);

  return spaceModel.addSpaceMember(spaceId, targetUserId);
}

export async function removeSpaceMember(spaceId: string, userId: string, targetUserId: string) {
  const space = await spaceModel.findSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  await requireOrgAdmin(userId, space.organizationId);
  return spaceModel.removeSpaceMember(spaceId, targetUserId);
}
