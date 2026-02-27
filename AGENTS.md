# NEUROTOXIC — Agent Instructions

## Critical Commands

- Test (logic): `npm run test` (uses `node:test` with `tsx`, NOT `vitest` or `jest`)
- Test (UI): `npm run test:ui` (uses Vitest for React components)
- Run one logic test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`
- Run one UI test: `npx vitest run tests/<file>.test.jsx`
- Lint: `npm run lint` — Build: `npm run build`

## Architecture Constraints

- **Version Pinning**: DO NOT upgrade React (19.2.4), Vite (7.3.1), Tailwind (4.2.0), Framer Motion (12.34.3), Tone.js (15.5.0). Do NOT introduce Howler.js.
- **Tailwind v4 syntax**: Use `bg-(--void-black)` NOT `bg-[var(--void-black)]`. Use `@import "tailwindcss"` NOT `@tailwind base`.
- **No hardcoded colors**: CSS uses `var(--toxic-green)`, `var(--void-black)`, etc. In PixiJS use `getPixiColorFromToken('--token-name')`.
- **State three-way contract**: Adding/changing actions requires updating `ActionTypes` + reducer case + `actionCreators.js` together.
- **State safety**: `player.money` clamped >= 0, `band.harmony` clamped 1–100 via helpers in `gameStateUtils.js`. `delta.flags.score` is intentionally unsupported.
- **Pixi.js v8 destroy**: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
- **Audio end gate**: Do NOT re-introduce `audioPlaybackEnded` — use `setlistCompleted` + `isNearTrackEnd` dual-gate instead.
- **Economy**: Travel deducts fuel liters and food money only. Gas station refuel is the only monetary fuel cost. `MODIFIER_COSTS` in `economyEngine.js` is the single source of truth for PreGig modifier costs.
- **Internationalization (I18n)**: All user-facing text MUST be localized. Use `t('key')` or `<Trans>`. Hardcoded English strings are forbidden. Keys must be namespaced (e.g., `ui:button.save`). Both English (`en`) and German (`de`) translations must be provided for every new key.

## Gotchas

- `songs.js` is excluded from ESLint — don't try to lint-fix it.
- Minigame hooks (`useTourbusLogic`, `useRoadieLogic`) must NOT import PIXI or touch DOM — they return reactive state for StageControllers.
- `useArrivalLogic` owns arrival routing (including direct PREGIG entry for performance nodes) — don't duplicate this in minigame hooks.
- `START_GIG` reducer resets `gigModifiers` to defaults — previous gig selections don't carry over.
- Stage `utils.js` exports like `calculateCrowdY` and `calculateLaneStartX` are internal — use `buildRhythmLayout` / `calculateCrowdOffset` instead.
- For songs with JSON notes, audio is capped to `maxNoteTime + NOTE_TAIL_MS` (1s tail). Procedurally-generated songs use full excerpt duration.
- `useRhythmGameAudio` merges `calculateGigPhysics` multipliers into `gameStateRef.current.modifiers` — the scoring hook reads them from there, don't re-derive.
- Production requires HTTPS (WebAudio mixed-content policy).
- Default chatter is limited to `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG` — `GIG` requires explicit conditional entries.

## Style

- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- Prettier: single quotes, no semicolons, 2-space indent, no trailing commas
- Components: PascalCase. Functions/variables: camelCase. Constants: SCREAMING_SNAKE_CASE.
