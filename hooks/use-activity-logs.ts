'use client';

import {
  useGetUserActivityLogsQuery,
  useGetOrgActivityLogsQuery,
  useCreateActivityLogMutation,
  useUpdateActivityLogMutation,
  useDeleteActivityLogMutation,
} from '@/store/api';

export function useUserActivityLogs() {
  return useGetUserActivityLogsQuery();
}

export function useOrgActivityLogs(orgId: string) {
  return useGetOrgActivityLogsQuery(orgId, { skip: !orgId });
}

export function useCreateActivityLog() {
  const [trigger, state] = useCreateActivityLogMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useUpdateActivityLog() {
  const [trigger, state] = useUpdateActivityLogMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useDeleteActivityLog() {
  const [trigger, state] = useDeleteActivityLogMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
