'use client';

import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '@/store/api';

export function useNotifications() {
  // SSE handles realtime push; polling is a fallback safety net
  return useGetNotificationsQuery(undefined, { pollingInterval: 60000 });
}

export function useUnreadCount() {
  // SSE handles realtime push; polling is a fallback safety net
  return useGetUnreadCountQuery(undefined, { pollingInterval: 60000 });
}

export function useMarkAsRead() {
  const [trigger, state] = useMarkAsReadMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useMarkAllAsRead() {
  const [trigger, state] = useMarkAllAsReadMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
