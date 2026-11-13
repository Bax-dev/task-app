import { prisma } from '@/lib/db/client';
import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import { requireSpaceAccess, requireProjectWrite } from '@/lib/guards/space-guard';
import * as projectModel from '../models';
import { CreateProjectDTO, UpdateProjectDTO } from '../types';

async function getOrgIdFromSpace(spaceId: string): Promise<string> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { organizationId: true },
  });
  if (!space) throw new Error('Space not found');
  return space.organizationId;
}

export async function createProject(userId: string, dto: CreateProjectDTO) {
  const orgId = await getOrgIdFromSpace(dto.spaceId);
  await requireNonGuest(userId, orgId);
  await requireSpaceAccess(userId, dto.spaceId);

  return projectModel.createProject({
    name: dto.name,
    description: dto.description,
    spaceId: dto.spaceId,
    createdById: userId,
  });
}

export async function getProject(projectId: string, userId: string) {
  const project = await projectModel.findProjectById(projectId);
  if (!project) throw new Error('Project not found');

  await requireSpaceAccess(userId, project.space.id);
  return project;
}

export async function getSpaceProjects(spaceId: string, userId: string) {
  await requireSpaceAccess(userId, spaceId);
  return projectModel.findProjectsBySpace(spaceId);
}

export async function getUserProjects(userId: string) {
  return projectModel.findProjectsByUser(userId);
}

export async function updateProject(projectId: string, userId: string, dto: UpdateProjectDTO) {
  const project = await projectModel.findProjectById(projectId);
  if (!project) throw new Error('Project not found');

  await requireNonGuest(userId, project.space.organizationId);
  await requireSpaceAccess(userId, project.space.id);
  return projectModel.updateProject(projectId, dto);
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await projectModel.findProjectById(projectId);
  if (!project) throw new Error('Project not found');

  if (project.createdById !== userId) {
    await requireOrgAdmin(userId, project.space.organizationId);
  } else {
    await requireProjectWrite(userId, projectId); // creator who left the org/space can't cascade-delete
  }

  return projectModel.deleteProject(projectId);
}
