# AGENTS.md — `src/components/stage/`

Scope: Applies to all stage manager modules in this directory.

## Purpose

These files run performance-critical Pixi stage systems:

- `CrowdManager.js`
- `EffectManager.js`
- `LaneManager.js`
- `NoteManager.js`

They are called from `PixiStageController` and execute inside the gig render loop.

## Best Practices

1. Keep per-frame work minimal and deterministic.
2. Reuse sprites/graphics via pooling; avoid frequent allocations.
3. Isolate side effects to manager lifecycle methods (`init`, `update`, `dispose`).
4. Keep gameplay timing authority in hooks/utils, not duplicated in managers.

## Safety & Stability

- Always guard against missing textures/containers during initialization.
- Ensure `dispose()` fully detaches listeners and destroys display objects to prevent leaks.
- Never inject HTML or use DOM sinks from these modules.

## Validation

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-23._
