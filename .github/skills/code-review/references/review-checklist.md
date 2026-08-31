# Review Checklist by File Type

Use this file to run a targeted checklist based on which files changed in the PR. Load it when
the diff touches a file type listed below.

## Table of Contents

1. [Reducers (`src/context/reducers/`)](#1-reducers)
2. [Action Creators / Types (`src/context/actionCreators.ts`, `actionTypes.ts`)](#2-action-creators--types)
3. [Domain Logic (`src/domain/`)](#3-domain-logic)
4. [Selectors / Utilities (`src/utils/`)](#4-selectors--utilities)
5. [React Components (`src/components/`)](#5-react-components)
6. [Pixi / Stage (`src/components/stage/`)](#6-pixi--stage)
7. [Locale Files (`public/locales/`)](#7-locale-files)
8. [Tests (`tests/`)](#8-tests)
9. [Sanitizers (`src/context/reducers/sanitizers/`)](#9-sanitizers)
10. [Migration Files (`src/context/reducers/migrations/`)](#10-migration-files)
11. [Audio (`src/utils/audio/`)](#11-audio)
12. [Large or Mixed PRs](#12-large-or-mixed-prs)

---

## 1. Reducers

Files: `src/context/reducers/*.ts` (excluding sanitizers/ and migrations/)

- [ ] All state changes go through a dispatched action — no direct mutation
- [ ] New action types added to `actionTypes.ts` and `actionCreators.ts`
- [ ] `Number.isFinite` or `finiteNumberOr` used before any clamp on reducer-received values
- [ ] `isFiniteNumber` (not `Number()` coercion) for type-narrowing checks
- [ ] No RNG calls or UUID generation inside reducer — belongs in action creator
- [ ] Toast IDs use `buildDeterministicToastId`, not `getSafeUUID()`
- [ ] Forbidden-key branch returns exact `state` reference (not `{ ...state }`)
- [ ] Completion reducers do NOT change `currentScene` — check all minigame completion handlers
- [ ] `QuestEvents.emit` only called when state actually changed
- [ ] `fameLevel` only updated alongside `fame` via `calculateFameLevel`

---

## 2. Action Creators / Types

Files: `src/context/actionCreators.ts`, `src/context/actionTypes.ts`

- [ ] New action type added to the `ActionType` enum/object in `actionTypes.ts`
- [ ] Creator sanitizes raw payload with `isFiniteNumber`/`finiteNumberOr` before packaging
- [ ] Creator is the right place for UUID generation (not reducer)
- [ ] `advanceDay(state)` used — not `createAdvanceDayAction()` without payload
- [ ] Currency in toast options uses `formatCurrency(value, i18n.language, signDisplay)`
- [ ] Action payload type is narrow (not `any` / `unknown` passed straight through)

---

## 3. Domain Logic

Files: `src/domain/`

- [ ] Quest logic stays in `src/domain/questLifecycle.ts` — not pushed into reducer
- [ ] Unlock eligibility stays in `src/utils/unlockCheck.ts` — not duplicated here
- [ ] No direct state mutation — pure functions return new state
- [ ] `finiteNumberOr` used for any arithmetic on values that may be persisted

---

## 4. Selectors / Utilities

Files: `src/utils/`

- [ ] `isFiniteNumber` used for type guards (not `typeof === 'number'`)
- [ ] `finiteNumberOr(value, fallback)` used before arithmetic on persisted values
- [ ] Recursive utilities have `WeakSet<object>` cycle guard
- [ ] `getRegionKeyForLocation` used to derive city — not `player.location` directly
- [ ] `getTotalDailyObligations(state)` used for bankruptcy checks
- [ ] Clock: `useClock()` in components; `IClock` parameter with `systemClock` default in pure helpers
- [ ] Unlock persistence: only `unlockManager.ts`; eligibility: only `unlockCheck.ts`

---

## 5. React Components

Files: `src/components/` (excluding stage/)

- [ ] No `.propTypes` added
- [ ] No hardcoded hex colors — `var(--color-*)` CSS variables or token helpers
- [ ] Timing: `useClock()` for non-gameplay time; `audioEngine.getGigTimeMs()` for in-gig
- [ ] `Object.hasOwn()` used for any untrusted key access
- [ ] No `@ts-ignore`, `@ts-nocheck`, or `any`
- [ ] i18n: new visible strings use `useTranslation` and a namespaced key

---

## 6. Pixi / Stage

Files: `src/components/stage/`

- [ ] Colors via `getPixiColorFromToken('--token-name')` from `stageRenderUtils.ts` — no hex literals
- [ ] Textures are loaded and disposed correctly (Pixi memory leak risk)
- [ ] No hardcoded hex fallbacks — use `brandColors.ts` if a fallback is genuinely needed

---

## 7. Locale Files

Files: `public/locales/en/*.json`, `public/locales/de/*.json`

- [ ] Every key added to `en/` has a matching key added to `de/`
- [ ] Namespace is appropriate (`ui`, `economy`, `venues`, `events`, `assets`, `items`, `unlocks`, `traits`, `chatter`, `minigame`)
- [ ] No hardcoded currency strings — values go through `formatCurrency`

---

## 8. Tests

Files: `tests/`

- [ ] Tests exercise actual logic, not just mocks of the thing being tested
- [ ] New production code has accompanying tests (or existing tests clearly cover the path)
- [ ] No test removed or weakened without a clear reason
- [ ] Security/invariant tests (`reducerInvariants.test.js`, `bandReducer.security.test.js`) not bypassed

---

## 9. Sanitizers

Files: `src/context/reducers/sanitizers/`

- [ ] `isFiniteNumber(val)` used (not `Number(val)` coercion)
- [ ] `Object.hasOwn` guard on `for...in` loops over default-shape constants
- [ ] Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) are stripped
- [ ] Orphan data (orphan liabilities, orphan `addedByModuleId` slots) is dropped
- [ ] Spread order in stash hydration: `{ ...itemObj, ...baseItem }` — base definition wins

---

## 10. Migration Files

Files: `src/context/reducers/migrations/`

- [ ] Migration is additive / non-destructive — does not clobber data set by a newer migration
- [ ] Legacy-key alias applies only when the current key is absent — current key always wins
- [ ] Migration is covered by a test that loads a pre-migration save and asserts the result

---

## 11. Audio

Files: `src/utils/audio/`

- [ ] Gameplay timing reads use `audioEngine.getGigTimeMs()` — no direct `Tone.Transport.seconds` or similar
- [ ] No Howler.js imports — the audio stack is Tone.js only
- [ ] New audio calls go through `src/utils/audio/audioEngine.ts`, not direct Tone.js calls from components

---

## 12. Large or Mixed PRs

When a PR touches >500 lines or spans multiple domains:

1. Call `pull_request_read method=get_files` to get the full file list.
2. Triage by risk tier:
   - **Tier 1 (fully review):** reducers, action creators, sanitizers, domain logic, migrations
   - **Tier 2 (fully review):** selectors, utilities with arithmetic, audio
   - **Tier 3 (spot-check):** components, locale files, tests, Pixi stage
3. In the summary, declare coverage for each tier:
   - `fully reviewed` — read every changed line
   - `spot-checked` — read a representative sample
   - `not reviewed` — out of scope; call it out explicitly
4. Use the verdict decision tree from `references/output-formats.md` as normal, but note any
   confidence gaps in the summary.
