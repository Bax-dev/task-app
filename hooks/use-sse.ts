'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { apiSlice } from '@/store/api';

/**
 * Hook that connects to the SSE endpoint and invalidates RTK Query cache tags
 * when server-side events arrive. This triggers automatic refetches for any
 * active queries matching the invalidated tags.
 *
 * @param projectId - Optional project ID for scoped subscriptions (e.g., board views)
 */
export function useSSE(projectId?: string) {
  const dispatch = useAppDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;

      const url = projectId
        ? `/api/events/stream?projectId=${projectId}`
        : '/api/events/stream';

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'CONNECTED' || data.type === 'REDIS_UNAVAILABLE') {
            return;
          }

          // Invalidate RTK Query tags from the event
          if (data.tags && Array.isArray(data.tags)) {
            const tags: { type: string; id?: string }[] = [];

            for (const tag of data.tags) {
              tags.push({ type: tag });
            }

            // Also invalidate specific IDs if provided
            if (data.ids && Array.isArray(data.ids)) {
              for (const id of data.ids) {
                for (const tag of data.tags) {
                  tags.push({ type: tag, id });
                }
              }
            }

            dispatch(apiSlice.util.invalidateTags(tags));
          }
        } catch {
          // Ignore malformed messages (e.g., heartbeats)
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        if (cancelled) return;

        retryCountRef.current += 1;

        // Stop reconnecting after 10 consecutive failures
        if (retryCountRef.current > 10) {
          return;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 30_000);
        retryTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [dispatch, projectId]);
}
