# Roguelite Expedition v1.5 Balance Recalibration Report

**Correctness:** ✅ PASS
**Release evidence:** ⚠️ NOT RELEASE EVIDENCE
**Release blocked by:** run size 20 is below the release size 2000; no usable pacing evidence: no captured playtest evidence at docs/superpowers/reports/roguelite-expedition-runtime-evidence.json; 12 unresolved balance corridor finding(s)
**Generated At:** 2026-09-11T08:12:12.180Z
**Profiles:** 6 mature archetypes
**Sample Count Per Cohort:** 20

## 0. Artifact Provenance

| Field | Value |
| :--- | :--- |
| Source fingerprint | `b155e792c03612af45d361b89887af740175a775de6f3e643af16048c7ede213` |
| Generator fingerprint | `6f60baba1c9499d0b5eefef86a8934eaca0fe13b65c7b93c5c8af1e737742bdb` |
| Seed namespace | `#roguelite-expedition-v1#calibration` |
| Runs per scenario | 20 |
| Working tree dirty | YES |
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
- ⚠️ Balance corridor: Profile high_exposure_performance completedRate 95.0% outside 20-90% corridor in calibration
- ⚠️ Balance corridor: Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Balance corridor: Profile rival_hunter failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Balance corridor: Profile clean_sponsor completedRate 95.0% outside 20-90% corridor in holdout
- ⚠️ Balance corridor: Profile clean_sponsor failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile diy_repair failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile scout_intel failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Balance corridor: Profile rival_hunter failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Runtime pacing evidence unusable: no captured playtest evidence at docs/superpowers/reports/roguelite-expedition-runtime-evidence.json. Capture a playtest cohort into docs/superpowers/reports/roguelite-expedition-runtime-evidence.json for this source fingerprint.
- ⚠️ Reduced-coverage run: 20 samples/cohort is below the binding release size of 2000. This artifact is a developer check, not release evidence.

### Release coverage

| Requirement | Produced | Expected |
| :--- | ---: | ---: |
| Task 8 calibration cohort | 20 | 20 |
| Task 8 holdout cohort | 20 | 20 |
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
| Task 10 skill trios (calibration) | 120 | 120 |
| Task 10 skill trios (holdout) | 120 | 120 |
| Task 11 fog pairs (calibration, both sources) | 200 | 200 |
| Task 11 fog pairs (holdout, both sources) | 200 | 200 |
| Task 12 six-run fresh-Career sequences (calibration) | 60 | 60 |
| Task 12 six-run fresh-Career sequences (holdout) | 60 | 60 |

## 2. Single-Run Calibration Corridors

*Namespace:* `#roguelite-expedition-v1#calibration`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 65.0% | 35.0% | 0.0% | 7.3 | $9676 | 8946 |
| `underground_heat` | 70.0% | 25.0% | 5.0% | 7.3 | $1709 | 14286 |
| `diy_repair` | 55.0% | 45.0% | 0.0% | 7.8 | $8487 | 11765 |
| `scout_intel` | 80.0% | 20.0% | 0.0% | 7.6 | $5943 | 13516 |
| `high_exposure_performance` | 95.0% | 5.0% | 0.0% | 5.9 | $4920 | 15888 |
| `rival_hunter` | 45.0% | 55.0% | 0.0% | 6.8 | $2789 | 12985 |

## 3. Single-Run Holdout Confirmation

*Namespace:* `#roguelite-expedition-v1#holdout`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 95.0% | 5.0% | 0.0% | 7.9 | $10792 | 10793 |
| `underground_heat` | 85.0% | 10.0% | 5.0% | 7.6 | $1723 | 15864 |
| `diy_repair` | 60.0% | 40.0% | 0.0% | 8.1 | $8900 | 15880 |
| `scout_intel` | 65.0% | 35.0% | 0.0% | 7.3 | $5942 | 12361 |
| `high_exposure_performance` | 85.0% | 15.0% | 0.0% | 5.7 | $5392 | 14184 |
| `rival_hunter` | 50.0% | 50.0% | 0.0% | 6.9 | $2618 | 14291 |

## 3b. Strategy Dominance

Dominance blocks only when the same conclusion reproduces in disjoint calibration and holdout; corridor misses are reported as tuning findings in section 1b.

No strategy strictly dominates the field across both cohorts.

**Corridor findings (12, non-blocking):**
- ⚠️ Profile clean_sponsor failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile diy_repair failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile scout_intel failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile high_exposure_performance completedRate 95.0% outside 20-90% corridor in calibration
- ⚠️ Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile rival_hunter failedRate 0.0% outside 2-50% corridor in calibration
- ⚠️ Profile clean_sponsor completedRate 95.0% outside 20-90% corridor in holdout
- ⚠️ Profile clean_sponsor failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile diy_repair failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile scout_intel failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile high_exposure_performance failedRate 0.0% outside 2-50% corridor in holdout
- ⚠️ Profile rival_hunter failedRate 0.0% outside 2-50% corridor in holdout

## 4. Paired Extraction Counterfactuals

Evaluated 120 calibration and 120 holdout matched window decisions under identical state, map, and RNG seeds.
- **Voluntary Extraction:** Secures current retained earnings and rare items with zero risk of further technical collapse.
- **Push Counterfactual:** Faces remaining route challenges, risking total failure vs achieving Finale completion payouts.

## 5. Matched Skill-vs-Management Probe

Evaluated 120 calibration and 120 holdout matched trios comparing Low Skill (45/0.35), Competent (70/0.70), and High Skill (90/0.95).
- Proves higher player skill significantly increases Gig rewards and lowers wear/repair burdens while management choices remain decisive.

## 6. Matched Hybrid-Fog Counterfactuals

Evaluated 200 calibration and 200 holdout matched route decision pairs.
Both branches derive from one canonical decision state with the Scout's automatic per-step reveal suppressed, so the only pre-decision difference is the single legal reveal branch B spends. Choices are scored off the production Fog projection (`getExpeditionNodeFogByNodeId`), never off raw hidden map data.

| Source | Pairs | Reveal granted | Reveal at decision | Route changed | Reveal-unused rate |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `scout_recon` | 200 | 200 | 200 | 15 | 92.5% |
| `reputation` | 200 | 200 | 17 | 2 | 88.2% |

The reputation entitlement draws its one bounded level-1 read from the whole forward route, so it lands on an immediate candidate only occasionally; "reveal at decision" separates that from a reveal the policy simply could not price yet.

## 7. Fresh-Career Progression Sequences

Evaluated 120 progression sequences (60 calibration, 60 holdout) starting with ZERO meta facilities, ZERO unlock sets, and Ascension locked.
- Baseline `initialState` purse and Fame — no seeded head start.
- Fuel is topped up by the build's own `startingFuelTarget`, charged at START; van wear carries between Tours.
- Fixture capability sets are strictly empty for all fresh runs.

### Summary by Profile (Calibration)

| Profile | Sequences | Completed All 6 % | Mean Runs Completed | Primary Halt Reasons |
| :--- | ---: | ---: | ---: | :--- |
| `clean_sponsor` | 10 | 100.0% | 6.00 | None |
| `underground_heat` | 10 | 100.0% | 6.00 | None |
| `diy_repair` | 10 | 100.0% | 6.00 | None |
| `scout_intel` | 10 | 100.0% | 6.00 | None |
| `high_exposure_performance` | 10 | 100.0% | 6.00 | None |
| `rival_hunter` | 10 | 100.0% | 6.00 | None |

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
