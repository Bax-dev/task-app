'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface Project {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  organization?: { id: string; name: string; slug: string };
  _count?: { tasks: number };
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects'),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useOrgProjects(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId, 'projects'],
    queryFn: () => api.get<Project[]>(`/api/organizations/${orgId}/projects`),
    enabled: !!orgId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; organizationId: string }) =>
      api.post<Project>('/api/projects', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', variables.organizationId, 'projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string | null }) =>
      api.patch<Project>(`/api/projects/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
