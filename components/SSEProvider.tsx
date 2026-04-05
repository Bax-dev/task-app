'use client';

import { useSSE } from '@/hooks/use-sse';
import { useAuth } from '@/hooks/use-auth';

/**
 * Mounts a global SSE connection for the authenticated user.
 * Subscribes to user-specific notification events and all project events
 * the user has access to. Place inside StoreProvider + auth context.
 */
export default function SSEProvider() {
  const { user } = useAuth();

  // Only connect when authenticated
  if (!user) return null;

  return <SSEConnection />;
}

function SSEConnection() {
  useSSE();
  return null;
}
