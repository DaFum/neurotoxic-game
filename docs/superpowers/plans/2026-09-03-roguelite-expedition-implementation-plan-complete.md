# Roguelite Expedition Implementation Plan — Canonical Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement the numbered child plans task-by-task.

**Goal:** Provide one unambiguous implementation entrypoint for the approved Roguelite Expedition design.

**Architecture:** The design specification owns product intent. The master plan owns gate order and cross-gate dependencies. Each numbered child plan owns the executable contract for its subsystem. Historical review files have no implementation authority.

**Tech Stack:** React 19, TypeScript 6, typed actions/reducers, deterministic RNG, existing map/gig/event/social/quest/asset owners, Node/Vitest/Playwright, balance simulator v15.

---

## Canonical authority

Read and implement in this order:

1. `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md`
2. `docs/superpowers/plans/2026-09-03-roguelite-expedition-master-plan.md`
3. The owning numbered child plan:
   - `roguelite-expedition/01-expedition-core-extraction.md`
   - `roguelite-expedition/02-condition-repairs-cargo.md`
   - `roguelite-expedition/03-crew-stress-relationships.md`
   - `roguelite-expedition/04-pressure-rivals-contracts.md`
   - `roguelite-expedition/05-meta-regions-ascension.md`
   - `roguelite-expedition/06-balance-simulator-recalibration.md`

There is **no fourth executable authority layer**.

The following files are historical review records only:

- `roguelite-expedition/00-review-hardening-contract.md`
- `roguelite-expedition/00a-exact-owner-contract-clarifications.md`
- `roguelite-expedition/00-spec-fidelity-execution-contract.md`

Every still-valid hardening/fidelity rule from those files is folded directly into G1–G6. If historical text conflicts with a numbered child plan, ignore the historical text.

---

## Dependency order

```text
G0  Freeze baseline/provenance
G1A Core foundation
G2  Condition / Repairs / Chassis / Cargo
G3  Crew / Stress / Relationships / Injuries
G4  Pressure / Sponsors / Contracts / Social / Rivals / Quests / Finales
G1B Core integration closure
G5  Meta / Regions / Tours / HQ / Ascension / Between-Tour / Legendary
G6  Production-parity simulator / career sequences / paired probes / runtime evidence
```

A gate may not depend on a producer that belongs to a later unfinished gate. G1B exists specifically to compose G2–G4 producers after they are real.

---

## Design invariants that no child plan may weaken

- Standard run target: roughly 20–30 real minutes and 7–9 meaningful nodes.
- Tour Prep commits the full build: setlist/equipment, chassis/modules, crew, cargo/Contraband, Sponsor/native Contracts, starter perk, Fuel target and protected Career Cash.
- Hybrid Fog shows node class, rough danger/reward and route topology while exact values/opportunities require Intel.
- Permanent HUD remains limited to Cash, Fuel, Stamina, Harmony, technical Condition and Heat; Crew Stress, Crowd Hype, Exposure, obligations and injuries are contextual status.
- Management creates the situation; active gig/minigame skill materially changes outcomes and downstream resource burden.
- Failure is multi-axis, attributable and normally telegraphed with a recovery decision before termination.
- Voluntary extraction is a push-your-luck choice and may explicitly carry selected unsecured rare rewards; failure may not impersonate voluntary extraction.
- Social influences Intel, Sponsor/Rival pressure and Crowd Hype; Crowd Hype changes combo upside without auto-winning the Gig.
- Nemesis progression reuses the same persistent Rival identity across runs and changes future rules/opportunities.
- Meta progression broadens options more than it raises baseline stats; the old automatic Day-1 numeric HQ snowball may not remain the dominant fresh-career path.
- Legendary rewards transform rules/choices rather than forming a percentage ladder.
- Simulator evidence is invalid until the measured behavior has a production owner and an app-side test.

---

## Mechanical authority guard

G1 creates `tests/node/expeditionPlanAuthority.test.js`. It reads this index, the master plan, all six child plans and the three historical review files and asserts:

```js
const CANONICAL_CHILDREN = [
  '01-expedition-core-extraction.md',
  '02-condition-repairs-cargo.md',
  '03-crew-stress-relationships.md',
  '04-pressure-rivals-contracts.md',
  '05-meta-regions-ascension.md',
  '06-balance-simulator-recalibration.md'
]

const BANNED_EXECUTABLE_FRAGMENTS = [
  'SECURE_EXPEDITION_REWARD',
  'cashReserveFloor:',
  "starterPerkId: 'headliner_pass'",
  "starterPerkId: 'nemesis_dossier'",
  'obligation: ActiveObligationState',
  'candidateTraitIds: string[]'
]
```

The test also requires every historical file to contain `NON-NORMATIVE` and rejects `binding amendment`/`this file wins` from historical files.

---

## Deep-review closure on 2026-09-04

The 19 open findings from the review of commit `94fd7aa` are owned directly by G1–G6:

```text
G1  provider/fixture wiring; PREPARE prepared-state transition; route-Contract commitment; explicit rare extraction; terminal lifecycle
G2  unified field-repair composition; executable hidden-defect lifecycle
G3  Crew injuries/unavailability; source-derived signature-trait acquisition
G4  expressive Contract constraints; persistent Double-Down rule; Crowd Hype; persistent Rival reactivation; executable Finale profiles
G5  concrete Tour-Token/rank/unlock economy; Day-1 HQ transition; typed persisted Between-Tour decisions
G6  six fully instantiated production-valid strategy profiles
Global  old hardening authority graph removed and folded into G1–G6
```

No new amendment file is permitted for these fixes. Future corrections modify the owning numbered child plan and, only when dependency/authority text changes, this index/master.