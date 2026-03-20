'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Star,
  FolderOpen,
  CheckSquare,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGetUserTasksQuery, useGetProjectsQuery } from '@/store/api';

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500/10 text-red-600',
  HIGH: 'bg-orange-500/10 text-orange-600',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  LOW: 'bg-muted text-muted-foreground',
};

const statusIcons: Record<string, string> = {
  TODO: 'bg-slate-500',
  IN_PROGRESS: 'bg-amber-500',
  DONE: 'bg-green-500',
  REJECTED: 'bg-red-500',
  CANCELLED: 'bg-gray-400',
};

export default function FavoritesPage() {
  const { data: tasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();

  const isLoading = tasksLoading || projectsLoading;

  // Quick access: urgent & high priority tasks that are not done
  const urgentTasks = useMemo(() => {
    return tasks
      .filter((t: any) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'DONE' && t.status !== 'CANCELLED')
      .sort((a: any, b: any) => {
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
      })
      .slice(0, 10);
  }, [tasks]);

  // Tasks due soon (next 3 days)
  const dueSoonTasks = useMemo(() => {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return tasks
      .filter((t: any) => {
        if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false;
        const due = new Date(t.dueDate);
        return due >= now && due <= threeDays;
      })
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks]);

  // Recently active projects (projects that have tasks)
  const activeProjects = useMemo(() => {
    const projectTaskCounts: Record<string, { total: number; active: number }> = {};
    tasks.forEach((t: any) => {
      if (!t.projectId) return;
      if (!projectTaskCounts[t.projectId]) projectTaskCounts[t.projectId] = { total: 0, active: 0 };
      projectTaskCounts[t.projectId].total++;
      if (t.status === 'IN_PROGRESS') projectTaskCounts[t.projectId].active++;
    });

    return projects
      .filter((p: any) => projectTaskCounts[p.id]?.active > 0)
      .map((p: any) => ({
        ...p,
        taskCount: projectTaskCounts[p.id]?.total || 0,
        activeCount: projectTaskCounts[p.id]?.active || 0,
      }))
      .sort((a: any, b: any) => b.activeCount - a.activeCount)
      .slice(0, 6);
  }, [projects, tasks]);

  // My in-progress tasks
  const myInProgress = useMemo(() => {
    return tasks.filter((t: any) => t.status === 'IN_PROGRESS').slice(0, 8);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quick Access</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your most important items at a glance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent & High Priority */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            Priority Tasks
          </h3>
          {urgentTasks.length > 0 ? (
            <div className="space-y-2">
              {urgentTasks.map((task: any) => (
                <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/50 transition-colors group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusIcons[task.status] || 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{task.project?.name || 'No project'}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${priorityColors[task.priority] || ''}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No priority tasks</p>
          )}
        </div>

        {/* Due Soon */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Due Within 3 Days
          </h3>
          {dueSoonTasks.length > 0 ? (
            <div className="space-y-2">
              {dueSoonTasks.map((task: any) => (
                <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/50 transition-colors group">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${priorityColors[task.priority] || ''}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nothing due soon</p>
          )}
        </div>

        {/* In Progress */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-primary" />
            In Progress
          </h3>
          {myInProgress.length > 0 ? (
            <div className="space-y-2">
              {myInProgress.map((task: any) => (
                <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/50 transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{task.project?.name || 'No project'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks in progress</p>
          )}
        </div>

        {/* Active Projects */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <FolderOpen className="w-4 h-4 text-primary" />
            Active Projects
          </h3>
          {activeProjects.length > 0 ? (
            <div className="space-y-2">
              {activeProjects.map((project: any) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/50 transition-colors group">
                    <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.activeCount} active &middot; {project.taskCount} total tasks
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No active projects</p>
          )}
        </div>
      </div>
    </div>
  );
}
