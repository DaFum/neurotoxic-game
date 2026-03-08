# Neurotoxic — Agent Instructions

## Critical Commands

- Logic tests (`node:test`): `npm run test`
- UI tests (Vitest): `npm run test:ui`
- Run single logic test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`
- Run single UI test: `npx vitest run tests/<file>.test.jsx`

## Architecture Constraints

- **Version Pinning**: Pinned to exact versions: React 19.2.4, Vite 7.3.1, Tailwind 4.2.1, Framer Motion 12.34.5, Tone.js 15.5.6. Node.js 22.13+ required. Do NOT introduce Howler.js.
- **Tailwind v4**: Use `bg-(--void-black)` NOT `bg-[var(--void-black)]`. Use `@import "tailwindcss"` NOT `@tailwind base`.
- **Colors**: Never hardcode colors. Use CSS vars (e.g., `var(--toxic-green)`). In PixiJS, use `getPixiColorFromToken('--token-name')`.
- **State Updates**: Adding actions requires updating `ActionTypes`, the reducer case, and `actionCreators.js` together.
- **State Limits**: Clamp `player.money` >= 0 and `band.harmony` 1–100 via `gameStateUtils.js` helpers.
- **Audio**: The single runtime clock source is `audioEngine.getGigTimeMs()`. Do not access Tone.js directly.
- **I18n**: All user-facing text MUST be localized using `t('key')` or `<Trans>`. Keys must be namespaced (e.g., `ui:button.save`). Provide both `en` and `de` translations.

## Gotchas

- `songs.js` is excluded from ESLint — do not attempt to lint-fix it.
- Never import PIXI in Minigame hooks (`useTourbusLogic`, `useRoadieLogic`). They only return reactive state for StageControllers.
- `useArrivalLogic` owns arrival routing (including direct PREGIG entry for performance nodes).
- `START_GIG` reducer resets `gigModifiers` to defaults; previous gig selections do not carry over.
- `COMPLETE_TRAVEL_MINIGAME` does NOT reset the scene — routing is deferred to `useArrivalLogic`.
- Pixi.js v8 cleanup: Always destroy on unmount using `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
- Audio end dual-gate: Do NOT use `audioPlaybackEnded`. Use `setlistCompleted` + `isNearTrackEnd` instead.
- Note-driven audio end: For songs with JSON notes, OGG/MIDI playback is capped to `maxNoteTime + NOTE_TAIL_MS`. For procedurally-generated songs the full excerpt duration is used.
- `MODIFIER_COSTS` in `economyEngine.js` is the single source of truth for PreGig modifier costs — never re-declare inline.
- Default chatter is limited to `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG` — `GIG` requires explicit conditional entries.
- **Image Loading**: Always use the `loadTexture` utility for dynamic images (especially `gen.pollinations.ai` URLs) to prevent PixiJS parsing errors and test failures.
- **Leaderboards API**: Always resolve song IDs via `SONGS_DB.find().leaderboardId` (API-safe slug) before submitting to `/api/leaderboard/song`. Never submit the raw `currentGig.songId` directly.

## Style & Conventions

- Commits must use Conventional Commits (e.g., `feat:`, `fix:`).

## Localization & Review Update

- Treat all user-facing strings as localized content; use namespaced keys (`ui:*`, `events:*`, etc.) instead of hardcoded text.
- When introducing new i18n keys, update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.
- Keep interpolation placeholders consistent across languages (e.g., `{{cost}}`, `{{location}}`).
- For non-visual error/toast paths, prefer resilient fallbacks (`defaultValue`) so missing keys do not surface raw key names to players.
- In React callbacks/hooks, keep translation usage consistent with hook dependency expectations (`t` included in callback deps when used in callback scope).
- Before merging localization work, run the project test commands (`npm run test` and `npm run test:ui`) and include results in the PR summary.
