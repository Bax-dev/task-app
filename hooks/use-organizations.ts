'use client';

import {
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useGetOrgMembersQuery,
  useCreateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '@/store/api';

export function useOrganizations() {
  return useGetOrganizationsQuery();
}

export function useOrganization(id: string) {
  return useGetOrganizationQuery(id, { skip: !id });
}

export function useOrgMembers(orgId: string) {
  return useGetOrgMembersQuery(orgId, { skip: !orgId });
}

export function useCreateOrganization() {
  const [trigger, state] = useCreateOrganizationMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useDeleteOrganization() {
  const [trigger, state] = useDeleteOrganizationMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
