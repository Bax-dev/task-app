import { TaskStatus, TaskPriority } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { requireOrgAdmin, requireNonGuest } from '@/lib/guards/org-guard';
import { requireSpaceAccess } from '@/lib/guards/space-guard';
import { notifyTaskAssigned, notifyTaskAssignedToMany, notifyTaskOverdue, notifyTaskUpdated } from '@/app/api/modules/notifications/services';
import { sendEmail, buildTaskAssignedEmail, buildTaskOverdueEmail } from '@/lib/email';
import * as taskModel from '../models';
import { CreateTaskDTO, UpdateTaskDTO, AssignTaskDTO } from '../types';
import { logAudit } from '@/lib/audit';
import { publishEvent } from '@/lib/redis-pubsub';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function sendAssignmentEmail(assigneeId: string, task: any, assignerName: string) {
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { name: true, email: true },
  });
  if (!assignee?.email) return;

  const { subject, html } = buildTaskAssignedEmail({
    assigneeName: assignee.name || assignee.email,
    taskTitle: task.title,
    projectName: task.project.name,
    assignedByName: assignerName,
    taskUrl: `${APP_URL}/projects/${task.projectId}/tasks/${task.id}`,
    priority: task.priority,
    dueDate: task.dueDate,
    description: task.description,
  });

  sendEmail({ to: assignee.email, subject, html }).catch((err) =>
    console.error(`[task-email] assignment email failed for ${assignee.email}:`, err?.message || err),
  );
}

async function sendOverdueEmail(recipient: { id: string; name: string | null; email: string }, task: any, scopeLabel?: string) {
  if (!recipient.email) return;

  const { subject, html } = buildTaskOverdueEmail({
    recipientName: recipient.name || recipient.email,
    taskTitle: task.title,
    projectName: task.project.name,
    taskUrl: `${APP_URL}/projects/${task.projectId}/tasks/${task.id}`,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    description: task.description,
    scopeLabel,
  });

  sendEmail({ to: recipient.email, subject, html }).catch(() => {});
}

async function getProjectScope(projectId: string): Promise<{ orgId: string; spaceId: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { spaceId: true, space: { select: { organizationId: true } } },
  });
  if (!project) throw new Error('Project not found');
  return { orgId: project.space.organizationId, spaceId: project.spaceId };
}

function getOrgIdFromTask(task: { project: { space: { organizationId: string } } }): string {
  return task.project.space.organizationId;
}

function getSpaceIdFromTask(task: { project: { spaceId: string } }): string {
  return task.project.spaceId;
}

async function getSpaceMemberIds(spaceId: string) {
  const members = await prisma.spaceMember.findMany({
    where: { spaceId },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

async function emailSpaceAssignmentFanout(spaceId: string, task: any, assignerName: string, excludeUserId: string) {
  const members = await prisma.spaceMember.findMany({
    where: { spaceId, userId: { not: excludeUserId } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  for (const m of members) {
    if (!m.user.email) continue;
    sendAssignmentEmail(m.user.id, task, assignerName).catch((err) =>
      console.error(`[task-email] space-assignment email failed for ${m.user.email}:`, err?.message || err),
    );
  }
}

export async function createTask(userId: string, dto: CreateTaskDTO) {
  const { orgId, spaceId } = await getProjectScope(dto.projectId);
  await requireNonGuest(userId, orgId);
  await requireSpaceAccess(userId, spaceId);

  const task = await taskModel.createTask({
    title: dto.title,
    description: dto.description,
    status: dto.status as TaskStatus,
    priority: dto.priority as TaskPriority,
    assignToSpace: dto.assignToSpace,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    projectId: dto.projectId,
    createdById: userId,
    issueTypeId: dto.issueTypeId,
  });

  if (dto.assignToSpace) {
    const assigner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const assignerName = assigner?.name || assigner?.email || 'Someone';
    const spaceMemberIds = (await getSpaceMemberIds(spaceId)).filter((id) => id !== userId);

    if (spaceMemberIds.length > 0) {
      notifyTaskAssignedToMany({
        assigneeIds: spaceMemberIds,
        taskTitle: task.title,
        projectName: task.project.name,
        assignedByName: assignerName,
        taskLink: `/projects/${task.projectId}/tasks/${task.id}`,
        spaceName: task.project.space.name,
      }).catch(() => {});
      emailSpaceAssignmentFanout(spaceId, task, assignerName, userId);
    }

    logAudit({
      userId,
      organizationId: orgId,
      description: `assigned task "${task.title}" to the whole ${task.project.space.name} space`,
      taskId: task.id,
    });
    publishEvent(`events:project:${dto.projectId}`, { type: 'TASK_CREATED', tags: ['Tasks'], ids: [`project-${dto.projectId}`] }).catch(() => {});
    return task;
  }

  // Assign users if provided
  if (dto.assigneeIds && dto.assigneeIds.length > 0) {
    const assigner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const assignerName = assigner?.name || assigner?.email || 'Someone';

    for (const assigneeId of dto.assigneeIds) {
      try {
        await requireSpaceAccess(assigneeId, spaceId);
        await taskModel.assignUser(task.id, assigneeId);

        if (assigneeId !== userId) {
          notifyTaskAssigned({
            assigneeId,
            taskTitle: task.title,
            projectName: task.project.name,
            assignedByName: assignerName,
            taskLink: `/projects/${task.projectId}/tasks/${task.id}`,
          }).catch(() => {});
          sendAssignmentEmail(assigneeId, task, assignerName).catch(() => {});
        }
      } catch {
        // Skip users who aren't members of this space
      }
    }

    // Re-fetch task with assignments
    const updated = await taskModel.findTaskById(task.id);
    logAudit({ userId, organizationId: orgId, description: `created task "${task.title}"`, taskId: task.id });
    publishEvent(`events:project:${dto.projectId}`, { type: 'TASK_CREATED', tags: ['Tasks'], ids: [`project-${dto.projectId}`] }).catch(() => {});
    if (updated) return updated;
  }

  logAudit({ userId, organizationId: orgId, description: `created task "${task.title}"`, taskId: task.id });
  publishEvent(`events:project:${dto.projectId}`, { type: 'TASK_CREATED', tags: ['Tasks'], ids: [`project-${dto.projectId}`] }).catch(() => {});
  return task;
}

export async function getTask(taskId: string, userId: string) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');

  await requireSpaceAccess(userId, getSpaceIdFromTask(task));
  return task;
}

export async function getProjectTasks(projectId: string, userId: string) {
  const { spaceId } = await getProjectScope(projectId);
  await requireSpaceAccess(userId, spaceId);
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
  await requireSpaceAccess(userId, getSpaceIdFromTask(task));

  if (task.createdById !== userId) {
    await requireOrgAdmin(userId, orgId);
  }

  logAudit({ userId, organizationId: orgId, description: `deleted task "${task.title}"` });
  publishEvent(`events:project:${task.projectId}`, { type: 'TASK_DELETED', tags: ['Tasks'], ids: [taskId, `project-${task.projectId}`] }).catch(() => {});
  return taskModel.deleteTask(taskId);
}

export async function toggleAssignment(taskId: string, userId: string, dto: AssignTaskDTO) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');
  const targetUserId = dto.userId;
  if (!targetUserId) throw new Error('User ID is required');

  if (task.assignToSpace) {
    throw new Error('Task is assigned to the whole space');
  }

  const orgId = getOrgIdFromTask(task);
  const spaceId = getSpaceIdFromTask(task);
  await requireSpaceAccess(userId, spaceId);
  await requireSpaceAccess(targetUserId, spaceId);

  const isCreator = task.createdById === userId;

  const existing = await taskModel.findAssignment(taskId, targetUserId);
  if (existing) {
    // Allow members to unassign themselves; admins and the task creator can unassign others
    if (targetUserId !== userId && !isCreator) {
      await requireOrgAdmin(userId, orgId);
    } else {
      await requireNonGuest(userId, orgId);
    }
    await taskModel.unassignUser(taskId, targetUserId);
    logAudit({ userId, organizationId: orgId, description: `unassigned a member from "${task.title}"`, taskId });
    publishEvent(`events:project:${task.projectId}`, { type: 'TASK_UPDATED', tags: ['Tasks'], ids: [taskId, `project-${task.projectId}`] }).catch(() => {});
    return { assigned: false, userId: targetUserId };
  }

  // Assigning is allowed for admins and the task creator
  if (!isCreator) {
    await requireOrgAdmin(userId, orgId);
  } else {
    await requireNonGuest(userId, orgId);
  }

  const assignment = await taskModel.assignUser(taskId, targetUserId);

  // Send notification to the assigned user (not to yourself)
  if (targetUserId !== userId) {
    const assigner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const assignerName = assigner?.name || assigner?.email || 'Someone';

    notifyTaskAssigned({
      assigneeId: targetUserId,
      taskTitle: task.title,
      projectName: task.project.name,
      assignedByName: assignerName,
      taskLink: `/projects/${task.projectId}/tasks/${taskId}`,
    }).catch(() => {}); // fire-and-forget
    sendAssignmentEmail(targetUserId, task, assignerName).catch(() => {});
  }

  logAudit({ userId, organizationId: orgId, description: `assigned a member to "${task.title}"`, taskId });
  publishEvent(`events:project:${task.projectId}`, { type: 'TASK_UPDATED', tags: ['Tasks'], ids: [taskId, `project-${task.projectId}`] }).catch(() => {});
  return { assigned: true, userId: targetUserId, user: assignment.user };
}

export async function assignUsers(taskId: string, userId: string, userIds: string[]) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');

  if (task.assignToSpace) {
    throw new Error('Task is assigned to the whole space');
  }

  const orgId = getOrgIdFromTask(task);
  const spaceId = getSpaceIdFromTask(task);
  await requireSpaceAccess(userId, spaceId);
  if (task.createdById !== userId) {
    await requireOrgAdmin(userId, orgId);
  } else {
    await requireNonGuest(userId, orgId);
  }

  const requestedIds = [...new Set(userIds)];
  if (requestedIds.length === 0) {
    return { assigned: false, userIds: [], users: [] };
  }

  const [accessChecks, existingAssignments] = await Promise.all([
    Promise.all(
      requestedIds.map(async (id) => {
        try {
          await requireSpaceAccess(id, spaceId);
          return id;
        } catch {
          return null;
        }
      }),
    ),
    prisma.taskAssignment.findMany({
      where: { taskId, userId: { in: requestedIds } },
      select: { userId: true },
    }),
  ]);

  const allowedIds = new Set(accessChecks.filter((id): id is string => id !== null));
  const existingIds = new Set(existingAssignments.map((assignment) => assignment.userId));
  const assignableIds = requestedIds.filter((id) => allowedIds.has(id) && !existingIds.has(id));

  if (assignableIds.length === 0) {
    return { assigned: false, userIds: [], users: [] };
  }

  await prisma.taskAssignment.createMany({
    data: assignableIds.map((assigneeId) => ({ taskId, userId: assigneeId })),
    skipDuplicates: true,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: assignableIds } },
    select: { id: true, name: true, email: true },
  });

  const notifyIds = assignableIds.filter((assigneeId) => assigneeId !== userId);
  if (notifyIds.length > 0) {
    const assigner = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const assignerName = assigner?.name || assigner?.email || 'Someone';

    notifyTaskAssignedToMany({
      assigneeIds: notifyIds,
      taskTitle: task.title,
      projectName: task.project.name,
      assignedByName: assignerName,
      taskLink: `/projects/${task.projectId}/tasks/${taskId}`,
      spaceName: task.project.space.name,
    }).catch(() => {});

    for (const assigneeId of notifyIds) {
      sendAssignmentEmail(assigneeId, task, assignerName).catch(() => {});
    }
  }

  logAudit({
    userId,
    organizationId: orgId,
    description: `assigned ${assignableIds.length} member${assignableIds.length === 1 ? '' : 's'} to "${task.title}"`,
    taskId,
  });
  publishEvent(`events:project:${task.projectId}`, {
    type: 'TASK_UPDATED',
    tags: ['Tasks'],
    ids: [taskId, `project-${task.projectId}`],
  }).catch(() => {});

  return { assigned: true, userIds: assignableIds, users };
}

export async function updateTask(taskId: string, userId: string, dto: UpdateTaskDTO) {
  const task = await taskModel.findTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const orgId = getOrgIdFromTask(task);
  const spaceId = getSpaceIdFromTask(task);
  await requireNonGuest(userId, orgId);
  await requireSpaceAccess(userId, spaceId);

  // Only admins can reject tasks
  if (dto.status === 'REJECTED') {
    await requireOrgAdmin(userId, orgId);
  }

  const updateData: any = {
    title: dto.title,
    description: dto.description,
    status: dto.status as TaskStatus | undefined,
    priority: dto.priority as TaskPriority | undefined,
    assignToSpace: dto.assignToSpace,
    dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined,
    issueTypeId: dto.issueTypeId !== undefined ? (dto.issueTypeId || null) : undefined,
  };

  // Set or clear rejection reason
  if (dto.status === 'REJECTED' && dto.rejectionReason) {
    updateData.rejectionReason = dto.rejectionReason;
  } else if (dto.status && dto.status !== 'REJECTED') {
    updateData.rejectionReason = null; // Clear rejection when status changes away
  }

  if (dto.assignToSpace === true) {
    await taskModel.clearAssignments(taskId);
  }

  const updated = await taskModel.updateTask(taskId, updateData);

  // Audit log
  let auditDesc = `updated task "${task.title}"`;
  if (dto.status) auditDesc = `changed status of "${task.title}" to ${dto.status}`;
  else if (dto.priority) auditDesc = `changed priority of "${task.title}" to ${dto.priority}`;
  else if (dto.assignToSpace === true) auditDesc = `assigned "${task.title}" to the whole ${task.project.space.name} space`;
  else if (dto.assignToSpace === false && task.assignToSpace) auditDesc = `removed whole-space assignment from "${task.title}"`;
  logAudit({ userId, organizationId: orgId, description: auditDesc, taskId });

  // Notify assigned users + task creator about the update
  const notifyIds = [
    ...task.assignments.map((a) => a.user.id),
    task.createdById,
  ].filter((id, i, arr) => id !== userId && arr.indexOf(id) === i); // dedupe, exclude self

  if (dto.assignToSpace === true) {
    const updater = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const updaterName = updater?.name || updater?.email || 'Someone';
    const spaceMemberIds = (await getSpaceMemberIds(spaceId)).filter((id) => id !== userId);

    if (spaceMemberIds.length > 0) {
      notifyTaskAssignedToMany({
        assigneeIds: spaceMemberIds,
        taskTitle: task.title,
        projectName: task.project.name,
        assignedByName: updaterName,
        taskLink: `/projects/${task.projectId}/tasks/${taskId}`,
        spaceName: task.project.space.name,
      }).catch(() => {});
      emailSpaceAssignmentFanout(spaceId, task, updaterName, userId);
    }
  } else if (notifyIds.length > 0) {
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

  publishEvent(`events:project:${task.projectId}`, {
    type: 'TASK_UPDATED',
    tags: ['Tasks'],
    ids: [taskId, `project-${task.projectId}`],
    projectId: task.projectId,
  }).catch(() => {});

  return updated;
}

export async function sendOverdueReminders() {
  const overdueTasks = await taskModel.findOverdueTasks();
  let remindersSent = 0;

  for (const task of overdueTasks) {
    const recipients = task.assignToSpace
      ? task.project.space.members.map((member) => member.user)
      : task.assignments.map((assignment) => assignment.user);

    const dedupedRecipients = recipients.filter(
      (recipient, index, list) => recipient.email && list.findIndex((item) => item.id === recipient.id) === index
    );

    if (dedupedRecipients.length === 0) {
      continue;
    }

    const scopeLabel = task.assignToSpace ? `${task.project.space.name} space` : null;

    await notifyTaskOverdue({
      userIds: dedupedRecipients.map((recipient) => recipient.id),
      taskTitle: task.title,
      projectName: task.project.name,
      taskLink: `/projects/${task.projectId}/tasks/${task.id}`,
      scopeLabel: scopeLabel ?? undefined,
    }).catch(() => {});

    for (const recipient of dedupedRecipients) {
      await sendOverdueEmail(recipient, task, scopeLabel ?? undefined);
      remindersSent += 1;
    }

    await taskModel.markOverdueReminderSent(task.id);
  }

  return {
    tasksChecked: overdueTasks.length,
    remindersSent,
  };
}
