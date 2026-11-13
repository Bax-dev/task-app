import { describe, it, expect } from 'vitest';
import { computeBoardPosition, sortByBoardPosition } from '@/lib/board-position';

describe('computeBoardPosition', () => {
  it('returns 0 for an empty column', () => {
    expect(computeBoardPosition([], 0)).toBe(0);
  });

  it('takes the midpoint between two neighbours', () => {
    expect(computeBoardPosition([1, 2, 3], 1)).toBe(1.5);
  });

  it('goes before the first card and after the last', () => {
    expect(computeBoardPosition([1, 2], 0)).toBe(0);
    expect(computeBoardPosition([1, 2], 2)).toBe(3);
  });

  it('puts the card first when the column has only unpositioned cards and index is 0', () => {
    expect(computeBoardPosition([null, null], 0)).toBe(0);
  });

  it('lands after the last positioned card when dropped among unpositioned ones', () => {
    expect(computeBoardPosition([1, 4, null, null], 3)).toBe(5);
    expect(computeBoardPosition([1, 4, null], 2)).toBe(5);
    expect(computeBoardPosition([null, null], 1)).toBe(0);
  });

  it('clamps an out-of-range index', () => {
    expect(computeBoardPosition([1], 10)).toBe(2);
    expect(computeBoardPosition([1], -3)).toBe(0);
  });

  it('result sorts into the requested slot', () => {
    const cards = [{ id: 'a', boardPosition: 1 }, { id: 'b', boardPosition: 2 }, { id: 'c', boardPosition: null }];
    const position = computeBoardPosition(cards.map((c) => c.boardPosition), 1);
    const sorted = sortByBoardPosition([...cards, { id: 'x', boardPosition: position }]);
    expect(sorted.map((c) => c.id)).toEqual(['a', 'x', 'b', 'c']);
  });
});
