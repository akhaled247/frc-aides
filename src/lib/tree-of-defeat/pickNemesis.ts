export interface HeadToHeadRecord {
  opponent: number;
  wins: number;
  losses: number;
  ties?: number;
}

/** Lower is worse. */
export function winPct(record: Pick<HeadToHeadRecord, 'wins' | 'losses' | 'ties'>): number {
  const ties = record.ties ?? 0;
  const total = record.wins + record.losses + ties;
  if (total === 0) return 1;
  return record.wins / total;
}

/**
 * Pick the Worst Record opponent.
 * Tie-break: worse (lower) win% → more losses → lower opponent team number.
 */
export function pickWorstRecordOpponent(records: HeadToHeadRecord[]): HeadToHeadRecord | null {
  if (records.length === 0) return null;

  return records.reduce((worst, candidate) => {
    const wPct = winPct(worst);
    const cPct = winPct(candidate);
    if (cPct < wPct) return candidate;
    if (cPct > wPct) return worst;
    if (candidate.losses > worst.losses) return candidate;
    if (candidate.losses < worst.losses) return worst;
    return candidate.opponent < worst.opponent ? candidate : worst;
  });
}
