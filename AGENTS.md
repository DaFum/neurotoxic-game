# Neurotoxic — Agent Instructions

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

- Before changing the repository, use the relevant installed workflow skill and read only the nested `AGENTS.md` files that govern the files you will touch. More-specific files override this one.
- Keep changes surgical. Do not refactor, reformat, upgrade dependencies, or remove pre-existing dead code outside the request.
- Use `pnpm` only. Dependencies are pinned; discuss changes first. Never add Howler.js—the audio stack is Tone.js through `src/utils/audio/audioEngine.ts`.

## Critical Commands

- Fast tests: `pnpm run test`; compact dot-reporter output: `pnpm run test:dot`; full PR gate: `pnpm run test:all`; UI: `pnpm run test:ui`; node: `pnpm run test:node`; perf/locale: `pnpm run test:additional`.
- Type gates: `pnpm run typecheck:core`; reducer gate: `pnpm run typecheck`.
- Single `node:test` file: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- Single/multiple Vitest files: `pnpm exec vitest run tests/<file>.test.jsx [tests/<other>.test.jsx ...]`. Do not use `test:ui:file` with multiple paths; it leaks unrelated suites.
- After exported APIs, types, source references, or tests change, run `pnpm run symbols:update` then `pnpm run symbols:check`. Never hand-edit or commit ignored `symbols.json`.
- Dead code gate: `pnpm run deadcode:check`; budget check: `pnpm run deadcode:budget`.

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
