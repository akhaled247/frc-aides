import type { DefeatDataset, TeamPathView } from './getDefeatDataset';

export type FocusNodeKind = 'start' | 'path' | 'cycle' | 'inbound';

export interface FocusNode {
  id: string;
  team: number;
  name: string;
  kind: FocusNodeKind;
}

export interface FocusLink {
  source: string;
  target: string;
  wins?: number;
  losses?: number;
  ties?: number;
  kind: 'path' | 'inbound';
}

export interface FocusGraphData {
  nodes: FocusNode[];
  links: FocusLink[];
}

function buildInboundIndex(graph: Record<string, number>): Map<number, number[]> {
  const inbound = new Map<number, number[]>();
  for (const [fromStr, to] of Object.entries(graph)) {
    const from = Number(fromStr);
    const list = inbound.get(to);
    if (list) list.push(from);
    else inbound.set(to, [from]);
  }
  return inbound;
}

let cachedInbound: { key: Record<string, number>; index: Map<number, number[]> } | null = null;

function inboundIndexFor(graph: Record<string, number>): Map<number, number[]> {
  if (cachedInbound?.key === graph) return cachedInbound.index;
  const index = buildInboundIndex(graph);
  cachedInbound = { key: graph, index };
  return index;
}

/**
 * Path + cycle nodes, plus a capped set of inbound neighbors that point at them.
 */
export function buildFocusGraph(
  dataset: DefeatDataset,
  view: TeamPathView,
  options: { maxInboundPerNode?: number } = {},
): FocusGraphData {
  const maxInbound = options.maxInboundPerNode ?? 6;
  const cycleSet = new Set(view.cycle);
  const coreTeams = new Set<number>();
  for (let i = 0; i < view.path.length; i++) {
    const team = view.path[i]!;
    // Skip trailing duplicate that closes the cycle for node set uniqueness.
    if (i === view.path.length - 1 && view.cycleStart >= 0) continue;
    coreTeams.add(team);
  }

  const nodes = new Map<number, FocusNode>();
  const links: FocusLink[] = [];
  const linkKeys = new Set<string>();

  function upsertNode(team: number, kind: FocusNodeKind) {
    const existing = nodes.get(team);
    if (existing) {
      const rank = { start: 3, cycle: 2, path: 1, inbound: 0 };
      if (rank[kind] > rank[existing.kind]) existing.kind = kind;
      return;
    }
    nodes.set(team, {
      id: String(team),
      team,
      name: dataset.catalog.teams[String(team)]?.name ?? `Team ${team}`,
      kind: team === view.team ? 'start' : kind,
    });
  }

  function addLink(
    from: number,
    to: number,
    kind: FocusLink['kind'],
    edge?: { wins: number; losses: number; ties?: number },
  ) {
    const key = `${from}->${to}:${kind}`;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({
      source: String(from),
      target: String(to),
      kind,
      wins: edge?.wins,
      losses: edge?.losses,
      ties: edge?.ties,
    });
  }

  for (const team of coreTeams) {
    const kind: FocusNodeKind = team === view.team ? 'start' : cycleSet.has(team) ? 'cycle' : 'path';
    upsertNode(team, kind);
  }

  for (let i = 0; i < view.path.length - 1; i++) {
    const from = view.path[i]!;
    const to = view.path[i + 1]!;
    const edge = view.edges[i];
    addLink(from, to, 'path', edge);
  }

  const inbound = inboundIndexFor(dataset.catalog.graph);
  for (const team of coreTeams) {
    const feeders = (inbound.get(team) ?? [])
      .filter((f) => !coreTeams.has(f))
      .sort((a, b) => a - b)
      .slice(0, maxInbound);
    for (const from of feeders) {
      upsertNode(from, 'inbound');
      const edge = dataset.edgesByKey.get(`${from}->${team}`);
      addLink(from, team, 'inbound', edge ?? undefined);
    }
  }

  return { nodes: [...nodes.values()], links };
}
