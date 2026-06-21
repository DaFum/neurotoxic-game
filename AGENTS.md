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
- Before finishing any repo change, check whether the change reveals a durable instruction that belongs in an `AGENTS.md`; update only the relevant scope file when the instruction is non-obvious, repo-specific, and likely to prevent future mistakes.

## Critical Commands

- Use `pnpm` only. Do not use `npm` or `yarn`.
- Test scope picker: `pnpm run test` for fast local, `pnpm run test:all` for full PR, `pnpm run test:ui` for Vitest/UI, `pnpm run test:node` for legacy node, `pnpm run test:additional` for perf/locale.
- Single-file tests: use `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js` for `node:test`. For Vitest run the file(s) directly with `pnpm exec vitest run tests/<file>.test.jsx [tests/<other>.test.jsx ...]` (append `2>&1 | grep -E "✓|×|FAIL|PASS|Tests |Test Files " | head -20` for a compact summary). Do NOT use `pnpm run test:ui:file -- <multiple files>`: with more than one path that wrapper does not scope the run to only those files, so unrelated suites leak into the output and you have to grep them back out.
- Type gates: `pnpm run typecheck:core`; `pnpm run typecheck` is the scoped reducer gate.
- Symbol index: `pnpm run symbols:update` regenerates `symbols.json`; `pnpm run symbols:check` verifies it is current.

## Symbols Index

- Before opening source only to inspect an exported symbol, check `symbols.json.knownSymbols` first. Local entries include signatures (`parameters`, `returnType`, `typeParameters`, `async`, `generator`), object structure (`properties`, union `variants`), heritage (`extends`, `implements`), literal data (`value` for primitive consts, `enumMembers`), docs (`jsDoc`, `deprecated`), graph data (`dependencies`, `usedBy`), exact positions, React metadata (`isComponent`, `isHook`), and export details (`exportKind`, `exportedName`, `exportPath`).
- Aliased re-exports (`export { X as Y }`) carry `isAlias: true` and `localName` (the real declared identifier at `path:lineStart`). Trust `localName`, not the index key, when jumping to the declaration. A symbol with `exportPath` is re-exported through that file.
- The top-level `meta` block summarizes counts and carries `meta.fieldGuide`, a one-line description of every field — read it when a field is unfamiliar. The primary index stays under `knownSymbols`.
- A symbol is only a true orphan when it has none of `usedBy`, `usedByTests`, `referencedBy`, `referencedByLocal`, or `referencedInFile`. `usedBy` covers static imports and resolved dynamic `import()` calls (the latter carry `dynamic: true`, so lazily route-split scenes are not false positives). `referencedBy` lists cross-file referrers that do NOT import the symbol — ambient `.d.ts` types used as field/payload types in another declaration file (reached via `export *`, e.g. `CompleteTravelMinigamePayload` referenced by `GameAction` in `game.d.ts`) and namespace-member access (`import * as ns; ns.foo()`); the import-based `usedBy` pass cannot see these. `referencedByLocal` lists same-file exported referrers (calls, JSX, dispatch-table membership, bare reads); `referencedInFile` is a boolean that also captures references from module-private helpers. Do not treat an empty `usedBy` alone as dead code — in particular, type-only exports are frequently consumed only through `referencedBy`.
- For concrete usage patterns, see `docs/agent-symbols-guide.md`.
- Do not hand-edit `symbols.json`. If exported APIs, type shapes, local imports/calls, JSDoc under `src/`, or test/spec/story imports change, run `pnpm run symbols:update` and then `pnpm run symbols:check`.
- Primitive/string-literal type aliases intentionally omit prototype `properties`; mixed unions expose object branches through `variants`.

## Dependencies

- Do not upgrade pinned dependencies without discussion. Do not add Howler.js; the project standardizes on Tone.js through `src/utils/audio/audioEngine.ts`, and a second audio stack would bypass timing/audio invariants. If a dependency change appears necessary, stop and discuss first.

## State and Payload Safety

- All state updates go through action creators. New actions must update `actionTypes`, reducer handling, and `actionCreators` together.
- Payload safety is two-layered:
  - Action creators normalize or drop locally invalid raw fields before dispatch.
  - Reducers remain the final authority, re-clamp computed state with canonical helpers, and reject malformed or hostile payloads by returning unchanged state.
  - Do not remove reducer clamps because input was normalized earlier.
- Arithmetic-then-clamp paths (`clampMemberMood(member.mood + delta)`, `clampMemberStamina(member.stamina + delta, ...)`) must wrap the persisted addend with `finiteNumberOr(value, fallback)` from `src/utils/finiteNumber.ts` (also re-exported via the `src/utils/gameState` barrel). The clamps internally short-circuit `NaN` to `0`, so a stale save with `undefined` mood/stamina would silently lose the bonus otherwise. This applies to ALL clamp helpers, not just member stats — `clampBandHarmony`, `clampBandStress`, etc.; `??` is not a substitute (it lets `NaN` through). Type-system `: number` on `BandMember` is not load-time enforced — treat persisted numeric fields as `unknown` at the arithmetic boundary even when the type says otherwise. `finiteNumberOr` is the shared canonical helper; do not reintroduce private copies or bare `typeof v === 'number'` narrowings (they let `NaN`/`Infinity` through).

## Domain Invariants

- Audio gameplay timing must use `audioEngine.getGigTimeMs()`, never direct Tone.js time reads.
- PreGig modifier costs come only from `MODIFIER_COSTS` in `src/utils/economyEngine.ts`.
- User-facing text must use namespaced i18n keys. Update matching EN and DE locale JSON together.
- Unlock logic is split across two files. `src/utils/unlockManager.ts` owns
  localStorage persistence (`getUnlocks`, `addUnlock`). `src/utils/unlockCheck.ts`
  owns state-based eligibility evaluation (`checkTraitUnlocks`). Do not add
  persistence logic to `unlockCheck` or evaluation logic to `unlockManager`.

## TypeScript

- CheckJS is strict for `.js/.jsx`; never add `@ts-nocheck` or `@ts-ignore`.
- Use `unknown` at JSON/storage/API/error boundaries and narrow before use; avoid `any`.
- Use `Object.hasOwn()` for untrusted property checks.
- `isolatedModules` requires type-only imports; prefer `as const satisfies` for keyed configs.
- Preserve valid falsy values with `??`, not `||`, except post-`Number()` fallbacks where `NaN` must collapse.
- Guard indexed reads under `noUncheckedIndexedAccess`.

## Testing

- Choose the runner by the framework already used in the same file; for new files, match the closest same-directory/domain tests. Do not mix `node:test` and Vitest patterns in one file.
- Vitest localStorage assertions must mock and restore `window.localStorage.setItem` in `try/finally`.
- `react-i18next` mocks must include `initReactI18next: { type: '3rdParty', init: () => {} }`.
- Explicitly populate lookup maps such as `SONGS_BY_ID` in mocked fixture data.

## Style

- Commits use Conventional Commits (`feat:`, `fix:`, etc.).
- Tailwind v4 uses `@import "tailwindcss"`; non-color tokens use syntax such as `z-(--z-crt)` or `style={{ zIndex: 'var(--z-crt)' }}`.
- Do not hardcode colors. Use defined CSS vars (`var(--color-toxic-green)`, `var(--color-void-black)`, `var(--color-blood-red)`) or Pixi token helpers (`getPixiColorFromToken('--toxic-green')`). Do not invent aliases such as `--color-void`, `--color-blood`, `--color-toxic-red`, or opacity suffixes that are not defined in `src/index.css`. Hex fallbacks for brand tokens live in a single source of truth at `src/utils/brandColors.ts` (`BRAND_COLOR_HEX`); both pixi (`stageRenderUtils`) and inline-SVG (`OverworldMap`) fallback maps must derive from it rather than reinline literal hex values.
- `getPixiColorFromToken` accepts both bare (`--toxic-green`) and prefixed (`--color-toxic-green`) token names; the resolver prefixes bare tokens with `--color-` before calling `getComputedStyle`, so runtime CSS lookups succeed for either form. `PIXI_TOKEN_FALLBACKS` (sourced from `BRAND_COLOR_HEX`) keys both variants so the SSR/test fallback path matches the runtime path — when extending `BRAND_COLOR_HEX`, both `--${name}` and `--color-${name}` entries are emitted automatically.
- Do not add `.propTypes` blocks. React 19 deprecates runtime propTypes validation. TypeScript interfaces in `src/types/components.d.ts` or inline prop types are the sole source of truth for prop contracts. The `prop-types` package has been removed from the project.

## Gotchas

- `currentGig` is the venue object. Use `state.currentGig?.capacity` and `.id`, not `state.currentGig?.venue`.
- `player.location` is the `venues:<id>.name` display key. Anything region-keyed (`reputationByRegion`, `region.reputationChanged` events, perRegion quest scopes) must derive the city key via `getRegionKeyForLocation` from `src/utils/mapUtils.ts`; keying by raw `player.location` silently splits regional state per venue.
- Never add band members to their own `relationships` map; self-relationships corrupt trait and infighting logic.
- `START_GIG` resets both `gigModifiers` and `minigame` state to defaults at this entry boundary. Minigame state is reset here, not on the post-gig return, so a finished or abandoned setup minigame cannot leak into the next gig — do NOT add a separate post-gig minigame cleanup (a racing cleanup dispatch fights the `startTransition` scene change and can null state mid-render).
- Minigame completion reducers must not change `currentScene` (`COMPLETE_TRAVEL_MINIGAME`, `COMPLETE_AMP_CALIBRATION`, `COMPLETE_KABELSALAT_MINIGAME`, `COMPLETE_ROADIE_MINIGAME`); arrival/overlay continuation callbacks own scene changes.
- Tourbus minigame damage is intentionally converted to van condition loss via `calculateTravelMinigameResult()` at 50% scaling; 100 damage means max 50 condition loss.
- Travel confirmation/resource checks must disclose and cover travel cost plus total daily obligations (`getTotalDailyObligations(state)`) because arrival also calls `advanceDay()`; do not use `calculateGuaranteedDailyCost` alone where assets/liabilities can apply.
- Gig report `net` must equal displayed income minus displayed expenses; economy dampeners and performance miss money penalties belong in the expense breakdown, not hidden continue deductions.
- Transport events tagged `breakdown` are scaled by `van.breakdownChance / BASE_BREAKDOWN_CHANCE` in `eventSelection.ts`; new mechanical-failure travel events must carry `tags: ['breakdown']` or van condition/suspension upgrades will not affect them.
- Audio end detection uses `setlistCompleted` plus `isNearTrackEnd`; do not use `audioPlaybackEnded`.
- Leaderboards submit `SONGS_BY_ID.get(songId).leaderboardId`, never raw `currentGig.songId`.
- Consumables use `inventory_add` and must not display as `OWNED`.
- Include `t` in hook/callback dependency arrays when used in that scope.
- Use `process.env.VITE_VAR` for env vars shared by Vite and `node:test`.
- Payload sanitizers must use `Number.isFinite(v)`, not bare `typeof v === 'number'` (which lets `NaN`/`Infinity` through and corrupts downstream clamps). Prefer the shared `finiteNumberOr(value, fallback)` / `isFiniteNumber(value)` helpers from `src/utils/finiteNumber.ts` (re-exported via the `src/utils/gameState` barrel) instead of inlining the check. When dropping `fame` from a payload, also drop the paired derived `fameLevel`.
- Toast `options` currency strings are baked at dispatch — call `formatCurrency(value, i18n.language, signDisplay)` (import `i18n` singleton from `src/i18n.ts` in reducers/action creators; use `i18n.language` from `useTranslation()` in components). Passing `undefined` falls back to `'en'` and bakes English currency for German users. Locale templates use a bare `{{amount}}` placeholder — no hardcoded `€` in `public/locales/{en,de}/ui.json`.

## Long-Term Assets

- `CHASSIS_CONFIG` and `MODULE_REGISTRY` (`src/utils/`) are the only sources of truth for chassis prices/upkeep and module catalogues. New chassis/modules go through `buildDiyTier` and the `imagePromptKey` indirection — do not hand-author DIY values or hardcode prompts in components. Once a tier exists in `CHASSIS_CONFIG`, consumers must read `CHASSIS_CONFIG[kind][flavor][tier]` directly instead of rebuilding DIY tiers from legit values.
- Use the typed `advanceDay(state)` action creator (`src/context/actionCreators.ts`); never dispatch a payloadless `createAdvanceDayAction()` — RNG determinism depends on the `dayRngStream` + `nextRngSeed` payload.
- DIY chassis can only be acquired via `cash` or `crowdfund`. The UI disables the loan option for DIY; the action creator returns `PURCHASE_CHASSIS_FAILED` as the second defense.
- Bankruptcy must consult `getTotalDailyObligations(state)` from `src/utils/assetSelectors.ts` (not `calculateGuaranteedDailyCost` directly) — that selector folds in asset upkeep, asset revenue, and liability payments.
- Asset reducers (`src/context/reducers/assetReducer.ts`) and tick functions (`src/utils/assetTicks.ts`) are pure. Pre-generate UUIDs (slot ids, crowdfund-materialized asset id) in action creators; the reducer reads them from the payload.

- Explicit return types on public members and getters of exported classes must be preserved to maintain clear public API contracts, prevent accidental type leakage, and improve TypeScript compilation performance. Do not remove them to rely on implicit type inference, even if a linter incorrectly flags their imported type as 'unused'.
