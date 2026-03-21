import { requireOrgMembership } from '@/lib/guards/org-guard';
import * as reportModel from '../models';

export async function getBurndownChart(userId: string, sprintId: string) {
  const sprint = await reportModel.getSprintWithTasks(sprintId);
  if (!sprint) throw new Error('Sprint not found');

  await requireOrgMembership(userId, sprint.organization.id);

  if (!sprint.startDate || !sprint.endDate) {
    throw new Error('Sprint must have start and end dates');
  }

  const totalPoints = sprint.sprintTasks.reduce(
    (sum, st) => sum + (st.storyPoints || st.task.storyPoints || 0),
    0
  );
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const burndownData = [];
  for (let day = 0; day <= totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    const completedPoints = sprint.sprintTasks
      .filter((st) => st.task.status === 'DONE' && new Date(st.task.updatedAt) <= currentDate)
      .reduce((sum, st) => sum + (st.storyPoints || st.task.storyPoints || 0), 0);

    const idealRemaining = totalPoints - (totalPoints / totalDays) * day;
    const actualRemaining = totalPoints - completedPoints;

    burndownData.push({
      date: currentDate.toISOString().split('T')[0],
      idealRemaining: Math.max(0, Math.round(idealRemaining * 10) / 10),
      actualRemaining,
    });
  }

  return {
    sprint: { id: sprint.id, name: sprint.name, startDate, endDate, totalPoints },
    burndownData,
  };
}

export async function getVelocityChart(userId: string, organizationId: string, sprintCount: number) {
  await requireOrgMembership(userId, organizationId);

  const sprints = await reportModel.getCompletedSprints(organizationId, sprintCount);

  const velocityData = sprints
    .map((sprint) => {
      const committed = sprint.sprintTasks.reduce(
        (sum, st) => sum + (st.storyPoints || st.task.storyPoints || 0),
        0
      );
      const completed = sprint.sprintTasks
        .filter((st) => st.task.status === 'DONE')
        .reduce((sum, st) => sum + (st.storyPoints || st.task.storyPoints || 0), 0);

      return { sprintId: sprint.id, sprintName: sprint.name, committed, completed };
    })
    .reverse();

  const avgVelocity =
    velocityData.length > 0
      ? Math.round(velocityData.reduce((sum, v) => sum + v.completed, 0) / velocityData.length)
      : 0;

  return { velocityData, averageVelocity: avgVelocity };
}

export async function getCumulativeFlow(userId: string, organizationId: string, days: number) {
  await requireOrgMembership(userId, organizationId);

  const tasks = await reportModel.getTasksByOrganization(organizationId);
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const statuses = ['TODO', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED'];
  const flowData = [];

  for (let day = 0; day <= days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];

    const counts: Record<string, number> = {};
    for (const status of statuses) {
      counts[status] = tasks.filter((t) => new Date(t.createdAt) <= currentDate).length;
    }
    // Simplified: count total tasks created by that date
    const totalTasks = tasks.filter((t) => new Date(t.createdAt) <= currentDate).length;

    flowData.push({ date: dateStr, total: totalTasks, ...counts });
  }

  return { flowData, statuses };
}
