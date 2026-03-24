# Neurotoxic — Agent Instructions

## Critical Commands

- Logic tests (`node:test`): `pnpm run test`
- UI tests (Vitest): `pnpm run test:ui`
- Run single logic test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`
- Run single UI test: `pnpm dlx vitest run tests/<file>.test.jsx`

## Architecture Constraints

- **Version Pinning**: Pinned: React 19.2.4, Vite 8.0.1, Tailwind 4.2.2, Framer Motion 12.38.0, Tone.js 15.5.6. Node.js 22.13+ required. Do NOT introduce Howler.js.
- **Tailwind v4**: Use `@import "tailwindcss"` (not `@tailwind base`). For non-color tokens (e.g., z-index `--z-*`), use `z-(--z-crt)` or `style={{ zIndex: 'var(--z-crt)' }}`.
- **Colors**: Never hardcode. Use CSS vars (`var(--color-toxic-green)`). In PixiJS: `getPixiColorFromToken('--toxic-green')` (omit `--color-` prefix).
- **State Updates**: Adding actions requires updating `ActionTypes`, the reducer case, and `actionCreators.js` together. Only use Action Creators — never call reducers directly.
- **State Limits**: Clamp `player.money` >= 0 and `band.harmony` 1–100 via `gameStateUtils.js` helpers.
- **Audio**: Use `audioEngine.getGigTimeMs()` as the single clock source. Do not access Tone.js directly.
- **I18n**: All user-facing text via `t('key')` or `<Trans>`, namespaced (e.g., `ui:button.save`). Update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.

## Testing

- `node:test` for `.js` logic files; `vitest` exclusively for `.jsx` React/UI components. Do not mix.
- In Vitest: mock `window.localStorage.setItem` wrapped in `try/finally`. For `react-i18next`, include `initReactI18next: { type: '3rdParty', init: () => {} }`.
- Explicitly populate lookup Maps (e.g., `SONGS_BY_ID`) in mocked data.

## Style & Conventions

- Commits must use Conventional Commits (e.g., `feat:`, `fix:`).

## Gotchas

- `songs.js` is excluded from ESLint — do not lint-fix it.
- Never import PIXI in Minigame hooks (`useTourbusLogic`, `useRoadieLogic`). They return reactive state only.
- `useArrivalLogic` owns arrival routing (including direct PREGIG entry for performance nodes).
- `START_GIG` resets `gigModifiers` to defaults; previous gig selections do not carry over.
- `COMPLETE_TRAVEL_MINIGAME` does NOT reset the scene — routing deferred to `useArrivalLogic`.
- Pixi.js v8 cleanup: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.
- Audio end: Do NOT use `audioPlaybackEnded`. Use `setlistCompleted` + `isNearTrackEnd`.
- Songs with JSON notes: OGG/MIDI capped to `maxNoteTime + NOTE_TAIL_MS`. Procedural songs use full excerpt duration.
- `MODIFIER_COSTS` in `economyEngine.js` is the single source of truth for PreGig costs — never re-declare inline.
- Default chatter scenes: `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG` only — `GIG` requires explicit conditional entries.
- Dynamic images: Use `loadTexture` utility (especially `gen.pollinations.ai` URLs) — prevents PixiJS parsing errors.
- Leaderboards: Resolve song IDs via `SONGS_BY_ID.get().leaderboardId` before submitting to `/api/leaderboard/song`. Never use raw `currentGig.songId`.
- React 19: Pass `ref` as a standard prop — do not use `React.forwardRef()`.
- `hqItems.js` uses a singular `effect` object. `events/special.js` events require unique IDs, `category: 'special'`, `events:` i18n keys, and an `options` array.
- Consumables use `inventory_add` effect and must NOT display as 'OWNED' (multi-purchase allowed).
- Success toasts for bounded state changes must show the actual applied delta, not the requested amount.
- Include `t` in React callback/hook deps when used inside that scope.
- Ad-hoc Node.js scripts using `require()` must end in `.cjs`.
- Use `process.env.VITE_VAR` for env vars needing Vite/node:test dual compatibility.
- Pollinations API key is safe to publish.
