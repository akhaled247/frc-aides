/**
 * Pull official TBA matches for all events in a year range, build the
 * all-team worst-record successor graph, write src/data/defeat-edges.json.
 *
 * Usage:
 *   TBA_AUTH_KEY=... npm run defeat:rebuild
 *   npm run defeat:rebuild -- --years 2015-2026
 *   npm run defeat:rebuild -- --input path/to/matches.json
 *   npm run defeat:rebuild -- --from 1992 --to 2026
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCatalogFromMatches,
  countTeamsReachingCycles,
  tbaMatchToSimple,
  type SimpleMatch,
} from '../src/lib/tree-of-defeat/aggregateH2H';
import { defeatEdgesCatalogSchema } from '../src/lib/tree-of-defeat/schema';
import { loadEnvFile, TbaClient, yearRange } from './tba/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, 'src/data/defeat-edges.json');
const CACHE = path.resolve(ROOT, '.cache/tba');

interface Args {
  years: number[];
  input: string;
  dryRun: boolean;
  skipNames: boolean;
}

function parseYearsToken(token: string): number[] {
  if (token.includes('-') && !token.includes(',')) {
    const [a, b] = token.split('-').map((x) => Number(x.trim()));
    if (Number.isFinite(a) && Number.isFinite(b) && a && b) {
      return yearRange(Math.min(a, b), Math.max(a, b));
    }
  }
  return token
    .split(',')
    .map((y) => Number(y.trim()))
    .filter((y) => Number.isFinite(y));
}

function parseArgs(argv: string[]): Args {
  const currentYear = new Date().getUTCFullYear();
  const args: Args = {
    years: yearRange(1992, currentYear),
    input: '',
    dryRun: false,
    skipNames: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? '';
    if (a === '--input') args.input = argv[++i] ?? '';
    else if (a === '--years') args.years = parseYearsToken(argv[++i] ?? '');
    else if (a === '--from') {
      const from = Number(argv[++i]);
      const to = args.years[args.years.length - 1] ?? currentYear;
      args.years = yearRange(from, to);
    } else if (a === '--to') {
      const to = Number(argv[++i]);
      const from = args.years[0] ?? 1992;
      args.years = yearRange(from, to);
    } else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--skip-names') args.skipNames = true;
    else if (!a.startsWith('-') && a.endsWith('.json') && !args.input) args.input = a;
    else if (!a.startsWith('-') && /^\d{4}([-,]\d{4})*$/.test(a)) args.years = parseYearsToken(a);
  }
  return args;
}

type TbaEvent = { key: string; event_type: number; name?: string };
type TbaMatch = {
  winning_alliance?: string;
  alliances?: {
    red?: { team_keys?: string[] };
    blue?: { team_keys?: string[] };
  };
};
type TbaTeamSimple = { key: string; team_number: number; nickname?: string; name?: string };

async function loadMatchesFromTba(client: TbaClient, years: number[]): Promise<SimpleMatch[]> {
  const matches: SimpleMatch[] = [];
  let eventCount = 0;
  for (const year of years) {
    const events = await client.getJson<TbaEvent[]>(`/events/${year}/simple`);
    const official = events.filter((e) => e.event_type >= 0 && e.event_type <= 5);
    console.log(`Year ${year}: ${official.length} official events (${events.length} total)`);
    for (const event of official) {
      eventCount += 1;
      const eventMatches = await client.getJson<TbaMatch[]>(`/event/${event.key}/matches/simple`);
      for (const m of eventMatches) {
        const simple = tbaMatchToSimple(m, event.event_type);
        if (simple) matches.push(simple);
      }
      if (eventCount % 25 === 0) {
        console.log(`  … ${eventCount} events, ${matches.length} matches so far`);
      }
    }
  }
  console.log(`Fetched ${matches.length} matches across ${eventCount} events`);
  return matches;
}

async function loadTeamNames(
  client: TbaClient,
  teamNumbers: number[],
): Promise<Record<string, string>> {
  const wanted = new Set(teamNumbers);
  const names: Record<string, string> = {};
  for (let page = 0; page < 30; page++) {
    const teams = await client.getJson<TbaTeamSimple[]>(`/teams/${page}/simple`);
    if (!teams.length) break;
    for (const team of teams) {
      if (!wanted.has(team.team_number)) continue;
      names[String(team.team_number)] = team.nickname || team.name || `Team ${team.team_number}`;
    }
    if (Object.keys(names).length >= wanted.size) break;
  }
  return names;
}

async function main() {
  loadEnvFile(path.join(ROOT, '.env'));
  const args = parseArgs(process.argv.slice(2));
  let matches: SimpleMatch[] = [];
  let source = 'aggregateH2H';
  let years = args.years;

  if (args.input) {
    matches = JSON.parse(readFileSync(path.resolve(args.input), 'utf8')) as SimpleMatch[];
    source = `input:${path.basename(args.input)}`;
    years = [];
  } else {
    const key = process.env.TBA_AUTH_KEY?.trim();
    if (!key) {
      console.error(
        'Missing TBA_AUTH_KEY. Set it in the environment or in .env (see .env.example).\n' +
          'Get a Read API key: https://www.thebluealliance.com/account',
      );
      process.exit(1);
    }
    const client = new TbaClient({ authKey: key, cacheDir: CACHE });
    console.log(`Building all-team defeat graph for years ${years[0]}–${years[years.length - 1]}…`);
    matches = await loadMatchesFromTba(client, years);
    source = `tba:${years[0]}-${years[years.length - 1]}`;

    let teamNames: Record<string, string> = {};
    const catalogDraft = buildCatalogFromMatches(matches, { source, years });
    if (!args.skipNames) {
      console.log(`Loading nicknames for ${catalogDraft.meta.teamCount} teams…`);
      teamNames = await loadTeamNames(
        client,
        Object.values(catalogDraft.teams).map((t) => t.number),
      );
    }

    const catalog = defeatEdgesCatalogSchema.parse(
      buildCatalogFromMatches(matches, {
        source,
        years,
        teamNames,
        generatedAt: new Date().toISOString(),
      }),
    );

    const reach = countTeamsReachingCycles(catalog.edges);
    console.log(
      `Graph: ${Object.keys(catalog.graph).length} successors, ${catalog.basins?.length ?? 0} basins, ` +
        `${reach.withCycle} teams reach a cycle, ${reach.deadEnds} dead-ends`,
    );

    if (args.dryRun) {
      console.log('Dry run — not writing file.');
      return;
    }

    writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${OUT}`);
    return;
  }

  const catalog = defeatEdgesCatalogSchema.parse(
    buildCatalogFromMatches(matches, {
      source,
      years: years.length ? years : undefined,
      generatedAt: new Date().toISOString(),
    }),
  );
  console.log(
    `Built ${catalog.edges.length} edges / ${Object.keys(catalog.graph).length} graph nodes from ${matches.length} matches (${source}).`,
  );
  if (args.dryRun) {
    console.log('Dry run — not writing file.');
    return;
  }
  writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
