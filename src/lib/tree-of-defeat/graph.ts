import type { DefeatEdge, DefeatEdgesCatalog } from './schema';

export type SuccessorMap = Map<number, number>;

export interface DefeatPathResult {
  /** Teams from start through the first repeated node (inclusive). */
  path: number[];
  /** Index in `path` where the cycle begins, or -1 if no cycle (dead end). */
  cycleStart: number;
}

export function buildSuccessorMap(edges: DefeatEdge[]): SuccessorMap {
  const map: SuccessorMap = new Map();
  for (const edge of edges) {
    if (map.has(edge.from)) {
      throw new Error(`duplicate outgoing edge for team ${edge.from}`);
    }
    map.set(edge.from, edge.to);
  }
  return map;
}

export function getPath(start: number, successors: SuccessorMap): DefeatPathResult {
  const path: number[] = [start];
  const seen = new Map<number, number>([[start, 0]]);
  let current = start;

  while (true) {
    const next = successors.get(current);
    if (next === undefined) {
      return { path, cycleStart: -1 };
    }
    const prior = seen.get(next);
    if (prior !== undefined) {
      path.push(next);
      return { path, cycleStart: prior };
    }
    seen.set(next, path.length);
    path.push(next);
    current = next;
  }
}

/** Unique cycle members in walk order (excludes the trailing duplicate). */
export function getCycle(result: DefeatPathResult): number[] {
  if (result.cycleStart < 0) return [];
  return result.path.slice(result.cycleStart, -1);
}

export function basinIdFromCycle(cycle: number[]): string {
  if (cycle.length === 0) return '';
  return [...cycle].sort((a, b) => a - b).join('-');
}

export interface BasinInfo {
  id: string;
  cycle: number[];
  members: number[];
}

/**
 * Assign every team that can reach a cycle to that cycle's basin.
 * Teams with no path to a cycle are omitted.
 */
export function getBasinsFromEdges(edges: DefeatEdge[]): Map<string, BasinInfo> {
  const successors = buildSuccessorMap(edges);
  const basins = new Map<string, BasinInfo>();
  const teamBasin = new Map<number, string>();

  const teamNumbers = new Set<number>();
  for (const edge of edges) {
    teamNumbers.add(edge.from);
    teamNumbers.add(edge.to);
  }

  for (const team of teamNumbers) {
    const result = getPath(team, successors);
    const cycle = getCycle(result);
    if (cycle.length === 0) continue;
    const id = basinIdFromCycle(cycle);
    let basin = basins.get(id);
    if (!basin) {
      basin = { id, cycle, members: [] };
      basins.set(id, basin);
    }
    if (!teamBasin.has(team)) {
      teamBasin.set(team, id);
      basin.members.push(team);
    }
  }

  for (const basin of basins.values()) {
    basin.members.sort((a, b) => a - b);
  }

  return basins;
}

export function getBasins(catalog: DefeatEdgesCatalog): Map<string, BasinInfo> {
  return getBasinsFromEdges(catalog.edges);
}

export function getBasinId(team: number, catalog: DefeatEdgesCatalog): string | null {
  const successors =
    Object.keys(catalog.graph).length > 0
      ? new Map(Object.entries(catalog.graph).map(([k, v]) => [Number(k), v]))
      : buildSuccessorMap(catalog.edges);
  const cycle = getCycle(getPath(team, successors));
  if (cycle.length === 0) return null;
  return basinIdFromCycle(cycle);
}

export function successorMapFromGraph(graph: Record<string, number>): SuccessorMap {
  return new Map(Object.entries(graph).map(([k, v]) => [Number(k), v]));
}

export function edgeLookup(edges: DefeatEdge[]): Map<string, DefeatEdge> {
  const map = new Map<string, DefeatEdge>();
  for (const edge of edges) {
    map.set(`${edge.from}->${edge.to}`, edge);
  }
  return map;
}
