/**
 * TOTP (RFC 6238) + recovery-code primitives for two-step verification. Mirrors stocklogs' mfa.py.
 *
 * Keys: secrets are written with MFA_ENCRYPTION_KEY (required in production). Reads also accept
 * MFA_ENCRYPTION_KEY_PREVIOUS and the legacy key derived from JWT_SECRET, so enrolments made before a
 * key was set or rotated keep working and are re-encrypted with the current key on their next sign-in.
 * Rotate: move the old value to MFA_ENCRYPTION_KEY_PREVIOUS, set a new MFA_ENCRYPTION_KEY.
 */
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const DIGITS = 6;
export const PERIOD = 30;
const DRIFT_STEPS = 1;
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const keyFrom = (raw: string) => createHash('sha256').update(raw).digest();

/** Every key still accepted for reading, the write key first. */
function readKeys(): Buffer[] {
  const { MFA_ENCRYPTION_KEY: current, MFA_ENCRYPTION_KEY_PREVIOUS: previous, JWT_SECRET: jwt } = process.env;
  const keys = [current, previous].filter((k): k is string => !!k).map(keyFrom);
  if (jwt) keys.push(keyFrom(`taskflow-mfa:${jwt}`)); // legacy: enrolments from before MFA_ENCRYPTION_KEY
  if (!keys.length) throw new Error('JWT_SECRET is not set');
  return keys;
}

function writeKey(): Buffer {
  if (process.env.MFA_ENCRYPTION_KEY) return keyFrom(process.env.MFA_ENCRYPTION_KEY);
  // A JWT-derived key would tie every enrolment to JWT_SECRET rotation; never write with it in production.
  if (process.env.NODE_ENV === 'production') throw new Error('MFA_ENCRYPTION_KEY must be set in production');
  return readKeys()[0];
}

// AES-256-GCM, stored as iv:authTag:cipher (hex).
export function encryptMfaSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', writeKey(), iv);
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('hex')).join(':');
}

/** Decrypts with whichever accepted key works. `stale` = written with an older key; re-encrypt it. */
export function openMfaSecret(payload: string): { secret: string; stale: boolean } {
  const [iv, tag, data] = payload.split(':');
  if (!iv || !tag || !data) throw new Error('Malformed MFA ciphertext');
  const keys = readKeys();
  for (let i = 0; i < keys.length; i++) {
    try {
      const decipher = createDecipheriv('aes-256-gcm', keys[i], Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      const secret = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
      return { secret, stale: !!process.env.MFA_ENCRYPTION_KEY && i > 0 };
    } catch {
      // GCM auth failure: not this key, try the next.
    }
  }
  throw new Error('MFA secret does not decrypt with any configured key');
}

export const decryptMfaSecret = (payload: string) => openMfaSecret(payload).secret;

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str: string): Buffer {
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of str.toUpperCase().replace(/=+$/, '')) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const generateSecret = () => base32Encode(randomBytes(20));

export function hotp(secret: string, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const num = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(num % 10 ** DIGITS).padStart(DIGITS, '0');
}

export const currentCounter = (atMs = Date.now()) => Math.floor(atMs / 1000 / PERIOD);

/** The time-step `code` belongs to (within ±1 step of drift), or null. Constant time per candidate. */
export function matchingCounter(secret: string, code: string, atMs = Date.now()): number | null {
  const digits = String(code ?? '').replace(/\D/g, '');
  if (digits.length !== DIGITS) return null;
  const now = currentCounter(atMs);
  let found: number | null = null;
  for (let c = now - DRIFT_STEPS; c <= now + DRIFT_STEPS; c++) {
    if (timingSafeEqual(Buffer.from(hotp(secret, c)), Buffer.from(digits))) found = c;
  }
  return found;
}

export function otpauthUrl(secret: string, email: string): string {
  const issuer = 'TaskFlow';
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(PERIOD) });
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${email}`)}?${params}`;
}

/** True for a bare 6-digit code (authenticator), false for anything else (treated as a recovery code). */
export const looksLikeTotp = (code: string) => /^\d{6}$/.test(String(code ?? '').replace(/\s/g, ''));

const RECOVERY_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/o, 1/l/i

export function newRecoveryCodes(count = 10): string[] {
  const part = () => Array.from({ length: 5 }, () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)]).join('');
  return Array.from({ length: count }, () => `${part()}-${part()}`);
}

const recoveryHmac = (key: Buffer, userId: string, code: string) =>
  createHmac('sha256', key)
    .update(`mfa-recovery:${userId}:${String(code ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')}`)
    .digest('hex');

/** Hash for storing a new recovery code (current key). */
export const recoveryHash = (userId: string, code: string): string => recoveryHmac(writeKey(), userId, code);

/** Every hash this code could be stored under: codes issued under an older key still work. */
export const recoveryHashCandidates = (userId: string, code: string): string[] =>
  readKeys().map((k) => recoveryHmac(k, userId, code));

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
