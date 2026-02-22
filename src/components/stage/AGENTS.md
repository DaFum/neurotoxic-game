# AGENTS.md — `src/components/stage/`

Scope: Applies to all stage manager modules in this directory.

## Purpose

These files run performance-critical Pixi stage systems:

- `CrowdManager.js`
- `EffectManager.js`
- `LaneManager.js`
- `NoteManager.js`
- `TourbusStageController.js` (Minigame Renderer)
- `RoadieStageController.js` (Minigame Renderer)
- `utils.js` (Calculations and layout constants)

They are called from `PixiStageController` (or Minigame controllers) and execute inside the gig or minigame render loop.

## Internal-Only Symbols (do not re-export)

The following symbols are used only within their own file and must not be exported:

- **`utils.js`**: `calculateCrowdY`, `calculateLaneStartX` — internal helpers called by `buildRhythmLayout` and `CrowdManager`. External callers should use `buildRhythmLayout` / `calculateCrowdOffset`.
- **`LaneManager.js`**: `LANE_BASE_FILL`, `LANE_BORDER_COLOR`, `HIT_BAR_INACTIVE_ALPHA`, `HIT_BAR_ACTIVE_ALPHA`, `HIT_BAR_BORDER_COLOR` — rendering constants used only inside `LaneManager`.

## Best Practices

1. Keep per-frame work minimal and deterministic.
2. Reuse sprites/graphics via pooling; avoid frequent allocations.
3. Isolate side effects to manager lifecycle methods (`init`, `update`, `dispose`).
4. Keep gameplay timing authority in hooks/utils, not duplicated in managers.
5. Resolve Pixi colors through token helpers (for example `getPixiColorFromToken`) rather than hardcoded numeric literals.

## Safety & Stability

- Always guard against missing textures/containers during initialization.
- Ensure `dispose()` fully detaches listeners and destroys display objects to prevent leaks.
- Never inject HTML or use DOM sinks from these modules.

## Visual Reliability

- Keep lane geometry and hit-line bars visibly readable against dark venue backgrounds (including inactive state) so Gig input lanes remain perceivable at all times.

## Validation

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-21._
