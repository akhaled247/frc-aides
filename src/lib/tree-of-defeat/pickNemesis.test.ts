import { describe, expect, it } from 'vitest';
import { confidence, pickWorstRecordOpponent, worstRecordConfidence } from './pickNemesis';

describe('confidence', () => {
  it('is zero without any votes', () => {
    expect(confidence(0, 0)).toBe(0);
  });

  it('scores a perfect record below 1 to account for sample size', () => {
    expect(confidence(10, 0)).toBeCloseTo(0.5263, 4);
  });

  it('ranks a larger sample of the same rate higher', () => {
    expect(confidence(100, 0)).toBeGreaterThan(confidence(10, 0));
  });
});

describe('pickWorstRecordOpponent', () => {
  it('returns null for empty list', () => {
    expect(pickWorstRecordOpponent([])).toBeNull();
  });

  it('picks higher Wilson loss-confidence (TBA Worst Record)', () => {
    const pick = pickWorstRecordOpponent([
      { opponent: 10, wins: 5, losses: 5 },
      { opponent: 20, wins: 1, losses: 9 },
    ]);
    expect(pick?.opponent).toBe(20);
  });

  it('prefers larger losing samples over tiny 0-win samples', () => {
    // win% would pick 0–1; TBA confidence picks the bigger losing record
    const pick = pickWorstRecordOpponent([
      { opponent: 10, wins: 0, losses: 1 },
      { opponent: 20, wins: 5, losses: 20 },
    ]);
    expect(pick?.opponent).toBe(20);
    expect(worstRecordConfidence({ wins: 5, losses: 20 })).toBeGreaterThan(
      worstRecordConfidence({ wins: 0, losses: 1 }),
    );
  });

  it('ranks larger samples of the same rate worse', () => {
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
