# Neurotoxic — Agent Instructions

## Workflow

- Before changing the repository, use the relevant installed workflow skill and read only the nested `AGENTS.md` files that govern the files you will touch. More-specific files override this one.
- Keep changes surgical. Do not refactor, reformat, upgrade dependencies, or remove pre-existing dead code outside the request.
- Use `pnpm` only. Dependencies are pinned; discuss changes first. Never add Howler.js—the audio stack is Tone.js through `src/utils/audio/audioEngine.ts`.

## Critical Commands

- Fast tests: `pnpm run test`; full PR gate: `pnpm run test:all`; UI: `pnpm run test:ui`; node: `pnpm run test:node`; perf/locale: `pnpm run test:additional`.
- Type gates: `pnpm run typecheck:core`; reducer gate: `pnpm run typecheck`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single/multiple Vitest files: `pnpm exec vitest run tests/<file>.test.jsx [tests/<other>.test.jsx ...]`. Do not use `test:ui:file` with multiple paths; it leaks unrelated suites.
- After exported APIs, types, source references, or tests change, run `pnpm run symbols:update` then `pnpm run symbols:check`. Never hand-edit or commit ignored `symbols.json`.

## Architecture Constraints

- All state updates go through typed action creators. New actions update `actionTypes`, reducer handling, and `actionCreators` together. Creators sanitize raw payloads; reducers remain authoritative and reject hostile payloads or re-clamp computed state.
- For persisted-number arithmetic, wrap the stored addend with `finiteNumberOr(value, fallback)` before any clamp. `??` and `typeof value === 'number'` do not reject `NaN`/`Infinity`.
- Use `audioEngine.getGigTimeMs()` for gameplay timing, never direct Tone.js time reads.
- User-facing text uses namespaced i18n keys. Update matching English and German locale JSON together. Currency baked into dispatched toast options must use `formatCurrency(value, i18n.language, signDisplay)`.
- `src/utils/unlockManager.ts` owns unlock persistence; `src/utils/unlockCheck.ts` owns eligibility evaluation. Do not mix these responsibilities.
- `CHASSIS_CONFIG` and `MODULE_REGISTRY` are the chassis/module sources of truth. Asset reducers and tick functions stay pure; generate UUIDs in action creators.

## TypeScript and Style

- CheckJS is strict for `.js/.jsx`; never add `@ts-nocheck`, `@ts-ignore`, or `any`. Use `unknown` at boundaries, `Object.hasOwn()` for untrusted keys, type-only imports, and guarded indexed reads.
- Preserve explicit return types on public members/getters of exported classes.
- Do not add `.propTypes`. Do not hardcode colors; use defined CSS variables or Pixi token helpers. Brand hex fallbacks come only from `src/utils/brandColors.ts`.
- Commits use Conventional Commits.

## High-Risk Gotchas

- `currentGig` is the venue object. Region-keyed state must derive its city with `getRegionKeyForLocation`, never raw `player.location`.
- `START_GIG` resets both `gigModifiers` and minigame state. Completion reducers must not change scenes; continuation callbacks own navigation.
- `lastGigStats.score` is raw (thousands). Outcome gates use `accuracy` (0–100) plus `failed`.
- Use typed `advanceDay(state)`; never dispatch payloadless `createAdvanceDayAction()`. Bankruptcy uses `getTotalDailyObligations(state)`.
