'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface Invitation {
  id: string;
  email: string;
  token: string;
  organizationId: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  organization?: { id: string; name: string; slug: string };
}

export function useOrgInvitations(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId, 'invitations'],
    queryFn: () => api.get<Invitation[]>(`/api/organizations/${orgId}/invitations`),
    enabled: !!orgId,
  });
}

export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: ['invitations', token],
    queryFn: () => api.get<Invitation>(`/api/invitations/${token}`),
    enabled: !!token,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; organizationId: string; role?: string }) =>
      api.post<Invitation>('/api/invitations', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organizations', variables.organizationId, 'invitations'],
      });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      api.post('/api/invitations/accept', { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
