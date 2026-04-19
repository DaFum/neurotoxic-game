# Neurotoxic — Agent Instructions

## Critical Commands

- Full quality gate: `pnpm run test:all` (required before PR).
- Extended suite (perf + locale): `pnpm run test:additional` (perf runs in CI via Performance Tests job; locale via Locale Smoke/Full Tests jobs).
- Legacy logic suites (`node:test`): `pnpm run test`.
- UI + migrated suites (Vitest): `pnpm run test:ui`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single Vitest file: `pnpm dlx vitest run tests/<file>.test.js(x)`.

## Architecture Constraints

- Do not upgrade pinned deps without discussion; do not add Howler.js.
- State updates must go through action creators. If adding a new action: update `actionTypes`, reducer handling, and `actionCreators` in the same change.
- Use canonical clamps for bounded state: `player.money >= 0` and `band.harmony` in `1..100` via `src/utils/gameStateUtils.ts`.
- Audio clock source is `audioEngine.getGigTimeMs()` only; do not read Tone.js time directly.
- PreGig modifier costs come from `MODIFIER_COSTS` in `src/utils/economyEngine.ts` (single source of truth).
- **I18n**: All user-facing text via `t('key')` or `<Trans>`, namespaced (e.g., `ui:button.save`). Update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.

## TypeScript

- Strict TS (`checkJs: true`) is enforced on `.js`/`.jsx` too. Migration is complete: `@ts-nocheck` budget is 0 (`.ci/ts-nocheck-budget.json`) — `pnpm run guard:nocheck` fails on any new occurrence in `src/`. Use `@ts-expect-error <reason>` only with a tracked follow-up; never `@ts-ignore`.
- Never `any`. Use `unknown` and narrow at boundaries (API responses, `JSON.parse`, `localStorage`, `postMessage`). For untrusted property checks use `Object.hasOwn()` — not `in` / `hasOwnProperty` (tests assert forbidden keys like `__proto__` are stripped).
- `isolatedModules: true` — type-only imports must use `import type` (mixed form: `import { Foo, type Bar }`). Symptom of getting it wrong: `tsc` complains but Vite still builds.
- Action creators return `Extract<GameAction, { type: typeof ActionTypes.X }>` (see `src/context/actionCreators.ts`). Do not hand-write `{ type, payload }` shapes — it breaks the discriminated union.
- Reducer `default` branch must call `assertNever(action)` so adding a new action variant fails compile at every missing handler.
- Apply bounded-state clamps once, in the action creator, via helpers in `src/utils/gameStateUtils.ts`. Reducers must not re-clamp.
- Lookup constants use `as const satisfies Record<Union, T>` — `as Record<Union, T>` discards literal inference and breaks downstream narrowing.
- Shared domain contracts live in `src/types/*.d.ts` (`game`, `audio`, `components`, `callbacks`, `rhythmGame`). Do not inline duplicate structural shapes in consumer modules.
- `jsconfig.checkjs.json` scopes stricter CheckJS (adds `noUncheckedIndexedAccess`) to migrated domains. When moving a new domain into that scope, add it to the `include` list in the same PR.
- Typecheck entry points: `pnpm run typecheck:core` (full `tsc --noEmit` via `jsconfig.checkjs.json`) and `pnpm run typecheck` (scoped reducer gate used in CI).

### TypeScript Best-Practice Patterns (repo canonical)

- Prefer `as const satisfies` for keyed configs/lookups so keys are checked but literals stay narrow; avoid `as Record<...>` unless you intentionally want widening.
- Reducers/sanitizers must **whitelist** untrusted payload fields when constructing objects (e.g., save toasts), not spread unknown records into state.
- Avoid truthy checks when `0`/`''` are valid values (e.g., use `value != null` for optional numeric/string payload fields).
- When invariants must hold (dense arrays, required map hits), fail loudly with explicit errors instead of silently skipping iterations.

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
- framer-motion, lucide-react, pixi.js, tone, and @tonejs/midi — these packages all include bundled TypeScript declarations and don't require stub files.
- `lint-staged` now covers `*.{js,jsx,ts,tsx}` — all source files are auto-linted and formatted at commit time.
- Never import PIXI in Minigame hooks (`useTourbusLogic`, `useRoadieLogic`). They return reactive state only.
- `useArrivalLogic` owns ALL arrival routing (including PREGIG direct entry); `COMPLETE_TRAVEL_MINIGAME` does not change scene.
- `START_GIG` resets `gigModifiers` to defaults; previous gig selections do not carry over.
- Pixi.js v8 cleanup: `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })` — two distinct args: `RendererDestroyOptions` then `DestroyOptions`.
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
