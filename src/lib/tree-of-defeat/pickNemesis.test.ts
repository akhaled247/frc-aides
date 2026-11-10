import { describe, expect, it } from 'vitest';
import { pickWorstRecordOpponent, winPct } from './pickNemesis';

describe('winPct', () => {
  it('computes wins over total including ties', () => {
    expect(winPct({ wins: 1, losses: 1, ties: 2 })).toBe(0.25);
  });

  it('returns 1 for empty record so empty does not win worst', () => {
    expect(winPct({ wins: 0, losses: 0 })).toBe(1);
  });
});

describe('pickWorstRecordOpponent', () => {
  it('returns null for empty list', () => {
    expect(pickWorstRecordOpponent([])).toBeNull();
  });

  it('picks lower win percentage', () => {
    const pick = pickWorstRecordOpponent([
      { opponent: 10, wins: 5, losses: 5 },
      { opponent: 20, wins: 1, losses: 9 },
    ]);
    expect(pick?.opponent).toBe(20);
  });

  it('breaks winpct ties with more losses', () => {
    const pick = pickWorstRecordOpponent([
      { opponent: 10, wins: 2, losses: 2 },
      { opponent: 20, wins: 4, losses: 4 },
    ]);
    expect(pick?.opponent).toBe(20);
  });

  it('breaks remaining ties with lower opponent number', () => {
    const pick = pickWorstRecordOpponent([
      { opponent: 99, wins: 1, losses: 3 },
      { opponent: 11, wins: 1, losses: 3 },
    ]);
    expect(pick?.opponent).toBe(11);
  });
});
