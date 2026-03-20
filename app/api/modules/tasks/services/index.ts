import { TaskStatus, TaskPriority } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { requireOrgMembership, requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import { notifyTaskAssigned, notifyTaskUpdated } from '@/app/api/modules/notifications/services';
import * as taskModel from '../models';
import { CreateTaskDTO, UpdateTaskDTO, AssignTaskDTO } from '../types';
import { logAudit } from '@/lib/audit';

async function getProjectOrgId(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { space: { select: { organizationId: true } } },
  });
  if (!project) throw new Error('Project not found');
  return project.space.organizationId;
}

function getOrgIdFromTask(task: { project: { space: { organizationId: string } } }): string {
  return task.project.space.organizationId;
}

export async function createTask(userId: string, dto: CreateTaskDTO) {
  const orgId = await getProjectOrgId(dto.projectId);
  await requireNonGuest(userId, orgId);

  const task = await taskModel.createTask({
    title: dto.title,
    description: dto.description,
    status: dto.status as TaskStatus,
    priority: dto.priority as TaskPriority,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    projectId: dto.projectId,
    createdById: userId,
  });

  // Assign users if provided
  if (dto.assigneeIds && dto.assigneeIds.length > 0) {
    const assigner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const assignerName = assigner?.name || assigner?.email || 'Someone';

    for (const assigneeId of dto.assigneeIds) {
      try {
        await requireOrgMembership(assigneeId, orgId);
        await taskModel.assignUser(task.id, assigneeId);

        if (assigneeId !== userId) {
          notifyTaskAssigned({
            assigneeId,
            taskTitle: task.title,
            projectName: task.project.name,
            assignedByName: assignerName,
            taskLink: `/projects/${task.projectId}/tasks/${task.id}`,
          }).catch(() => {});
        }
      } catch {
        // Skip users who aren't org members
      }
    }

    // Re-fetch task with assignments
    const updated = await taskModel.findTaskById(task.id);
    logAudit({ userId, organizationId: orgId, description: `created task "${task.title}"`, taskId: task.id });
    if (updated) return updated;
  }

  logAudit({ userId, organizationId: orgId, description: `created task "${task.title}"`, taskId: task.id });
  return task;
}

export async function getTask(taskId: string, userId: string) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');

  await requireOrgMembership(userId, getOrgIdFromTask(task));
  return task;
}

export async function getProjectTasks(projectId: string, userId: string) {
  const orgId = await getProjectOrgId(projectId);
  await requireOrgMembership(userId, orgId);
  return taskModel.findTasksByProject(projectId);
}

export async function getUserTasks(userId: string) {
  return taskModel.findTasksByUser(userId);
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const orgId = getOrgIdFromTask(task);
  await requireNonGuest(userId, orgId);

  if (task.createdById !== userId) {
    await requireOrgAdmin(userId, orgId);
  }

  logAudit({ userId, organizationId: orgId, description: `deleted task "${task.title}"` });
  return taskModel.deleteTask(taskId);
}

export async function toggleAssignment(taskId: string, userId: string, dto: AssignTaskDTO) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const orgId = getOrgIdFromTask(task);
  await requireOrgAdmin(userId, orgId);
  await requireOrgMembership(dto.userId, orgId);

  const existing = await taskModel.findAssignment(taskId, dto.userId);
  if (existing) {
    await taskModel.unassignUser(taskId, dto.userId);
    logAudit({ userId, organizationId: orgId, description: `unassigned a member from "${task.title}"`, taskId });
    return { assigned: false, userId: dto.userId };
  }

  const assignment = await taskModel.assignUser(taskId, dto.userId);

  // Send notification to the assigned user (not to yourself)
  if (dto.userId !== userId) {
    const assigner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const assignerName = assigner?.name || assigner?.email || 'Someone';

    notifyTaskAssigned({
      assigneeId: dto.userId,
      taskTitle: task.title,
      projectName: task.project.name,
      assignedByName: assignerName,
      taskLink: `/projects/${task.projectId}/tasks/${taskId}`,
    }).catch(() => {}); // fire-and-forget
  }

  logAudit({ userId, organizationId: orgId, description: `assigned a member to "${task.title}"`, taskId });
  return { assigned: true, userId: dto.userId, user: assignment.user };
}

export async function updateTask(taskId: string, userId: string, dto: UpdateTaskDTO) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const orgId = getOrgIdFromTask(task);
  await requireNonGuest(userId, orgId);

  // Only admins can reject tasks
  if (dto.status === 'REJECTED') {
    await requireOrgAdmin(userId, orgId);
  }

  const updateData: any = {
    title: dto.title,
    description: dto.description,
    status: dto.status as TaskStatus | undefined,
    priority: dto.priority as TaskPriority | undefined,
    dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined,
  };

  // Set or clear rejection reason
  if (dto.status === 'REJECTED' && dto.rejectionReason) {
    updateData.rejectionReason = dto.rejectionReason;
  } else if (dto.status && dto.status !== 'REJECTED') {
    updateData.rejectionReason = null; // Clear rejection when status changes away
  }

  const updated = await taskModel.updateTask(taskId, updateData);

  // Audit log
  let auditDesc = `updated task "${task.title}"`;
  if (dto.status) auditDesc = `changed status of "${task.title}" to ${dto.status}`;
  else if (dto.priority) auditDesc = `changed priority of "${task.title}" to ${dto.priority}`;
  logAudit({ userId, organizationId: orgId, description: auditDesc, taskId });

  // Notify assigned users + task creator about the update
  const notifyIds = [
    ...task.assignments.map((a) => a.user.id),
    task.createdById,
  ].filter((id, i, arr) => id !== userId && arr.indexOf(id) === i); // dedupe, exclude self

  if (notifyIds.length > 0) {
    const updater = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const updaterName = updater?.name || updater?.email || 'Someone';

    let change = 'made changes';
    if (dto.status === 'REJECTED') change = `rejected task${dto.rejectionReason ? ': ' + dto.rejectionReason : ''}`;
    else if (dto.status) change = `changed status to ${dto.status}`;
    else if (dto.priority) change = `changed priority to ${dto.priority}`;

    notifyTaskUpdated({
      assigneeIds: notifyIds,
      updatedByName: updaterName,
      taskTitle: task.title,
      change,
      taskLink: `/projects/${task.projectId}/tasks/${taskId}`,
    }).catch(() => {});
  }

  return updated;
}
