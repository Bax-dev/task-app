import { z } from 'zod';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 50;

/** `?limit=<1..100>&cursor=<id>`; out-of-range limits are clamped rather than rejected. */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().transform((n) => Math.min(Math.max(n, 1), MAX_PAGE_SIZE)).optional(),
  cursor: z.string().uuid('Invalid cursor').optional(),
});

export type Page<T> = { items: T[]; nextCursor: string | null };

/** Prisma args: fetch one extra row so toPage can tell whether another page exists. */
export function pageArgs(limit: number, cursor?: string) {
  return { take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) };
}

export function toPage<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  if (rows.length <= limit) return { items: rows, nextCursor: null };
  const items = rows.slice(0, limit);
  return { items, nextCursor: items[items.length - 1].id };
}
