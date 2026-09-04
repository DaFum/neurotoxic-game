# Roguelite Expedition — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement the numbered child plans task-by-task.

**Goal:** Implement the approved Roguelite Expedition design as a production-valid, testable loop without amendment chains, simulator-only mechanics or hidden caller-authorized state transitions.

**Architecture:** Existing production owners remain canonical: `player`, `band`, assets/tourbus, map generation, social/Brand Deals, quests, event engine, gig/rhythm flow and persistence. Expedition adds a run-scoped orchestration state and Career/meta state only where the design needs new ownership. Reducers/shared resolvers remain authoritative against malformed direct actions.

**Tech Stack:** React 19, TypeScript 6, existing typed `GameAction`/`ActionTypes`, reducers/action creators, deterministic RNG, i18next, Node/Vitest/Playwright and the v15 balance harness.

---

## Authority

Only these documents are executable authorities:

1. `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md`
2. this master plan
3. the owning numbered child plan `01`–`06`

`00-review-hardening-contract.md`, `00a-exact-owner-contract-clarifications.md` and `00-spec-fidelity-execution-contract.md` are **NON-NORMATIVE historical review records**. Their still-valid content has been folded into G1–G6.

---

## Gate order

```text
G0 -> G1A -> G2 -> G3 -> G4 -> G1B -> G5 -> G6
```

### G0 — Frozen baseline/provenance
Owned by G6 Task 1. Freeze v14 outputs and current command/provenance rules before changing the balance horizon.

### G1A — Core foundation
Owned by `01` Tasks 1–9. Creates prepared run identity, complete loadout/commitment, deterministic map/Fog/Intel, reward ledger, extraction settlement and Economy/Fuel failure shell. It may start a valid no-Contract/no-later-subsystem Expedition.

### G2 — Vehicle/Condition/Cargo/Repair
Owned by `02`. Adds chassis playstyles, manifest-only cargo, technical wear, skill-based repairs, hidden defects, inspections and insurance.

### G3 — Crew/Stress/Relationships/Injuries
Owned by `03`. Adds six Crew roles, source-bound Stress/relationships, Band injuries, Crew injury/unavailability, signature traits and Contact Intel.

### G4 — Pressure/Sponsors/Contracts/Social/Rivals/Finales
Owned by `04`. Adds expressive native Contracts, Sponsor commitments, Double Down, Crowd Hype, Pressure Director, Authority events, persistent Rival/Nemesis identity, quests, contextual/special Finales and reducer-authoritative drafts.

### G1B — Core integration closure
Owned by `01` Tasks 10–12. Integrates G2–G4 failure signals, Intel/reward producers and the full route→node→consequence→extract/finale E2E flow.

### G5 — Meta/Regions/Tours/HQ/Ascension
Owned by `05`. Completes the unified effective-rules path, Region/Tour semantics, concrete Tour-Token/rank economy, HQ transition, unlock sets, 1–3 typed Between-Tour decisions, Archive, Ascension and rule-changing Legendaries.

### G6 — Evidence/calibration
Owned by `06`. Builds six explicit production-valid profiles, disjoint calibration/holdout cohorts, linked Career sequences, paired extraction and skill-vs-management probes, and real runtime samples.

---

## Global implementation invariants

These invariants are embedded in the owning child plans and are not delegated to a separate hardening file:

1. **Reducer authority.** Public actions carry intent plus genuinely nondeterministic tokens/stale guards only. Derived prices, rewards, next state, eligibility and rule outcomes are recomputed or exact-validated by the reducer/shared pure resolver.
2. **Replay safety.** Every run/Career settlement is keyed by stable `runId`/source evidence and duplicate dispatch is identical-state/no additional payout.
3. **Navigation outside reducers.** Reducers settle state only; the owning committed-state continuation callback performs save/scene change.
4. **Persistence completeness.** New required top-level state is wired through `initialState`, `createInitialState`, `PERSISTED_FIELDS`/load sanitizer where persistent, and the Playwright screenshot `BASE_STATE` mirror.
5. **Context completeness.** Every new context-level action is in `ActionTypes`/`GameAction`, returned with `Extract<...>`, implemented in `GameStateProvider`, exposed by `GameDispatchActions`/`dispatchValue` and covered by tests.
6. **Source proof.** Social/Contact Intel, reward ledger entries, Rival outcomes, obligation progress, Crew Career changes and Draft offers require canonical just-resolved source evidence.
7. **Production parity.** G6 imports production helpers; no simulator-only duplicate formula may decide a release metric.
8. **No invisible debuffs.** Material Condition/Injury/Finale modifiers are surfaced before active play.
9. **No softlocks.** Zero Condition, critical injury, no Fuel and Authority crises always expose a legal recovery/extract/accept-failure path when the design says one exists.
10. **No hidden plan override.** Future fixes edit the owning G1–G6 file directly.

---

## Product-fidelity matrix

| Approved design pillar | Owner | Required production proof |
|---|---|---|
| Full constrained Tour Prep build | G1 + G4 | preview→commit→START test with setlist/equipment/chassis/modules/Crew/cargo/Sponsor/native Contracts/Fuel/Cash |
| 7–9-node branching map + hybrid Fog | G1 + G5 | deterministic map parity, visible node class/edges, 0→1→2 Intel |
| Six permanent HUD resources | G1 | UI test: only Cash/Fuel/Stamina/Harmony/Condition/Heat persistent |
| Management creates situation; skill changes outcome | G2/G3/G4/G6 | Condition/Injury/Finale/Crowd-Hype modifiers + paired skill probe |
| Chassis/module playstyles | G2/G5/G6 | production travel/cargo/repair/Authority differences + profile signatures |
| Crew roles, Stress, relationships, injuries | G3 | each role has a consumer; source-bound stress/relationship; Band+Crew injury/recovery persistence |
| Sponsors/Contracts/Double Down | G4 | prepared-route commitments; typed constraints; save/reload Double-Down enforcement |
| Social as strategic system | G4 | push/monetize/suppress/weaponize + Sponsor/Rival/Intel/Crowd-Hype outputs |
| Multi-input Pressure Director | G4 | weight tests for Heat/Exposure/Cash/Condition/Stress/obligations/Rival/depth + cross-family relief |
| Persistent Nemesis | G4/G5/G6 | same Rival id across ≥3 linked runs + higher-level route/Sponsor/finale changes |
| Hybrid extraction | G1/G5 | base Cash/Fame retention + secured/explicitly-extracted/abandoned rare-item divergence |
| Contextual + Contract special Finales | G4 | exact Finale profile affects real gig lifecycle for every finale family |
| Broadening meta progression | G5 | exact token/rank/facility/set registries + fresh-career Day-1 HQ transition |
| 1–3 Between-Tour decisions | G5/G6 | typed persisted decisions block Next Tour until settled; linked Career simulation executes them |
| Rule-changing Legendaries | G5/G6 | five production activation tests + coverage evidence |
| 20–30 real minutes | G6 | real runtime samples, not simulator iteration duration |

---

## Merge/release rule

A gate is green only when its child-plan exit criteria and listed focused tests pass. G6 may report soft balance hypotheses, but a metric is not release evidence until:

```text
production owner exists
AND app-side integration test exists
AND deterministic harness uses that production owner
AND calibration/holdout requirements for that metric are satisfied
```

Real-duration target remains a soft product target until at least 20 valid runtime samples exist.