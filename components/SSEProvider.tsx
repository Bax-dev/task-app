'use client';

import { useSSE } from '@/hooks/use-sse';
import { useAuth } from '@/hooks/use-auth';
import { WifiOff } from 'lucide-react';

/**
 * Mounts a global SSE connection for the authenticated user.
 * Subscribes to user-specific notification events and all project events
 * the user has access to. Place inside StoreProvider + auth context.
 * Renders a small "Live updates paused" banner once reconnects are exhausted.
 */
export default function SSEProvider() {
  const { user } = useAuth();

  // Only connect when authenticated
  if (!user) return null;

  return <SSEConnection />;
}

function SSEConnection() {
  const { paused, retry } = useSSE();
  if (!paused) return null;

  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-1.5 text-xs text-muted-foreground">
      <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
      Live updates paused
      <button type="button" onClick={retry} className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
        Retry
      </button>
    </div>
  );
}
