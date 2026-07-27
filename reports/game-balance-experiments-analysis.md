# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 18460 simulation runs in 24506 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 17.31% | 17.31% | 0 pp | 0 | €4353 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 17.31% | 16.54% | -0.77 pp | 0 | €4436 | -0.16% | Pass |
| bootstrap-obligations-80-through-3 | 17.31% | 15% | -2.31 pp | 0 | €4454 | -0.26% | Pass |
| bootstrap-obligations-70-through-3 | 17.31% | 14.23% | -3.08 pp | 0 | €4428 | -0.28% | Pass |
| bootstrap-obligations-80-through-5 | 17.31% | 11.54% | -5.77 pp | 0 | €4441 | -0.39% | Pass |
| bootstrap-obligations-70-through-5 | 17.31% | 6.54% | -10.77 pp | 0 | €4426 | -0.33% | Pass |
| bootstrap-obligations-60-through-5 | 17.31% | 2.31% | -15 pp | 0 | €4496.5 | 0.19% | Pass |
| bootstrap-emergency-250 | 17.31% | 17.31% | 0 pp | 0 | €4378 | -0.02% | Pass |
| bootstrap-emergency-500 | 17.31% | 16.92% | -0.38 pp | 0 | €4399 | -0.01% | Pass |
| bootstrap-staged-60-80 | 17.31% | 9.62% | -7.69 pp | 0 | €4395 | -0.39% | Pass |
| bootstrap-staged-75 | 17.31% | 12.69% | -4.62 pp | 0 | €4413 | -0.3% | Pass |

## Bootstrap-Ranking

1. bootstrap-none
2. bootstrap-emergency-250
3. bootstrap-emergency-500
4. bootstrap-obligations-90-through-3
5. bootstrap-obligations-60-through-5
6. bootstrap-obligations-80-through-3
7. bootstrap-obligations-70-through-3
8. bootstrap-obligations-70-through-5
9. bootstrap-obligations-80-through-5
10. bootstrap-staged-75
11. bootstrap-staged-60-80

## Gewählter Bootstrap-Hebel

`bootstrap-none` was selected by the combination search: candidate pairs are ordered by `combinationImpact`, which is derived from the overrides alone, and the first pair passing final combined validation wins. 1 of 154 pairs were evaluated; the remaining 153 carry higher impact and so could not have been selected.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 9.89 | 2974.75 | 4553.06 | 1512.65 | 1528.07 | 50 | 1.35 | 1.06 | 27.36% | 0% | 10 |
| control | baseline_touring | 2 | 5 | 1663.2 | 2180.65 | 780.14 | 1560.28 | 50.2 | 0.93 | 0.15 | 26.48% | 0% | 10 |
| control | baseline_touring | 3 | 2.98 | 1043.2 | 1225.03 | 465.47 | 1580.11 | 52.98 | 0.5 | 0.01 | 37.2% | 1.15% | 9.96 |
| control | baseline_touring | 4 | 1.91 | 571.77 | 662.06 | 312.71 | 1597.6 | 55.01 | 0.05 | 0 | 56.34% | 8.85% | 9.79 |
| control | baseline_touring | 5 | 1.75 | 513.14 | 569.09 | 286.02 | 1579.5 | 54.79 | 0 | 0 | 73.88% | 25% | 9.72 |
| control | low_resource_touring | 1 | 9.9 | 2897.93 | 4473.9 | 1544.59 | 1562.38 | 49.08 | 1.31 | 1.03 | 27.33% | 0% | 10 |
| control | low_resource_touring | 2 | 5 | 1729.71 | 2216.24 | 776.92 | 1554.97 | 49.72 | 0.92 | 0.17 | 37.31% | 0% | 10 |
| control | low_resource_touring | 3 | 0.08 | 99.99 | 118.27 | 39.69 | 46.28 | 73.32 | 0.01 | 0 | 68.93% | 97.31% | 3.2 |
| control | low_resource_touring | 4 | 0 | 0 | 0 | 0 | 0 | 73.9 | 0 | 0 | 69.2% | 100% | 3 |
| control | low_resource_touring | 5 | 0 | 0 | 0.63 | 2.31 | 6.73 | 73.99 | 0 | 0 | 69.3% | 100% | 3.03 |
| finalTuning | baseline_touring | 1 | 9.89 | 2974.75 | 4553.06 | 1512.65 | 1528.07 | 50 | 1.35 | 1.06 | 27.36% | 0% | 10 |
| finalTuning | baseline_touring | 2 | 5 | 1663.2 | 2180.65 | 780.14 | 1560.28 | 50.2 | 0.93 | 0.15 | 26.48% | 0% | 10 |
| finalTuning | baseline_touring | 3 | 2.98 | 1043.2 | 1225.03 | 465.47 | 1580.11 | 52.98 | 0.5 | 0.01 | 37.2% | 1.15% | 9.96 |
| finalTuning | baseline_touring | 4 | 1.91 | 571.77 | 662.06 | 312.71 | 1597.6 | 55.01 | 0.05 | 0 | 56.34% | 8.85% | 9.79 |
| finalTuning | baseline_touring | 5 | 1.75 | 513.14 | 569.09 | 286.02 | 1579.5 | 54.79 | 0 | 0 | 73.88% | 25% | 9.72 |
| finalTuning | low_resource_touring | 1 | 9.9 | 2897.93 | 4473.9 | 1544.59 | 1562.38 | 49.08 | 1.31 | 1.03 | 27.33% | 0% | 10 |
| finalTuning | low_resource_touring | 2 | 5 | 1729.71 | 2216.24 | 776.92 | 1554.97 | 49.72 | 0.92 | 0.17 | 37.31% | 0% | 10 |
| finalTuning | low_resource_touring | 3 | 0.08 | 99.99 | 118.27 | 39.69 | 46.28 | 73.32 | 0.01 | 0 | 68.93% | 97.31% | 3.2 |
| finalTuning | low_resource_touring | 4 | 0 | 0 | 0 | 0 | 0 | 73.9 | 0 | 0 | 69.2% | 100% | 3 |
| finalTuning | low_resource_touring | 5 | 0 | 0 | 0.63 | 2.31 | 6.73 | 73.99 | 0 | 0 | 69.3% | 100% | 3.03 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":78.86,"famePerDayAdvantagePct":93.89,"harmonyDelta":-0.2,"repairsDelta":0.42,"bankruptcyDeltaPct":0},"low_resource_touring":{"moneyPerDayAdvantagePct":67.54,"famePerDayAdvantagePct":98.81,"harmonyDelta":-0.64,"repairsDelta":0.39,"bankruptcyDeltaPct":0}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":78.86,"famePerDayAdvantagePct":93.89,"harmonyDelta":-0.2,"repairsDelta":0.42,"bankruptcyDeltaPct":0},"low_resource_touring":{"moneyPerDayAdvantagePct":67.54,"famePerDayAdvantagePct":98.81,"harmonyDelta":-0.64,"repairsDelta":0.39,"bankruptcyDeltaPct":0}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 78.86% | 78.86% | 0 pp | No |
| low_resource_touring | 67.54% | 67.54% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 78.86% is outside the 20-25% target (was 78.86%)
- low_resource_touring money-per-day advantage 67.54% is outside the 20-25% target (was 67.54%)

Gap-1 dominance is unchanged (baseline_touring money-per-day advantage 78.86% is outside the 20-25% target (was 78.86%); low_resource_touring money-per-day advantage 67.54% is outside the 20-25% target (was 67.54%)). The selected combination applies no late-game dampener, so the remaining advantage reflects simply playing more gig nodes rather than a compounding effect a lever could remove.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -2.73% | -3.41% | -0.27% | 0 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -3.21% | -3.57% | -0.27% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -2.42% | -4.02% | -0.27% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -6.26% | -3.33% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -7.27% | -5.2% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -8.34% | -6.62% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -7.45% | -6.63% | 0% | 0 pp | 0 | Pass |
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
6. touring-demand-5-15-window-3
7. touring-demand-5-20-window-5
8. touring-none
9. touring-stress-1
10. touring-stress-2
11. touring-wear-105
12. touring-wear-110
13. touring-wear-115
14. touring-stress-1-recovery-90

## Gewählter Late-Game-Hebel

`touring-none` was selected by the combination search: candidate pairs are ordered by `combinationImpact`, which is derived from the overrides alone, and the first pair passing final combined validation wins. 1 of 154 pairs were evaluated; the remaining 153 carry higher impact and so could not have been selected.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 17.31% | 17.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 1.15% | 1.15% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 0.77% | 0.77% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
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
