import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  getTeamLabel,
  lookupTeamPath,
  type DefeatDataset,
  type TeamPathView,
} from '@/lib/tree-of-defeat/getDefeatDataset';
import {
  buildSuccessorMap,
  edgeLookup,
  getBasins,
  successorMapFromGraph,
} from '@/lib/tree-of-defeat/graph';
import type { DefeatEdgesCatalog } from '@/lib/tree-of-defeat/schema';
import ChainViz from './ChainViz';
import DefeatGraphViz from './DefeatGraphViz';

interface Props {
  catalog: DefeatEdgesCatalog;
}

function readTeamParam(): string {
  if (typeof window === 'undefined') return '';
  const raw = new URLSearchParams(window.location.search).get('team');
  return raw && /^\d+$/.test(raw) ? raw : '';
}

function writeTeamParam(team: number | null) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (team === null) url.searchParams.delete('team');
  else url.searchParams.set('team', String(team));
  window.history.replaceState({}, '', url);
}

export default function TreeOfDefeatApp({ catalog }: Props) {
  const dataset = useMemo<DefeatDataset>(
    () => ({
      catalog,
      successors:
        Object.keys(catalog.graph).length > 0
          ? successorMapFromGraph(catalog.graph)
          : buildSuccessorMap(catalog.edges),
      edgesByKey: edgeLookup(catalog.edges),
      basins: getBasins(catalog),
    }),
    [catalog],
  );

  const [input, setInput] = useState(readTeamParam);
  const [activeTeam, setActiveTeam] = useState<number | null>(() => {
    const initial = readTeamParam();
    return initial ? Number(initial) : null;
  });

  const view: TeamPathView | null = useMemo(() => {
    if (activeTeam === null) return null;
    return lookupTeamPath(dataset, activeTeam);
  }, [activeTeam, dataset]);

  useEffect(() => {
    writeTeamParam(activeTeam);
  }, [activeTeam]);

  function selectTeam(team: number) {
    setInput(String(team));
    setActiveTeam(team);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!/^\d+$/.test(trimmed)) {
      setActiveTeam(null);
      return;
    }
    setActiveTeam(Number(trimmed));
  }

  const edgeCount = Object.keys(catalog.graph).length || catalog.edges.length;
  const yearLabel =
    catalog.meta.years && catalog.meta.years.length > 0
      ? `${catalog.meta.years[0]}–${catalog.meta.years[catalog.meta.years.length - 1]}`
      : null;

  return (
    <div className="tod-app">
      <header className="tod-hero">
        <h1>Tree of Defeat</h1>
        <p>
          Follow each team&apos;s worst head-to-head record until the chain loops — the FRC cousin of
          Wikipedia&apos;s walk to Philosophy. Snapshot: {edgeCount} teams
          {yearLabel ? `, official ${yearLabel}` : ''} ({catalog.meta.source}).
        </p>
      </header>

      <form className="tod-form" onSubmit={onSubmit}>
        <label htmlFor="tod-team">Team number</label>
        <div className="tod-form-row">
          <input
            id="tod-team"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 254"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
          />
          <button type="submit">Trace path</button>
        </div>
      </form>

      {activeTeam !== null && !view && (
        <p className="tod-empty" role="status">
          Team {activeTeam} is not in this snapshot.
        </p>
      )}

      {!activeTeam && (
        <p className="tod-empty" role="status">
          Enter a team number to explore its defeat path and interactive graph.
        </p>
      )}

      {view && (
        <section className="tod-results" aria-live="polite">
          <div className="tod-summary">
            <h2>{getTeamLabel(dataset, view.team)}</h2>
            {view.cycle.length > 0 ? (
              <p>
                Path reaches a cycle:{' '}
                {view.cycle.map(String).join(' → ')} → {view.cycle[0]}.
              </p>
            ) : (
              <p>Path ends without a cycle (dead-end in snapshot).</p>
            )}
          </div>

          <DefeatGraphViz dataset={dataset} view={view} onSelectTeam={selectTeam} />

          <ChainViz dataset={dataset} view={view} />

          <ol className="tod-path-list">
            {view.path.map((team, index) => {
              const edge = view.edges[index];
              const inCycle = view.cycleStart >= 0 && index >= view.cycleStart;
              return (
                <li key={`${team}-${index}`} className={inCycle ? 'tod-path-list__cycle' : undefined}>
                  <button type="button" className="tod-path-link" onClick={() => selectTeam(team)}>
                    {getTeamLabel(dataset, team)}
                  </button>
                  {edge && (
                    <span className="tod-path-record">
                      {' '}
                      → {edge.wins}–{edge.losses}
                      {edge.ties != null && edge.ties > 0 ? `–${edge.ties}` : ''} vs {edge.to}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <p className="tod-footnote">
        Metric: official-event head-to-head <strong>worst win%</strong> (not identical to TBA Beta
        “Worst Record” if their formula differs). Tie-break: lower win% → more losses → lower opponent
        number. Inspired by{' '}
        <a
          href="https://www.chiefdelphi.com/t/the-tree-of-defeat/526027"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chief Delphi — The Tree of Defeat
        </a>
        . Rebuild: <code>npm run defeat:rebuild</code> (TBA cache in <code>.cache/tba</code>).
      </p>
    </div>
  );
}
