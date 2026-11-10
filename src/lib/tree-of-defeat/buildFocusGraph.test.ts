import { describe, expect, it } from 'vitest';
import { buildFocusGraph } from './buildFocusGraph';
import { getDefeatDataset, lookupTeamPath } from './getDefeatDataset';

describe('buildFocusGraph', () => {
  it('includes path/cycle nodes and inbound feeders for 254', () => {
    const dataset = getDefeatDataset();
    const view = lookupTeamPath(dataset, 254);
    expect(view).not.toBeNull();
    const focus = buildFocusGraph(dataset, view!, { maxInboundPerNode: 4 });
    expect(focus.nodes.some((n) => n.team === 254 && n.kind === 'start')).toBe(true);
    expect(focus.nodes.some((n) => n.kind === 'cycle')).toBe(true);
    expect(focus.links.some((l) => l.kind === 'path')).toBe(true);
    expect(focus.nodes.length).toBeGreaterThan(view!.cycle.length);
  });
});
