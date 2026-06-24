# FRC Aides

Browser tools for FIRST programming teams — **PID Simulation** and **Programming Resources** — extracted from [Mantik](https://mantik.netlify.app) and published on GitHub Pages.

## Live site

- https://akhaled247.github.io/frc-aides/
- https://akhaled247.github.io/frc-aides/pid-simulation
- https://akhaled247.github.io/frc-aides/prog-collection

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

## Resource submissions

The prog-collection submit form posts to Mantik's Netlify function (`mantik.netlify.app`). Production builds need `PUBLIC_RECAPTCHA_SITE_KEY` (reCAPTCHA v2 checkbox registered for `akhaled247.github.io`).

## Programming Resources catalog (synced from Mantik)

The prog-collection data file `src/data/resources.json` is **copied automatically** from [itkan-robotics/mantik](https://github.com/itkan-robotics/mantik) when the catalog changes on mantik `main`. Do not edit that file in this repo — changes will be overwritten on the next sync.

To add or update resources, approve a submission issue on mantik or edit `src/data/resources.json` in the mantik repo and merge to `main`.

## License

Tools derived from Mantik (itkan-robotics/mantik). See Mantik for upstream licensing.
