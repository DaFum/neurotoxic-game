# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 18460 simulation runs in 38957 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 21.92% | 21.92% | 0 pp | 0 | €3772 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 21.92% | 28.85% | 6.92 pp | 0 | €3830 | -6.37% | Fail |
| bootstrap-obligations-80-through-3 | 21.92% | 27.69% | 5.77 pp | 0 | €3789.5 | -5.54% | Fail |
| bootstrap-obligations-70-through-3 | 21.92% | 22.69% | 0.77 pp | 0 | €3647 | -2.25% | Fail |
| bootstrap-obligations-80-through-5 | 21.92% | 19.23% | -2.69 pp | 0 | €3517 | -1.97% | Pass |
| bootstrap-obligations-70-through-5 | 21.92% | 8.85% | -13.08 pp | 0 | €3395 | 5.32% | Fail |
| bootstrap-obligations-60-through-5 | 21.92% | 5.77% | -16.15 pp | 0 | €3714 | 6.09% | Fail |
| bootstrap-emergency-250 | 21.92% | 11.15% | -10.77 pp | 0 | €3846 | 5.56% | Fail |
| bootstrap-emergency-500 | 21.92% | 10% | -11.92 pp | 0 | €3932 | 7.4% | Fail |
| bootstrap-staged-60-80 | 21.92% | 18.08% | -3.85 pp | 0 | €3549 | -1.82% | Pass |
| bootstrap-staged-75 | 21.92% | 22.69% | 0.77 pp | 0 | €3724 | -1.9% | Fail |

## Bootstrap-Ranking

1. bootstrap-none
2. bootstrap-obligations-80-through-5
3. bootstrap-staged-60-80
4. bootstrap-obligations-90-through-3
5. bootstrap-obligations-80-through-3
6. bootstrap-obligations-70-through-3
7. bootstrap-staged-75
8. bootstrap-emergency-250
9. bootstrap-emergency-500
10. bootstrap-obligations-70-through-5
11. bootstrap-obligations-60-through-5

## Gewählter Bootstrap-Hebel

`bootstrap-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 42 pairs were evaluated, 41 skipped. Der gewaehlte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unveraendert auf dem Kontrollzustand.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 10 | 2784.49 | 4471.02 | 1606.69 | 1606.69 | 52.3 | 1.28 | 1.03 | 30.11% | 0% | 10 |
| control | baseline_touring | 2 | 5 | 1657.59 | 2214.49 | 821.35 | 1642.7 | 54.89 | 0.87 | 0.12 | 34.29% | 0% | 10 |
| control | baseline_touring | 3 | 2.95 | 891.7 | 1130.62 | 492.6 | 1664.05 | 60.03 | 0.42 | 0.02 | 51.1% | 2.31% | 9.9 |
| control | baseline_touring | 4 | 1.82 | 427.31 | 562.15 | 313.28 | 1599.5 | 62 | 0.05 | 0 | 69.52% | 15% | 9.53 |
| control | baseline_touring | 5 | 0.99 | 267.95 | 317.84 | 206.47 | 932.26 | 64.65 | 0 | 0 | 84.46% | 58.46% | 7.67 |
| control | low_resource_touring | 1 | 10 | 2926.07 | 4649.17 | 1579.19 | 1579.75 | 51.2 | 1.25 | 1.03 | 29.44% | 0% | 10 |
| control | low_resource_touring | 2 | 5 | 1635.53 | 2212.54 | 810.93 | 1623.12 | 53.27 | 0.94 | 0.15 | 40.12% | 0% | 10 |
| control | low_resource_touring | 3 | 0.09 | 70.82 | 85.71 | 43.6 | 46.7 | 73.24 | 0.01 | 0 | 68.76% | 96.92% | 3.22 |
| control | low_resource_touring | 4 | 0.01 | 3.32 | 4.24 | 3.5 | 5.29 | 73.75 | 0 | 0 | 69.07% | 99.62% | 3.03 |
| control | low_resource_touring | 5 | 0 | 0 | 0 | 0.15 | 0 | 73.99 | 0 | 0 | 69.36% | 100% | 3.01 |
| finalTuning | baseline_touring | 1 | 10 | 2784.49 | 4471.02 | 1606.69 | 1606.69 | 52.3 | 1.28 | 1.03 | 30.11% | 0% | 10 |
| finalTuning | baseline_touring | 2 | 5 | 1657.59 | 2214.49 | 821.35 | 1642.7 | 54.89 | 0.87 | 0.12 | 34.29% | 0% | 10 |
| finalTuning | baseline_touring | 3 | 2.95 | 891.7 | 1130.62 | 492.6 | 1664.05 | 60.03 | 0.42 | 0.02 | 51.1% | 2.31% | 9.9 |
| finalTuning | baseline_touring | 4 | 1.82 | 427.31 | 562.15 | 313.28 | 1599.5 | 62 | 0.05 | 0 | 69.52% | 15% | 9.53 |
| finalTuning | baseline_touring | 5 | 0.99 | 267.95 | 317.84 | 206.47 | 932.26 | 64.65 | 0 | 0 | 84.46% | 58.46% | 7.67 |
| finalTuning | low_resource_touring | 1 | 10 | 2926.07 | 4649.17 | 1579.19 | 1579.75 | 51.2 | 1.25 | 1.03 | 29.44% | 0% | 10 |
| finalTuning | low_resource_touring | 2 | 5 | 1635.53 | 2212.54 | 810.93 | 1623.12 | 53.27 | 0.94 | 0.15 | 40.12% | 0% | 10 |
| finalTuning | low_resource_touring | 3 | 0.09 | 70.82 | 85.71 | 43.6 | 46.7 | 73.24 | 0.01 | 0 | 68.76% | 96.92% | 3.22 |
| finalTuning | low_resource_touring | 4 | 0.01 | 3.32 | 4.24 | 3.5 | 5.29 | 73.75 | 0 | 0 | 69.07% | 99.62% | 3.03 |
| finalTuning | low_resource_touring | 5 | 0 | 0 | 0 | 0.15 | 0 | 73.99 | 0 | 0 | 69.36% | 100% | 3.01 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":67.98,"famePerDayAdvantagePct":95.62,"harmonyDelta":-2.59,"repairsDelta":0.41,"bankruptcyDeltaPct":0},"low_resource_touring":{"moneyPerDayAdvantagePct":78.91,"famePerDayAdvantagePct":94.74,"harmonyDelta":-2.07,"repairsDelta":0.31,"bankruptcyDeltaPct":0}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":67.98,"famePerDayAdvantagePct":95.62,"harmonyDelta":-2.59,"repairsDelta":0.41,"bankruptcyDeltaPct":0},"low_resource_touring":{"moneyPerDayAdvantagePct":78.91,"famePerDayAdvantagePct":94.74,"harmonyDelta":-2.07,"repairsDelta":0.31,"bankruptcyDeltaPct":0}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 67.98% | 67.98% | 0 pp | No |
| low_resource_touring | 78.91% | 78.91% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 67.98% is outside the 20-25% target (was 67.98%)
- low_resource_touring money-per-day advantage 78.91% is outside the 20-25% target (was 78.91%)

Gap-1 dominance is unchanged (baseline_touring money-per-day advantage 67.98% is outside the 20-25% target (was 67.98%); low_resource_touring money-per-day advantage 78.91% is outside the 20-25% target (was 78.91%)). The selected combination applies no late-game dampener, so the remaining advantage reflects simply playing more gig nodes rather than a compounding effect a lever could remove.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | 0.21% | -3.06% | -0.36% | 0 pp | 0 | Fail |
| touring-demand-7.5-25-window-3 | -1.1% | -6.05% | -0.36% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -0.99% | -5.46% | -0.36% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -2.01% | -6.57% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -4.02% | -11% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -5.92% | -11.86% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -5.34% | -11.09% | 0% | 0 pp | 0 | Pass |
| touring-stress-1 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-stress-2 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-stress-1-recovery-90 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-wear-105 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-wear-110 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-wear-115 | 0% | 0% | 0% | 0 pp | 0 | Pass |

## Late-Game-Ranking

1. touring-demand-13.5-48-after-3-window-5
2. touring-demand-16-55-after-5
3. touring-demand-10-40-after-3-window-5
4. touring-demand-10-40-after-3-window-3
5. touring-demand-7.5-25-window-3
6. touring-demand-5-20-window-5
7. touring-none
8. touring-stress-1
9. touring-stress-2
10. touring-wear-105
11. touring-wear-110
12. touring-wear-115
13. touring-stress-1-recovery-90
14. touring-demand-5-15-window-3

## Gewählter Late-Game-Hebel

`touring-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 42 pairs were evaluated, 41 skipped. Der gewaehlte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unveraendert auf dem Kontrollzustand.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 21.92% | 21.92% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 1.15% | 1.15% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 2.31% | 2.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 3.08% | 3.08% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| late_game_probe | not_evaluated | not_evaluated | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |

Final gate: **PASS**. Bootstrap Struggle bankruptcy must remain <= 60%.

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and the early/mid progression checkpoints (days 3 and 5) are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production.

Recommendation: **accepted-for-production-partial**

## Fazit

Selection is based on paired deltas, distributions, deterministic bootstrap intervals, transition matrices, and explicit side-effect limits.

| Ergebnis | Status |
|---|---|
| Phase 3B (Bootstrap-Insolvenz) | bestanden |
| Finale Sicherheits-Gates | bestanden |
| Late-Game-Snowball | nicht verbessert |
| Gap-1-Dominanz im Zielband | nicht gelöst |
| Phase 3C Gesamtstatus | partial |
| Produktionskandidat | accepted-for-production-partial |
