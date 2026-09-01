# Review Risk Model

Use this reference to decide **where to spend review depth** and **when a candidate issue is strong enough to become a finding**. Review priority is not finding severity.

## Table of Contents

1. [Review-Priority Tiers](#1-review-priority-tiers)
2. [Escalation and De-escalation](#2-escalation-and-de-escalation)
3. [Invariant-First State and Boundary Pass](#3-invariant-first-state-and-boundary-pass)
4. [Type and Runtime Soundness Pass](#4-type-and-runtime-soundness-pass)
5. [Evidence and Confidence Gate](#5-evidence-and-confidence-gate)
6. [Root-Cause Compression](#6-root-cause-compression)
7. [Current-Head and Re-review Rules](#7-current-head-and-re-review-rules)

---

## 1. Review-Priority Tiers

These tiers control review depth, not the label attached to a defect.

### Tier A — Deep review first

Typical signals:

- reducers, action contracts, sanitizers, migrations, persistence, hydration, save/load
- external or hostile input crossing into typed state
- state-machine, minigame completion, quest lifecycle, asset tick, or event-engine transitions
- security-sensitive logic, prototype-pollution defenses, auth/trust boundaries
- config/lookup changes that can silently route gameplay to the wrong branch
- shared contracts or discriminants whose failure fans out across the app

Ask:

- Can this create impossible or silently corrupted game state?
- Can malformed data cross a boundary and appear trusted afterward?
- Can this cause lost progress, duplicate rewards/effects, leaked effects, or exploitable state?
- Would failure be non-local or difficult for a player/test to detect?

### Tier B — Full review after Tier A

Typical signals:

- shared selectors/utilities, arithmetic helpers, clocks, audio timing
- React 19 refs/effects/subscriptions/cleanup with behavioral consequences
- typed lookup maps, finite config maps, serialization shapes, API response contracts
- high-fan-out utilities or domain helpers
- performance-sensitive loops or event/tick paths

Ask:

- Can one wrong assumption propagate to many call sites?
- Does runtime behavior still match the TypeScript contract?
- Can timing, cleanup, or stale closure behavior misfire in a realistic flow?

### Tier C — Targeted/spot review when the PR is large

Typical signals:

- isolated React presentation logic
- Pixi presentation wiring with limited state impact
- locale files
- tests that do not themselves alter production behavior
- localized refactors with unchanged contracts

Still promote to a higher tier when the hunk crosses a state, timing, external-data, or shared-contract boundary.

### Tier D — Minimal review

Typical signals:

- copy-only changes
- formatting-only changes
- import reordering with no runtime effect
- mechanical renames with unchanged contracts

Do not spend deep-review budget here unless another changed file makes the same root area risky.

---

## 2. Escalation and De-escalation

Promote review depth when any of these are true:

- the same change touches both a trust boundary and a state transition
- a guard is replaced by a cast, assertion, coercion, or non-null assumption
- a shared action/type/config contract changes
- persistence, migration, hydration, replay, or deterministic RNG behavior changes
- tests for the changed invariant are deleted, weakened, or no longer exercise the path
- a utility has high fan-out or runs on a hot/tick path
- a no-op path can now create side effects, navigation, rewards, events, or charges

De-emphasize a hunk when all of these are true:

- blast radius is local
- contract shape is unchanged
- no new trust-boundary or state-transition behavior exists
- failure would be obvious and contained
- existing focused tests still exercise the exact behavior

Do not rank risk by line count alone.

---

## 3. Invariant-First State and Boundary Pass

For state-heavy changes, name the invariant before judging the implementation.

Examples:

- an action creator sanitizes raw input and a reducer remains the final authority
- a completion reducer preserves `currentScene`
- persisted values cannot inject `NaN`, `Infinity`, prototype keys, or definition overrides
- one forward-applied effect has one matching revertible record
- a no-op dispatch preserves identity and emits no progress event
- a migration never overwrites a current key with a stale legacy alias
- deterministic reducers do not generate UUIDs or random values

Trace two paths when practical:

1. **Normal path:** expected valid input through the changed code.
2. **Edge/adversarial path:** malformed persistence, missing lookup key, stale replay, duplicate invocation, invalid action payload, no-op transition, boundary value, or cleanup/unmount path.

Follow the path far enough to prove a concrete consequence. A suspicious local pattern without a plausible consequence is not yet a finding.

---

## 4. Type and Runtime Soundness Pass

Treat TypeScript as a tool for enforcing runtime contracts, not as an end in itself.

Prioritize:

- `unknown` plus explicit narrowing at storage/API/event/external boundaries
- guarded indexed reads and lookup results before property access
- literal discriminants that remain narrow enough for action/union handling
- action creators that stay tied to the canonical `GameAction` member instead of drifting payload shapes
- shared domain contracts from `src/types/**` rather than divergent cross-module clones
- finite config/lookup maps whose key coverage is compiler-checked when missing entries are possible
- assertions/non-null operators only when a visible invariant makes failure impossible
- React 19 ref/effect/cleanup behavior when the changed type contract affects runtime lifecycle

A type-style preference is not a finding. Keep it only when the typing can hide a real runtime defect, contract drift, or unsafe boundary.

---

## 5. Evidence and Confidence Gate

Classify candidate concerns internally before writing comments:

### Confirmed

The visible diff plus required surrounding context proves the issue and a realistic failure mode. Confirmed findings may affect severity/verdict.

### Contingent

The concern is plausible but depends on unseen context. Fetch the narrowest evidence that can confirm or dismiss it. If it remains contingent, do not present it as Critical or Important; mention it only as a limitation/follow-up when useful.

### Unsupported

The concern relies on guessing, style preference, invented surrounding behavior, or a failure mode that cannot be made concrete. Drop it.

For every kept finding require:

- changed location
- violated invariant/rule
- realistic failure mode
- evidence chain
- smallest safe fix direction

Tie-break uncertain severity downward unless a trust boundary, persistence boundary, security issue, or concrete state-corruption path justifies escalation.

---

## 6. Root-Cause Compression

Do not equate comment count with review quality.

Merge candidate findings when they share:

- the same underlying invariant violation
- the same failure mode
- the same corrective action

Choose the most actionable changed line for the inline comment and mention other affected call sites or hunks in the same body when helpful.

Keep separate findings when one fix would not resolve the other failure mode.

Drop:

- weaker duplicates
- vague architecture warnings with no demonstrated impact
- style-only comments already enforced by tooling
- test-gap comments that duplicate the real implementation defect without adding a distinct risk

---

## 7. Current-Head and Re-review Rules

For re-reviews or long-running PRs:

1. Refetch PR metadata and capture the current head SHA.
2. Refetch unresolved/non-outdated review threads.
3. Review current patches, not remembered or cached hunks.
4. Pin base/head file-content fallbacks to concrete SHAs.
5. Do not re-raise a previous comment if the current head fixed it.
6. If a previous issue remains, comment only when the re-review needs an updated finding; otherwise reference the unresolved thread in the summary.
7. If repository sources disagree about the current diff, state which SHA/source was used and avoid an approval until the discrepancy is resolved.
