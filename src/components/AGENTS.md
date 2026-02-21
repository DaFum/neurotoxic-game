# AGENTS.md — `src/components/`

Scope: Applies to all files in `src/components/`.

## Purpose

This directory contains gameplay-visible components and high-frequency rendering surfaces.

Nested override: `src/components/stage/AGENTS.md` applies to `src/components/stage/*` and takes precedence there.

Current component groups:

- **Pixi stage integration**: `PixiStage.jsx`, `PixiStageController.js`
- **Gig overlays**: `GigHUD.jsx`, `HecklerOverlay.jsx`, `ChatterOverlay.jsx`
- **Overworld map rendering**: `MapNode.jsx`, `MapConnection.jsx`
- **Session UX widgets**: `ToggleRadio.jsx`, `TutorialManager.jsx`

## Code-Aligned Runtime Contracts

1. `PixiStage` owns controller lifecycle and must always destroy/dispose resources on unmount.
2. `PixiStageController` orchestrates stage managers (`CrowdManager`, `LaneManager`, `EffectManager`, `NoteManager`) and is expected to be resilient to init/dispose failures.
3. `GigHUD` is a presentation/overlay component driven by `stats` and `gameStateRef`; toxic-mode visual state depends on runtime stat flags. **`stats.accuracy` is a required prop** (`PropTypes.number.isRequired`); the "LOW ACC" warning fires when `accuracy < 70`.
4. `ChatterOverlay` consumes a read-only game-state slice and must avoid mutating global game state.
5. `ToggleRadio` controls ambient playback through shared audio control state and must remain lightweight (memoized).

## Editing Rules

1. Keep component APIs stable (props/events). If changed, update all call sites and tests in the same patch.
2. Keep frame-loop logic out of React render paths; place hot-path updates in controller/manager runtime methods.
3. Avoid passing full global state to high-frequency components; pass minimal slices only.
4. Prefer memoization (`memo`, `useMemo`, stable callbacks) where it directly reduces unnecessary re-renders.
5. Do not introduce unsafe DOM sinks or dynamic HTML injection in component rendering paths.

## Performance & Reliability

- Never recreate Pixi app/controller objects on every render.
- Always clean up listeners/tickers/RAF hooks created by components.
- Guard against null refs during mount/unmount race conditions.
- Keep visual overlays deterministic under rapid scene transitions.

## Testing Expectations

When component behavior changes, update/verify relevant tests:

- `tests/PixiStageController.test.js`
- `tests/NoteManager.test.js` (stage manager behavior)
- `tests/GigHUD.test.jsx`
- `tests/ChatterOverlay.test.jsx`
- `tests/performance/pixiStage.bench.js` for perf-sensitive Pixi logic

## Validation Checklist

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-21._
