---
name: min-repro-builder
description: Build a minimal reproducible case inside the repo to isolate bugs (audio, assets, rendering). Use when asked to create a small repro or debugging playground.
---

# Minimal Repro Builder

## Key Files

- `src/scenes/` — scene components (use an existing scene as a starting point)
- `src/main.jsx` — app entry point (can temporarily route to repro scene)
- `src/utils/logger.js` — use for structured repro logging
- `src/assets/` — reuse existing MIDI and image assets
- `src/context/initialState.js` — default state for repro setup

## Workflow

1. Identify the smallest scene or route to reproduce the issue (check `src/scenes/AGENTS.md` for flow).
2. Reuse existing assets from `src/assets/` and `public/` — do not add new files.
3. Set up minimal state using `initialState.js` values.
4. Add concise logging via `logger.js` and cleanup code.
5. Document how to run the repro (`npm run dev` and navigate to the relevant route).

## Output

- Provide the new file locations and reproduction steps.

## Related Skills

- `debug-ux-upgrader` — for adding debug overlays to the repro
- `audio-debugger-ambient-vs-gig` — for audio-specific repro cases
