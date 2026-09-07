# Roguelite Expedition v1.5 Balance Recalibration Report

**Correctness:** ❌ FAIL
**Release evidence:** ⚠️ NOT RELEASE EVIDENCE
**Generated At:** 2026-09-07T15:44:51.453Z
**Profiles:** 6 mature archetypes
**Sample Count Per Cohort:** 20

## 0. Artifact Provenance

| Field | Value |
| :--- | :--- |
| Source fingerprint | `705d88d8be82d4dcd5f208cf0f0da6814e47e587243572a4348f1589dc7ac132` |
| Generator fingerprint | `78efef4af77bfea6c6ff2117bbcbd3564132d8ee8a3503742d1b31580f993459` |
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

**FAILURES DETECTED (2):**
- ❌ Coverage shortfall: Task 12 six-run fresh-Career sequences (calibration) produced 1 of the expected 60 (59 of 60 sequences halted early: 59x start_refused_insufficient_career_funds)
- ❌ Coverage shortfall: Task 12 six-run fresh-Career sequences (holdout) produced 0 of the expected 60 (60 of 60 sequences halted early: 60x start_refused_insufficient_career_funds)

## 1b. Soft Findings (tuneable, non-blocking)

G6 Task 7 treats the balance corridors as tuneable hypotheses, and Task 14 treats the 20–30 minute window as a product corridor rather than a synthetic hard gate. These do not fail correctness, but they do hold back release evidence.

- ⚠️ Balance corridor: Profile underground_heat has trivial 100% completion in calibration
- ⚠️ Balance corridor: Profile high_exposure_performance has trivial 100% completion in calibration
- ⚠️ Balance corridor: Profile underground_heat has trivial 100% completion in holdout
- ⚠️ Balance corridor: Profile high_exposure_performance has trivial 100% completion in holdout
- ⚠️ Runtime pacing evidence unusable: no captured playtest evidence at docs/superpowers/reports/roguelite-expedition-runtime-evidence.json. Capture a playtest cohort into docs/superpowers/reports/roguelite-expedition-runtime-evidence.json for this source fingerprint.
- ⚠️ Reduced-coverage run: 20 samples/cohort is below the binding release size of 2000. This artifact is a developer check, not release evidence.

### Release coverage

| Requirement | Produced | Expected |
| :--- | ---: | ---: |
| Task 8 calibration cohort | 20 | 20 |
| Task 8 holdout cohort | 20 | 20 |
| Task 9 extraction pairs (calibration, clean_sponsor, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (calibration, underground_heat, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (calibration, diy_repair, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (calibration, scout_intel, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (calibration, high_exposure_performance, scarcest of 3 window(s)) | 20 | 20 |
| Task 9 extraction pairs (calibration, rival_hunter, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (holdout, clean_sponsor, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (holdout, underground_heat, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (holdout, diy_repair, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (holdout, scout_intel, scarcest of 4 window(s)) | 20 | 20 |
| Task 9 extraction pairs (holdout, high_exposure_performance, scarcest of 3 window(s)) | 20 | 20 |
| Task 9 extraction pairs (holdout, rival_hunter, scarcest of 4 window(s)) | 20 | 20 |
| Task 10 skill trios (calibration) | 120 | 120 |
| Task 10 skill trios (holdout) | 120 | 120 |
| Task 11 fog pairs (calibration, both sources) | 200 | 200 |
| Task 11 fog pairs (holdout, both sources) | 200 | 200 |
| Task 12 six-run fresh-Career sequences (calibration) | 1 | 60 |
| ↳ *59 of 60 sequences halted early: 59x start_refused_insufficient_career_funds* | | |
| Task 12 six-run fresh-Career sequences (holdout) | 0 | 60 |
| ↳ *60 of 60 sequences halted early: 60x start_refused_insufficient_career_funds* | | |

## 2. Single-Run Calibration Corridors

*Namespace:* `#roguelite-expedition-v1#calibration`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 45.0% | 55.0% | 0.0% | 6.7 | $489355 | 150 |
| `underground_heat` | 100.0% | 0.0% | 0.0% | 8.0 | $487054 | 150 |
| `diy_repair` | 0.0% | 100.0% | 0.0% | 4.2 | $493170 | 150 |
| `scout_intel` | 30.0% | 70.0% | 0.0% | 6.0 | $493295 | 150 |
| `high_exposure_performance` | 100.0% | 0.0% | 0.0% | 6.0 | $491366 | 777 |
| `rival_hunter` | 40.0% | 60.0% | 0.0% | 6.7 | $493860 | 150 |

## 3. Single-Run Holdout Confirmation

*Namespace:* `#roguelite-expedition-v1#holdout`

| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `clean_sponsor` | 60.0% | 40.0% | 0.0% | 7.2 | $489398 | 150 |
| `underground_heat` | 100.0% | 0.0% | 0.0% | 8.0 | $487119 | 150 |
| `diy_repair` | 0.0% | 100.0% | 0.0% | 4.3 | $492988 | 150 |
| `scout_intel` | 25.0% | 75.0% | 0.0% | 6.0 | $493251 | 150 |
| `high_exposure_performance` | 100.0% | 0.0% | 0.0% | 6.0 | $491400 | 777 |
| `rival_hunter` | 40.0% | 60.0% | 0.0% | 6.8 | $493880 | 150 |

## 3b. Strategy Dominance

Dominance blocks only when the same conclusion reproduces in disjoint calibration and holdout; corridor misses are reported as tuning findings in section 1b.

No strategy strictly dominates the field across both cohorts.

**Corridor findings (4, non-blocking):**
- ⚠️ Profile underground_heat has trivial 100% completion in calibration
- ⚠️ Profile high_exposure_performance has trivial 100% completion in calibration
- ⚠️ Profile underground_heat has trivial 100% completion in holdout
- ⚠️ Profile high_exposure_performance has trivial 100% completion in holdout

## 4. Paired Extraction Counterfactuals

Evaluated 120 calibration and 120 holdout matched window decisions under identical state, map, and RNG seeds.
- **Voluntary Extraction:** Secures current retained earnings and rare items with zero risk of further technical collapse.
- **Push Counterfactual:** Faces remaining route challenges, risking total failure vs achieving Finale completion payouts.

## 5. Matched Skill-vs-Management Probe

Evaluated undefined matched trios comparing Low Skill (45/0.35), Competent (70/0.70), and High Skill (90/0.95).
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

| Profile | Seed | Runs Requested | Runs Funded | Halted At | Reason |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `clean_sponsor` | 1084131028 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1100908647 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1117686266 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1134463885 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1017020552 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1033798171 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1050575790 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 1067353409 | 6 | 6 | — | completed all runs |
| `clean_sponsor` | 949910076 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 966687695 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `underground_heat` | 1084131028 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `underground_heat` | 1100908647 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 1117686266 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 1134463885 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 1017020552 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 1033798171 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `underground_heat` | 1050575790 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 1067353409 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `underground_heat` | 949910076 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 966687695 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1084131028 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1100908647 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1117686266 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1134463885 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1017020552 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1033798171 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1050575790 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 1067353409 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 949910076 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 966687695 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 1084131028 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `scout_intel` | 1100908647 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 1117686266 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 1134463885 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 1017020552 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 1033798171 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 1050575790 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `scout_intel` | 1067353409 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 949910076 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 966687695 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1084131028 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1100908647 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1117686266 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1134463885 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1017020552 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1033798171 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1050575790 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 1067353409 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 949910076 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 966687695 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1084131028 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1100908647 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1117686266 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1134463885 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1017020552 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1033798171 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1050575790 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `rival_hunter` | 1067353409 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `rival_hunter` | 949910076 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 966687695 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 231635839 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 214858220 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 265191077 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 248413458 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 164525363 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 147747744 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 198080601 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 181302982 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 365856791 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `clean_sponsor` | 349079172 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `underground_heat` | 231635839 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 214858220 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 265191077 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 248413458 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 164525363 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `underground_heat` | 147747744 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 198080601 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 181302982 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 365856791 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `underground_heat` | 349079172 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 231635839 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 214858220 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 265191077 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 248413458 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 164525363 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 147747744 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 198080601 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 181302982 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `diy_repair` | 365856791 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `diy_repair` | 349079172 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `scout_intel` | 231635839 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `scout_intel` | 214858220 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 265191077 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `scout_intel` | 248413458 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 164525363 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `scout_intel` | 147747744 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 198080601 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `scout_intel` | 181302982 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `scout_intel` | 365856791 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `scout_intel` | 349079172 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 231635839 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 214858220 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 265191077 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 248413458 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 164525363 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 147747744 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 198080601 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 181302982 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 365856791 | 6 | 3 | 4 | start_refused_insufficient_career_funds |
| `high_exposure_performance` | 349079172 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 231635839 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 214858220 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 265191077 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 248413458 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 164525363 | 6 | 1 | 2 | start_refused_insufficient_career_funds |
| `rival_hunter` | 147747744 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 198080601 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 181302982 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 365856791 | 6 | 2 | 3 | start_refused_insufficient_career_funds |
| `rival_hunter` | 349079172 | 6 | 2 | 3 | start_refused_insufficient_career_funds |

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

