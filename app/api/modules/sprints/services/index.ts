import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import { getAccessibleSpaceIds, requireTaskWrite } from '@/lib/guards/space-guard';
import * as sprintModel from '../models';
import { CreateSprintDTO, UpdateSprintDTO, SprintTaskDTO } from '../types';

type WithSprintTasks = { sprintTasks: { task: { project: { spaceId: string } } }[] };

/** Sprints are org-wide, but their tasks must not leak out of private spaces. */
async function onlyVisibleTasks<T extends WithSprintTasks>(userId: string, organizationId: string, sprints: T[]): Promise<T[]> {
  const access = await getAccessibleSpaceIds(userId, organizationId);
  if (access.all) return sprints;
  return sprints.map((s) => ({ ...s, sprintTasks: s.sprintTasks.filter((st) => access.ids.includes(st.task.project.spaceId)) }));
}

export async function createSprint(userId: string, dto: CreateSprintDTO) {
  await requireNonGuest(userId, dto.organizationId);

  const sprint = await sprintModel.createSprint({
    name: dto.name,
    goal: dto.goal,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    organizationId: dto.organizationId,
    createdById: userId,
  });

  return sprint;
}

export async function readSprint(sprintId: string, userId: string) {
  const sprint = await sprintModel.findSprintById(sprintId);
  if (!sprint) throw new Error('Sprint not found');

  await requireOrgMembership(userId, sprint.organizationId);
  return (await onlyVisibleTasks(userId, sprint.organizationId, [sprint]))[0];
}

export async function readSprints(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return onlyVisibleTasks(userId, organizationId, await sprintModel.findSprintsByOrganization(organizationId));
}

export async function editSprint(sprintId: string, userId: string, dto: UpdateSprintDTO) {
  const sprint = await sprintModel.findSprintById(sprintId);
  if (!sprint) throw new Error('Sprint not found');

  await requireNonGuest(userId, sprint.organizationId);

  const updateData: any = {
    name: dto.name,
    goal: dto.goal,
    status: dto.status as any,
  };

  if (dto.startDate !== undefined) {
    updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
  }
  if (dto.endDate !== undefined) {
    updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
  }

  return sprintModel.updateSprint(sprintId, updateData);
}

export async function removeSprint(sprintId: string, userId: string) {
  const sprint = await sprintModel.findSprintById(sprintId);
  if (!sprint) throw new Error('Sprint not found');

  if (sprint.createdById !== userId) {
    await requireOrgAdmin(userId, sprint.organizationId);
  } else {
    await requireNonGuest(userId, sprint.organizationId);
  }

  return sprintModel.deleteSprint(sprintId);
}

export async function addSprintTask(sprintId: string, userId: string, dto: SprintTaskDTO) {
  const sprint = await sprintModel.findSprintById(sprintId);
  if (!sprint) throw new Error('Sprint not found');

  await requireNonGuest(userId, sprint.organizationId);

  const task = await requireTaskWrite(userId, dto.taskId);
  if (task.organizationId !== sprint.organizationId) {
    throw new Error('Task does not belong to this organization');
  }

  return sprintModel.addSprintTask({
    sprintId,
    taskId: dto.taskId,
    storyPoints: dto.storyPoints,
  });
}

export async function removeSprintTask(sprintId: string, userId: string, taskId: string) {
  const sprint = await sprintModel.findSprintById(sprintId);
  if (!sprint) throw new Error('Sprint not found');

  await requireNonGuest(userId, sprint.organizationId);

  return sprintModel.removeSprintTask(sprintId, taskId);
}
