import { readFileSync, writeFileSync } from 'node:fs';
import { edgesToGraph, summarizeBasins } from '../src/lib/tree-of-defeat/aggregateH2H';
import { defeatEdgesCatalogSchema } from '../src/lib/tree-of-defeat/schema';

const path = 'src/data/defeat-edges.json';
const raw = JSON.parse(readFileSync(path, 'utf8')) as {
  meta: Record<string, unknown>;
  teams: Record<string, unknown>;
  edges: Parameters<typeof edgesToGraph>[0];
};
raw.meta = {
  ...raw.meta,
  matchCount: typeof raw.meta.matchCount === 'number' ? raw.meta.matchCount : 0,
  teamCount: Object.keys(raw.teams).length,
};
const upgraded = {
  ...raw,
  graph: edgesToGraph(raw.edges),
  basins: summarizeBasins(raw.edges),
};
const catalog = defeatEdgesCatalogSchema.parse(upgraded);
writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(
  `upgraded fixture: edges=${catalog.edges.length} graph=${Object.keys(catalog.graph).length} basins=${catalog.basins?.length}`,
);
