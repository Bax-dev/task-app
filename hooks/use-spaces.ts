'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface Space {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  organizationId: string;
  createdAt: string;
  _count?: { projects: number };
  projects?: any[];
}

export function useOrgSpaces(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId, 'spaces'],
    queryFn: () => api.get<Space[]>(`/api/organizations/${orgId}/spaces`),
    enabled: !!orgId,
  });
}

export function useSpace(id: string) {
  return useQuery({
    queryKey: ['spaces', id],
    queryFn: () => api.get<Space>(`/api/spaces/${id}`),
    enabled: !!id,
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string; icon?: string; organizationId: string }) =>
      api.post<Space>('/api/spaces', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', variables.organizationId, 'spaces'] });
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/spaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}
