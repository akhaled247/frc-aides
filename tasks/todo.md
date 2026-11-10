# Tree of Defeat — Task Checklist

## Phase 1: Foundation

- [x] Task 1: Zod schema + hand defeat-edges fixture from CD thread examples
- [x] Task 2: Pure graph path/cycle/basin helpers + Vitest

### Checkpoint: Foundation

- [x] Graph + schema tests pass (`npm run test:tree` — 19 tests)

## Phase 2: Explorer

- [x] Task 3: Dataset loader + TreeOfDefeatApp path/loop/basin UI
- [x] Task 4: Astro page, CSS, navigation, landing card, `?team=` deep link
- [x] Task 5: Path chain visualization with cycle highlight

### Checkpoint: Core

- [x] `npm run build` succeeds (`/tree-of-defeat/index.html`)
- [ ] Manual: `/tree-of-defeat?team=254` shows path + loop + basin

## Phase 3: Ingest

- [x] Task 6: TBA offline H2H → Worst Record rebuild script (+ aggregation unit tests)
- [x] Task 7: `npm run defeat:rebuild` + README notes; committed hand snapshot
- [x] Refactor: successor `graph` + `basins` in catalog; disk-cached TBA client (2005→current)
- [x] Live TBA pull for all teams (2005–2025 → 7568-node graph, 3 basins)

### Checkpoint: Complete

- [x] All v1 acceptance themes met (fixture-backed)
- [ ] Ready for review / commit (ask before commit)
