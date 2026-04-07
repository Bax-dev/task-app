'use client';

import {
  useGetOrgSpacesQuery,
  useGetSpaceQuery,
  useCreateSpaceMutation,
  useUpdateSpaceMutation,
  useDeleteSpaceMutation,
} from '@/store/api';

export function useOrgSpaces(orgId: string) {
  return useGetOrgSpacesQuery(orgId, { skip: !orgId });
}

export function useSpace(id: string) {
  return useGetSpaceQuery(id, { skip: !id });
}

export function useCreateSpace() {
  const [trigger, state] = useCreateSpaceMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useUpdateSpace() {
  const [trigger, state] = useUpdateSpaceMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useDeleteSpace() {
  const [trigger, state] = useDeleteSpaceMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
