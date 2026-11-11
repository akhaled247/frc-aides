import { describe, expect, it } from 'vitest';
import raw from '@/data/defeat-edges.json';
import {
  basinIdFromCycle,
  buildSuccessorMap,
  getBasinId,
  getBasins,
  getCycle,
  getPath,
  successorMapFromGraph,
} from './graph';
import { defeatEdgesCatalogSchema } from './schema';

const catalog = defeatEdgesCatalogSchema.parse(raw);
const successors = successorMapFromGraph(catalog.graph);

describe('defeat-edges catalog', () => {
  it('parses under schema with matching graph/edges', () => {
    expect(catalog.meta.metric).toBe('worst_record');
    expect(catalog.edges.length).toBe(Object.keys(catalog.graph).length);
    expect(catalog.edges.length).toBeGreaterThan(100);
    expect(catalog.basins?.length).toBeGreaterThan(0);
  });
});

describe('getPath / getCycle', () => {
  it('walks 254 into the main attractor cycle in this snapshot', () => {
    const result = getPath(254, successors);
    expect(result.path[0]).toBe(254);
    expect(result.cycleStart).toBeGreaterThanOrEqual(0);
    const cycle = getCycle(result);
    expect(cycle.length).toBeGreaterThan(1);
    expect(cycle).toContain(67);
    expect(result.path.at(-1)).toBe(cycle[0]);
  });

  it('returns cycleStart -1 on dead end', () => {
    const map = buildSuccessorMap([{ from: 1, to: 2, wins: 0, losses: 1 }]);
    const result = getPath(1, map);
    expect(result).toEqual({ path: [1, 2], cycleStart: -1 });
    expect(getCycle(result)).toEqual([]);
  });
});

describe('basins', () => {
  it('puts every team with an edge into some basin', () => {
    const basins = getBasins(catalog);
    const covered = new Set<number>();
    for (const basin of basins.values()) {
      for (const m of basin.members) covered.add(m);
    }
    for (const edge of catalog.edges) {
      expect(covered.has(edge.from)).toBe(true);
    }
  });

  it('assigns 254 to the largest basin in the TBA snapshot', () => {
    const id = getBasinId(254, catalog);
    expect(id).not.toBeNull();
    const basins = [...(catalog.basins ?? [])].sort((a, b) => b.memberCount - a.memberCount);
    expect(basins[0]?.id).toBe(id);
    expect(basinIdFromCycle(basins[0]!.cycle)).toBe(id);
  });

  it('keeps distinct basin ids for the top attractors', () => {
    const ids = new Set((catalog.basins ?? []).map((b) => b.id));
    expect(ids.size).toBe(catalog.basins?.length);
  });
});
