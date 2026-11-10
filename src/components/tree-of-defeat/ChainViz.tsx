import { getTeamLabel, type DefeatDataset, type TeamPathView } from '@/lib/tree-of-defeat/getDefeatDataset';

interface Props {
  dataset: DefeatDataset;
  view: TeamPathView;
}

export default function ChainViz({ dataset, view }: Props) {
  const cycleSet = new Set(view.cycle);

  return (
    <div className="tod-chain" role="img" aria-label="Defeat chain visualization">
      {view.path.map((team, index) => {
        const isRepeat = index === view.path.length - 1 && view.cycleStart >= 0;
        const inCycle = cycleSet.has(team) && (index >= view.cycleStart || isRepeat);
        const edge = index < view.path.length - 1 ? view.edges[index] : null;

        return (
          <div className="tod-chain-step" key={`${team}-${index}`}>
            <div
              className={[
                'tod-chain-node',
                inCycle ? 'tod-chain-node--cycle' : '',
                index === 0 ? 'tod-chain-node--start' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="tod-chain-num">{team}</span>
              <span className="tod-chain-name">
                {dataset.catalog.teams[String(team)]?.name ?? 'Unknown'}
              </span>
            </div>
            {edge && (
              <div className="tod-chain-edge" aria-hidden="true">
                <span className="tod-chain-wl">
                  {edge.wins}–{edge.losses}
                  {edge.ties ? `–${edge.ties}` : ''}
                </span>
                <span className="tod-chain-arrow">→</span>
              </div>
            )}
            {isRepeat && (
              <span className="tod-chain-loop-tag">loop</span>
            )}
          </div>
        );
      })}
      <p className="tod-chain-caption">
        Start {getTeamLabel(dataset, view.team)}
        {view.cycle.length > 0
          ? ` · cycle ${view.cycle.join(' → ')}`
          : ' · no cycle'}
      </p>
    </div>
  );
}
