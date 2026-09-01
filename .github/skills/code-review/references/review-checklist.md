# Review Checklist by File Type

Use this file after changed files are known. Run only the checklists that match the diff, then apply
`review-risk-model.md` when cross-cutting state, persistence, TypeScript, or boundary risk is present.

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
12. [Cross-Cutting Type / Boundary Checks](#12-cross-cutting-type--boundary-checks)
13. [Large or Mixed PRs](#13-large-or-mixed-prs)

---

## 1. Reducers

Files: `src/context/reducers/*.ts` (excluding sanitizers/ and migrations/)

- [ ] All state changes go through dispatched typed actions; no direct state mutation
- [ ] New actions are wired through `actionTypes.ts`, `actionCreators.ts`, and reducer handling
- [ ] Reducer-received numeric values reject/drop non-finite inputs before clamping
- [ ] Persisted-number arithmetic uses `finiteNumberOr` before arithmetic/clamping
- [ ] Type narrowing uses strict finite-number checks, not permissive coercion
- [ ] No RNG or UUID generation inside reducer code
- [ ] Toast IDs use `buildDeterministicToastId` or a pre-generated payload ID
- [ ] Forbidden-key/no-op branches return the exact original `state` reference when required
- [ ] Minigame completion handlers preserve `currentScene`
- [ ] `QuestEvents.emit` fires only when state actually changed
- [ ] `fameLevel` changes only as a derived value alongside `fame`
- [ ] Replayed/stale actions cannot double-charge, double-reward, duplicate side effects, or create orphan state
- [ ] One applied reversible effect has the matching bookkeeping needed to reverse exactly that application

---

## 2. Action Creators / Types

Files: `src/context/actionCreators.ts`, `src/context/actionTypes.ts`

- [ ] New action type is added to the canonical `ActionTypes` `as const` object; no duplicate raw action string
- [ ] Literal action discriminants remain narrow; no widening to plain `string`
- [ ] Every new/changed `src/context` action creator returns `Extract<GameAction, { type: typeof ActionTypes.X }>` exactly; do not hand-write an equivalent action object return shape
- [ ] Creator sanitizes raw payload before packaging it for dispatch
- [ ] UUID/random generation occurs here rather than in reducers when the reducer needs deterministic input
- [ ] `advanceDay(state)` is used instead of a payloadless `createAdvanceDayAction()` call
- [ ] Currency embedded in toast options uses `formatCurrency(value, i18n.language, signDisplay)`
- [ ] Action payload type is narrow; untrusted `unknown` is not passed through without validation
- [ ] Action contract changes update all affected reducer/tests/shared types in the same PR

Treat a hand-written return object shape on a new/changed `src/context` action creator as an **Important** repository-rule violation even when it appears structurally equivalent. The scoped contract requires `Extract<GameAction, ...>` so the creator remains coupled to the canonical discriminated union and reducer narrowing cannot drift.

---

## 3. Domain Logic

Files: `src/domain/`

- [ ] Quest lifecycle logic remains in `src/domain/questLifecycle.ts`
- [ ] Unlock eligibility remains in `src/utils/unlockCheck.ts`
- [ ] Pure domain helpers do not mutate state or hide side effects
- [ ] Persisted-number arithmetic uses `finiteNumberOr` where invalid stored values are possible
- [ ] State transitions preserve domain invariants on both normal and no-op/edge paths
- [ ] Shared domain contracts are imported from `src/types/**` instead of cloned locally when a canonical type already exists

---

## 4. Selectors / Utilities

Files: `src/utils/`

- [ ] `isFiniteNumber` is used for strict numeric type guards where repo rules require it
- [ ] `finiteNumberOr(value, fallback)` is used before arithmetic on persisted values
- [ ] Recursive utilities use `WeakSet<object>` cycle protection
- [ ] `getRegionKeyForLocation` derives region/city keys instead of raw `player.location`
- [ ] `getTotalDailyObligations(state)` remains the bankruptcy obligation authority
- [ ] Non-gameplay time uses an `IClock` parameter with `systemClock` default where appropriate
- [ ] Unlock persistence stays in `unlockManager.ts`; eligibility stays in `unlockCheck.ts`
- [ ] Indexed object/array/map lookups are narrowed before property access when the key can miss
- [ ] Shared high-fan-out utilities keep existing contracts or update all call sites/tests coherently
- [ ] Hot/tick-path changes do not introduce obviously unbounded or repeated work proportional to unrelated state size

---

## 5. React Components

Files: `src/components/` (excluding stage/)

- [ ] No `.propTypes` added
- [ ] No hardcoded hex colors; use CSS variables/token helpers
- [ ] Non-gameplay time uses `useClock()`; in-gig timing uses `audioEngine.getGigTimeMs()`
- [ ] Untrusted key access is guarded with `Object.hasOwn()` where applicable
- [ ] No `@ts-ignore`, `@ts-nocheck`, or `any`
- [ ] New visible strings use namespaced i18n keys
- [ ] New React 19 components accept refs as standard `ref` props; do not introduce `forwardRef`
- [ ] Effects/subscriptions clean up correctly and do not rely on stale state/closure assumptions
- [ ] Indexed/optional values are narrowed instead of hidden behind unsafe assertions
- [ ] Wide game-state consumers use focused selectors rather than passing the whole root state when the nested repo instructions require it

Do not turn general React preferences into findings. Keep lifecycle/ref/state comments only when a repo rule is explicit or a concrete runtime consequence exists.

---

## 6. Pixi / Stage

Files: `src/components/stage/`

- [ ] Colors use `getPixiColorFromToken('--token-name')` rather than hardcoded hex literals
- [ ] Textures/resources are loaded and disposed without leaks
- [ ] Hex fallbacks, when genuinely necessary, come from `brandColors.ts`
- [ ] Pixi-dependent renderer/controller concerns stay out of React hook layers where nested repo instructions require separation
- [ ] Stage updates do not accidentally subscribe to or rebuild from unrelated root-state changes

---

## 7. Locale Files

Files: `public/locales/en/*.json`, `public/locales/de/*.json`

- [ ] Every added English key has a matching German key and vice versa
- [ ] Namespace is appropriate (`ui`, `economy`, `venues`, `events`, `assets`, `items`, `unlocks`, `traits`, `chatter`, `minigame`)
- [ ] No hardcoded currency strings bypass `formatCurrency`
- [ ] Renamed/removed keys do not leave changed call sites pointing at stale keys

---

## 8. Tests

Files: `tests/`

- [ ] Tests exercise the real logic rather than mocking away the behavior under review
- [ ] New risky production behavior is covered by an existing or new focused regression test
- [ ] A proposed test would fail on the actual defect/invariant break, not merely restate implementation details
- [ ] No test is removed/weakened in a way that hides the changed failure mode
- [ ] Security/invariant tests such as `reducerInvariants.test.js` and `bandReducer.security.test.js` are not bypassed
- [ ] Persistence/migration changes include malformed/legacy input cases when those are part of the risk
- [ ] No-op/replay/duplicate paths are tested when the changed logic can emit events, charge resources, reward the player, or mutate identity

Missing coverage alone is not automatically Important. Escalate only when the untested changed invariant has meaningful regression risk.

---

## 9. Sanitizers

Files: `src/context/reducers/sanitizers/`

- [ ] Strict runtime narrowing rejects malformed types; do not trust TypeScript casts after parsed data
- [ ] `Object.hasOwn` guards `for...in` loops over default-shape constants
- [ ] Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) are stripped/rejected
- [ ] Invalid/orphan references are dropped according to the domain contract
- [ ] Stash hydration spread order remains `{ ...itemObj, ...baseItem }`
- [ ] Probability/range fields clamp to the repo-defined valid range
- [ ] Malformed data falls back or is skipped rather than copied wholesale
- [ ] New persisted fields have an explicit legacy/missing-value behavior

---

## 10. Migration Files

Files: `src/context/reducers/migrations/`

- [ ] Migration is additive/non-destructive unless destructive behavior is explicitly required
- [ ] Legacy aliases apply only when the current key is absent; current data wins
- [ ] Pre-migration saves are tested through the actual load/migration path
- [ ] Re-running or chaining migrations cannot clobber data produced by newer migrations
- [ ] Changed shared types remain compatible with old persisted data or the migration handles the incompatibility explicitly

---

## 11. Audio

Files: `src/utils/audio/`

- [ ] Gameplay timing reads use `audioEngine.getGigTimeMs()`
- [ ] No Howler.js imports; the audio stack remains Tone.js through `audioEngine.ts`
- [ ] New audio calls go through `src/utils/audio/audioEngine.ts`, not direct Tone.js calls from components
- [ ] Timing changes preserve the correct clock ownership across pause/resume/replay paths

---

## 12. Cross-Cutting Type / Boundary Checks

Run this section when a change crosses storage/API/config/state/module boundaries or materially changes TypeScript contracts.

- [ ] Storage, JSON, API, event, imported-data, and other runtime boundaries enter as `unknown` or an equivalently validated shape
- [ ] Casts/assertions/non-null operators are backed by a visible invariant; otherwise narrow explicitly
- [ ] Guard indexed lookup results before dereference when keys can be absent
- [ ] Canonical shared contracts in `src/types/**` are reused instead of re-declared across modules
- [ ] Literal maps/configs preserve key coverage; `as const satisfies Record<K, V>` is the preferred local pattern when finite-key completeness matters
- [ ] New action discriminants remain literal and exhaustively handled by the existing action/reducer architecture
- [ ] A change in one shared type/config/action updates every dependent boundary that must stay aligned
- [ ] Runtime validation exists where static TypeScript types disappear (JSON parse, local storage, external data, dynamic object keys)

Only report these when they produce a real contract/boundary risk or break an explicit repo rule. Do not create type-style nits.

---

## 13. Large or Mixed PRs

When a PR is larger than roughly 500 changed lines or spans several unrelated domains:

1. Fetch the complete changed-file list with `pull_request_read method=get_files perPage=100` and paginate.
2. Load `references/review-risk-model.md` and group changes by root-risk area.
3. Map review depth:
   - **Tier A:** fully review every changed line/hunk and required surrounding context
   - **Tier B:** fully review every changed line/hunk
   - **Tier C:** spot-check representative hunks unless escalation rules promote the area
   - **Tier D:** minimal verification unless another change raises its risk
4. Do not assume directory alone determines the tier; promote state/boundary/shared-contract hunks even inside otherwise low-risk files.
5. In the final summary, declare coverage as:
   - `fully reviewed`
   - `spot-checked`
   - `not reviewed`
6. If any changed file is only `spot-checked` or `not reviewed`, do not use **Approve**. Use **Comment** for a clean but partial review, or **Request changes** if a Critical/Important finding exists.
7. Apply the normal verdict decision tree only when every changed file has been fully reviewed.
