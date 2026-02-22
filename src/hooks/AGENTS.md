# AGENTS.md — `src/hooks/`

Scope: Applies to all files in `src/hooks/`.

Nested overrides:
- `src/hooks/rhythmGame/AGENTS.md` for `src/hooks/rhythmGame/*`
- `src/hooks/minigames/AGENTS.md` for `src/hooks/minigames/*`

## Purpose

Hooks orchestrate gameplay state transitions, side effects, and cross-module coordination.

Current top-level hooks:

- `useTravelLogic.js`
- `useArrivalLogic.js`
- `usePurchaseLogic.js`
- `useAudioControl.js`
- `useRhythmGameLogic.js`

## Code-Aligned Rules

1. Keep hooks orchestration-focused; avoid embedding presentation logic.
2. Keep cleanup robust (timers, listeners, RAF, audio/session resources).
3. Keep return contracts stable unless all consumers are updated in the same patch.
4. Route persistent/global state updates through context actions.
5. Prevent duplicate scene transitions from concurrent completion paths.

## Key Return Contracts

- **`useRhythmGameLogic.js`** `stats` memo includes `accuracy` (0–100) alongside `score`, `combo`, `health`, `overload`, `isToxicMode`, `isGameOver`, and `isAudioReady`. `GigHUD` and any consumer that renders the "LOW ACC" warning depend on this field being present and numeric.

## Guardrails

- Respect global state safety (`money >= 0`, `harmony >= 1` after reducer clamping).
- Keep gig completion deterministic (`POSTGIG` transition from a single resolved path).
- Avoid direct DOM mutation except where listener wiring requires it.

## Validation & Test Targets

When hook logic changes, verify relevant suites:

- `tests/useTravelLogic.test.js`
- `tests/usePurchaseLogic.test.js`
- `tests/useAudioControl.test.js`
- `tests/useRhythmGameLogic.test.js`

Then run:

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-21._
