# TS/TSX Migration Finish Plan

## Scope Reviewed
- AGENTS files found: `AGENTS.md` (root only).
- Current migration status snapshot:
  - `src/**/*.js|jsx`: **0** remaining.
  - `// @ts-nocheck` in `src`: **299** files.

## Goal
Remove incremental migration scaffolding (`@ts-nocheck`) and reach stable strict TS/TSX with reproducible CI gates while preserving current gameplay behavior.

## Phase 0 — Baseline & Tracking (1 PR)
1. Add a migration tracker document sectioning `@ts-nocheck` by domain (context, utils, hooks, UI, scenes, audio, minigames).
2. Record baseline command results:
   - `pnpm run typecheck`
   - `pnpm run test:all`
3. Add a simple progress metric in the tracker: `nocheck_count` and target burn-down per phase.

## Phase 1 — Domain Types First (2–3 PRs)
1. Stabilize shared contracts in `src/types/`:
   - game state slices (`player`, `band`, `social`, `gig`, `map`, `minigame`)
   - action payloads used by reducers/action creators
   - audio/song/note contracts
2. Replace duplicated ad-hoc inline object typings with imports from `src/types/*`.
3. Keep runtime unchanged; type-only PRs.

## Phase 2 — State Layer Hardening (3–5 PRs)
1. Remove `@ts-nocheck` from `src/context/actionCreators.ts`, `gameReducer.ts`, `initialState.ts`, and reducer modules in small batches.
2. Enforce action coherence per AGENTS rule: `actionTypes` + reducer case + `actionCreators` updated together.
3. Ensure bounded state updates continue via `gameStateUtils` clamps (`money`, `harmony`).

## Phase 3 — Utils & Audio (3–4 PRs)
1. Remove `@ts-nocheck` in `src/utils/*` by subsystem:
   - core utilities
   - economy/event/save
   - audio engine stack
2. For audio migration, preserve single clock source usage (`audioEngine.getGigTimeMs()` only).
3. Add/expand focused tests around touched utility modules per PR.

## Phase 4 — Hooks & UI Components (4–6 PRs)
1. Migrate hooks in feature slices (travel, gig, post-gig, band HQ, minigames).
2. Migrate UI components by scene cluster to reduce cross-file churn.
3. Ensure i18n calls remain typed and dependency arrays include `t` where used.

## Phase 5 — Scenes & Entry Points (2–3 PRs)
1. Remove `@ts-nocheck` from top-level scenes (`Overworld`, `Gig`, `PreGig`, `PostGig`, `MainMenu`, etc.).
2. Migrate `App.tsx`, `main.tsx`, and routing composition last to avoid blocking parallel PRs.

## Phase 6 — Enforcement & Exit Criteria (1 PR)
1. Gate completion criteria:
   - `@ts-nocheck` count in `src` = **0**
   - `pnpm run typecheck` passes
   - `pnpm run test:all` passes
2. Add CI check to fail on newly introduced `@ts-nocheck` in `src`.
3. Document TS migration completion in release notes/changelog.

## Recommended PR Cadence
- Keep each PR to one domain + one risk surface.
- Prefer type-only or behavior-only changes (not both) in the same PR.
- Require `pnpm run test:all` before merge for every migration PR.
