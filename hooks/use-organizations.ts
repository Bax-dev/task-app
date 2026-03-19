'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdById: string;
  createdAt: string;
  _count?: { projects: number; memberships: number };
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<Organization[]>('/api/organizations'),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => api.get<Organization>(`/api/organizations/${id}`),
    enabled: !!id,
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: () => api.get<Member[]>(`/api/organizations/${orgId}/members`),
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.post<Organization>('/api/organizations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
