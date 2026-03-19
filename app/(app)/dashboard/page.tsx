'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Users, Zap, Loader2 } from 'lucide-react';
import { useGetOrganizationsQuery, useGetUserTasksQuery, useGetProjectsQuery } from '@/store/api';

export default function DashboardPage() {
  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();

  const { data: tasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();

  const { data: projects = [], error: projectsError } = useGetProjectsQuery();

  if (orgsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Here&apos;s what&apos;s happening with your projects
          </p>
        </div>
        <Link href="/organizations/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            New Organization
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Organizations</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{organizations.length}</p>
            </div>
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary/20" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Projects</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                {projectsError ? <span className="text-destructive text-sm">Error loading</span> : projects.length}
              </p>
            </div>
            <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-accent/20" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">My Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{tasks.length}</p>
            </div>
            <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Organizations */}
      {organizations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Organizations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org: any) => (
              <Link key={org.id} href={`/organizations/${org.id}`} className="group">
                <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {org._count?.spaces || 0} spaces &middot; {org._count?.memberships || 0} members
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {recentTasks.length > 0 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Recent Tasks</h2>
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Task</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Priority</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task: any) => (
                  <tr key={task.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      <Link href={`/projects/${task.projectId}/tasks/${task.id}`} className="hover:text-primary">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {task.project?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'URGENT' ? 'bg-red-500/10 text-red-600' :
                        task.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600' :
                        task.priority === 'LOW' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No organizations yet</h3>
          <p className="text-muted-foreground mb-4">Create your first organization to get started</p>
          <Link href="/organizations/new">
            <Button>Create Organization</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
