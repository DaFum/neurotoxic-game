---
name: pixi-lifecycle-memory-leak-sentinel
description: Audit Pixi.js components for lifecycle correctness and memory cleanup. Use when reviewing PixiStage changes, scene transitions, or suspected memory leaks.
---

# Pixi.js Lifecycle Audit

## Workflow

1. Locate Pixi.js Application creation (e.g., `new Application`).
2. Confirm cleanup on unmount: stop ticker and call `app.destroy` with children/texture/baseTexture.
3. Confirm refs are cleared and container DOM nodes are cleaned up.
4. Check for event listeners or intervals and ensure they are disposed.

## Output

- Report missing cleanup paths.
- Provide the correct cleanup snippet if needed.
