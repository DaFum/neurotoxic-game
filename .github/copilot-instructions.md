# Copilot Instructions — NEUROTOXIC

Consult `AGENTS.md` (root) and `src/*/AGENTS.md` files for domain-specific gotchas.

## Critical Commands

- Logic tests: `npm run test` (uses `node:test` with `tsx`, NOT vitest/jest)
- UI tests: `npm run test:ui` (Vitest)
- Run one logic test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`
- Run one UI test: `npx vitest run tests/<file>.test.jsx`

## Architecture Constraints

- **Version Pinning**: DO NOT upgrade React (19.2.4), Vite (7.3.1), Tailwind (4.2.0), Framer Motion (12.34.3), Tone.js (15.5.0). Do NOT introduce Howler.js.
- **Tailwind v4 syntax**: `bg-(--void-black)` NOT `bg-[var(--void-black)]`. `@import "tailwindcss"` NOT `@tailwind base`.
- **No hardcoded colors**: Use CSS variables (`--toxic-green`, `--void-black`, etc.). In PixiJS use `getPixiColorFromToken('--token-name')`. Full palette is defined in `src/index.css`.
- **State three-way contract**: Adding/changing actions requires updating `ActionTypes` + reducer case + `actionCreators.js` together.
- **State safety**: `player.money` clamped >= 0, `band.harmony` clamped 1–100 via `gameStateUtils.js`. `delta.flags.score` is unsupported by design.
- **Pixi.js v8 destroy**: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })` — always on unmount.

## Audio

- **Tone.js only** — no Howler.js.
- Do NOT re-introduce `audioPlaybackEnded` — use `setlistCompleted` + `isNearTrackEnd` dual-gate.
- For songs with JSON notes, audio is capped to `maxNoteTime + NOTE_TAIL_MS`. Procedural songs use full excerpt duration.
- `AudioManager` uses `audioEngine` facade only — no direct Tone.js access.
- Production requires HTTPS (WebAudio mixed-content policy).

## Gotchas

- `songs.js` is excluded from ESLint.
- Minigame hooks must NOT import PIXI — they return reactive state for StageControllers.
- `useArrivalLogic` owns arrival routing (including direct PREGIG entry) — don't duplicate.
- `START_GIG` resets `gigModifiers` to defaults. `COMPLETE_TRAVEL_MINIGAME` does NOT reset the scene.
- `MODIFIER_COSTS` in `economyEngine.js` is the single source of truth — never re-declare inline.
- Travel deducts fuel liters and food money only. Gas station refuel is the only monetary fuel cost.
- Default chatter limited to `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG` — `GIG` requires explicit entries.
- Audio asset URLs unified through `buildAssetUrlMap` — don't reintroduce `buildMidiUrlMap`.

## Style

- Prettier: single quotes, no semicolons, 2-space indent, no trailing commas
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
