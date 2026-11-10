import type { FocusGraphData, FocusLink, FocusNode } from './buildFocusGraph';

export interface LaidOutNode extends FocusNode {
  x: number;
  y: number;
}

export interface LaidOutLink extends FocusLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LaidOutGraph {
  nodes: LaidOutNode[];
  links: LaidOutLink[];
  width: number;
  height: number;
}

function uniqueById(nodes: FocusNode[]): FocusNode[] {
  const seen = new Set<string>();
  const out: FocusNode[] = [];
  for (const n of nodes) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
  }
  return out;
}

/**
 * Deterministic layout: approach path left→right into a cycle ring; inbound feeders beside targets.
 */
export function layoutFocusGraph(
  data: FocusGraphData,
  cycleOrder: number[] = [],
): LaidOutGraph {
  const byTeam = new Map(data.nodes.map((n) => [n.team, n]));
  const cycleIds = new Set(cycleOrder.map(String));
  if (cycleIds.size === 0) {
    for (const n of data.nodes) {
      if (n.kind === 'cycle') cycleIds.add(n.id);
    }
  }

  const ring: FocusNode[] = [];
  for (const team of cycleOrder) {
    const node = byTeam.get(team);
    if (node) ring.push(node);
  }
  if (ring.length === 0) {
    ring.push(...data.nodes.filter((n) => n.kind === 'cycle'));
  }

  const approach = uniqueById(
    data.nodes.filter((n) => (n.kind === 'path' || n.kind === 'start') && !cycleIds.has(n.id)),
  );
  const inbound = data.nodes.filter((n) => n.kind === 'inbound');

  const ringCount = Math.max(ring.length, 1);
  const ringR = 34 + ringCount * 11;
  const cx = 440;
  const cy = 220;
  const positions = new Map<string, { x: number; y: number }>();

  ring.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / ringCount - Math.PI / 2;
    positions.set(node.id, {
      x: cx + ringR * Math.cos(angle),
      y: cy + ringR * Math.sin(angle),
    });
  });

  const pathGap = 74;
  const pathStartX = Math.max(48, cx - ringR - 100 - Math.max(approach.length - 1, 0) * pathGap);
  approach.forEach((node, i) => {
    positions.set(node.id, {
      x: pathStartX + i * pathGap,
      y: cy,
    });
  });

  const inboundByTarget = new Map<string, FocusNode[]>();
  for (const link of data.links) {
    if (link.kind !== 'inbound') continue;
    const node = inbound.find((n) => n.id === link.source);
    if (!node) continue;
    const list = inboundByTarget.get(link.target) ?? [];
    list.push(node);
    inboundByTarget.set(link.target, list);
  }

  for (const [targetId, feeders] of inboundByTarget) {
    const target = positions.get(targetId);
    if (!target) continue;
    feeders.forEach((node, i) => {
      if (positions.has(node.id)) return;
      const spread = (i - (feeders.length - 1) / 2) * 38;
      positions.set(node.id, {
        x: target.x - 96,
        y: target.y + spread,
      });
    });
  }

  let fallbackY = 48;
  for (const node of data.nodes) {
    if (positions.has(node.id)) continue;
    positions.set(node.id, { x: 48, y: fallbackY });
    fallbackY += 42;
  }

  const nodes: LaidOutNode[] = data.nodes.map((n) => {
    const p = positions.get(n.id)!;
    return { ...n, x: p.x, y: p.y };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links: LaidOutLink[] = data.links.flatMap((l) => {
    const a = byId.get(l.source);
    const b = byId.get(l.target);
    if (!a || !b) return [];
    return [{ ...l, x1: a.x, y1: a.y, x2: b.x, y2: b.y }];
  });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x);
    maxY = Math.max(maxY, n.y);
  }
  const pad = 52;
  const width = Math.max(640, maxX - minX + pad * 2);
  const height = Math.max(360, maxY - minY + pad * 2);
  const dx = pad - minX;
  const dy = pad - minY;
  for (const n of nodes) {
    n.x += dx;
    n.y += dy;
  }
  for (const l of links) {
    l.x1 += dx;
    l.y1 += dy;
    l.x2 += dx;
    l.y2 += dy;
  }

  return { nodes, links, width, height };
}
