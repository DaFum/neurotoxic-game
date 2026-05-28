# Neurotoxic - Agent Instructions

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Workflow

- Use the relevant installed Superpowers workflow skill before any repo action that changes code, tests, tooling, docs, config, git history, or agent instructions. Repo action means editing files, running write/generation commands, changing dependencies, or running git operations that affect repository state.
- Read only the relevant nested `AGENTS.md` files before editing; nested files add scope rules and override root guidance when more specific.

## Critical Commands

- Use `pnpm` only. Do not use `npm` or `yarn`.
- Test scope picker: `pnpm run test` for fast local, `pnpm run test:all` for full PR, `pnpm run test:ui` for Vitest/UI, `pnpm run test:node` for legacy node, `pnpm run test:additional` for perf/locale.
- Single-file tests: use `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js` for `node:test`; use `pnpm run test:ui:file -- tests/<file>.test.js(x)` for Vitest.
- Type gates: `pnpm run typecheck:core`; `pnpm run typecheck` is the scoped reducer gate.

## Architecture Constraints

### Dependencies

- Do not upgrade pinned dependencies without discussion. Do not add Howler.js; the project standardizes on Tone.js through `src/utils/audio/audioEngine.ts`, and a second audio stack would bypass timing/audio invariants. If a dependency change appears necessary, stop and discuss first.

### State and payload safety

- All state updates go through action creators. New actions must update `actionTypes`, reducer handling, and `actionCreators` together.
- Payload safety is two-layered:
  - Action creators normalize or drop locally invalid raw fields before dispatch.
  - Reducers remain the final authority, re-clamp computed state with canonical helpers, and reject malformed or hostile payloads by returning unchanged state.
  - Do not remove reducer clamps because input was normalized earlier.
- Arithmetic-then-clamp paths (`clampMemberMood(member.mood + delta)`, `clampMemberStamina(member.stamina + delta, ...)`) must wrap the persisted addend with `finiteNumberOr(value, fallback)` from `src/utils/gameStateUtils.ts`. The clamps internally short-circuit `NaN` to `0`, so a stale save with `undefined` mood/stamina would silently lose the bonus otherwise. Type-system `: number` on `BandMember` is not load-time enforced — treat persisted numeric fields as `unknown` at the arithmetic boundary even when the type says otherwise. `finiteNumberOr` is the shared canonical helper; do not reintroduce private copies or bare `typeof v === 'number'` narrowings (they let `NaN`/`Infinity` through).

### Domain invariants

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
- Reducer default branches must call `assertNever`; `gameReducer` deliberately uses `assertNever(action as never)` as a runtime trap, so do not remove the cast to chase compile-time exhaustiveness.
- Prefer `as const satisfies Record<Union, T>` for keyed configs; avoid widening with `as Record<...>`.
- Shared domain contracts belong in `src/types/*.d.ts`; do not duplicate local structural clones. `RelationshipChange` is defined in `src/types/game.d.ts`, not `gameStateUtils.ts`.
- Preserve valid falsy values with nullish checks (`??`), not truthy fallbacks (`||`). Exception: keep `Number(x) || 0` (and similar post-coercion patterns) — `Number()` returns `NaN` for invalid input, and `NaN ?? 0` evaluates to `NaN`, breaking the clamp. Sweep `||` → `??` only on direct property reads of optional numeric fields.
- Give categorize/split helpers explicit named return types instead of broad `Record<string, T[]>`.
- Boundary and error-handler functions must accept `unknown` and narrow before use.
- Under `noUncheckedIndexedAccess`, guard indexed reads (`const item = array[i]; if (!item) continue`).

## Testing

- Choose the runner by the framework already used in the same file; for new files, match the closest same-directory/domain tests. Do not mix `node:test` and Vitest patterns in one file.
- Vitest localStorage assertions must mock and restore `window.localStorage.setItem` in `try/finally`.
- `react-i18next` mocks must include `initReactI18next: { type: '3rdParty', init: () => {} }`.
- Explicitly populate lookup maps such as `SONGS_BY_ID` in mocked fixture data.

## Style

- Commits use Conventional Commits (`feat:`, `fix:`, etc.).
- Tailwind v4 uses `@import "tailwindcss"`; non-color tokens use syntax such as `z-(--z-crt)` or `style={{ zIndex: 'var(--z-crt)' }}`.
- Do not hardcode colors. Use CSS vars (`var(--color-toxic-green)`) or Pixi token helpers (`getPixiColorFromToken('--toxic-green')`). Hex fallbacks for brand tokens live in a single source of truth at `src/utils/brandColors.ts` (`BRAND_COLOR_HEX`); both pixi (`stageRenderUtils`) and inline-SVG (`OverworldMap`) fallback maps must derive from it rather than reinline literal hex values.
- `getPixiColorFromToken` accepts both bare (`--toxic-green`) and prefixed (`--color-toxic-green`) token names; the resolver prefixes bare tokens with `--color-` before calling `getComputedStyle`, so runtime CSS lookups succeed for either form. `PIXI_TOKEN_FALLBACKS` (sourced from `BRAND_COLOR_HEX`) keys both variants so the SSR/test fallback path matches the runtime path — when extending `BRAND_COLOR_HEX`, both `--${name}` and `--color-${name}` entries are emitted automatically.
- Do not add `.propTypes` blocks. React 19 deprecates runtime propTypes validation. TypeScript interfaces in `src/types/components.d.ts` or inline prop types are the sole source of truth for prop contracts. The `prop-types` package has been removed from the project.

## Gotchas

- `currentGig` is the venue object. Use `state.currentGig?.capacity` and `.id`, not `state.currentGig?.venue`.
- Never add band members to their own `relationships` map; self-relationships corrupt trait and infighting logic.
- `createInitialState` settings sanitization keeps only `crtEnabled`, `tutorialSeen`, and `logLevel`.
- `START_GIG` resets `gigModifiers` to defaults.
- Minigame completion reducers must not change `currentScene` (`COMPLETE_TRAVEL_MINIGAME`, `COMPLETE_AMP_CALIBRATION`, `COMPLETE_KABELSALAT_MINIGAME`, `COMPLETE_ROADIE_MINIGAME`); arrival/overlay continuation callbacks own scene changes.
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
- Locale keys may be looked up via template (``t(`ui:<prefix>.${var}`)``) — search the codebase for the prefix before deleting an apparently-unused key. Known dynamic prefixes: `chatter_labels.${scene}` (`src/components/ChatterOverlay.tsx`), `bandhq.${balanceKey}` (`src/ui/bandhq/CatalogTab.tsx`, balance keys `money`/`funds`/`fame`), `featureList.*` (indexed by config array).
- `EventDelta` (`src/types/events.d.ts`) is the single source of truth, shared with `eventEngine.ts`, `gameStateUtils.ts`, and `EventDeltaPayload` (`actions.d.ts`). Its four container fields (`player`, `band`, `social`, `flags`) are required — callers must initialize each as `{}` so `eventEngine` handlers can mutate without non-null assertions. `EventDeltaPayload` only adds `activeStoryFlags` + `pendingEvents`; do not redeclare containers.
- Payload sanitizers must use `Number.isFinite(v)`, not bare `typeof v === 'number'` (which lets `NaN`/`Infinity` through and corrupts downstream clamps). Prefer the shared `finiteNumberOr(value, fallback)` helper from `src/utils/gameStateUtils.ts` instead of inlining the check. When dropping `fame` from a payload, also drop the paired derived `fameLevel`.
- `BASE_STATE` in `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js` must mirror `createInitialState()` exactly. Only `toasts` and `isScreenshotMode` may be omitted; any other top-level field added to `initialState` without updating `BASE_STATE` fails `tests/node/playwright-screenshot-fixture-validation.test.js`.
- Toast `options` currency strings are baked at dispatch — call `formatCurrency(value, i18n.language, signDisplay)` (import `i18n` singleton from `src/i18n.ts` in reducers/action creators; use `i18n.language` from `useTranslation()` in components). Passing `undefined` falls back to `'en'` and bakes English currency for German users. Locale templates use a bare `{{amount}}` placeholder — no hardcoded `€` in `public/locales/{en,de}/ui.json`.

## Long-Term Assets

- `CHASSIS_CONFIG` and `MODULE_REGISTRY` (`src/utils/`) are the only sources of truth for chassis prices/upkeep and module catalogues. New chassis/modules go through `buildDiyTier` and the `imagePromptKey` indirection — do not hand-author DIY values or hardcode prompts in components.
- Use the typed `advanceDay(state)` action creator (`src/context/actionCreators.ts`); never dispatch a payloadless `createAdvanceDayAction()` — RNG determinism depends on the `dayRngStream` + `nextRngSeed` payload.
- DIY chassis can only be acquired via `cash` or `crowdfund`. The UI disables the loan option for DIY; the action creator returns `PURCHASE_CHASSIS_FAILED` as the second defense.
- Bankruptcy must consult `getTotalDailyObligations(state)` from `src/utils/assetSelectors.ts` (not `calculateGuaranteedDailyCost` directly) — that selector folds in asset upkeep, asset revenue, and liability payments.
- Asset reducers (`src/context/reducers/assetReducer.ts`) and tick functions (`src/utils/assetTicks.ts`) are pure. Pre-generate UUIDs (slot ids, crowdfund-materialized asset id) in action creators; the reducer reads them from the payload.
