# CLAUDE.md

## Critical Commands

```bash
npm run test       # Logic tests (node:test, NOT vitest/jest)
npm run test:ui    # UI tests (Vitest for React components)
npm run test:all   # Both
npm run lint       # ESLint
npm run build      # Production build
```

Run one logic test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`
Run one UI test: `npx vitest run tests/<file>.test.jsx`

## Architecture Constraints

- **Version Pinning**: DO NOT upgrade React (19.2.4), Vite (7.3.1), Tailwind (4.2.0), Framer Motion (12.34.3), Tone.js (15.5.0). Do NOT introduce Howler.js. Node.js 22.3+ required.
- **Tailwind v4 syntax**: `bg-(--void-black)` NOT `bg-[var(--void-black)]`. `@import "tailwindcss"` NOT `@tailwind base`.
- **No hardcoded colors**: Use CSS variables (`--toxic-green`, `--void-black`, etc.). In PixiJS use `getPixiColorFromToken('--token-name')`.
- **State three-way contract**: Adding/changing actions requires updating `ActionTypes` + reducer case + `actionCreators.js` together.
- **State safety**: `player.money` clamped >= 0, `band.harmony` clamped 1–100 via helpers in `gameStateUtils.js`. `delta.flags.score` is intentionally unsupported.
- **Pixi.js v8 destroy**: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })` — always on unmount.
- **Internationalization (I18n)**: All user-facing text MUST be localized. Use `t('key')` or `<Trans>`. Hardcoded English strings are forbidden. Keys must be namespaced (e.g., `ui:button.save`). Both English (`en`) and German (`de`) translations must be provided for every new key.

## Audio

- **Tone.js only** — do NOT introduce Howler.js.
- **Audio end dual-gate**: Do NOT re-introduce `audioPlaybackEnded`. Use `setlistCompleted` + `isNearTrackEnd` instead. When the last song's `onEnded` fires, `totalDuration` is snapped to the current frozen gig-clock value.
- **Note-driven audio end**: For songs with JSON notes, OGG/MIDI playback is capped to `maxNoteTime + NOTE_TAIL_MS` so music stops when bars finish falling. For procedurally-generated songs (no JSON notes) the full excerpt duration is used.
- **AudioManager** consumes state strictly through `audioEngine` facade — no direct Tone.js access. Use `audioEngine.getGigTimeMs()` as the single runtime clock source.
- Production requires HTTPS (WebAudio mixed-content policy).

## Economy

- Travel deducts fuel liters and food money only. Gas station refuel is the only monetary fuel cost.
- `MODIFIER_COSTS` in `economyEngine.js` is the single source of truth for PreGig modifier costs — never re-declare inline.

## Gotchas

- `songs.js` is excluded from ESLint — don't try to lint-fix it.
- Minigame hooks (`useTourbusLogic`, `useRoadieLogic`) must NOT import PIXI — they return reactive state for StageControllers.
- `useArrivalLogic` owns arrival routing (including direct PREGIG entry for performance nodes) — don't duplicate elsewhere.
- `START_GIG` reducer resets `gigModifiers` to defaults — previous gig selections don't carry over.
- `COMPLETE_TRAVEL_MINIGAME` does NOT reset the scene — routing is deferred to `useArrivalLogic`.
- Default chatter is limited to `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG` — `GIG` requires explicit conditional entries.
- `useRhythmGameAudio` merges `calculateGigPhysics` multipliers into `gameStateRef.current.modifiers` — scoring hook reads them from there, don't re-derive.
- Stage `utils.js` exports like `calculateCrowdY` and `calculateLaneStartX` are internal — use `buildRhythmLayout` / `calculateCrowdOffset`.
- Audio asset URLs are unified through `buildAssetUrlMap` — don't reintroduce `buildMidiUrlMap`.
- Heavy scenes are lazy-loaded via `createNamedLazyLoader` in `App.jsx`.

## Style

- Prettier: single quotes, no semicolons, 2-space indent, no trailing commas, arrow parens: avoid.
- ESLint ignores `dist/` and `src/data/songs.js`. `no-unused-vars` warns (allows `_` prefix).
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
