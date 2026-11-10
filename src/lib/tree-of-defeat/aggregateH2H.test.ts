import { describe, expect, it } from 'vitest';
import {
  accumulateHeadToHead,
  buildCatalogFromMatches,
  edgesFromHeadToHead,
  tbaMatchToSimple,
  type SimpleMatch,
} from './aggregateH2H';

const sample: SimpleMatch[] = [
  {
    eventType: 0,
    winningAlliance: 'red',
    redTeams: [254, 1678],
    blueTeams: [118, 2056],
  },
  {
    eventType: 0,
    winningAlliance: 'blue',
    redTeams: [254],
    blueTeams: [118],
  },
  {
    eventType: 0,
    winningAlliance: 'blue',
    redTeams: [254],
    blueTeams: [118],
  },
  {
    eventType: 99,
    winningAlliance: 'red',
    redTeams: [254],
    blueTeams: [9999],
  },
];

describe('accumulateHeadToHead', () => {
  it('ignores offseason when officialOnly', () => {
    const table = accumulateHeadToHead(sample, { officialOnly: true });
    expect(table.get(254)?.has(9999)).toBeFalsy();
  });

  it('counts cross-alliance results', () => {
    const table = accumulateHeadToHead(sample, { officialOnly: true });
    const vs118 = table.get(254)?.get(118);
    expect(vs118).toEqual({ opponent: 118, wins: 1, losses: 2, ties: 0 });
  });
});

describe('edgesFromHeadToHead', () => {
  it('emits one worst-record edge per team', () => {
    const table = accumulateHeadToHead(sample, { officialOnly: true });
    const edges = edgesFromHeadToHead(table);
    const from254 = edges.find((e) => e.from === 254);
    expect(from254?.to).toBe(118);
    expect(from254?.wins).toBe(1);
    expect(from254?.losses).toBe(2);
  });
});

describe('buildCatalogFromMatches', () => {
  it('builds schema-ready catalog with successor graph', () => {
    const catalog = buildCatalogFromMatches(sample, {
      teamNames: { '254': 'Cheesy Poofs', '118': 'Robonauts' },
      source: 'unit-test',
    });
    expect(catalog.meta.metric).toBe('worst_record');
    expect(catalog.teams['254']?.name).toBe('Cheesy Poofs');
    expect(catalog.edges.some((e) => e.from === 254 && e.to === 118)).toBe(true);
    expect(catalog.graph['254']).toBe(118);
    expect(catalog.basins?.length).toBeGreaterThan(0);
  });
});

describe('tbaMatchToSimple', () => {
  it('parses TBA alliance keys', () => {
    const simple = tbaMatchToSimple(
      {
        winning_alliance: 'blue',
        alliances: {
          red: { team_keys: ['frc254', 'frc1678'] },
          blue: { team_keys: ['frc118'] },
        },
      },
      0,
    );
    expect(simple).toEqual({
      eventType: 0,
      winningAlliance: 'blue',
      redTeams: [254, 1678],
      blueTeams: [118],
    });
  });

  it('drops frc0 placeholders', () => {
    const simple = tbaMatchToSimple(
      {
        winning_alliance: 'red',
        alliances: {
          red: { team_keys: ['frc254', 'frc0'] },
          blue: { team_keys: ['frc118'] },
        },
      },
      0,
    );
    expect(simple).toEqual({
      eventType: 0,
      winningAlliance: 'red',
      redTeams: [254],
      blueTeams: [118],
    });
  });
});
