import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { buildFocusGraph } from '@/lib/tree-of-defeat/buildFocusGraph';
import { layoutFocusGraph } from '@/lib/tree-of-defeat/layoutFocusGraph';
import type { DefeatDataset, TeamPathView } from '@/lib/tree-of-defeat/getDefeatDataset';

interface Props {
  dataset: DefeatDataset;
  view: TeamPathView;
  onSelectTeam: (team: number) => void;
}

const KIND_CLASS: Record<string, string> = {
  start: 'tod-gnode--start',
  cycle: 'tod-gnode--cycle',
  path: 'tod-gnode--path',
  inbound: 'tod-gnode--inbound',
};

export default function DefeatGraphViz({ dataset, view, onSelectTeam }: Props) {
  const layout = useMemo(() => {
    const focus = buildFocusGraph(dataset, view);
    return layoutFocusGraph(focus, view.cycle);
  }, [dataset, view]);

  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  function onWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    setTransform((t) => {
      const nextK = Math.min(3.5, Math.max(0.35, t.k * factor));
      const wx = (mx - t.x) / t.k;
      const wy = (my - t.y) / t.k;
      return {
        k: nextK,
        x: mx - wx * nextK,
        y: my - wy * nextK,
      };
    });
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      px: event.clientX,
      py: event.clientY,
      x: transform.x,
      y: transform.y,
    };
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setTransform((t) => ({
      ...t,
      x: drag.x + (event.clientX - drag.px),
      y: drag.y + (event.clientY - drag.py),
    }));
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="tod-graph">
      <div className="tod-graph-toolbar">
        <span>Drag to pan · scroll to zoom · click a node to trace that team</span>
        <span>
          {layout.nodes.length} nodes · {layout.links.length} edges (path + nearby feeders)
        </span>
      </div>
      <svg
        className="tod-graph-svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Interactive defeat path graph"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <marker
            id="tod-arrow-path"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(0,146,202,0.85)" />
          </marker>
          <marker
            id="tod-arrow-inbound"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(138,154,168,0.8)" />
          </marker>
        </defs>
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          {layout.links.map((link) => (
            <line
              key={`${link.source}-${link.target}-${link.kind}`}
              className={link.kind === 'path' ? 'tod-glink tod-glink--path' : 'tod-glink tod-glink--inbound'}
              x1={link.x1}
              y1={link.y1}
              x2={link.x2}
              y2={link.y2}
              markerEnd={link.kind === 'path' ? 'url(#tod-arrow-path)' : 'url(#tod-arrow-inbound)'}
            />
          ))}
          {layout.nodes.map((node) => (
            <g
              key={node.id}
              className={`tod-gnode ${KIND_CLASS[node.kind] ?? ''}`}
              transform={`translate(${node.x} ${node.y})`}
              onClick={(event) => {
                event.stopPropagation();
                onSelectTeam(node.team);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectTeam(node.team);
                }
              }}
            >
              <title>
                {node.team} — {node.name}
              </title>
              <circle r={node.kind === 'inbound' ? 10 : node.kind === 'start' ? 14 : 12} />
              <text y={4}>{node.team}</text>
            </g>
          ))}
        </g>
      </svg>
      <div className="tod-graph-legend" aria-hidden="true">
        <span>
          <i className="tod-swatch tod-swatch--start" /> start
        </span>
        <span>
          <i className="tod-swatch tod-swatch--path" /> path
        </span>
        <span>
          <i className="tod-swatch tod-swatch--cycle" /> cycle
        </span>
        <span>
          <i className="tod-swatch tod-swatch--inbound" /> feeds in
        </span>
      </div>
    </div>
  );
}
