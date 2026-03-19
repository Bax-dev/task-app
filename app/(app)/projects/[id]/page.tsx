'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { useGetProjectQuery, useGetProjectTasksQuery, useGetOrgMembersQuery } from '@/store/api';
import TaskBoard from '@/components/tasks/TaskBoard';
import { useAuth } from '@/hooks/use-auth';

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();

  const { data: project, isLoading: projectLoading } = useGetProjectQuery(id);

  const { data: tasks = [], isLoading: tasksLoading } = useGetProjectTasksQuery(id);

  const orgId = project?.space?.organizationId;
  const { data: members = [] } = useGetOrgMembersQuery(orgId!, { skip: !orgId });
  const isGuest = members.find((m: any) => m.id === currentUser?.id)?.role === 'GUEST';

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  const tasksByStatus = {
    TODO: tasks.filter((t: any) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t: any) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t: any) => t.status === 'DONE'),
    CANCELLED: tasks.filter((t: any) => t.status === 'CANCELLED'),
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <Link
          href={`/spaces/${project.spaceId || project.space?.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Space
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          {!isGuest && (
            <Link href={`/projects/${id}/tasks/new`}>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </Link>
          )}
        </div>
      </div>

      <TaskBoard projectId={id} tasksByStatus={tasksByStatus} />
    </div>
  );
}
