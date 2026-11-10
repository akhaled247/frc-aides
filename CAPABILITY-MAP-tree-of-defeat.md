# Capability Map: Tree of Defeat

Source: [Chief Delphi — The Tree of Defeat](https://www.chiefdelphi.com/t/the-tree-of-defeat/526027) (posts 1–35)

## Objective

Interactive browser tool that follows each FRC team’s “worst record against” edge (TBA-style), builds the resulting directed graph, and lets anyone see which defeat-tree / loop their team falls into — the Chart Party / “all roads lead to Philosophy” toy the thread asked for.

## Assumptions (correct me before module specs)

1. This ships as a **new frc-aides app** alongside PID Sim and Prog Collection (not a separate site).
2. Default edge metric is TBA Beta **Worst Record** (not Most Losses / Statbotics / Brennan Bibic “Worst Matchup”), because that is what OP used for the 2062 tree.
3. Default match set is **official events only** (OP confirmed off-seasons excluded).
4. Edges are **precomputed offline** and shipped as static data (or refreshed on a schedule) so the site does not hammer TBA live per visitor ([Amicus1](https://www.chiefdelphi.com/t/the-tree-of-defeat/526027/13)).
5. Career / all-time cumulative records are the v1 time window (not single-season), matching how people browsed TBA Stats.
6. Visualization tone is playful data-story (Chart Party / Side Quest), not a dense analytics dashboard.

---

## Module table

| Module id | Responsibility | Depends on |
|---|---|---|
| `defeat-data` | Ingest TBA (or equivalent) H2H records; emit one outgoing “defeat edge” per team under chosen metric/filters | — |
| `defeat-graph` | Build digraph; detect loops, trees/basins, path-to-loop, in-degree hubs; answer queries offline | `defeat-data` |
| `defeat-explorer` | Team lookup → path list, loop highlight, depth-to-cycle, shareable URL | `defeat-graph` |
| `defeat-viz` | Full-graph / basin visualization (Chart Party–style) | `defeat-graph`, `defeat-explorer` |
| `defeat-metrics` | Metric & filter controls (worst record vs most losses, offseason, season window, ties) | `defeat-data`, `defeat-graph`, `defeat-explorer` |

**Build order:** `defeat-data` → `defeat-graph` → `defeat-explorer` → `defeat-viz`, `defeat-metrics`

---

## Feature list (from the thread)

### Must-have (v1) — thread’s core ask

| ID | Feature | Thread cue | Module |
|---|---|---|---|
| F1 | **Team path lookup** — enter team # → show ordered chain until a team repeats | OP: “check your team’s path” | `defeat-explorer` |
| F2 | **Loop detection** — mark the cycle start/end and list cycle members | OP loops; NateJay 694↔1796; Beach Bots 330↔294 | `defeat-graph`, `defeat-explorer` |
| F3 | **Worst-record edges** — one successor per team using TBA “worst record” | OP method; MonsTR440 clarifies metric | `defeat-data` |
| F4 | **Bulk precompute** — compute all team→nemesis edges once; ship/query locally | Amicus1: query once, then analyze graph | `defeat-data`, `defeat-graph` |
| F5 | **Basin / tree identity** — label which attractor loop a team drains into (e.g. 2062 loop vs outliers) | OP: most roads → 2062; outliers 1418 / 2974 | `defeat-graph`, `defeat-explorer` |
| F6 | **Website chart** — interactive page that charts chains (not a spreadsheet/doc) | Herringbone: “website charting this out”; NateJay: “vibecoded tool” | `defeat-explorer`, `defeat-viz` |

### Should-have (v1.1) — questions the thread kept hitting

| ID | Feature | Thread cue | Module |
|---|---|---|---|
| F7 | **Metric switch** — Worst Record vs Most Losses (and show that graphs differ) | Zook: same start team, different loops; MonsTR440: worst-record loops less | `defeat-metrics` |
| F8 | **Off-season toggle** — include/exclude off-season matches | Dee9277 asks; OP says no | `defeat-metrics` |
| F9 | **Hub ranking** — teams with most inbound “defeat” edges (67, 254, 2056 called out) | MonsTR440 on high-link teams | `defeat-graph`, `defeat-viz` |
| F10 | **Multi-tree catalog** — list all distinct attractor loops + how many teams feed each | OP: “how many different trees exist?” | `defeat-graph`, `defeat-explorer` |
| F11 | **Shareable path URL** — `/tree-of-defeat?team=254` deep link | Implied by “check your team” social use | `defeat-explorer` |
| F12 | **Record detail on edge** — W–L (and %) for the chosen nemesis | Christopher149 / NateJay comparing W–L | `defeat-explorer` |

### Nice-to-have (v2) — stretch from discussion

| ID | Feature | Thread cue | Module |
|---|---|---|---|
| F13 | **Season / era scrubber** — rebuild graph for a year or year-range; watch loops migrate | jnesselr: “how that changes over time” | `defeat-metrics`, `defeat-data` |
| F14 | **Chart Party full-map viz** — zoomable whole-graph or per-basin tree layout | Herringbone Chart Party wish; pigrammer Side Quest vibe | `defeat-viz` |
| F15 | **Confidence / alternate rankings** — TBA confidence or Statbotics-style edge | MonsTR440 on TBA confidence looping less | `defeat-metrics` |
| F16 | **Best-record twin** — “Tree of Triumph” (best record *against* / *with*) | OP also peeked at best-record | `defeat-metrics` |
| F17 | **District / region overlay** — explain closed-district loops | zp2974 district hypothesis | `defeat-viz` |
| F18 | **Tie policy UI** — document & optionally choose how ties break (losses, then %, then team #) | Christopher149 mutual/tied cases | `defeat-data`, `defeat-metrics` |
| F19 | **Export** — download edge list / basin membership CSV/JSON for nerds | Amicus1 automation spirit | `defeat-graph` |
| F20 | **Compare two teams** — do they share a basin? where do paths meet? | Natural follow-on to path lookup | `defeat-explorer` |

### Explicit non-goals (for now)

- Live per-request TBA scraping in the browser
- Predicting future matches / Elo-EPA modeling beyond the joke framing
- Replacing TBA Beta Stats UI itself
- Crowdsourced manual chain docs as the source of truth (OP’s Google doc stays inspiration only)

---

## Suggested acceptance themes (for later module specs)

- Given team `T`, path is deterministic for a frozen dataset + metric + filters.
- Every team with data reaches a detected cycle in finite steps; no silent truncation.
- Switching Most Losses vs Worst Record can change basin membership (regression fixtures from thread examples: 4276, 694, 254→2062).
- Site works with static hosting (GitHub Pages), same as existing frc-aides apps.

---

## Open questions

1. **Host:** Confirm new route under frc-aides (e.g. `/tree-of-defeat`) vs Mantik vs standalone?
2. **Data rights / TBA:** Use official TBA API + auth key in CI for rebuilds, or only public beta Stats exports?
3. **v1 metric lock:** Ship Worst Record only first, or Worst Record + Most Losses day one?
4. **Active teams only?** Include inactive/historical teams in the graph, or filter to recent seasons?
5. **Tie-break rule:** When two opponents tie on the metric, what is the canonical successor?

---

## Gate

**Phase 0 complete when you approve** module boundaries, build order, and which feature IDs are in/out for v1.

After approval, next step is **Phase 1 Specify** per module in build order (starting with `defeat-data`), not planning or code in the same turn.
