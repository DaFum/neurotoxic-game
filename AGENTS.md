# Neurotoxic — Agent Instructions

## Workflow

- Before changing the repository, use the relevant installed workflow skill and read only the nested `AGENTS.md` files that govern the files you will touch. More-specific files override this one.
- `docs/superpowers/plans/` and `docs/superpowers/specs/` are the binding contract for planned gate work. Read the task's own section before implementing it; a paraphrase drifts from the approved design and the drift surfaces in review, not in the tests.
- Keep changes surgical. Do not refactor, reformat, upgrade dependencies, or remove pre-existing dead code outside the request.
- Use `pnpm` only. Dependencies are pinned; discuss changes first. Never add Howler.js—the audio stack is Tone.js through `src/utils/audio/audioEngine.ts`.
- `package.json#packageManager` is the sole pnpm version source; CI setup must derive and validate the version instead of duplicating it in workflow inputs or environment variables.

## Critical Commands

- Fast tests: `pnpm run test`; compact dot-reporter output: `pnpm run test:dot`; full PR gate: `pnpm run test:all`; UI: `pnpm run test:ui`; node: `pnpm run test:node`; perf/locale: `pnpm run test:additional`.
- Type gates: `pnpm run typecheck:core`; reducer gate: `pnpm run typecheck`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single/multiple Vitest files: `pnpm exec vitest run tests/<file>.test.jsx [tests/<other>.test.jsx ...]`. Do not use `test:ui:file` with multiple paths; it leaks unrelated suites.
- To check or review the codebase, you can also use the `symbols.json` file. Run `pnpm run symbols:update` and then `pnpm run symbols:check`. Never manually edit or commit ignored `symbols.json` files.
- Vitest node/api suites (`tests/api`, logic tests) need the node config: `pnpm exec vitest run --config vitest.config.node.js tests/<file>`. Server code under `api/` is type-checked by `pnpm run typecheck:server`; tooling tests by `pnpm run test:tooling`.
- Dead code gate: `pnpm run deadcode:check`; budget check: `pnpm run deadcode:budget`.
- After editing this file, run `pnpm run sync:agents`; `tests/node/agentInstructionsSync.test.js` fails when `.github/copilot-instructions.md` drifts from it.

## Skills

Process skills come first: per `using-superpowers`, start new work with `brainstorming` and bugs with `systematic-debugging` before any implementation skill.

## Architecture Constraints

- All state updates go through typed action creators. New actions update `actionTypes`, reducer handling, and `actionCreators` together. Creators sanitize raw payloads; reducers remain authoritative and reject hostile payloads or re-clamp computed state.
- For persisted-number arithmetic, wrap the stored addend with `finiteNumberOr(value, fallback)` before any clamp. `??` and `typeof value === 'number'` do not reject `NaN`/`Infinity`.
- State and payload sanitizers must enforce strict type narrowing using `isFiniteNumber(value)`; never use `Number(value)` coercion, which improperly accepts booleans, arrays, and numeric strings.
- Recursive object utilities (freezers, traversers, sanitizers) must use `WeakSet<object>` for cycle safety and continue traversal through already-frozen parent objects.
- When modifying imports/exports or barrel files, verify that `pnpm run deadcode:check` does not exceed `.ci/dead-code-budget.json`.
- Use `audioEngine.getGigTimeMs()` for gameplay timing, never direct Tone.js time reads. Non-gameplay time (timestamps, cooldowns, persistence metadata) goes through the injected `IClock` from `src/utils/clock.ts` (`useClock()` in components, an `IClock` parameter defaulting to `systemClock` in pure helpers).
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
- Terminal endings (bankruptcy, career victory, stranded, event game over) are persisted as `terminalOutcome` (`src/types/game.d.ts`). Any path that ends in `GAMEOVER` must have it set (`handleChangeScene` derives one if missing), otherwise a reload resumes the run instead of the ending.
- During an active expedition `protectedCareerCash` is not spendable. Spend gates, event conditions and option affordability use the spendable view from `src/domain/expedition/spendableCash.ts`; the cash floor (`enforceExpeditionCashFloor`) is the reducer backstop, not the only check.
- Leaderboard ranking is honor-based. Stats syncs carry a monotonic `revision`; the API drops stale revisions. Do not add client-trust assumptions beyond that.
