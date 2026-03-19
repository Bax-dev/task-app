'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import TaskBoard from '@/components/tasks/TaskBoard';
import { useAuth } from '@/hooks/use-auth';

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get<any>(`/api/projects/${id}`),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['projects', id, 'tasks'],
    queryFn: () => api.get<any[]>(`/api/projects/${id}/tasks`),
  });

  const orgId = project?.space?.organizationId;
  const { data: members = [] } = useQuery({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: () => api.get<any[]>(`/api/organizations/${orgId}/members`),
    enabled: !!orgId,
  });
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
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/spaces/${project.spaceId || project.space?.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Space
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
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
