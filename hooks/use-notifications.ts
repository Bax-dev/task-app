'use client';

import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '@/store/api';

export function useNotifications() {
  return useGetNotificationsQuery(undefined, { pollingInterval: 30000 });
}

export function useUnreadCount() {
  return useGetUnreadCountQuery(undefined, { pollingInterval: 15000 });
}

export function useMarkAsRead() {
  const [trigger, state] = useMarkAsReadMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}

export function useMarkAllAsRead() {
  const [trigger, state] = useMarkAllAsReadMutation();
  return { mutate: trigger, mutateAsync: trigger, ...state };
}
