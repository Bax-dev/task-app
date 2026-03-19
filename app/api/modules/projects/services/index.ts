import { prisma } from '@/lib/db/client';
import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
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

  await requireOrgMembership(userId, project.space.organizationId);
  return project;
}

export async function getSpaceProjects(spaceId: string, userId: string) {
  const orgId = await getOrgIdFromSpace(spaceId);
  await requireOrgMembership(userId, orgId);
  return projectModel.findProjectsBySpace(spaceId);
}

export async function getUserProjects(userId: string) {
  return projectModel.findProjectsByUser(userId);
}

export async function updateProject(projectId: string, userId: string, dto: UpdateProjectDTO) {
  const project = await projectModel.findProjectById(projectId);
  if (!project) throw new Error('Project not found');

  await requireNonGuest(userId, project.space.organizationId);
  return projectModel.updateProject(projectId, dto);
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await projectModel.findProjectById(projectId);
  if (!project) throw new Error('Project not found');

  const isCreator = project.createdById === userId;
  if (!isCreator) {
    await requireOrgAdmin(userId, project.space.organizationId);
  }

  return projectModel.deleteProject(projectId);
}
