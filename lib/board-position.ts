/**
 * Position for a card inserted at `index` into a column, given the column's other cards'
 * boardPosition values in display order (positioned first, then nulls — matching the API sort).
 * Only the moved card is written; neighbours keep their values.
 * shortcut: midpoints lose precision after ~50 drops into the same gap; add a column rebalance if that shows up.
 */
export function computeBoardPosition(positions: (number | null | undefined)[], index: number): number {
  const i = Math.max(0, Math.min(index, positions.length));
  const prev = i > 0 ? positions[i - 1] : undefined;
  const next = positions[i];

  if (i > 0 && prev == null) {
    // Dropped among never-positioned cards: they can't be ordered without rewriting them,
    // so the card lands right after the last positioned one.
    const last = positions.filter((p): p is number => typeof p === 'number').at(-1);
    return last == null ? 0 : last + 1;
  }
  if (prev != null && next != null) return (prev + next) / 2;
  if (prev != null) return prev + 1;
  if (next != null) return next - 1;
  return 0;
}

/** Client-side mirror of the API order: boardPosition asc, nulls last, stable otherwise. */
export function sortByBoardPosition<T extends { boardPosition?: number | null }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => (a.boardPosition ?? Infinity) - (b.boardPosition ?? Infinity) || 0);
}
