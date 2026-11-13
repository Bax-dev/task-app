import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/guards/auth-guard';
import { createSubscriber } from '@/lib/redis-pubsub';
import { prisma } from '@/lib/db/client';
import { requireProjectAccess } from '@/lib/guards/space-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const MAX_STREAMS_PER_USER = 5;
// shortcut: per-instance count, upgrade to a Redis counter when running several instances.
const openStreams = new Map<string, number>();

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

  if ((openStreams.get(userId) ?? 0) >= MAX_STREAMS_PER_USER) {
    return new Response('Too many open streams', { status: 429 });
  }

  if (projectId) {
    try {
      await requireProjectAccess(userId, projectId);
    } catch {
      return new Response('Forbidden', { status: 403 });
    }
    channels.push(`events:project:${projectId}`);
  } else {
    // Projects in spaces the user can access: every space in orgs they admin, else spaces they're a member of.
    try {
      const memberships = await prisma.membership.findMany({
        where: { userId },
        select: { organizationId: true, role: true },
      });
      const adminOrgIds = memberships.filter((m) => m.role === 'ADMIN').map((m) => m.organizationId);
      const memberOrgIds = memberships.filter((m) => m.role !== 'ADMIN').map((m) => m.organizationId);

      if (memberships.length > 0) {
        const projects = await prisma.project.findMany({
          where: {
            OR: [
              { space: { organizationId: { in: adminOrgIds } } },
              { space: { organizationId: { in: memberOrgIds }, members: { some: { userId } } } },
            ],
          },
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
      openStreams.set(userId, (openStreams.get(userId) ?? 0) + 1);

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

      // Cleanup when client disconnects (runs once, also if it aborted before start()).
      let cleanedUp = false; // separate from `closed`: a failed send sets that, but resources still need releasing
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        closed = true;
        const left = (openStreams.get(userId) ?? 1) - 1;
        if (left > 0) openStreams.set(userId, left); else openStreams.delete(userId);
        clearInterval(heartbeatTimer);
        try {
          subscriber.unsubscribe().catch(() => {});
          subscriber.disconnect();
        } catch {}
        try {
          controller.close();
        } catch {}
      };
      if (request.signal.aborted) cleanup();
      else request.signal.addEventListener('abort', cleanup);
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
