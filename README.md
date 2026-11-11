# FRC Aides

Browser tools for FIRST programming teams — **PID Simulation** and **Programming Resources** — extracted from [Mantik](https://mantik.netlify.app) and published on GitHub Pages.

## Live site

- https://akhaled247.github.io/frc-aides/
- https://akhaled247.github.io/frc-aides/pid-simulation
- https://akhaled247.github.io/frc-aides/prog-collection
- https://akhaled247.github.io/frc-aides/tree-of-defeat

## Stack

Astro 7 + React 19 + TypeScript (same as Mantik).

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:4321/frc-aides/

## Build

```bash
npm run build
npm run preview
```

## Tree of Defeat

Interactive explorer for “worst record against” chains (Chief Delphi [Tree of Defeat](https://www.chiefdelphi.com/t/the-tree-of-defeat/526027)).

Offline pipeline pulls official TBA matches for every event in a year range, builds one successor edge per team (worst H2H record), and writes a committed graph snapshot to `src/data/defeat-edges.json` (`graph` adjacency + `edges` with W–L + `basins`). The site never calls TBA at runtime.

```bash
cp .env.example .env   # set TBA_AUTH_KEY from https://www.thebluealliance.com/account
npm run test:tree
# Full all-team graph (default years 1992→current; responses cached in .cache/tba):
npm run defeat:rebuild
# Narrow window:
npm run defeat:rebuild -- --years 2018-2025
# Or from a local SimpleMatch[] dump:
npm run defeat:rebuild -- --input path/to/matches.json
```

Metric: official-event head-to-head win%; tie-break lower win% → more losses → lower opponent team number.

## Resource submissions

The prog-collection submit form posts to Mantik's Netlify function (`mantik.netlify.app`). Production builds need `PUBLIC_RECAPTCHA_SITE_KEY` (reCAPTCHA v2 checkbox registered for `akhaled247.github.io`).

## Programming Resources catalog (synced from Mantik)

The prog-collection data file `src/data/resources.json` is **copied automatically** from [itkan-robotics/mantik](https://github.com/itkan-robotics/mantik) when the catalog changes on mantik `main`. Do not edit that file in this repo — changes will be overwritten on the next sync.

To add or update resources, approve a submission issue on mantik or edit `src/data/resources.json` in the mantik repo and merge to `main`.

## License

Tools derived from Mantik (itkan-robotics/mantik). See Mantik for upstream licensing.
