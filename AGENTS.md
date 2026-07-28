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

- Before opening source only to inspect an exported symbol, regenerate `symbols.json` and check `symbols.json.knownSymbols` first. Local entries include signatures (`parameters`, `returnType`, `typeParameters`, `async`, `generator`), object structure (`properties`, union `variants`), heritage (`extends`, `implements`), literal data (`value` for primitive consts, `enumMembers`), docs (`jsDoc`, `deprecated`), graph data (`dependencies`, `usedBy`), exact positions, React metadata (`isComponent`, `isHook`), and export details (`exportKind`, `exportedName`, `exportPath`).
- Aliased re-exports (`export { X as Y }`) carry `isAlias: true` and `localName` (the real declared identifier at `path:lineStart`). Trust `localName`, not the index key, when jumping to the declaration. A symbol with `exportPath` is re-exported through that file.
- The top-level `meta` block summarizes counts and carries `meta.fieldGuide`, a one-line description of every field — read it when a field is unfamiliar. The primary index stays under `knownSymbols`.
- A symbol is only a true orphan when it has none of `usedBy`, `usedByTests`, `referencedBy`, `referencedByLocal`, or `referencedInFile`. `usedBy` covers static imports and resolved dynamic `import()` calls (the latter carry `dynamic: true`, so lazily route-split scenes are not false positives). `referencedBy` lists cross-file referrers that do NOT import the symbol — ambient `.d.ts` types used as field/payload types in another declaration file (reached via `export *`, e.g. `CompleteTravelMinigamePayload` referenced by `GameAction` in `game.d.ts`) and namespace-member access (`import * as ns; ns.foo()`); the import-based `usedBy` pass cannot see these. `referencedByLocal` lists same-file exported referrers (calls, JSX, dispatch-table membership, bare reads); `referencedInFile` is a boolean that also captures references from module-private helpers. Do not treat an empty `usedBy` alone as dead code — in particular, type-only exports are frequently consumed only through `referencedBy`.
- Verified blind spots: namespace imports of a **barrel** (`import * as audioEngine from './audioEngine'` in `src/utils/audio/AudioManager.ts`) are not credited to the underlying symbols — the seven audio functions consumed that way (`playSFX`, `setSFXVolume`, `setMusicVolume`, ...) look test-only; and multi-hop `export *` back-compat chains (`economyEngine.ts` → `economy/index.ts` → ..., similarly `assetSelectors`, `postGigUtils`, `errorHandler`) can make test imports look unresolvable. Grep-verify any deletion candidate in those subtrees before treating index data as proof of death.
- For concrete usage patterns, see `docs/agent-symbols-guide.md`.
- Do not hand-edit `symbols.json`. If exported APIs, type shapes, local imports/calls, JSDoc under `src/`, or test/spec/story imports change, run `pnpm run symbols:update` and then `pnpm run symbols:check`.
- Primitive/string-literal type aliases intentionally omit prototype `properties`; mixed unions expose object branches through `variants`.
- The generated `symbols.json` file is ignored by .gitignore. Do not attempt to stage or commit it using git.

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
- Pure helpers that need direct unit tests live in dedicated utility/view-model modules (e.g. `hooks/audioControlUtils.ts`, `ui/questHintViewModel.ts`, `hooks/postGig/handlers/continueHandlerUtils.ts`). Hook/component modules export only the hook/component — do not export internal helpers from them as test seams.
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
- `lastGigStats.score` is the RAW rhythm score (BASE_POINTS 100 per hit, reaches thousands) and stays raw for leaderboards/chatter/post-option thresholds. Gig-outcome gating (reputation/quest branches in `handleSetLastGigStats`, bad-gig event conditions) must use `lastGigStats.accuracy` (0–100) plus the `failed` flag — never `score < 30`-style checks on the raw score.
- Audio end detection uses `setlistCompleted` plus `isNearTrackEnd`; do not use `audioPlaybackEnded`.
- Leaderboards submit `SONGS_BY_ID.get(songId).leaderboardId`, never raw `currentGig.songId`.
- Consumables use `inventory_add` and must not display as `OWNED`.
- Include `t` in hook/callback dependency arrays when used in that scope.
- Use `process.env.VITE_VAR` for env vars shared by Vite and `node:test`.
- Payload sanitizers must use `Number.isFinite(v)`, not bare `typeof v === 'number'` (which lets `NaN`/`Infinity` through and corrupts downstream clamps). Prefer the shared `finiteNumberOr(value, fallback)` / `isFiniteNumber(value)` helpers from `src/utils/finiteNumber.ts` (re-exported via the `src/utils/gameState` barrel) instead of inlining the check. When dropping `fame` from a payload, also drop the paired derived `fameLevel`.
- `scripts/game-balance-simulation.mjs` must source mechanics from canonical game modules (reducers, action creators, `CLINIC_CONFIG`, `CHASSIS_CONFIG`, minigame logic) instead of hand-rolled values. PreGig runs exactly ONE setup minigame per gig (roadie/kabelsalat/amp, last game down-weighted to 0.2 — see `usePreGigHandlers`); simulating all three per gig triples harmony stress and skews balance results.
- A playthrough is bounded by the map, not by a clock: `generateMap()` is always called with depth 10 and builds a strictly forward layered DAG, so every route is exactly 10 hops, arrival advances the day once, and reaching the single `FINALE` node ends the run on the victory screen. `SIMULATION_CONSTANTS.daysPerRun` must track that horizon — simulating longer models tours the game cannot contain, and it silently invents late-game problems (a "through day 60" relief lever becomes a permanent subsidy, a "from day 28" dampener never fires).
- `gigGapDays` sets how *often* a scenario plays; `gigCadencePolicy` sets *which* days, and the phase is a balance parameter, not a formatting detail. The shipped `gap-aligned` policy (`day % gap === 0`) makes a `gigGapDays: 2` scenario decline day 1 and start on day 2, which adds a full unpaid cost cycle before the first payout. Measured with `pnpm run simulate:balance:cadence`, that phase alone moves `cult_hypergrowth` holdout insolvency between 13.85% and 1.92% and every gap>1 scenario by a similar factor — a larger swing than any tuning lever in `BALANCE_EXPERIMENTS`. Never read a scenario risk number without knowing the phase it was measured under, and never adopt a phase because its numbers look better: it has to match what the game implies. `SCENARIOS` must not pin `gigCadencePolicy` (probes set it per cohort, and pinning it would silently change the published reports and their `scenarioConfigSha256`).
- An insolvency before the first gig and one after it are different findings. `run.earlyRunway` (`firstGigDay`, `bankruptBeforeFirstGig`, `moneyBeforeFirstGig`, `obligationsBeforeFirstGig`, `firstBlockedTravel`, …) separates them, because a tour-level average cannot: runs that fail with ~0 gigs played never reached the economy the averages describe, so raising gig payouts cannot fix them. Check that share before proposing any economy change in response to an insolvency rate.
- `calculateAverageFameEarnedPerGig` scores a run that played no gig as 0, so any change that moves the never-played count shifts Fame-per-gig without a single gig paying differently. Keep it for the cohort KPI (the `fameProgressPerGig` bands are calibrated on it), but never use it for a paired side-effect comparison: the ±5% Fame limit measured that way vetoed `bootstrap-emergency-500` at +25.7% while the same-denominator delta was −1.9%, and that lever was the only one bringing `cult_hypergrowth` inside its holdout cap. Paired Fame comparisons go through `pairedFamePerGig` (pairs where both sides played); descriptive cohort figures should publish both denominators, as the cadence probe does.
- Balance experiments use THREE disjoint seed streams (`SEED_STREAMS` / `streamSeed` in `scripts/game-balance-experiments.mjs`) and the roles are not interchangeable: `calibration` carries the paired candidate-vs-control comparison, `selection` carries the candidate search against the hard caps, and `validation` (the `#holdout` marker, shared with the simulation report's `kpiHoldoutValidation`) is measured exactly once, on the combination the search already chose. A stream that picked the candidate cannot also be the evidence that it generalises — pointing the search at `#holdout` turned 154 candidate attempts against one cohort into a selection criterion and then published the survivor as independent robustness. When the selected combination breaches a cap on `validation`, the outcome is `no-production-recommendation-final-validation-failed` and the next step is a new pre-declared candidate family; searching for a replacement on that stream is exactly what destroys it.
- The Fame side-effect limit fails closed. `pairedFamePerGig` excludes pairs where either side played no gig, so a candidate that removes every comparable gig would otherwise read as a measured 0% and pass `Math.abs(0) <= 5` on no evidence. It returns `deltaPct: null` plus `sufficientEvidence` (coverage at least `FAME_EVIDENCE_MIN_SHARE` of the cohort, a share so it tracks `runsPerScenario`), and every gate goes through `famePerGigWithinLimit`, never the bare delta.
- A running minimum has to be sampled after every money-moving CALL in the day loop, not once per day and not once per group of calls (a negative event followed by a brand-deal advance would hide the trough between them). Mutations inside a single helper are deliberately not sampled individually — that would mean threading an observer through the production-mirroring helpers. `lowestMoneyBeforeFirstGig` sampled only after the daily tick, leaving events, maintenance, refuelling, the shop, asset investment and the travel cost outside the window — so the reported minimum could sit ABOVE the balance at the end of that same window. `observeEarlyRunwayMoney()` is called at each of those points; `tests/node/game-balance-simulation.test.js` pins `lowestMoneyBeforeFirstGig <= moneyBeforeFirstGig`.
- Every generated balance artifact carries `sourceBaseCommit` and `workingTreeDirty`, and is regenerated from a CLEAN tree — commit the source first, then regenerate, then commit the reports (the repo's `fix(balance):` / `docs(balance): regenerate artifacts` pair). A report generated before its own source commit cannot be reproduced from the commit it names.
- Release gating in `scripts/game-balance-experiments.mjs` has THREE stages, and which stream each runs on is the point: the paired calibration validation and `measureHoldoutGate` on `selection` both run *inside* the candidate search, per combination, and the final validation runs `measureHoldoutGate({ stream: 'validation' })` exactly ONCE, on the combination the search already chose. Applying a cap check only after selection is what let the neutral no-op ship as `accepted-for-production-partial` while 125 of 126 pairs were never asked whether they would hold; running that same check on `#holdout` inside the search is the opposite error and destroys the stream (see the three-stream rule above). When the final validation fails, the outcome is `no-production-recommendation-final-validation-failed`, nothing is `selectedForProduction`, and no replacement is searched for on that stream. Screening aborts at the first breached cap (cheapest rejection, `holdoutGateScenarios()` orders by ascending cap); the final validation must use `abortOnBreach: false`, or the artifact publishes untouched caps as "unmeasured" and that reads as config drift.
- `KPI_TARGETS` money bands, `getProgressionInsight` thresholds, `SIMULATION_CONSTANTS.progressionCheckpointDays`, the `fameProgressPerGig` bands and the bootstrap `solventMedianMoneyMax` / `solventP90MoneyMax` limits are all calibrated against the horizon AND the economy constants. Re-derive them from a neutral-tuning control run whenever `daysPerRun`, `GLOBAL_PAYOUT_NERF` or `FAME_PROGRESS_CONSTANTS` change. A band the neutral control cannot reach is a broken gate, not a balance finding; a checkpoint day beyond the horizon reads null and fails every candidate.
- `BALANCE_SOURCE_FILES` in `scripts/utils/balance-report-metadata.mjs` must list every module that can move a number in the generated reports — economy scalars, fame rewards, catalogue prices and `crypto.ts` (RNG batching), not just the harness. A file that changes results without changing `balanceSourceSha256` makes the published reproducibility claim false; `tests/node/balanceSourceFiles.test.js` pins the required entries.
- `MAX_GIG_NET` is applied *after* `GLOBAL_PAYOUT_NERF`, so holding the same gross-net clipping threshold means scaling it by the same factor as the nerf. Setting it to any other value silently adds or removes high-end damping on top of the payout change — derive it, and say so if the extra damping is intended.
- Balance verdicts must derive their targets from the live configuration, never from hardcoded figures. The fame audit reads the tour horizon and the current catalogue cost (`getFameCatalogTarget`); a hardcoded "20-30 gigs to 24,390 Fame" inverted its own verdict the moment either side moved. The same applies to any new audit or insight threshold.
- `GLOBAL_PAYOUT_NERF` / `FAME_PROGRESS_CONSTANTS` and the one-off shop catalogue are a coupled pair: a full tour must fund the catalogue. Changing one side alone breaks that target — re-measure both. When rescaling catalogue prices, exclude entries priced against their own grant (`label_contact` pays +1000 Fame); scaling their cost without scaling the grant makes them nearly free.
- Anything that reseeds `crypto.getRandomValues` per simulated run must call `resetSecureRandomBatch()` from `src/utils/crypto.ts` at the start of that run. `secureRandom()` draws 1024 values at a time, so without dropping the buffer a run consumes values generated from the *previous* run's stream, at an offset that depends on how many draws that run made. Same-seed runs then stop reproducing and paired experiment deltas measure buffer drift instead of the tuning. A short probe run will not catch this — assert reproducibility on a full-length run (`tests/node/game-balance-experiments.test.js`).
- Toast `options` currency strings are baked at dispatch — call `formatCurrency(value, i18n.language, signDisplay)` (import `i18n` singleton from `src/i18n.ts` in reducers/action creators; use `i18n.language` from `useTranslation()` in components). Passing `undefined` falls back to `'en'` and bakes English currency for German users. Locale templates use a bare `{{amount}}` placeholder — no hardcoded `€` in `public/locales/{en,de}/ui.json`.

## Long-Term Assets

- `CHASSIS_CONFIG` and `MODULE_REGISTRY` (`src/utils/`) are the only sources of truth for chassis prices/upkeep and module catalogues. New chassis/modules go through `buildDiyTier` and the `imagePromptKey` indirection — do not hand-author DIY values or hardcode prompts in components. Once a tier exists in `CHASSIS_CONFIG`, consumers must read `CHASSIS_CONFIG[kind][flavor][tier]` directly instead of rebuilding DIY tiers from legit values.
- Use the typed `advanceDay(state)` action creator (`src/context/actionCreators.ts`); never dispatch a payloadless `createAdvanceDayAction()` — RNG determinism depends on the `dayRngStream` + `nextRngSeed` payload.
- DIY chassis can only be acquired via `cash` or `crowdfund`. The UI disables the loan option for DIY; the action creator returns `PURCHASE_CHASSIS_FAILED` as the second defense.
- Bankruptcy must consult `getTotalDailyObligations(state)` from `src/utils/assetSelectors.ts` (not `calculateGuaranteedDailyCost` directly) — that selector folds in asset upkeep, asset revenue, and liability payments.
- Asset reducers (`src/context/reducers/assetReducer.ts`) and tick functions (`src/utils/assetTicks.ts`) are pure. Pre-generate UUIDs (slot ids, crowdfund-materialized asset id) in action creators; the reducer reads them from the payload.

- Explicit return types on public members and getters of exported classes must be preserved to maintain clear public API contracts, prevent accidental type leakage, and improve TypeScript compilation performance. Do not remove them to rely on implicit type inference, even if a linter incorrectly flags their imported type as 'unused'.
