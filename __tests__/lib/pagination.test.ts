import { describe, it, expect } from 'vitest';
import { paginationQuerySchema, pageArgs, toPage } from '@/lib/pagination';

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `id-${i}` }));
const CURSOR = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';

describe('paginationQuerySchema', () => {
  it('clamps limit into 1..100 and coerces strings', () => {
    expect(paginationQuerySchema.parse({ limit: '500' }).limit).toBe(100);
    expect(paginationQuerySchema.parse({ limit: '0' }).limit).toBe(1);
    expect(paginationQuerySchema.parse({ limit: '-3' }).limit).toBe(1);
    expect(paginationQuerySchema.parse({ limit: '25' }).limit).toBe(25);
  });

  it('leaves limit undefined when absent (opt-in) and rejects junk', () => {
    expect(paginationQuerySchema.parse({}).limit).toBeUndefined();
    expect(paginationQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ limit: '2.5' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ cursor: 'not-a-uuid' }).success).toBe(false);
    expect(paginationQuerySchema.parse({ cursor: CURSOR }).cursor).toBe(CURSOR);
  });
});

describe('pageArgs', () => {
  it('fetches limit + 1 rows and skips the cursor row', () => {
    expect(pageArgs(20)).toEqual({ take: 21 });
    expect(pageArgs(20, CURSOR)).toEqual({ take: 21, cursor: { id: CURSOR }, skip: 1 });
  });
});

describe('toPage', () => {
  it('returns nextCursor = last returned id when the extra row came back', () => {
    const page = toPage(rows(21), 20);
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).toBe('id-19');
  });

  it('returns nextCursor null on the last page', () => {
    expect(toPage(rows(20), 20)).toEqual({ items: rows(20), nextCursor: null });
    expect(toPage(rows(3), 20).nextCursor).toBeNull();
    expect(toPage([], 20)).toEqual({ items: [], nextCursor: null });
  });
});
