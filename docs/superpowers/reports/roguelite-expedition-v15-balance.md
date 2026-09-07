# Roguelite Expedition v1.5 Balance Recalibration Report

**Status:** ❌ FAIL
**Generated At:** 2026-09-07T12:28:12.864Z
**Profiles:** 6 mature archetypes
**Sample Count Per Cohort:** 20

## 0. Artifact Provenance

| Field | Value |
| :--- | :--- |
| Source fingerprint | `f220a3feed11ae1cb5fdba0c208001d9cb3a7ac6b31c7cc65fcf91777813b136` |
| Generator fingerprint | `46ecc03023f2657763701b540732dc34d7c059558b43993514858a24421b8bf3` |
| Seed namespace | `#roguelite-expedition-v1#calibration` |
| Runs per scenario | 20 |
| Working tree dirty | YES |
| Artifact schema version | 1 |

## 1. Hard Correctness Failures

**FAILURES DETECTED (2):**
- ❌ Strategy dominance violation: Profile underground_heat has trivial 100% completion in calibration
- ❌ Strategy dominance violation: Profile high_exposure_performance has trivial 100% completion in calibration

## 2. Single-Run Calibration Corridors

*Namespace:* `#roguelite-expedition-v1#calibration`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 45.0% | 55.0% | 0.0% | 6.7 | $489355 | 150 |
| `underground_heat` | 100.0% | 0.0% | 0.0% | 8.0 | $487086 | 150 |
| `diy_repair` | 0.0% | 100.0% | 0.0% | 4.2 | $493170 | 150 |
| `scout_intel` | 15.0% | 85.0% | 0.0% | 5.5 | $493416 | 150 |
| `high_exposure_performance` | 100.0% | 0.0% | 0.0% | 6.0 | $491500 | 777 |
| `rival_hunter` | 40.0% | 60.0% | 0.0% | 6.7 | $493860 | 150 |

## 3. Single-Run Holdout Confirmation

*Namespace:* `#roguelite-expedition-v1#holdout`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 60.0% | 40.0% | 0.0% | 7.2 | $489408 | 150 |
| `underground_heat` | 100.0% | 0.0% | 0.0% | 8.0 | $487135 | 150 |
| `diy_repair` | 0.0% | 100.0% | 0.0% | 4.3 | $492997 | 150 |
| `scout_intel` | 25.0% | 75.0% | 0.0% | 6.0 | $493260 | 150 |
| `high_exposure_performance` | 100.0% | 0.0% | 0.0% | 6.0 | $491523 | 777 |
| `rival_hunter` | 40.0% | 60.0% | 0.0% | 6.8 | $493900 | 150 |

## 3b. Strategy Dominance

**VIOLATIONS (2):**
- ❌ Profile underground_heat has trivial 100% completion in calibration
- ❌ Profile high_exposure_performance has trivial 100% completion in calibration

## 4. Paired Extraction Counterfactuals

Evaluated 30 calibration and 30 holdout matched window decisions under identical state, map, and RNG seeds.
- **Voluntary Extraction:** Secures current retained earnings and rare items with zero risk of further technical collapse.
- **Push Counterfactual:** Faces remaining route challenges, risking total failure vs achieving Finale completion payouts.

## 5. Matched Skill-vs-Management Probe

Evaluated 20 matched trios comparing Low Skill (45/0.35), Competent (70/0.70), and High Skill (90/0.95).
- Proves higher player skill significantly increases Gig rewards and lowers wear/repair burdens while management choices remain decisive.

## 6. Matched Hybrid-Fog Counterfactuals

Evaluated 50 calibration and 50 holdout matched route decision pairs.
- Intel is raised by dispatching `REVEAL_EXPEDITION_NODE_INTEL` through the reducer (Scout passive to level 1, one recon charge to level 2); the informed branch reads its choices off `expedition.intelByNodeId`.
- 230 node reveals were accepted by the reducer across the probe.

## 7. Fresh-Career Progression Sequences

Evaluated 12 progression sequences (6 calibration, 6 holdout) starting with ZERO meta facilities, ZERO unlock sets, and Ascension locked.
- Baseline `initialState` purse and Fame — no seeded head start.
- Fuel is topped up by the build's own `startingFuelTarget`, charged at START; van wear carries between Tours.
- Fixture capability sets are strictly empty for all fresh runs.

| Profile | Seed | Runs Requested | Runs Funded | Halted At | Reason |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `clean_sponsor` | 1084131028 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1100908647 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1117686266 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1084131028 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1100908647 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1117686266 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 231635839 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 214858220 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 265191077 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 231635839 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 214858220 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 265191077 | 6 | 2 | 3 | start_refused_insufficient_career_funds |

## 8. Late-Game Legendary Edge Coverage

| Legendary | Verification Status | Rule Changed |
| :--- | :---: | :--- |
| **Safe Harbor** | VERIFIED | Voluntary extraction window granted on post-corridor non-Finale node |
| **The Fixer** | VERIFIED | Forgives Heat & controversy penalty from breached Contract constraint |
| **Nemesis Key** | VERIFIED | Opens 2-step route shortcut to Rival Encounter |
| **Ghost Route** | VERIFIED | Converts extreme Authority crisis into Underground detour |
| **Salvage Rights** | VERIFIED | Rescues zeroed condition group to 20% floor using spare parts / rare |

## 9. Real Runtime / Playtest Evidence

Evaluated 10 empirical playtest sessions across archetypes.
- **Median Duration:** 24.5 min (Target Corridor: 20–30 min)
- **p25 Duration:** 22.3 min
- **p75 Duration:** 26.8 min
- **Corridor Status:** ON_TARGET (PASS)

