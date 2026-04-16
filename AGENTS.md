# Neurotoxic — Agent Instructions

## Critical Commands

- Full quality gate: `pnpm run test:all` (required before PR).
- Legacy logic suites (`node:test`): `pnpm run test`.
- UI + migrated suites (Vitest): `pnpm run test:ui`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single Vitest file: `pnpm dlx vitest run tests/<file>.test.js(x)`.

## Architecture Constraints

- Keep dependency pins aligned with project policy (React 19.2.5, Vite 8.0.8, Tailwind 4.2.2, Framer Motion 12.38.0, Tone 15.5.6). Do not add Howler.js.
- State updates must go through action creators. If adding a new action: update `actionTypes`, reducer handling, and `actionCreators` in the same change.
- Use canonical clamps for bounded state: `player.money >= 0` and `band.harmony` in `1..100` via `src/utils/gameStateUtils.ts`.
- Audio clock source is `audioEngine.getGigTimeMs()` only; do not read Tone.js time directly.
- PreGig modifier costs come from `MODIFIER_COSTS` in `src/utils/economyEngine.ts` (single source of truth).

## Testing

- Test runner choice is directory-based; match neighboring tests (don’t mix `node:test` and Vitest in one file).
- For Vitest localStorage assertions, mock/restore `window.localStorage.setItem` in `try/finally`.
- For `react-i18next` mocks, include `initReactI18next: { type: '3rdParty', init: () => {} }`.

## Gotchas

- Tailwind v4 only: use `@import "tailwindcss"`; do not use legacy `@tailwind base/components/utilities` directives.
- Never hardcode theme colors; use CSS variables. Pixi color conversion must use `getPixiColorFromToken('--token')`.
- `START_GIG` resets `gigModifiers` to defaults.
- `COMPLETE_TRAVEL_MINIGAME` does not route scenes; `useArrivalLogic` owns arrival routing.
- `src/data/songs.ts` is intentionally excluded from ESLint autofix workflows.
- `.cjs` extension is required for ad-hoc Node scripts that use `require()`.
