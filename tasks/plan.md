# Implementation Plan: Tree of Defeat (v1)

## Overview

Ship `/tree-of-defeat` on frc-aides so a visitor can enter a team number, walk the precomputed “worst record against” chain to a loop, see which attractor basin they land in, and share a deep link. v1 covers capability-map **F1–F6** (+ shareable `?team=`). **F7–F20 out of scope.**

Source: [CAPABILITY-MAP-tree-of-defeat.md](../CAPABILITY-MAP-tree-of-defeat.md)

## Architecture Decisions

- Static committed `src/data/defeat-edges.json`; no TBA at browser or `astro build`.
- Worst Record only; official/all-time; TBA Wilson loss-confidence (z=3); tie-break lower opponent #.
- Pure graph lib (outdegree ≤ 1) + Vitest; React island + Astro page mirroring PID Sim.
- TBA rebuild script offline (`TBA_AUTH_KEY`); fixture/snapshot always committed.

## Task List

See [todo.md](todo.md).

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| TBA Worst Record formula drift | Low | Match TBA `confidence(losses, wins)` Wilson z=3 |
| TBA rate limits | High | Commit snapshot; never call TBA at runtime |
| Viz scope creep | Med | Draw queried path only |

## Open Questions

- Exact TBA Beta Stats formula — validate when regenerating with a real key.
