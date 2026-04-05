import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { createSubscriber } from '@/lib/redis-pubsub';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

/**
 * SSE endpoint: GET /api/events/stream?projectId=<optional>
 *
 * Subscribes to Redis channels and pushes events to the client via SSE.
 * Channels:
 *   - events:user:<userId>          (always, for notifications)
 *   - events:project:<projectId>    (if projectId query param provided)
 *   - events:project:<pid> for all  (if no projectId, subscribes to user's projects)
 */
export async function GET(request: NextRequest) {
  const session = await authenticateRequest(request);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.userId;
  const projectId = request.nextUrl.searchParams.get('projectId');

  // Determine channels to subscribe to
  const channels: string[] = [`events:user:${userId}`];

  if (projectId) {
    channels.push(`events:project:${projectId}`);
  } else {
    // Subscribe to all projects the user has access to (via org memberships)
    try {
      const memberships = await prisma.membership.findMany({
        where: { userId },
        select: { organizationId: true },
      });
      const orgIds = memberships.map((m) => m.organizationId);

      if (orgIds.length > 0) {
        const projects = await prisma.project.findMany({
          where: { space: { organizationId: { in: orgIds } } },
          select: { id: true },
        });
        for (const p of projects) {
          channels.push(`events:project:${p.id}`);
        }
      }
    } catch (err) {
      console.warn('[SSE] Failed to fetch user projects for subscription:', err);
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      function send(data: string) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          closed = true;
        }
      }

      // Send initial connection event
      send(`data: ${JSON.stringify({ type: 'CONNECTED', channels: channels.length })}\n\n`);

      // Redis subscriber
      const subscriber = createSubscriber();
      let heartbeatTimer: ReturnType<typeof setInterval>;

      subscriber.connect()
        .then(() => {
          if (closed) {
            subscriber.disconnect();
            return;
          }

          subscriber.subscribe(...channels).catch((err: any) => {
            console.warn('[SSE] Subscribe failed:', err.message);
          });

          subscriber.on('message', (_channel: string, message: string) => {
            send(`data: ${message}\n\n`);
          });

          // Heartbeat to keep connection alive
          heartbeatTimer = setInterval(() => {
            send(': heartbeat\n\n');
          }, HEARTBEAT_INTERVAL);
        })
        .catch((err: any) => {
          console.warn('[SSE] Redis connection failed:', err.message);
          // Send fallback event so client knows to use polling
          send(`data: ${JSON.stringify({ type: 'REDIS_UNAVAILABLE' })}\n\n`);
        });

      // Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(heartbeatTimer);
        try {
          subscriber.unsubscribe().catch(() => {});
          subscriber.disconnect();
        } catch {}
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
