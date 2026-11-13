import { describe, it, expect, beforeAll } from 'vitest';
import {
  hotp, matchingCounter, currentCounter, generateSecret, encryptMfaSecret, decryptMfaSecret,
  recoveryHash, newRecoveryCodes, looksLikeTotp,
} from '@/lib/auth/totp';

// RFC 6238 appendix B, SHA-1 secret "12345678901234567890" in base32.
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('totp', () => {
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret'; });

  it('matches RFC 6238 test vectors (last 6 digits)', () => {
    expect(hotp(RFC_SECRET, currentCounter(59_000))).toBe('287082');
    expect(hotp(RFC_SECRET, currentCounter(1_111_111_109_000))).toBe('081804');
    expect(hotp(RFC_SECRET, currentCounter(20_000_000_000_000))).toBe('353130');
  });

  it('accepts ±1 step of drift and rejects older codes', () => {
    const at = 1_700_000_000_000;
    const now = currentCounter(at);
    expect(matchingCounter(RFC_SECRET, hotp(RFC_SECRET, now), at)).toBe(now);
    expect(matchingCounter(RFC_SECRET, hotp(RFC_SECRET, now - 1), at)).toBe(now - 1);
    expect(matchingCounter(RFC_SECRET, hotp(RFC_SECRET, now - 2), at)).toBeNull();
    expect(matchingCounter(RFC_SECRET, '12345', at)).toBeNull();
  });

  it('round-trips an encrypted secret', () => {
    const s = generateSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(decryptMfaSecret(encryptMfaSecret(s))).toBe(s);
  });

  it('normalises recovery codes and tells them apart from TOTP codes', () => {
    const [code] = newRecoveryCodes(1);
    expect(code).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/);
    expect(recoveryHash('u1', code)).toBe(recoveryHash('u1', code.toUpperCase().replace('-', ' ')));
    expect(recoveryHash('u1', code)).not.toBe(recoveryHash('u2', code));
    expect(looksLikeTotp('123 456')).toBe(true);
    expect(looksLikeTotp(code)).toBe(false);
  });
});
