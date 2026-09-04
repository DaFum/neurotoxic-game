# Roguelite Expedition Implementation Plan — Canonical Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide one unambiguous entrypoint for implementing the approved Roguelite Expedition design without relying on amendment chains or superseded snippets.

**Architecture:** The approved design specification is the product authority. The master plan defines dependency order, and each numbered child plan owns the executable contract for its subsystem. The hardening contract is cross-cutting validation guidance; the former exact-owner and spec-fidelity files are retained only as historical review records and MUST NOT override the normalized child plans.

**Tech Stack:** React 19, TypeScript 6, typed actions/reducers, existing map/gig/event/social/quest/asset systems, deterministic RNG, Node/Vitest/Playwright, balance simulator v15.

---

## Canonical authority

Read and implement in this order:

1. `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md` — approved product/design intent.
2. `docs/superpowers/plans/2026-09-03-roguelite-expedition-master-plan.md` — dependency order and gate ownership.
3. The matching numbered child plan:
   - `roguelite-expedition/01-expedition-core-extraction.md`
   - `roguelite-expedition/02-condition-repairs-cargo.md`
   - `roguelite-expedition/03-crew-stress-relationships.md`
   - `roguelite-expedition/04-pressure-rivals-contracts.md`
   - `roguelite-expedition/05-meta-regions-ascension.md`
   - `roguelite-expedition/06-balance-simulator-recalibration.md`
4. `roguelite-expedition/00-review-hardening-contract.md` — mandatory cross-cutting safety rules where they do not alter the product semantics already fixed by the Spec/child plan.

The following two files are **historical review logs only** and are not implementation authorities:

- `roguelite-expedition/00a-exact-owner-contract-clarifications.md`
- `roguelite-expedition/00-spec-fidelity-execution-contract.md`

Every still-valid clarification from those files has been folded into the numbered child plans. Do not copy code or contracts from the historical files into production.

## Conflict rule

```text
approved design Spec
  > master dependency/gate order
    > subsystem child plan
      > compatible cross-cutting hardening rule
```

A child plan may tighten implementation detail, but may not weaken a design requirement. If a hardening rule conflicts with a child-plan semantic contract, preserve the child-plan behavior and apply the hardening principle at the same boundary instead of reviving an older payload/schema.

---

## Dependency order

The plan is intentionally not a simple G1→G6 close sequence because several Core integration proofs require later subsystem producers.

```text
G0  Freeze baseline/provenance
G1A Core foundation: prep/loadout, map/fog, lifecycle, settlement ledger, core failure framework
G2  Condition / Repairs / Chassis / Cargo / Insurance
G3  Crew / Stress / Relationships / Injuries
G4  Pressure / Sponsors / Contracts / Social / Rivals / Quests / Finales / Drafts
G1B Core integration closure: compose G2–G4 failure, Intel and reward producers; E2E core loop
G5  Meta / Regions / Tours / HQ / Ascension / Between-Tour / Legendary
G6  Production-parity simulator + career sequences + paired probes + playtest evidence
```

No gate may require a producer that belongs to a later, not-yet-implemented gate. Child-plan sections explicitly marked **Integration closure** are executed only after their listed dependencies exist.

---

## Approved experience invariants

All implementation work must preserve these design tests:

- A Standard run targets **20–30 minutes** and approximately **7–9 meaningful nodes**.
- Management creates the situation; active gig/minigame skill materially changes the outcome.
- Tour Prep commits a constrained build: setlist/equipment, chassis/modules, crew, cargo, Sponsor/contracts, perk, Fuel target and a protected/usable Cash allocation.
- Map Fog is hybrid: node type/danger/reward/edges are visible; exact values and hidden opportunities require Intel.
- Cash remains useful because safety, recovery, obligations and opportunity costs compete for it; the design is not solved by globally crushing gig income.
- Failure is multi-axis, attributable and normally telegraphed with at least one recovery decision before termination.
- Extraction is a recurring push-your-luck decision; completion gives maximum upside, but extraction/failure preserve meaningful progress.
- Temporary drafts are occasional and rule-changing; Standard runs accept at most two.
- Meta progression broadens options more than it increases baseline power.
- Chassis, Crew, Modules, Regions, Tour Types, Contracts and Legendaries must create different playstyles, not merely percentage ladders.
- Severe events use repeat protection plus cross-family anti-frustration.
- No simulator metric counts as evidence until the measured behavior has a production owner and an app-side test.

---

## Subsystem ownership

| Concern | Canonical plan |
|---|---|
| Prep/run seed, full build, map/fog, lifecycle, extraction/failure, reward ledger, persistent HUD | `01` |
| Vehicle/chassis, Fuel/Condition interactions, Cargo manifest, Repairs, Defects, Inspections, Insurance | `02` |
| Crew roles, Stress, crises, Band↔Crew relationships, staged injuries, Crew persistence/contact Intel | `03` |
| Heat/Exposure, Sponsors/contracts, Double Down, Social, Director, authorities, Rivals/Nemesis, Expedition quests, finales, drafts | `04` |
| Unified effective rules, regions/tours, unlock sets, HQ, Fame role, Between-Tour, Archive, Ascension, Legendaries | `05` |
| Full-build simulator, safety/design gates, extraction/skill probes, linked Career simulation, real-duration evidence | `06` |

---

## Mechanical plan-authority guard

Create `tests/node/expeditionPlanAuthority.test.js` in G1A. The test must read this index, the master plan and all six child plans and fail when:

1. this canonical order is missing or reordered;
2. a historical file is described as normative;
3. a child plan contains a superseded public contract shape.

The initial banned contract fragments are:

```js
const BANNED_PLAN_CONTRACTS = [
  'SECURE_EXPEDITION_REWARD',
  'crewRelationshipByPair',
  'toCrewRelationshipKey(',
  "starterPerkId: 'headliner_pass'",
  "starterPerkId: 'nemesis_dossier'",
  "starterPerkId: 'disaster_artist'",
  'cashReserveFloor:',
  'expectedStatus: ObligationStatus\n  next:',
  'obligation: ActiveObligationState'
]
```

The Draft action is allowed only in the normalized intent form from `04`; the plan-authority test additionally asserts that `OFFER_EXPEDITION_DRAFT` never contains `candidateTraitIds` in its payload contract.

---

## Gate completion matrix

| Gate | Must prove before close |
|---|---|
| G0 | frozen v14 baseline/provenance and current test command contract |
| G1A | prepared run seed, full build commitment, protected Cash budget, route/fog, base Intel, route reward ledger, extraction, core Economy/Fuel failures |
| G2 | chassis playstyles, manifest-only consumers, explainable wear, skill-based field repair, defects/inspection/insurance, zero-Condition recovery |
| G3 | every Crew role has a consumer, contextual Stress/crises, Band↔Crew relationship producer+consumer, staged injury gameplay, source-derived persistent Crew settlement |
| G4 | deliberate Sponsor/contracts, route-valid contract targets, Double Down, Social choices+Intel, multi-input Director, severe-event relief, Nemesis quest chain, contextual/special finales, reducer-authoritative drafts |
| G1B | composed multi-axis failure, all Intel grant sources, all reward-source proofs, route→node→consequence→extract/finale E2E |
| G5 | one effective rules path, immediate HQ facility value, real unlock sets, Fame no longer universal Expedition purchase currency, 1–3 Between-Tour choices, rule-changing Legendaries |
| G6 | six production-valid full builds, disjoint calibration/holdout, linked Career sequences, paired extraction probe, skill-vs-management probe, real-duration playtest evidence |

---

## Verification rule

Each task follows red → implementation → focused green → broader gate → commit. At the end of every child plan run the repository commands required by current `AGENTS.md`/`package.json`; never preserve a stale command solely because an older plan listed it.

The final implementation is complete only when the Spec coverage matrix in the master plan has no unowned row and G6 imports production helpers rather than copying formulas.
