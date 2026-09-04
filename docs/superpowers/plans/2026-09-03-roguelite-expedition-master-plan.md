# Roguelite Expedition — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Roguelite Expedition as a short, high-agency touring mode that reuses Neurotoxic's current systems while making preparation, route choice, active performance, recovery, pressure and extraction decisions matter.

**Architecture:** Keep existing production owners for money/fame, band, van, assets, social, quests, events and unlocks. Add an Expedition coordination layer that commits a constrained build and tracks run-only state, while every persistent or economic mutation still flows through the repository's typed reducer/action conventions. The numbered child plans are the executable source of truth; this master file owns dependency order, acceptance gates and Spec coverage only.

**Tech Stack:** React 19, TypeScript 6, existing reducers/hooks/event engine/quest producers/assets/map generator, deterministic RNG, Vitest/Node/Playwright, balance simulator v15.

---

## 1. Frozen product decisions

The implementation must preserve the approved Spec rather than reinterpret it as a generic touring refactor.

```text
Standard run length:          ~20–30 real minutes
Meaningful map nodes:         ~7–9
Core loop:                    prepare -> route -> node -> consequence -> pressure -> extract/continue -> finale -> meta
Map information:              hybrid Fog of War
Extraction:                   hybrid retention, recurring push-your-luck choice
Temporary drafts:             occasional, 1-of-3, max two accepted in Standard
Permanent progression:        breadth/rule access > raw stat inflation
Primary experience:           management creates conditions; active skill changes outcomes
Failure:                      multi-axis, visible, normally recoverable before termination
Meta pause:                   1–3 consequential decisions
Dedicated long-term currency: at most Tour Tokens in addition to existing values
```

The mode must support at least these viable families:

1. Clean Sponsor / Contract
2. High-Heat / Underground
3. DIY Repair / resilience
4. Scout / information control
5. High-Exposure performance
6. Rival / Nemesis hunt

No one family may dominate both safety and maximum secured reward in calibration and holdout.

---

## 2. Canonical plan structure

Normative implementation sources are:

1. approved design Spec;
2. this master plan for dependency/gate order;
3. the numbered child plan for the subsystem being implemented;
4. compatible `00-review-hardening-contract.md` constraints.

`00a-exact-owner-contract-clarifications.md` and `00-spec-fidelity-execution-contract.md` are historical review logs only. Their still-valid content has been incorporated into the numbered plans.

---

## 3. Execution order

### G0 — Freeze current evidence before semantic cutover

**Owner:** `06-balance-simulator-recalibration.md`, Task 1.

Before gameplay changes:

- snapshot the current v14 report and source fingerprint;
- pin current test/type/dead-code commands from root and nested `AGENTS.md`/`package.json`;
- do not compare v14 day-horizon results as a paired population with v15 Expedition results.

### G1A — Core foundation

**Owner:** `01-expedition-core-extraction.md`, Tasks 1–9.

Build only contracts that do not depend on G2–G4:

- prepared run identity/seed;
- full committed build and active-run identity freeze;
- protected Career Cash + spendable Expedition Cash boundary;
- map generation, visible route classes and hybrid Fog;
- Scout/perk Intel lifecycle;
- explicit reward ledger and route-reward source proof;
- extraction/completion/failure lifecycle;
- Economy/Fuel core failure/rescue;
- six-resource HUD and explicit extraction confirmation.

Do **not** close technical/Crew/Authority/Contract failure proofs here; their producers do not exist yet.

### G2 — Condition / Repairs / Chassis / Cargo

**Owner:** `02-condition-repairs-cargo.md`.

Adds:

- four playstyle chassis profiles derived from existing tourbus ownership;
- rule-changing module affordances;
- manifest-only merch/Contraband usage;
- explainable vehicle/technical wear;
- active-performance Condition effects;
- skill-based field repairs using existing minigames;
- defects, inspections, insurance and zero-Condition recovery.

### G3 — Crew / Stress / Relationships / Injuries

**Owner:** `03-crew-stress-relationships.md`.

Adds:

- three-slot constrained Crew build;
- role consumers;
- contextual Stress and crises;
- Crew↔Crew and Band↔Crew relationships;
- staged injuries that affect active performance;
- source-derived Career settlement and concrete signature traits;
- Crew-contact Intel producer.

### G4 — Pressure / Sponsors / Contracts / Social / Rivals / Quests / Finales / Drafts

**Owner:** `04-pressure-rivals-contracts.md`.

Adds:

- deliberate Sponsor selection through existing Social/Brand Deal ownership;
- native contracts with route-valid targets, stacking and Double Down;
- Heat/Exposure/Social trade-offs and Social Intel;
- multi-input Pressure Director plus cross-family severe-event relief;
- Authority decisions with safe but costly exits;
- Rival/Nemesis persistence and dedicated quest chains;
- contextual and contract-defined finales;
- reducer-authoritative temporary drafts.

### G1B — Core integration closure

**Owner:** `01-expedition-core-extraction.md`, Integration Tasks 10–12.

Only after G2–G4 exist:

- compose all failure families into one evaluator;
- wire Social/Contact Intel grants into the base lifecycle;
- prove route/event/contract/contact reward sources through the final ledger;
- execute the complete route→travel→node→gig/event→consequence→next route→extract/finale path;
- prove no PreGig/failure state can softlock.

### G5 — Meta / Regions / HQ / Ascension / Between-Tour / Legendary

**Owner:** `05-meta-regions-ascension.md`.

Adds:

- one canonical effective-rules composition path that includes Region, Tour, Chassis/Crew, Starter Perk, run Drafts, Tour Pressure, Nemesis and relevant Legendary capabilities;
- Region/Tour biome rules;
- capability unlock sets and immediate HQ facility value;
- Fame as access/expectation signal instead of universal Expedition purchase currency;
- Tour Archive;
- exactly 1–3 Between-Tour decisions;
- rule-changing Legendary capabilities.

### G6 — Production-parity evidence

**Owner:** `06-balance-simulator-recalibration.md`.

Adds:

- six complete production-valid builds;
- route-horizon v15 calibration + disjoint holdout;
- linked six-run Career sequences;
- paired extraction counterfactuals;
- paired skill-vs-management counterfactuals;
- real-duration playtest instrumentation/reporting;
- release blockers for structural defects and reproducible dominance.

---

## 4. Dependency rules

1. A gate may define an extension hook for a later subsystem, but it may not run a test that requires the later producer before that producer exists.
2. No reducer may trust materialized economic/reward/progress results from UI/action payloads when the result can be derived from canonical state.
3. All random candidate generation happens outside reducers from a committed seed; reducers recompute or validate deterministic eligibility before accepting state changes.
4. Active Expedition inventory consumers see only the committed Cargo manifest; global inventory remains canonical ownership.
5. Persistent consequences settle exactly once from finalized run evidence keyed by stable `runId`.
6. Simulator profiles must use the same validators/helpers as the app and may not introduce hidden defaults or aliases.
7. A mechanic cannot satisfy a G6 metric unless production has a real consumer and an app-side test.

---

## 5. Cross-subsystem state boundaries

Conceptual state remains separated as follows:

```text
player/band/assets/social/unlocks  -> existing persistent owners
expedition.prep                    -> prepared run id/seed and Tour Prep-only commitment context
expedition.loadout                 -> committed build identity
expedition.route/lifecycle         -> route step, visited nodes, outcome, extraction windows
expedition.rewardLedger            -> source-proven run rewards and security
expedition.condition/cargo         -> run technical state and manifest
expedition.crewRunById             -> run Stress/status only
career                             -> ranks, facilities, Crew/Rival history, Archive, settled run ids
pressure/contracts                 -> run Heat/Exposure/Obligations
```

Do not create a second owner for canonical money, Fame, van Fuel/Condition, inventory/stash, active Social deals or installed assets. Expedition may hold snapshots/budgets/manifests needed to constrain the run, but canonical ownership stays where it exists today.

---

## 6. Spec coverage matrix

| Spec requirement | Production owner | Verification owner |
|---|---|---|
| 20–30 minute Standard run | runtime timestamps / Run Summary | G6 playtest sample report |
| 7–9 meaningful nodes | Tour Type map depth / route generator | G6 node-choice metrics |
| management + active skill | Gig/repair modifiers | G6 paired skill probe |
| full constrained build | Tour Prep + loadout validator | G1 tests / G6 full builds |
| hybrid Fog | node Intel selectors | G1 + G6 Intel metrics |
| Cash/Fuel pressure | protected Cash + travel owner | G1/G2 + G6 spend metrics |
| multi-axis failure | composed failure evaluator | G1B + G6 cause distribution |
| hybrid extraction | settlement resolver | G1 + paired extraction probe |
| rare targeted drafts | G4 draft reducer | G4/G6 offer/pick metrics |
| Crew identity/Stress/relationships | G3 | G3/G6 |
| staged injuries | G3 | G3 active-play tests / G6 incidence |
| explainable Condition/wear | G2 | G2/G6 |
| chassis playstyles | G2 | G2/G6 chassis diversity |
| repair minigame skill | G2 | G2/G6 skill probe |
| inspections/insurance | G2 | G2/G6 sink/use metrics |
| Heat/Exposure/Obligations | G4 | G4/G6 |
| anti-frustration Director | G4 | event/director tests + G6 repeat metrics |
| persistent Nemesis + quest chain | G4/G5 | multi-run tests + G6 Career sequences |
| Sponsor/Contract Double Down | G4 | G4/G6 obligation metrics |
| contextual/special finales | G4 | finale tests + G6 shares |
| Region/Tour biomes | G5 | G5/G6 strategy profiles |
| HQ as meta hub | G5 | HQ UI/meta tests |
| 1–3 Between-Tour choices | G5 | G5 + G6 Career sequences |
| rule-changing Legendaries | G5 | deterministic transform tests + G6 activations |
| Fame access signal | G5 | shop/HQ regression tests |

No row may be left at “future work” when the Expedition release gate closes.

---

## 7. Release gate hierarchy

### Hard correctness gates

Block completion for any:

- invalid/disconnected route;
- non-finite/negative protected state;
- duplicate settlement/reward/contract/Career persistence;
- stale run state after reset;
- manifest bypass;
- unresolved mandatory PreGig with no legal recovery/termination action;
- reducer-authority violation for draft/obligation/reward/persistent Career changes;
- simulator-only mechanic or formula;
- missing calibration or holdout profile;
- repeated severe event during a protected relief window unless an explicit high-risk rule opts out;
- production-invalid G6 build;
- persistent rule-changing reward encoded as a temporary starter perk.

### Soft product corridors

Initially report rather than hard-fail:

- completion/extraction/failure mix;
- Condition/Crew crisis incidence;
- strategy pick rates;
- 20–30 minute pacing until human-play samples exist;
- economy sink composition;
- individual balance values.

### Blocking dominance

A strategy/extraction choice becomes a blocker only when the same material safety+reward dominance reproduces in both calibration and holdout under the thresholds defined in G6.

---

## 8. Required final verification

After all child plans are implemented:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
pnpm run test:e2e
pnpm run typecheck:core
pnpm run typecheck
pnpm run deadcode:check
pnpm run deadcode:budget
pnpm run symbols:check
pnpm run simulate:balance
pnpm run simulate:balance:expedition-probe
pnpm run simulate:balance:skill-probe
```

Use the current repository command contract when implementation begins; if package scripts have changed, update this plan/test command list in the same implementation PR rather than invoking stale aliases.

---

## 9. Final design test

Every added mechanic must answer at least one of these questions for the player:

- What do I risk?
- What do I spend?
- What do I reveal?
- What build trade-off do I accept?
- Do I keep pushing or stop now?
- Can active skill rescue this management situation?

If a mechanic only adds maintenance clicks or an uncontextualized percentage without creating one of those decisions, it does not belong in the Expedition core.
