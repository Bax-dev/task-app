import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis | undefined };

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
  });

  client.on('error', (err) => {
    console.warn('[Redis] Connection error:', err.message);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

/**
 * Safely execute a Redis command. Returns null if Redis is unavailable.
 */
export async function safeRedisCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    return await fn();
  } catch (error: any) {
    console.warn('[Redis] Command failed:', error.message);
    return null;
  }
}
