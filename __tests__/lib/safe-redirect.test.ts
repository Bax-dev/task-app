import { describe, it, expect } from 'vitest';
import { safeRedirect } from '@/lib/utils';

describe('safeRedirect', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirect('/invite/abc?x=1#y')).toBe('/invite/abc?x=1#y');
  });
  it.each([null, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/\t/evil.com', 'javascript:alert(1)'])(
    'rejects %j',
    (p) => expect(safeRedirect(p)).toBe('/dashboard'),
  );
});
