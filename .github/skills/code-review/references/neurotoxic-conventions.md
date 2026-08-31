# Neurotoxic-Specific Review Conventions

Load this file when reviewing any PR that touches `src/`. It contains the complete set of
repo-specific rules with severity and canonical source paths. Violations are bugs, not preferences.

## Table of Contents

1. [State Architecture](#1-state-architecture)
2. [Numeric Safety](#2-numeric-safety)
3. [Timing and Clock](#3-timing-and-clock)
4. [Internationalization](#4-internationalization)
5. [Visual / Color](#5-visual--color)
6. [TypeScript / CheckJS](#6-typescript--checkjs)
7. [Reducer-Specific Rules](#7-reducer-specific-rules)
8. [Asset and Module System](#8-asset-and-module-system)
9. [Unlock System](#9-unlock-system)
10. [High-Risk Gotchas](#10-high-risk-gotchas)
11. [What Not to Flag](#11-what-not-to-flag)

---

## 1. State Architecture

**Severity: Critical for violations**

| Rule | What to look for | Source |
|------|-----------------|--------|
| Action creator → reducer flow | All state mutations must go through a typed action creator dispatched to a reducer. No `setState` on game state, no direct object mutation outside a reducer. | `src/context/actionCreators.ts`, `src/context/actionTypes.ts` |
| New actions update all three | Adding an action type requires: `actionTypes.ts` entry, `actionCreators.ts` creator, reducer handling. Missing any one = Critical. | `AGENTS.md §Architecture` |
| Creators sanitize, reducers clamp | Action creators sanitize raw input payloads. Reducers are the final authority and re-clamp computed state. Sanitization in the wrong layer = Important. | `AGENTS.md §Architecture` |
| No RNG in reducers | Reducers must be pure. UUID generation and RNG calls belong in action creators. | `src/context/reducers/AGENTS.md §Reducer Flow` |
| Toast IDs from deterministic helper | `buildDeterministicToastId(prefix, state.toasts)` or a pre-generated payload ID — never `getSafeUUID()` inside a reducer. | `src/context/reducers/AGENTS.md §Reducer Flow` |
| Domain logic stays in domain layer | `questReducer.ts` is an integration point only. Quest logic lives in `src/domain/questLifecycle.ts`. | `src/context/reducers/AGENTS.md §Reducer Flow` |
| Forbidden-key branch returns identical reference | Prototype-pollution rejection must `return state` (same reference), never `return { ...state }`. A spread still fails `reducerInvariants.test.js`. | `src/context/reducers/AGENTS.md §Load Sanitization` |
| Minigame completion must not change `currentScene` | Completion reducers preserve `state.currentScene`. Navigation belongs to continuation callbacks. | `src/context/reducers/AGENTS.md §Reducer Flow` |

---

## 2. Numeric Safety

**Severity: Important for coercion violations; Critical if in a sanitizer path**

| Rule | What to look for | Source |
|------|-----------------|--------|
| `isFiniteNumber(val)` not `Number(val)` | `Number()` silently accepts booleans, arrays, strings. Use `isFiniteNumber` from `src/utils/finiteNumber.ts`. | `src/utils/finiteNumber.ts:27` |
| `finiteNumberOr(value, fallback)` before clamping | For any persisted number arithmetic, wrap the stored addend with `finiteNumberOr`. `??` and `typeof value === 'number'` both pass `NaN`/`Infinity`. | `src/utils/finiteNumber.ts:16` |
| `Number.isFinite` in sanitizers | Sanitizer files may use `Number.isFinite` directly (standard JS). The ban on `Number()` coercion still applies everywhere. | `src/context/reducers/AGENTS.md §Load Sanitization` |
| `WeakSet` for cycle safety in recursive utilities | Recursive traversers/freezers/sanitizers need `WeakSet<object>` guards and must continue traversal through already-frozen parents. | `AGENTS.md §Architecture` |
| Clamp probabilities | New probability fields in sanitizers must be clamped to `[0, 1]` (or narrower) — matches `plannedSuccessProbability` pattern. | `src/context/reducers/AGENTS.md §Long-Term Assets` |

---

## 3. Timing and Clock

**Severity: Important**

| Rule | What to look for | Source |
|------|-----------------|--------|
| Gameplay timing via `audioEngine.getGigTimeMs()` | Never call Tone.js time APIs directly for in-gig gameplay timing. | `src/utils/audio/audioEngine.ts` |
| Non-gameplay time via `IClock` | Timestamps, cooldowns, and persistence metadata use the injected `IClock` from `src/utils/clock.ts`. In components: `useClock()`. In pure helpers: `IClock` parameter defaulting to `systemClock`. | `src/utils/clock.ts` |

---

## 4. Internationalization

**Severity: Minor for missing key; Important if currency is hardcoded**

| Rule | What to look for | Source |
|------|-----------------|--------|
| Both locale files updated together | Any new user-facing string in `public/locales/en/<namespace>.json` needs a matching key in `public/locales/de/<namespace>.json`. | `public/locales/en/`, `public/locales/de/` |
| Locale namespaces | `assets`, `chatter`, `economy`, `events`, `items`, `minigame`, `traits`, `ui`, `unlocks`, `venues` | `public/locales/en/` |
| Currency via `formatCurrency` | Currency shown in toast options dispatched from action creators/reducers must use `formatCurrency(value, i18n.language, signDisplay)` from `src/utils/numberUtils.ts`. | `src/utils/numberUtils.ts:74` |

---

## 5. Visual / Color

**Severity: Minor**

| Rule | What to look for | Source |
|------|-----------------|--------|
| No hardcoded hex in components | Use CSS variables (`var(--color-*)`) or `getPixiColorFromToken('--token-name')` from `src/components/stage/stageRenderUtils.ts`. | `AGENTS.md §TypeScript and Style` |
| Brand hex fallbacks only from `brandColors.ts` | If a hex literal is truly needed as a fallback, it must come from `src/utils/brandColors.ts`. | `src/utils/brandColors.ts` |
| No `.propTypes` | This codebase uses TypeScript/JSDoc typing. `.propTypes` is not used and should not be added. | `AGENTS.md §TypeScript and Style` |

---

## 6. TypeScript / CheckJS

**Severity: Important**

| Rule | What to look for | Source |
|------|-----------------|--------|
| No `@ts-nocheck` / `@ts-ignore` / `any` | CheckJS is strict for `.js/.jsx`. These suppressions are forbidden. | `AGENTS.md §TypeScript and Style` |
| `unknown` at boundaries | Use `unknown` for untrusted input. Narrow with guards before use. | `AGENTS.md §TypeScript and Style` |
| `Object.hasOwn()` for untrusted keys | Do not use `in` or bracket access without an `Object.hasOwn` guard on untrusted objects. | `AGENTS.md §TypeScript and Style` |
| Explicit return types on exported class members | Public members/getters of exported classes must have explicit return type annotations. | `AGENTS.md §TypeScript and Style` |
| Type-only imports | Imports used only as types must use `import type`. | `AGENTS.md §TypeScript and Style` |
| Conventional Commits | `type(scope): message`. Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`. | `AGENTS.md §TypeScript and Style` |

---

## 7. Reducer-Specific Rules

**Severity: Critical for data integrity issues; Important for logic issues**

| Rule | What to look for | Source |
|------|-----------------|--------|
| Numeric payload rejection | Reducers must reject/drop non-finite numbers with `Number.isFinite` or `finiteNumberOr` before clamping — not rely on clamps silently turning `NaN` into `0`. | `src/context/reducers/AGENTS.md §Reducer Flow` |
| Quest events only on state change | `QuestEvents.emit` must only fire when state actually changed. No-op dispatches must return original state without emitting. | `src/context/reducers/AGENTS.md §Reducer Flow` |
| `fameLevel` derived alongside `fame` | Never update `fameLevel` standalone. Always recompute via `calculateFameLevel` when `fame` changes. | `src/context/reducers/AGENTS.md §Reducer Flow` |
| `assertNever` pattern is intentional | The `gameReducer` default branch uses `assertNever(action as never)`. The `as never` cast is deliberate (defense-in-depth against malformed dispatches). Do not flag as a bug. | `src/context/reducers/AGENTS.md §Reducer Flow` |
| Contraband `activeContrabandEffects` — no dedup by `instanceId` | Must register exactly one entry per use. Deduping by `instanceId` leaks buffs permanently on expiry. | `src/context/reducers/AGENTS.md §Band Effects` |

---

## 8. Asset and Module System

**Severity: Critical for financial exploits; Important for logic correctness**

| Rule | What to look for | Source |
|------|-----------------|--------|
| `CHASSIS_CONFIG` and `MODULE_REGISTRY` are sources of truth | Asset reducers read config directly. `buildDiyTier` belongs in `assetConfig.ts` only. | `AGENTS.md §Architecture` |
| Tick functions are the daily authority | `processAssetTick → processLiabilityTick → processCrowdfundTick → rollAssetRiskEvents` — do not add parallel action paths for these. | `src/context/reducers/AGENTS.md §Long-Term Assets` |
| `handleInstallModule` charges only on slot transition | Cost deducted only when slot actually transitions `null → module`. Stale replay protection already in place — don't remove it. | `src/context/reducers/AGENTS.md §Long-Term Assets` |
| Child modules must be uninstalled first | `handleRemoveModule` rejects removal if any slot added by the module still has an `installedModuleId`. | `src/context/reducers/AGENTS.md §Long-Term Assets` |
| Loan-mode chassis payload requires valid `loanProfileId` | Missing/invalid `loanProfileId` → return state unchanged (defense against free-chassis exploits). | `src/context/reducers/AGENTS.md §Long-Term Assets` |

---

## 9. Unlock System

**Severity: Important if responsibilities are mixed**

| Rule | What to look for | Source |
|------|-----------------|--------|
| Persistence in `unlockManager.ts` only | `src/utils/unlockManager.ts` owns unlock persistence. Do not add persistence logic elsewhere. | `src/utils/unlockManager.ts` |
| Eligibility in `unlockCheck.ts` only | `src/utils/unlockCheck.ts` owns eligibility evaluation. Do not duplicate eligibility logic in reducers or components. | `src/utils/unlockCheck.ts` |

---

## 10. High-Risk Gotchas

These are easy to get wrong and worth checking explicitly in any PR touching the named areas:

| Gotcha | Correct pattern | Wrong pattern |
|--------|----------------|---------------|
| Location / city derivation | `getRegionKeyForLocation(player.location)` from `src/utils/mapUtils.ts:144` | `player.location` directly in region-keyed state |
| `currentGig` is a venue object | `currentGig` holds the venue. Do not use it as a city key. | `state.currentGig` used as a location string |
| `START_GIG` side effects | Resets `gigModifiers` AND minigame state. Completion reducers must not navigate. | Reducer calling `navigate()` or changing `currentScene` on completion |
| `lastGigStats.score` is raw | Raw score is in thousands. Outcome logic uses `accuracy` (0–100) + `failed` flag. | Comparing raw score to percentage thresholds |
| `advanceDay` | Use typed `advanceDay(state)` from `src/context/actionCreators.ts:1226`. | Dispatching `createAdvanceDayAction()` without payload |
| Bankruptcy check | Uses `getTotalDailyObligations(state)` from `src/utils/assetSelectors/stateAggregation.ts:75`. | Manual obligation sum in reducer |
| Contraband duration | Measured in days, decremented on `ADVANCE_DAY` only — never per-gig. | Decrementing duration on gig events |
| Stash hydration spread order | `{ ...itemObj, ...baseItem }` — base definition fields always win. | `{ ...baseItem, ...itemObj }` — save data overrides definition |

---

## 11. What Not to Flag

Flagging these wastes review trust and trains authors to ignore comments:

- Import ordering or whitespace — linters (`eslint`, `prettier`) enforce these automatically
- Refactors that don't change behavior when the result is clearly correct
- Missing JSDoc on private helpers — not required in this codebase
- Stylistic naming preferences with no correctness impact
- The `assertNever(action as never)` pattern in `gameReducer` — it is intentional (see §7)
- `addContrabandHelper` being a function not an action — intentional composition pattern
