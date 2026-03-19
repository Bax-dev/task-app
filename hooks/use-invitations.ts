'use client';

import {
  useGetOrgInvitationsQuery,
  useGetInvitationByTokenQuery,
  useCreateInvitationMutation,
  useAcceptInvitationMutation,
} from '@/store/api';

export function useOrgInvitations(orgId: string) {
  return useGetOrgInvitationsQuery(orgId, { skip: !orgId });
}

export function useInvitationByToken(token: string) {
  return useGetInvitationByTokenQuery(token, { skip: !token });
}

export function useCreateInvitation() {
  const [trigger, state] = useCreateInvitationMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useAcceptInvitation() {
  const [trigger, state] = useAcceptInvitationMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
