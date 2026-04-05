import Redis from 'ioredis';

/**
 * Redis Pub/Sub for realtime SSE events.
 *
 * - `publishEvent()` sends events to a Redis channel (uses the shared client).
 * - `createSubscriber()` creates a dedicated Redis connection for subscribing
 *   (Redis clients in subscribe mode cannot issue other commands).
 *
 * Channel conventions:
 *   events:project:<projectId>  — task/board changes scoped to a project
 *   events:user:<userId>        — user-specific notifications
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ── Publisher (reuses the shared Redis client) ───────────────────────────────

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    publisher.on('error', (err) => {
      console.warn('[Redis PubSub] Publisher error:', err.message);
    });
  }
  return publisher;
}

export interface SSEEvent {
  type: string;
  tags: string[];
  ids?: string[];
  projectId?: string;
}

export async function publishEvent(channel: string, payload: SSEEvent): Promise<void> {
  try {
    const pub = getPublisher();
    if (pub.status !== 'ready') await pub.connect();
    await pub.publish(channel, JSON.stringify(payload));
  } catch (err: any) {
    console.warn('[Redis PubSub] Publish failed:', err.message);
  }
}

// ── Subscriber (new connection per SSE client) ───────────────────────────────

export function createSubscriber(): Redis {
  const sub = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 500, 5000);
    },
  });
  sub.on('error', (err) => {
    console.warn('[Redis PubSub] Subscriber error:', err.message);
  });
  return sub;
}
