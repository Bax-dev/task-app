'use client';

import { useMemo } from 'react';
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useGetUserTasksQuery, useGetProjectsQuery, useGetOrganizationsQuery } from '@/store/api';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  DONE: '#22c55e',
  REJECTED: '#ef4444',
  CANCELLED: '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#3b82f6',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

export default function ReportsPage() {
  const { data: tasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();
  const { data: projects = [], isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: organizations = [] } = useGetOrganizationsQuery();

  const isLoading = tasksLoading || projectsLoading;

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t: any) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const overdue = tasks.filter((t: any) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== 'DONE' && t.status !== 'CANCELLED';
    }).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, inProgress, overdue, completionRate };
  }, [tasks]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t: any) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      color: STATUS_COLORS[name] || '#94a3b8',
    }));
  }, [tasks]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t: any) => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: PRIORITY_COLORS[name] || '#94a3b8',
    }));
  }, [tasks]);

  const projectTaskData = useMemo(() => {
    const projectMap: Record<string, { name: string; total: number; done: number }> = {};
    tasks.forEach((t: any) => {
      const projName = t.project?.name || 'Unassigned';
      if (!projectMap[projName]) projectMap[projName] = { name: projName, total: 0, done: 0 };
      projectMap[projName].total++;
      if (t.status === 'DONE') projectMap[projName].done++;
    });
    return Object.values(projectMap).sort((a, b) => b.total - a.total).slice(0, 8);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">Overview of your productivity and task progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium">Total Tasks</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.done}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stats.completionRate}% rate</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.overdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tasks by Status */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            Tasks by Status
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No task data</p>
          )}
        </div>

        {/* Tasks by Priority */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            Tasks by Priority
          </h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No task data</p>
          )}
        </div>
      </div>

      {/* Tasks by Project */}
      {projectTaskData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            Tasks by Project
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectTaskData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="done" name="Completed" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary">{organizations.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Organizations</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary">{projects.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Projects</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-primary">{stats.completionRate}%</p>
          <p className="text-sm text-muted-foreground mt-1">Completion Rate</p>
        </div>
      </div>
    </div>
  );
}
