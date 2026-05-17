# Neurotoxic - Agent Instructions

## Workflow

- Use the Superpowers skill before any repo action that changes code, tests, tooling, docs, config, git history, or agent instructions.
- Read only the relevant nested `AGENTS.md` files before editing; nested files add scope rules and override root guidance when more specific.

## Critical Commands

- Use `pnpm` only. Do not use `npm` or `yarn`.
- Full PR gate: `pnpm run test:all`.
- Fast local gate: `pnpm run test`.
- UI and migrated suites: `pnpm run test:ui`.
- Full legacy node suites: `pnpm run test:node`.
- Extended perf and locale suites: `pnpm run test:additional`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single Vitest file: `pnpm run test:ui:file -- tests/<file>.test.js(x)`.
- Type gates: `pnpm run typecheck:core`; `pnpm run typecheck` is the scoped reducer gate.

## Architecture Constraints

- Do not upgrade pinned dependencies without discussion; do not add Howler.js.
- All state updates go through action creators. New actions must update `actionTypes`, reducer handling, and `actionCreators` together.
- Sanitize raw payload fields in action creators as early as possible (using inline `Math.max` or `gameStateUtils.ts` helpers) when the invariant is local to the incoming value, such as non-negative costs, rewards, or direct bounded assignments.
- Reducers remain the final authority for bounded state. When computing next state from prior state plus a payload, delta, reward, cost, or functional update, apply canonical clamp helpers before storing the final value.
- Do not remove terminal reducer clamps merely because an action creator also normalizes input. Early payload sanitation and final-state clamping serve different purposes and may both be required.
- Audio gameplay timing must use `audioEngine.getGigTimeMs()`, never direct Tone.js time reads.
- PreGig modifier costs come only from `MODIFIER_COSTS` in `src/utils/economyEngine.ts`.
- User-facing text must use namespaced i18n keys. Update matching EN and DE locale JSON together.
- Unlock logic is split across two files. `src/utils/unlockManager.ts` owns
  localStorage persistence (`getUnlocks`, `addUnlock`). `src/utils/unlockCheck.ts`
  owns state-based eligibility evaluation (`checkTraitUnlocks`). Do not add
  persistence logic to `unlockCheck` or evaluation logic to `unlockManager`.

## TypeScript

- CheckJS is strict for `.js/.jsx`. `@ts-nocheck` budget is zero; never add `@ts-ignore`.
- Avoid `any`. Use `unknown` at boundaries (`JSON.parse`, storage, API payloads, caught errors, postMessage) and narrow before use.
- Use `Object.hasOwn()` for untrusted property checks; prototype-pollution tests assert hostile keys are stripped.
- `isolatedModules` requires type-only imports (`import type` or mixed `import { Foo, type Bar }`).
- Action creators return `Extract<GameAction, { type: typeof ActionTypes.X }>`; do not hand-write action object shapes.
- Reducer default branches must call `assertNever(action)`.
- Prefer `as const satisfies Record<Union, T>` for keyed configs; avoid widening with `as Record<...>`.
- Shared domain contracts belong in `src/types/*.d.ts`; do not duplicate local structural clones. `RelationshipChange` is defined in `src/types/game.d.ts`, not `gameStateUtils.ts`.
- Preserve valid falsy values with nullish checks (`??`), not truthy fallbacks (`||`).
- Give categorize/split helpers explicit named return types instead of broad `Record<string, T[]>`.
- Boundary and error-handler functions must accept `unknown` and narrow before use.
- Under `noUncheckedIndexedAccess`, guard indexed reads (`const item = array[i]; if (!item) continue`).

## Testing

- Choose the runner by neighboring tests; do not mix `node:test` and Vitest patterns in one file.
- Vitest localStorage assertions must mock and restore `window.localStorage.setItem` in `try/finally`.
- `react-i18next` mocks must include `initReactI18next: { type: '3rdParty', init: () => {} }`.
- Explicitly populate lookup maps such as `SONGS_BY_ID` in mocked fixture data.

## Style

- Commits use Conventional Commits (`feat:`, `fix:`, etc.).
- Tailwind v4 uses `@import "tailwindcss"`; non-color tokens use syntax such as `z-(--z-crt)` or `style={{ zIndex: 'var(--z-crt)' }}`.
- Do not hardcode colors. Use CSS vars (`var(--color-toxic-green)`) or Pixi token helpers (`getPixiColorFromToken('--toxic-green')`).
- Do not add `.propTypes` blocks. React 19 deprecates runtime propTypes validation. TypeScript interfaces in `src/types/components.d.ts` or inline prop types are the sole source of truth for prop contracts. The `prop-types` package has been removed from the project.

## Gotchas

- `currentGig` is the venue object. Use `state.currentGig?.capacity` and `.id`, not `state.currentGig?.venue`.
- Never add band members to their own `relationships` map; self-relationships corrupt trait and infighting logic.
- `createInitialState` settings sanitization keeps only `crtEnabled`, `tutorialSeen`, and `logLevel`.
- `START_GIG` resets `gigModifiers` to defaults.
- `useArrivalLogic` owns all arrival routing; `COMPLETE_TRAVEL_MINIGAME` must not change scene.
- Tourbus minigame damage is intentionally converted to van condition loss via `calculateTravelMinigameResult()` at 50% scaling; 100 damage means max 50 condition loss.
- Travel confirmation must disclose travel cost plus guaranteed daily upkeep because arrival also calls `advanceDay()`.
- Gig report `net` must equal displayed income minus displayed expenses; economy dampeners and performance miss money penalties belong in the expense breakdown, not hidden continue deductions.
- Audio end detection uses `setlistCompleted` plus `isNearTrackEnd`; do not use `audioPlaybackEnded`.
- JSON-note OGG/MIDI caps at `maxNoteTime + NOTE_TAIL_MS`; procedural songs use full excerpt duration.
- Default chatter scenes are `MENU`, `OVERWORLD`, `PREGIG`, and `POSTGIG`; `GIG` needs explicit conditional entries.
- Dynamic Pixi images, especially `gen.pollinations.ai`, must load through `loadTexture`.
- Leaderboards submit `SONGS_BY_ID.get(songId).leaderboardId`, never raw `currentGig.songId`.
- React 19 passes `ref` as a normal prop; do not introduce `React.forwardRef()`.
- Consumables use `inventory_add` and must not display as `OWNED`.
- Success toasts for bounded state changes must show the applied delta, not the requested amount.
- Include `t` in hook/callback dependency arrays when used in that scope.
- Use `.cjs` for ad-hoc Node scripts using `require()`.
- Use `process.env.VITE_VAR` for env vars shared by Vite and `node:test`.
- `getCityKeyFromVenueId` (exported from `src/utils/mapGenerator.ts`) returns `''` for venue IDs that contain no underscore; callers must guard the empty-string case.
- `band.merchPrices` is persisted through save/load via `sanitizeBand` in `src/context/reducers/systemReducer.ts`; do not strip it during state sanitization.
- `MerchStrategyBlock` lives in `src/components/pregig/`; it uses full i18n and design-token styling.
- `deriveFinancials` in `src/utils/postGigUtils.ts` accepts an optional `bandMerchPrices` param; pass `band.merchPrices` when calling from post-gig hooks.
- Locale keys can be looked up dynamically. Before deleting a key from `public/locales/{en,de}/ui.json` because grep finds no literal match, also search for templated lookups (`` t(`ui:<prefix>.${var}`) ``). Known dynamic prefixes: `chatter_labels.${scene}` in `src/components/ChatterOverlay.tsx`, `bandhq.${balanceKey}` in `src/ui/bandhq/CatalogTab.tsx` (balance keys include `money`, `funds`, `fame`), and `featureList.*` indexed by config array.
- `EventDelta` lives in `src/types/events.d.ts` and is the single source of truth shared by `eventEngine.ts`, `gameStateUtils.ts`, and `EventDeltaPayload` in `actions.d.ts`. The four container fields (`player`, `band`, `social`, `flags`) are required so handlers in `eventEngine.ts` can mutate them without non-null assertions; callers must initialize an empty object for each before passing the delta around. `EventDeltaPayload` only adds `activeStoryFlags` and `pendingEvents` on top — do not redeclare the container fields.
- Currency strings emitted into toast `options` are baked at dispatch time. Pass `formatCurrency(value, i18n.language, signDisplay)` from reducers and action creators (`clinicReducer.ts`, `socialReducer.ts`, `purchaseLogicUtils.ts`, `questLifecycle.ts`) — import the singleton from `src/i18n.ts` so German users get locale-correct formatting; passing `undefined` falls back to `'en'` and bakes English currency into every toast. Consume the formatted string with a bare `{{amount}}` placeholder in the locale templates and remove any hardcoded `€` glyphs from `public/locales/{en,de}/ui.json`. When formatting inside a React component, use `i18n.language` from `useTranslation()` instead.
