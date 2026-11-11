import { buildSuccessorMap, getBasinsFromEdges, getCycle, getPath } from './graph';
import { pickWorstRecordOpponent, type HeadToHeadRecord } from './pickNemesis';
import type { DefeatBasin, DefeatEdge, DefeatEdgesCatalog, DefeatTeam } from './schema';

export interface SimpleMatch {
  /** TBA event_type; official = 0–5 by default. */
  eventType: number;
  winningAlliance: 'red' | 'blue' | '';
  redTeams: number[];
  blueTeams: number[];
}

export const OFFICIAL_EVENT_TYPES = new Set([0, 1, 2, 3, 4, 5]);

export function isOfficialEvent(eventType: number): boolean {
  return OFFICIAL_EVENT_TYPES.has(eventType);
}

function teamKey(n: number): string {
  return String(n);
}

/** Mutating accumulator: wins/losses/ties for `team` vs `opponent`. */
function bump(
  table: Map<number, Map<number, HeadToHeadRecord>>,
  team: number,
  opponent: number,
  result: 'win' | 'loss' | 'tie',
) {
  let vs = table.get(team);
  if (!vs) {
    vs = new Map();
    table.set(team, vs);
  }
  let row = vs.get(opponent);
  if (!row) {
    row = { opponent, wins: 0, losses: 0, ties: 0 };
    vs.set(opponent, row);
  }
  if (result === 'win') row.wins += 1;
  else if (result === 'loss') row.losses += 1;
  else row.ties = (row.ties ?? 0) + 1;
}

export function accumulateHeadToHead(
  matches: SimpleMatch[],
  options: { officialOnly?: boolean } = {},
): Map<number, Map<number, HeadToHeadRecord>> {
  const officialOnly = options.officialOnly ?? true;
  const table = new Map<number, Map<number, HeadToHeadRecord>>();

  for (const match of matches) {
    if (officialOnly && !isOfficialEvent(match.eventType)) continue;
    const { redTeams, blueTeams, winningAlliance } = match;
    for (const red of redTeams) {
      for (const blue of blueTeams) {
        if (winningAlliance === 'red') {
          bump(table, red, blue, 'win');
          bump(table, blue, red, 'loss');
        } else if (winningAlliance === 'blue') {
          bump(table, blue, red, 'win');
          bump(table, red, blue, 'loss');
        } else {
          bump(table, red, blue, 'tie');
          bump(table, blue, red, 'tie');
        }
      }
    }
  }

  return table;
}

export function edgesFromHeadToHead(
  table: Map<number, Map<number, HeadToHeadRecord>>,
): DefeatEdge[] {
  const edges: DefeatEdge[] = [];
  for (const [team, opponents] of table) {
    const pick = pickWorstRecordOpponent([...opponents.values()]);
    if (!pick) continue;
    edges.push({
      from: team,
      to: pick.opponent,
      wins: pick.wins,
      losses: pick.losses,
      ties: pick.ties ?? 0,
    });
  }
  edges.sort((a, b) => a.from - b.from);
  return edges;
}

function parseTeamKey(key: string): number | null {
  const m = /^frc(\d+)$/i.exec(key);
  if (!m) return null;
  const n = Number(m[1]);
  // TBA sometimes emits frc0 placeholders; skip non-positive numbers.
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Map a TBA match + event_type into SimpleMatch (or null if unusable). */
export function tbaMatchToSimple(
  match: {
    winning_alliance?: string;
    alliances?: {
      red?: { team_keys?: string[] };
      blue?: { team_keys?: string[] };
    };
  },
  eventType: number,
): SimpleMatch | null {
  const red = (match.alliances?.red?.team_keys ?? [])
    .map(parseTeamKey)
    .filter((n): n is number => n != null);
  const blue = (match.alliances?.blue?.team_keys ?? [])
    .map(parseTeamKey)
    .filter((n): n is number => n != null);
  if (red.length === 0 || blue.length === 0) return null;
  const w = match.winning_alliance;
  const winningAlliance = w === 'red' || w === 'blue' ? w : '';
  return { eventType, winningAlliance, redTeams: red, blueTeams: blue };
}

export function edgesToGraph(edges: DefeatEdge[]): Record<string, number> {
  const graph: Record<string, number> = {};
  for (const edge of edges) {
    graph[teamKey(edge.from)] = edge.to;
  }
  return graph;
}

export function summarizeBasins(edges: DefeatEdge[]): DefeatBasin[] {
  return [...getBasinsFromEdges(edges).values()]
    .map((b) => ({
      id: b.id,
      cycle: b.cycle,
      memberCount: b.members.length,
    }))
    .sort((a, b) => b.memberCount - a.memberCount || a.id.localeCompare(b.id));
}

export function buildCatalogFromMatches(
  matches: SimpleMatch[],
  options: {
    teamNames?: Record<string, string>;
    generatedAt?: string;
    source?: string;
    years?: number[];
  } = {},
): DefeatEdgesCatalog {
  const table = accumulateHeadToHead(matches, { officialOnly: true });
  const edges = edgesFromHeadToHead(table);
  const graph = edgesToGraph(edges);
  const teams: Record<string, DefeatTeam> = {};
  for (const edge of edges) {
    for (const n of [edge.from, edge.to]) {
      const key = teamKey(n);
      if (!teams[key]) {
        teams[key] = {
          number: n,
          name: options.teamNames?.[key],
        };
      }
    }
  }

  const basins = summarizeBasins(edges);

  return {
    meta: {
      metric: 'worst_record',
      officialOnly: true,
      generatedAt: options.generatedAt ?? new Date().toISOString(),
      source: options.source ?? 'aggregateH2H',
      tieBreak: 'wilson_loss_confidence_then_team_number',
      years: options.years,
      matchCount: matches.filter((m) => isOfficialEvent(m.eventType)).length,
      teamCount: Object.keys(teams).length,
    },
    teams,
    graph,
    edges,
    basins,
  };
}

/** Walk every team in the graph; used by rebuild verification. */
export function countTeamsReachingCycles(edges: DefeatEdge[]): {
  withCycle: number;
  deadEnds: number;
} {
  const successors = buildSuccessorMap(edges);
  const teams = new Set<number>();
  for (const e of edges) {
    teams.add(e.from);
    teams.add(e.to);
  }
  let withCycle = 0;
  let deadEnds = 0;
  for (const team of teams) {
    if (getCycle(getPath(team, successors)).length > 0) withCycle += 1;
    else deadEnds += 1;
  }
  return { withCycle, deadEnds };
}
