---
name: pixi-lifecycle-memory-leak-sentinel
description: Audit Pixi.js components for lifecycle correctness and memory cleanup. Use when reviewing PixiStage changes, scene transitions, or suspected memory leaks.
---

# Pixi.js Lifecycle Audit

## Key Files

- `src/components/PixiStage.jsx` — main Pixi.js Application mount point (React component)
- `src/components/PixiStageController.js` — orchestrates Pixi stage lifecycle
- `src/utils/pixiStageUtils.js` — Pixi utility helpers for setup/teardown
- `src/scenes/Gig.jsx` — scene that hosts the rhythm game Pixi stage
- `tests/pixiStageUtils.test.js` — existing tests for Pixi utilities

## Workflow

1. Read `PixiStage.jsx` and locate `new Application()` creation — verify it runs inside a `useEffect` with proper cleanup.
2. Confirm the cleanup return function calls `app.destroy({ children: true, texture: true, baseTexture: true })` and stops the ticker.
3. Check `PixiStageController.js` for refs — confirm they are nulled on unmount.
4. Verify `Gig.jsx` scene transitions don't leave orphaned Pixi instances (check unmount path).
5. Check for `addEventListener`, `setInterval`, or `requestAnimationFrame` calls and ensure they are disposed.

## Output

- Report missing cleanup paths with file and line references.
- Provide the correct cleanup snippet if needed.

## Related Skills

- `webaudio-reliability-fixer` — audio leaks often accompany Pixi lifecycle issues
- `perf-budget-enforcer` — memory leaks directly impact performance budgets
