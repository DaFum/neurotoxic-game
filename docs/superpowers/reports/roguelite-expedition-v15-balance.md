# Roguelite Expedition v1.5 Balance Recalibration Report

**Status:** ✅ PASS
**Generated At:** 2026-09-07T11:09:48.844Z
**Profiles:** 6 mature archetypes
**Sample Count Per Cohort:** 20

## 1. Hard Correctness Failures

All 14 Hard Correctness Gates passed with 0 invariant violations across all cohorts.

## 2. Single-Run Calibration Corridors

*Namespace:* `#roguelite-expedition-v1#calibration`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 55.0% | 45.0% | 0.0% | 7.0 | $489922 | 150 |
| `underground_heat` | 0.0% | 100.0% | 0.0% | 5.0 | $488052 | 150 |
| `diy_repair` | 0.0% | 100.0% | 0.0% | 4.2 | $493538 | 150 |
| `scout_intel` | 15.0% | 85.0% | 0.0% | 5.5 | $493902 | 150 |
| `high_exposure_performance` | 100.0% | 0.0% | 0.0% | 6.0 | $492115 | 777 |
| `rival_hunter` | 40.0% | 60.0% | 0.0% | 6.7 | $494444 | 150 |

## 3. Single-Run Holdout Confirmation

*Namespace:* `#roguelite-expedition-v1#holdout`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 65.0% | 35.0% | 0.0% | 7.3 | $490002 | 150 |
| `underground_heat` | 0.0% | 100.0% | 0.0% | 5.0 | $488052 | 150 |
| `diy_repair` | 0.0% | 100.0% | 0.0% | 4.5 | $493359 | 150 |
| `scout_intel` | 25.0% | 75.0% | 0.0% | 6.0 | $493790 | 150 |
| `high_exposure_performance` | 100.0% | 0.0% | 0.0% | 6.0 | $492138 | 777 |
| `rival_hunter` | 55.0% | 45.0% | 0.0% | 7.1 | $494574 | 150 |

## 4. Paired Extraction Counterfactuals

Evaluated 30 matched window decisions under identical state, map, and RNG seeds.
- **Voluntary Extraction:** Secures current retained earnings and rare items with zero risk of further technical collapse.
- **Push Counterfactual:** Faces remaining route challenges, risking total failure vs achieving Finale completion payouts.

## 5. Matched Skill-vs-Management Probe

Evaluated 20 matched trios comparing Low Skill (45/0.35), Competent (70/0.70), and High Skill (90/0.95).
- Proves higher player skill significantly increases Gig rewards and lowers wear/repair burdens while management choices remain decisive.

## 6. Matched Hybrid-Fog Counterfactuals

Evaluated 50 matched route decision pairs.
- Proves revealed information (Scout recon / intel) is actively consumed by route selection policies and alters node evaluation.

## 7. Fresh-Career Progression Sequences

Evaluated 6 six-run progression sequences starting with ZERO meta facilities, ZERO unlock sets, and Ascension locked.
- First meta facility purchased naturally via earned Tour Tokens.
- Fixture capability sets are strictly empty for all fresh runs.

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

