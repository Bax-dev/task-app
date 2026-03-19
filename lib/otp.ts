import { redis, safeRedisCall } from './redis';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const OTP_RESEND_COOLDOWN_SECONDS = 60; // 1 minute between resends

// In-memory fallback when Redis is unavailable (dev only)
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function memSet(key: string, value: string, ttl: number) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

function memGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memDel(key: string) {
  memoryStore.delete(key);
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP with 5-minute TTL
 */
export async function storeOTP(purpose: string, email: string, otp: string): Promise<void> {
  const key = `otp:${purpose}:${email}`;
  const cooldownKey = `otp-cooldown:${purpose}:${email}`;

  const stored = await safeRedisCall(() => redis.setex(key, OTP_EXPIRY_SECONDS, otp));

  if (stored === null) {
    // Fallback to in-memory
    memSet(key, otp, OTP_EXPIRY_SECONDS);
    memSet(cooldownKey, '1', OTP_RESEND_COOLDOWN_SECONDS);
  } else {
    await safeRedisCall(() => redis.setex(cooldownKey, OTP_RESEND_COOLDOWN_SECONDS, '1'));
  }

  // Always log OTP in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========================================`);
    console.log(`[DEV OTP] Purpose: ${purpose}`);
    console.log(`[DEV OTP] Email: ${email}`);
    console.log(`[DEV OTP] Code: ${otp}`);
    console.log(`========================================\n`);
  }
}

/**
 * Verify OTP. Deletes OTP on success.
 */
export async function verifyOTP(purpose: string, email: string, otp: string): Promise<boolean> {
  const key = `otp:${purpose}:${email}`;

  const stored = await safeRedisCall(() => redis.get(key));

  if (stored === otp) {
    await safeRedisCall(() => redis.del(key));
    await safeRedisCall(() => redis.del(`otp-cooldown:${purpose}:${email}`));
    return true;
  }

  // Fallback to in-memory
  if (stored === null) {
    const memValue = memGet(key);
    if (memValue === otp) {
      memDel(key);
      memDel(`otp-cooldown:${purpose}:${email}`);
      return true;
    }
  }

  return false;
}

/**
 * Check if resend cooldown is active
 */
export async function canResendOTP(purpose: string, email: string): Promise<boolean> {
  const cooldownKey = `otp-cooldown:${purpose}:${email}`;

  const exists = await safeRedisCall(() => redis.exists(cooldownKey));

  if (exists === null) {
    // Fallback to in-memory
    return memGet(cooldownKey) === null;
  }

  return exists === 0;
}

/**
 * Get remaining TTL for an OTP
 */
export async function getOTPTTL(purpose: string, email: string): Promise<number> {
  const key = `otp:${purpose}:${email}`;
  const ttl = await safeRedisCall(() => redis.ttl(key));
  return ttl && ttl > 0 ? ttl : 0;
}

/**
 * Delete OTP
 */
export async function deleteOTP(purpose: string, email: string): Promise<void> {
  await safeRedisCall(() => redis.del(`otp:${purpose}:${email}`));
  await safeRedisCall(() => redis.del(`otp-cooldown:${purpose}:${email}`));
  memDel(`otp:${purpose}:${email}`);
  memDel(`otp-cooldown:${purpose}:${email}`);
}
