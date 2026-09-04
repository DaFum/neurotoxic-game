# Archived Spec-Fidelity Review Record

**Status:** Historical review record — **non-normative**.

This file records why the Roguelite Expedition plan required repeated fidelity corrections. It no longer overrides the numbered implementation plans.

The normalized authority chain is:

1. approved design Spec;
2. `2026-09-03-roguelite-expedition-master-plan.md` for dependency/gate order;
3. the owning numbered child plan;
4. compatible cross-cutting rules from `00-review-hardening-contract.md`.

The canonical index is `docs/superpowers/plans/2026-09-03-roguelite-expedition-implementation-plan-complete.md`.

## Review lessons preserved by the normalized plans

The numbered plans now directly incorporate the issues that were previously expressed as R1–R12 amendments and later deep-review findings:

- no amendment-based authority graph;
- active-run setlist/module/equipment identity freeze;
- manifest-only Expedition merch/Contraband consumers;
- zero-Condition recovery without PreGig softlock;
- Crew↔Crew and Band↔Crew relationships with real event producer/consumer paths;
- committed Sponsor obligations materialized from persisted Social state;
- source-entitled Scout/Perk/Social/Contact Intel;
- multi-input Pressure Director;
- a single complete effective-rules composition path;
- rule-changing Legendary capabilities kept separate from starter perks;
- linked Career-sequence simulation for cross-run metrics;
- source-derived reward security with no generic secure boolean action;
- real starting Cash allocation via a protected-Career-Cash boundary;
- Fuel included in Mobility failure/rescue;
- chassis playstyles rather than module-only identity;
- staged injuries reaching active gameplay;
- source-derived Crew Career settlement and concrete signature traits;
- native Contract reward multiplier/stacking and tour-ending flag semantics;
- deliberate Tour Prep Sponsor/Contract selection and mid-run Double Down;
- cross-family severe-event anti-frustration;
- Expedition run goals, Rival/Nemesis quest chains and meta unlock objectives;
- reducer-authoritative Draft candidate generation;
- HQ facilities with immediate real capability value;
- full production-valid G6 builds;
- paired skill-vs-management evidence;
- real run-duration evidence separated from simulator estimates.

## Rule for future corrections

Do not append R13, R14, or another clarification file. Correct the owning child-plan section directly, update the master coverage matrix if dependency/ownership changes, and extend `tests/node/expeditionPlanAuthority.test.js` when a stale contract needs to be mechanically banned.

## Spec-fidelity checklist

Before implementation is considered complete, the child plans must collectively prove:

```text
short/dense run pacing
constrained full build
hybrid Fog
multi-axis attributable failure
hybrid extraction
occasional rule-changing drafts
Crew identity/stress/relationships/injuries
Condition/cargo/chassis/repairs/inspection/insurance
active skill relevance
Heat/Exposure/Obligations
multi-input Director + anti-frustration
persistent Rivals/Nemesis + dedicated quests
Sponsors/Contracts + Double Down
Social strategic choices
context-sensitive and special finales
Region/Tour biome differences
HQ/meta breadth progression
1–3 Between-Tour decisions
Ascension modular rule pressure
rule-changing Legendaries
anti-snowball constraints
production-parity simulator and playtest evidence
```

This file may be deleted in a later cleanup PR once review history no longer needs to live beside the executable plans.
