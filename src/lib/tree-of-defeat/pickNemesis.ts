export interface HeadToHeadRecord {
  opponent: number;
  wins: number;
  losses: number;
  ties?: number;
}

/**
 * TBA Beta “Confidence” for W–L sorting (Wilson score lower bound, z=3).
 * @see https://www.evanmiller.org/how-not-to-sort-by-average-rating.html
 * @see the-blue-alliance/the-blue-alliance pwa/app/lib/utils.tsx `confidence`
 */
export function confidence(ups: number, downs: number, z = 3): number {
  const n = ups + downs;
  if (n === 0) return 0;
  const phat = ups / n;
  return (
    (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  );
}

/** Higher = worse H2H (TBA Worst Record Against). Ties ignored. */
export function worstRecordConfidence(
  record: Pick<HeadToHeadRecord, 'wins' | 'losses'>,
): number {
  return confidence(record.losses, record.wins);
}

/**
 * Pick TBA Worst Record Against opponent: highest Wilson loss-confidence.
 * Tie-break: lower opponent team number (TBA sort is insertion-order only).
 */
export function pickWorstRecordOpponent(records: HeadToHeadRecord[]): HeadToHeadRecord | null {
  if (records.length === 0) return null;

  return records.reduce((worst, candidate) => {
    const wConf = worstRecordConfidence(worst);
    const cConf = worstRecordConfidence(candidate);
    if (cConf > wConf) return candidate;
    if (cConf < wConf) return worst;
    return candidate.opponent < worst.opponent ? candidate : worst;
  });
}
