'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  assignments?: { user: { id: string; name: string | null; email: string } }[];
  project?: { id: string; name: string; organizationId: string };
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => api.get<Task[]>(`/api/projects/${projectId}/tasks`),
    enabled: !!projectId,
  });
}

export function useUserTasks() {
  return useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => api.get<Task[]>('/api/tasks'),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get<Task>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      projectId: string;
    }) => api.post<Task>('/api/tasks', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      dueDate?: string | null;
    }) => api.patch<Task>(`/api/tasks/${id}`, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', result.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', result.projectId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useToggleAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      api.post(`/api/tasks/${taskId}/assign`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
