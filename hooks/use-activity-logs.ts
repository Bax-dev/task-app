'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface ActivityLog {
  id: string;
  description: string;
  status: string;
  note: string | null;
  taskId: string | null;
  organizationId: string;
  createdById: string;
  loggedAt: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  task?: { id: string; title: string; projectId: string } | null;
  organization?: { id: string; name: string };
}

export function useUserActivityLogs() {
  return useQuery({
    queryKey: ['activity-logs', 'mine'],
    queryFn: () => api.get<ActivityLog[]>('/api/activity-logs'),
  });
}

export function useOrgActivityLogs(orgId: string) {
  return useQuery({
    queryKey: ['activity-logs', 'org', orgId],
    queryFn: () => api.get<ActivityLog[]>(`/api/organizations/${orgId}/activity-logs`),
    enabled: !!orgId,
  });
}

export function useCreateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      description: string;
      status?: string;
      note?: string | null;
      taskId?: string | null;
      organizationId: string;
    }) => api.post<ActivityLog>('/api/activity-logs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

export function useUpdateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      description?: string;
      status?: string;
      note?: string | null;
      taskId?: string | null;
    }) => api.patch<ActivityLog>(`/api/activity-logs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

export function useDeleteActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/activity-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
