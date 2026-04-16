# Neurotoxic — Agent Instructions

## Critical Commands

- Full quality gate: `pnpm run test:all` (required before PR).
- Legacy logic suites (`node:test`): `pnpm run test`.
- UI + migrated suites (Vitest): `pnpm run test:ui`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single Vitest file: `pnpm dlx vitest run tests/<file>.test.js(x)`.

## Architecture Constraints

- Keep dependency pins aligned with project policy (React 19.2.5, Vite 8.0.8, Tailwind 4.2.2, Framer Motion 12.38.0, Tone 15.5.6). Node.js 22.13+ required. Do not add Howler.js.
- State updates must go through action creators. If adding a new action: update `actionTypes`, reducer handling, and `actionCreators` in the same change.
- Use canonical clamps for bounded state: `player.money >= 0` and `band.harmony` in `1..100` via `src/utils/gameStateUtils.ts`.
- Audio clock source is `audioEngine.getGigTimeMs()` only; do not read Tone.js time directly.
- PreGig modifier costs come from `MODIFIER_COSTS` in `src/utils/economyEngine.ts` (single source of truth).
- **I18n**: All user-facing text via `t('key')` or `<Trans>`, namespaced (e.g., `ui:button.save`). Update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.

## Testing

- Test runner choice is directory-based; match neighboring tests (don't mix `node:test` and Vitest in one file).
- For Vitest localStorage assertions, mock/restore `window.localStorage.setItem` in `try/finally`.
- For `react-i18next` mocks, include `initReactI18next: { type: '3rdParty', init: () => {} }`.
- Explicitly populate lookup Maps (e.g., `SONGS_BY_ID`) in mocked data.

## Style & Conventions

- Commits must use Conventional Commits (`feat:`, `fix:`, etc.).
- Use `pnpm` exclusively — never `npm` or `yarn`.
- **Tailwind v4**: use `@import "tailwindcss"` (not `@tailwind base`). For non-color tokens (e.g., z-index `--z-*`), use `z-(--z-crt)` or `style={{ zIndex: 'var(--z-crt)' }}`.
- **Colors**: never hardcode. Use CSS vars (`var(--color-toxic-green)`). In PixiJS: `getPixiColorFromToken('--toxic-green')` (omit `--color-` prefix).

## Gotchas

- `src/data/songs.ts` is intentionally excluded from ESLint autofix workflows.
- Never import PIXI in Minigame hooks (`useTourbusLogic`, `useRoadieLogic`). They return reactive state only.
- `useArrivalLogic` owns ALL arrival routing (including PREGIG direct entry); `COMPLETE_TRAVEL_MINIGAME` does not change scene.
- `START_GIG` resets `gigModifiers` to defaults; previous gig selections do not carry over.
- Pixi.js v8 cleanup: `app.destroy({ removeView: true, children: true, texture: true, textureSource: true })`.
- Audio end: Do NOT use `audioPlaybackEnded`. Use `setlistCompleted` + `isNearTrackEnd`.
- Songs with JSON notes: OGG/MIDI capped to `maxNoteTime + NOTE_TAIL_MS`. Procedural songs use full excerpt duration.
- Default chatter scenes: `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG` only — `GIG` requires explicit conditional entries.
- Dynamic images: Use `loadTexture` utility (especially `gen.pollinations.ai` URLs) — prevents PixiJS parsing errors.
- Leaderboards: Resolve song IDs via `SONGS_BY_ID.get().leaderboardId` before submitting to `/api/leaderboard/song`. Never use raw `currentGig.songId`.
- React 19: Pass `ref` as a standard prop — do not use `React.forwardRef()`.
- `hqItems.js` uses a singular `effect` object. `events/special.js` events require unique IDs, `category: 'special'`, `events:` i18n keys, and an `options` array.
- Consumables use `inventory_add` effect and must NOT display as 'OWNED' (multi-purchase allowed).
- Success toasts for bounded state changes must show the actual applied delta, not the requested amount.
- Include `t` in React callback/hook deps when used inside that scope.
- `.cjs` extension is required for ad-hoc Node scripts that use `require()`.
- Use `process.env.VITE_VAR` for env vars needing Vite/node:test dual compatibility.
- Pollinations API key is safe to publish.
