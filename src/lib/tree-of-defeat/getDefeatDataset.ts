import rawCatalog from '@/data/defeat-edges.json';
import {
  buildSuccessorMap,
  edgeLookup,
  getBasinId,
  getBasins,
  getCycle,
  getPath,
  successorMapFromGraph,
  type BasinInfo,
  type SuccessorMap,
} from './graph';
import {
  defeatEdgesCatalogSchema,
  type DefeatEdge,
  type DefeatEdgesCatalog,
  type DefeatTeam,
} from './schema';

export interface DefeatDataset {
  catalog: DefeatEdgesCatalog;
  successors: SuccessorMap;
  edgesByKey: Map<string, DefeatEdge>;
  basins: Map<string, BasinInfo>;
}

export interface TeamPathView {
  team: number;
  path: number[];
  cycle: number[];
  cycleStart: number;
  basinId: string | null;
  basin: BasinInfo | null;
  edges: DefeatEdge[];
}

let cached: DefeatDataset | null = null;

export function getDefeatDataset(): DefeatDataset {
  if (cached) return cached;
  const catalog = defeatEdgesCatalogSchema.parse(rawCatalog);
  const successors =
    Object.keys(catalog.graph).length > 0
      ? successorMapFromGraph(catalog.graph)
      : buildSuccessorMap(catalog.edges);
  cached = {
    catalog,
    successors,
    edgesByKey: edgeLookup(catalog.edges),
    basins: getBasins(catalog),
  };
  return cached;
}

export function getTeamLabel(dataset: DefeatDataset, team: number): string {
  const entry: DefeatTeam | undefined = dataset.catalog.teams[String(team)];
  if (entry?.name) return `${team} — ${entry.name}`;
  return String(team);
}

export function lookupTeamPath(dataset: DefeatDataset, team: number): TeamPathView | null {
  if (!dataset.catalog.teams[String(team)] && !dataset.successors.has(team)) {
    return null;
  }
  const result = getPath(team, dataset.successors);
  const cycle = getCycle(result);
  const basinId = getBasinId(team, dataset.catalog);
  const edges: DefeatEdge[] = [];
  for (let i = 0; i < result.path.length - 1; i++) {
    const from = result.path[i]!;
    const to = result.path[i + 1]!;
    const edge = dataset.edgesByKey.get(`${from}->${to}`);
    if (edge) edges.push(edge);
  }
  return {
    team,
    path: result.path,
    cycle,
    cycleStart: result.cycleStart,
    basinId,
    basin: basinId ? (dataset.basins.get(basinId) ?? null) : null,
    edges,
  };
}
