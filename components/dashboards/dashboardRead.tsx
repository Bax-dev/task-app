'use client';

import { useState, useMemo } from 'react';
import {
  LayoutDashboard, Loader2, Trash2, Search, Pencil,
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, BarChart3, User, FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetUserTasksQuery, useGetProjectsQuery } from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import type { Task } from '@/types/task';

// ─── Helpers ───

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-indigo-500',
  IN_PROGRESS: 'bg-amber-500',
  IN_REVIEW: 'bg-purple-500',
  DONE: 'bg-green-500',
  CANCELLED: 'bg-gray-400',
  REJECTED: 'bg-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-gray-400';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white ${color}`}>
      {label}
    </span>
  );
}

// ─── Dashboard Widgets View ───

function DashboardWidgets() {
  const { user: currentUser } = useAuth();
  const { data: tasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();

  const stats = useMemo(() => {
    const total = tasks.length;

    // Status counts
    const statusCounts: Record<string, number> = {};
    tasks.forEach((t: Task) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    const todoCount = statusCounts['TODO'] || 0;
    const inProgressCount = (statusCounts['IN_PROGRESS'] || 0) + (statusCounts['IN_REVIEW'] || 0);
    const doneCount = statusCounts['DONE'] || 0;

    const todoPercent = total ? (todoCount / total) * 100 : 0;
    const inProgressPercent = total ? (inProgressCount / total) * 100 : 0;
    const donePercent = total ? (doneCount / total) * 100 : 0;

    // Priority counts
    const priorityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    tasks.forEach((t: Task) => {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
    });
    const maxPriority = Math.max(...Object.values(priorityCounts), 1);

    // Completion rate
    const completionRate = total ? Math.round((doneCount / total) * 100) : 0;

    // Recent tasks (last 5 by createdAt)
    const recentTasks = [...tasks]
      .sort((a: Task, b: Task) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // My tasks
    const myTasks = tasks.filter((t: Task) =>
      t.assignments?.some((a) => a.user.id === currentUser?.id)
    );

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter((t: Task) => {
      if (!t.dueDate) return false;
      if (t.status === 'DONE' || t.status === 'CANCELLED') return false;
      return new Date(t.dueDate) < now;
    });

    // Tasks by project
    const tasksByProject: Record<string, { name: string; count: number }> = {};
    tasks.forEach((t: Task) => {
      const projId = t.projectId;
      const projName = t.project?.name || 'Unknown';
      if (!tasksByProject[projId]) {
        tasksByProject[projId] = { name: projName, count: 0 };
      }
      tasksByProject[projId].count++;
    });
    const projectList = Object.values(tasksByProject).sort((a, b) => b.count - a.count);
    const maxProjectCount = Math.max(...projectList.map((p) => p.count), 1);

    return {
      total, statusCounts, todoCount, inProgressCount, doneCount,
      todoPercent, inProgressPercent, donePercent,
      priorityCounts, maxPriority,
      completionRate,
      recentTasks,
      myTasks,
      overdueTasks,
      projectList, maxProjectCount,
    };
  }, [tasks, currentUser?.id]);

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Task Overview */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Task Overview</h3>
        </div>
        <p className="text-3xl font-bold text-foreground mb-4">{stats.total}</p>
        <p className="text-xs text-muted-foreground mb-3">Total Tasks</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
          <div className="bg-indigo-500" style={{ width: `${stats.todoPercent}%` }} />
          <div className="bg-amber-500" style={{ width: `${stats.inProgressPercent}%` }} />
          <div className="bg-green-500" style={{ width: `${stats.donePercent}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> To Do ({stats.todoCount})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress ({stats.inProgressCount})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Done ({stats.doneCount})</span>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Priority Distribution</h3>
        </div>
        <div className="space-y-3">
          {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((priority) => (
            <div key={priority}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground capitalize">{priority.toLowerCase()}</span>
                <span className="font-medium text-foreground">{stats.priorityCounts[priority]}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${PRIORITY_COLORS[priority]}`}
                  style={{ width: `${(stats.priorityCounts[priority] / stats.maxPriority) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-6 self-start">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Completion Rate</h3>
        </div>
        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{stats.completionRate}%</p>
          <p className="text-sm text-muted-foreground mt-1">Completion Rate</p>
        </div>
        <div className="w-full mt-6 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${stats.completionRate}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{stats.doneCount} of {stats.total} tasks completed</p>
      </div>

      {/* Recent Tasks */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Recent Tasks</h3>
        </div>
        {stats.recentTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        ) : (
          <div className="space-y-2">
            {stats.recentTasks.map((task: Task) => (
              <div key={task.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                <p className="text-sm text-foreground truncate flex-1 min-w-0">{task.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={task.status} />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(task.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Tasks */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">My Tasks</h3>
          <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{stats.myTasks.length}</span>
        </div>
        {stats.myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks assigned to you</p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {stats.myTasks.slice(0, 8).map((task: Task) => (
              <div key={task.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                <p className="text-sm text-foreground truncate flex-1 min-w-0">{task.title}</p>
                <StatusBadge status={task.status} />
              </div>
            ))}
            {stats.myTasks.length > 8 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{stats.myTasks.length - 8} more</p>
            )}
          </div>
        )}
      </div>

      {/* Overdue Tasks */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-sm text-foreground">Overdue Tasks</h3>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
          <p className="text-2xl font-bold text-red-600">{stats.overdueTasks.length}</p>
          <p className="text-xs text-red-600/70">Overdue Tasks</p>
        </div>
        {stats.overdueTasks.length > 0 ? (
          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {stats.overdueTasks.slice(0, 5).map((task: Task) => (
              <div key={task.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                <p className="text-red-600 truncate flex-1 min-w-0">{task.title}</p>
                <span className="text-[10px] text-red-600/70 whitespace-nowrap shrink-0">
                  Due {new Date(task.dueDate!).toLocaleDateString()}
                </span>
              </div>
            ))}
            {stats.overdueTasks.length > 5 && (
              <p className="text-xs text-red-600/60 text-center pt-1">+{stats.overdueTasks.length - 5} more</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No overdue tasks</p>
        )}
      </div>

      {/* Tasks by Project */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 md:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2 mb-4">
          <FolderKanban className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Tasks by Project</h3>
        </div>
        {stats.projectList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet</p>
        ) : (
          <div className="space-y-3 max-h-[240px] overflow-y-auto">
            {stats.projectList.map((proj) => (
              <div key={proj.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground truncate mr-2">{proj.name}</span>
                  <span className="font-medium text-muted-foreground shrink-0">{proj.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${(proj.count / stats.maxProjectCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───

interface DashboardReadProps {
  dashboards: any[];
  isLoading: boolean;
  selectedDashboardId: string | null;
  onSelectDashboard: (id: string | null) => void;
  onEditDashboard: (dashboard: any) => void;
  onDeleteDashboard: (dashboard: any) => void;
  isGuest: boolean;
}

export default function DashboardRead({
  dashboards,
  isLoading,
  selectedDashboardId,
  onSelectDashboard,
  onEditDashboard,
  onDeleteDashboard,
  isGuest,
}: DashboardReadProps) {
  const [search, setSearch] = useState('');

  const activeDashboard = useMemo(
    () => dashboards.find((d: any) => d.id === selectedDashboardId),
    [dashboards, selectedDashboardId]
  );

  // ─── Dashboard View (widgets) ───
  if (activeDashboard) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSelectDashboard(null)}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{activeDashboard.name}</h1>
              <p className="text-muted-foreground text-sm">
                Created by {activeDashboard.createdBy?.name || activeDashboard.createdBy?.email} &middot; Updated {new Date(activeDashboard.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {!isGuest && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEditDashboard(activeDashboard)}>
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700" onClick={() => onDeleteDashboard(activeDashboard)}>
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <DashboardWidgets />
      </div>
    );
  }

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Dashboard List View ───
  const filtered = dashboards.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  if (filtered.length > 0) {
    return (
      <>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search dashboards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dashboard: any) => (
            <div key={dashboard.id} className="relative group">
              <div
                className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors h-full cursor-pointer"
                onClick={() => onSelectDashboard(dashboard.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <LayoutDashboard className="w-5 h-5 text-primary mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {dashboard.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {dashboard.createdBy?.name || dashboard.createdBy?.email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                </p>
              </div>
              {!isGuest && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); onEditDashboard(dashboard); }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); onDeleteDashboard(dashboard); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (dashboards.length > 0) {
    return (
      <>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search dashboards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-sm"
          />
        </div>
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No dashboards match &quot;{search}&quot;</p>
        </div>
      </>
    );
  }

  return (
    <div className="text-center py-12">
      <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-bold text-foreground mb-2">No dashboards yet</h3>
      <p className="text-muted-foreground mb-4">Create your first dashboard to get started</p>
    </div>
  );
}
