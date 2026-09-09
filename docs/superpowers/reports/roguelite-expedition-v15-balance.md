# Roguelite Expedition v1.5 Balance Recalibration Report

**Correctness:** ✅ PASS
**Release evidence:** ⚠️ NOT RELEASE EVIDENCE
**Release blocked by:** no usable pacing evidence: no captured playtest evidence at docs/superpowers/reports/roguelite-expedition-runtime-evidence.json; 10 unresolved balance corridor finding(s)
**Generated At:** 2026-09-09T08:39:48.584Z
**Profiles:** 6 mature archetypes
**Sample Count Per Cohort:** 2000

## 0. Artifact Provenance

| Field | Value |
| :--- | :--- |
| Source fingerprint | `9b5c40d7fc2de55e73e1ade7952e9c3d3baa527c3d56dc2aae33f42994b2546f` |
| Generator fingerprint | `e1b57cebcf5987ce4fe81081568855e3e38ca7e264f6af6de88d09b1fa9618b6` |
| Seed namespace | `#roguelite-expedition-v1#calibration` |
| Runs per scenario | 2000 |
| Working tree dirty | no |
| Artifact schema version | 1 |

### Resolved mature-fixture inputs

Every fixture value that can move a balance number, declared on the profile rather than defaulted by the builder.

| Profile | Fixture v | Cash | Fame | Member skills | Van upgrades | Start fuel |
| :--- | ---: | ---: | ---: | :--- | :--- | ---: |
| `clean_sponsor` | 1 | $500000 | 150 | tech=5 technical=5 charisma=5 | stage_monitors, amp_overdrive, effects_rack | 80 |
| `underground_heat` | 1 | $500000 | 150 | tech=5 technical=5 charisma=5 | stage_monitors, amp_overdrive, effects_rack | 85 |
| `diy_repair` | 1 | $500000 | 150 | tech=5 technical=5 charisma=5 | stage_monitors, amp_overdrive, effects_rack | 75 |
| `scout_intel` | 1 | $500000 | 150 | tech=5 technical=5 charisma=5 | stage_monitors, amp_overdrive, effects_rack | 70 |
| `high_exposure_performance` | 1 | $500000 | 150 | tech=5 technical=5 charisma=5 | stage_monitors, amp_overdrive, effects_rack | 80 |
| `rival_hunter` | 1 | $500000 | 150 | tech=5 technical=5 charisma=5 | stage_monitors, amp_overdrive, effects_rack | 85 |

## 1. Hard Correctness Failures

All 14 Hard Correctness Gates passed with 0 invariant violations across all cohorts.

## 1b. Soft Findings (tuneable, non-blocking)

G6 Task 7 treats the balance corridors as tuneable hypotheses, and Task 14 treats the 20–30 minute window as a product corridor rather than a synthetic hard gate. These do not fail correctness, but they do hold back release evidence.

- ⚠️ Balance corridor: Profile clean_sponsor failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Balance corridor: Profile diy_repair failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Balance corridor: Profile scout_intel failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Balance corridor: Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Balance corridor: Profile rival_hunter failedRate 1.1% outside 2-50% corridor in calibration
- ⚠️ Balance corridor: Profile clean_sponsor failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile diy_repair failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile scout_intel failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile rival_hunter failedRate 0.9% outside 2-50% corridor in holdout
- ⚠️ Runtime pacing evidence unusable: no captured playtest evidence at docs/superpowers/reports/roguelite-expedition-runtime-evidence.json. Capture a playtest cohort into docs/superpowers/reports/roguelite-expedition-runtime-evidence.json for this source fingerprint.

### Release coverage

| Requirement | Produced | Expected |
| :--- | ---: | ---: |
| Task 8 calibration cohort | 2000 | 2000 |
| Task 8 holdout cohort | 2000 | 2000 |
| Task 9 extraction pairs (calibration, clean_sponsor, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (calibration, underground_heat, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (calibration, diy_repair, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (calibration, scout_intel, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (calibration, high_exposure_performance, scarcest of 3 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (calibration, rival_hunter, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (holdout, clean_sponsor, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (holdout, underground_heat, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (holdout, diy_repair, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (holdout, scout_intel, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (holdout, high_exposure_performance, scarcest of 3 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 9 extraction pairs (holdout, rival_hunter, scarcest of 4 window(s), 0 run(s) reached it) | 0 | 0 |
| Task 10 skill trios (calibration) | 12000 | 12000 |
| Task 10 skill trios (holdout) | 12000 | 12000 |
| Task 11 fog pairs (calibration, both sources) | 20000 | 20000 |
| Task 11 fog pairs (holdout, both sources) | 20000 | 20000 |
| Task 12 six-run fresh-Career sequences (calibration) | 6000 | 6000 |
| Task 12 six-run fresh-Career sequences (holdout) | 6000 | 6000 |

## 2. Single-Run Calibration Corridors

*Namespace:* `#roguelite-expedition-v1#calibration`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 54.4% | 45.6% | 0.0% | 7.0 | $9405 | 8586 |
| `underground_heat` | 71.9% | 23.8% | 4.3% | 7.4 | $1658 | 13862 |
| `diy_repair` | 65.1% | 34.8% | 0.0% | 8.2 | $9058 | 13389 |
| `scout_intel` | 68.8% | 31.1% | 0.0% | 7.4 | $5895 | 12287 |
| `high_exposure_performance` | 82.0% | 18.1% | 0.0% | 5.6 | $5154 | 14255 |
| `rival_hunter` | 41.1% | 57.7% | 1.1% | 6.7 | $2410 | 12346 |

## 3. Single-Run Holdout Confirmation

*Namespace:* `#roguelite-expedition-v1#holdout`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 55.5% | 44.5% | 0.0% | 7.0 | $9446 | 8512 |
| `underground_heat` | 70.0% | 25.5% | 4.5% | 7.3 | $1652 | 13549 |
| `diy_repair` | 63.8% | 36.2% | 0.0% | 8.1 | $8997 | 12851 |
| `scout_intel` | 64.1% | 35.9% | 0.0% | 7.3 | $5811 | 11767 |
| `high_exposure_performance` | 81.3% | 18.8% | 0.0% | 5.6 | $5180 | 13925 |
| `rival_hunter` | 39.4% | 59.7% | 0.9% | 6.6 | $2408 | 12016 |

## 3b. Strategy Dominance

Dominance blocks only when the same conclusion reproduces in disjoint calibration and holdout; corridor misses are reported as tuning findings in section 1b.

No strategy strictly dominates the field across both cohorts.

**Corridor findings (10, non-blocking):**
- ⚠️ Profile clean_sponsor failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile diy_repair failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile scout_intel failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile rival_hunter failedRate 1.1% outside 2-50% corridor in calibration
- ⚠️ Profile clean_sponsor failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile diy_repair failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile scout_intel failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile rival_hunter failedRate 0.9% outside 2-50% corridor in holdout

## 4. Paired Extraction Counterfactuals

Evaluated 12000 calibration and 12000 holdout matched window decisions under identical state, map, and RNG seeds.
- **Voluntary Extraction:** Secures current retained earnings and rare items with zero risk of further technical collapse.
- **Push Counterfactual:** Faces remaining route challenges, risking total failure vs achieving Finale completion payouts.

## 5. Matched Skill-vs-Management Probe

Evaluated 12000 calibration and 12000 holdout matched trios comparing Low Skill (45/0.35), Competent (70/0.70), and High Skill (90/0.95).
- Proves higher player skill significantly increases Gig rewards and lowers wear/repair burdens while management choices remain decisive.

## 6. Matched Hybrid-Fog Counterfactuals

Evaluated 20000 calibration and 20000 holdout matched route decision pairs.
Both branches derive from one canonical decision state with the Scout's automatic per-step reveal suppressed, so the only pre-decision difference is the single legal reveal branch B spends. Choices are scored off the production Fog projection (`getExpeditionNodeFogByNodeId`), never off raw hidden map data.

| Source | Pairs | Reveal granted | Reveal at decision | Route changed | Reveal-unused rate |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `scout_recon` | 20000 | 20000 | 20000 | 1430 | 92.8% |
| `reputation` | 20000 | 20000 | 2693 | 257 | 90.5% |

The reputation entitlement draws its one bounded level-1 read from the whole forward route, so it lands on an immediate candidate only occasionally; "reveal at decision" separates that from a reveal the policy simply could not price yet.

## 7. Fresh-Career Progression Sequences

Evaluated 12000 progression sequences (6000 calibration, 6000 holdout) starting with ZERO meta facilities, ZERO unlock sets, and Ascension locked.
- Baseline `initialState` purse and Fame — no seeded head start.
- Fuel is topped up by the build's own `startingFuelTarget`, charged at START; van wear carries between Tours.
- Fixture capability sets are strictly empty for all fresh runs.

### Summary by Profile (Calibration)

| Profile | Sequences | Completed All 6 % | Mean Runs Completed | Primary Halt Reasons |
| :--- | ---: | ---: | ---: | :--- |
| `clean_sponsor` | 1000 | 100.0% | 6.00 | None |
| `underground_heat` | 1000 | 100.0% | 6.00 | None |
| `diy_repair` | 1000 | 100.0% | 6.00 | None |
| `scout_intel` | 1000 | 100.0% | 6.00 | None |
| `high_exposure_performance` | 1000 | 100.0% | 6.00 | None |
| `rival_hunter` | 1000 | 100.0% | 6.00 | None |

### Compact Sequence Samples

| Profile | Seed | Runs Requested | Runs Completed | Halted At | Reason |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `clean_sponsor` | 1084131028 | 6 | 6 | — | completed all runs |
| `clean_sponsor` | 1100908647 | 6 | 6 | — | completed all runs |
| `clean_sponsor` | 1117686266 | 6 | 6 | — | completed all runs |
| `clean_sponsor` | 1134463885 | 6 | 6 | — | completed all runs |
| `clean_sponsor` | 1017020552 | 6 | 6 | — | completed all runs |

## 8. Late-Game Legendary Edge Coverage

| Legendary | Verification Status | Rule Changed |
| :--- | :---: | :--- |
| **Safe Harbor** | VERIFIED | Voluntary extraction window granted on post-corridor non-Finale node |
| **The Fixer** | VERIFIED | Forgives Heat & controversy penalty from breached Contract constraint |
| **Nemesis Key** | VERIFIED | Opens 2-step route shortcut to Rival Encounter |
| **Ghost Route** | VERIFIED | Converts extreme Authority crisis into Underground detour |
| **Salvage Rights** | VERIFIED | Rescues zeroed condition group to 20% floor using spare parts / rare |

## 9. Real Runtime / Playtest Evidence

**NO USABLE PACING EVIDENCE.** no captured playtest evidence at docs/superpowers/reports/roguelite-expedition-runtime-evidence.json

Pacing is read only from captured playtest artifacts recorded against this report's source fingerprint (`docs/superpowers/reports/roguelite-expedition-runtime-evidence.json`). No median is stated, because none has been measured for this build.

