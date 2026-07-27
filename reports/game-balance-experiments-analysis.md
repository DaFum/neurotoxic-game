# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 163540 simulation runs in 864164 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-obligations-90 | 88.46% | 84.23% | -4.23 pp | 1 | €5065 | -0.74% | Fail |
| bootstrap-obligations-80 | 88.46% | 80.38% | -8.08 pp | 3 | €4087 | -2.94% | Fail |
| bootstrap-obligations-70 | 88.46% | 73.85% | -14.62 pp | 14 | €4470 | -6.46% | Fail |
| bootstrap-emergency-250 | 88.46% | 79.23% | -9.23 pp | 2 | €4736 | -6.39% | Fail |
| bootstrap-emergency-500 | 88.46% | 78.46% | -10 pp | 14 | €4976.5 | -6.2% | Fail |
| bootstrap-emergency-750 | 88.46% | 76.92% | -11.54 pp | 15 | €4052.5 | -5.55% | Fail |
| bootstrap-staged-60-80 | 88.46% | 80.38% | -8.08 pp | 7 | €5254 | -4.42% | Fail |
| bootstrap-staged-75 | 88.46% | 81.54% | -6.92 pp | 1 | €4661.5 | -3.42% | Fail |
| bootstrap-staged-85 | 88.46% | 83.46% | -5 pp | 1 | €4218 | -2.15% | Fail |
| bootstrap-obligations-50-through-60 | 88.46% | 56.92% | -31.54 pp | 28 | €3691 | -1.91% | Pass |
| bootstrap-obligations-49-through-60 | 88.46% | 60% | -28.46 pp | 30.5 | €3588 | -1.21% | Pass |
| bootstrap-obligations-47-through-60 | 88.46% | 56.92% | -31.54 pp | 32 | €3435.5 | -1.26% | Pass |
| bootstrap-obligations-46-through-60 | 88.46% | 57.31% | -31.15 pp | 33 | €2992 | -1.71% | Pass |
| bootstrap-obligations-45-through-60 | 88.46% | 55% | -33.46 pp | 35 | €3270 | -1.19% | Pass |

## Bootstrap-Ranking

1. bootstrap-obligations-45-through-60
2. bootstrap-obligations-50-through-60
3. bootstrap-obligations-47-through-60
4. bootstrap-obligations-46-through-60
5. bootstrap-obligations-49-through-60
6. bootstrap-obligations-70
7. bootstrap-emergency-750
8. bootstrap-emergency-500
9. bootstrap-emergency-250
10. bootstrap-obligations-80
11. bootstrap-staged-60-80
12. bootstrap-staged-75
13. bootstrap-obligations-90
14. bootstrap-staged-85

## Gewählter Bootstrap-Hebel

`bootstrap-obligations-49-through-60` showed the best accepted paired outcome.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 61.13 | 870.49 | 2049.98 | 665.71 | 816.75 | 40.8 | 11.89 | 7.99 | 60.12% | 0% | 75 |
| control | baseline_touring | 2 | 29.13 | 284.77 | 940.63 | 374.15 | 956.63 | 55.93 | 7.56 | 4.13 | 57.7% | 1.15% | 74.47 |
| control | baseline_touring | 3 | 16.15 | 136.83 | 509.33 | 229.83 | 1026.37 | 52.03 | 5.48 | 2.16 | 72.59% | 14.62% | 72.12 |
| control | baseline_touring | 4 | 8.41 | 43.85 | 285.86 | 129.11 | 960.96 | 53.38 | 3.83 | 1.08 | 87.61% | 53.85% | 62.61 |
| control | baseline_touring | 5 | 5.19 | 20.32 | 190.54 | 92.84 | 952.68 | 53.26 | 2.85 | 0.44 | 94.07% | 78.08% | 53.24 |
| control | low_resource_touring | 1 | 61.02 | 836.58 | 2018.92 | 664.36 | 816.58 | 38.48 | 11.93 | 8.1 | 61.41% | 0% | 75 |
| control | low_resource_touring | 2 | 29.38 | 287.66 | 944.52 | 406.34 | 1030.74 | 55.41 | 7.66 | 4.14 | 57.09% | 0.77% | 74.54 |
| control | low_resource_touring | 3 | 15.3 | 123.53 | 478.28 | 224.17 | 1026.46 | 52.43 | 5.22 | 2.07 | 74.34% | 16.92% | 70.06 |
| control | low_resource_touring | 4 | 8.11 | 43.54 | 291.98 | 133.82 | 1007.11 | 54.68 | 3.68 | 0.99 | 88.41% | 53.08% | 61.02 |
| control | low_resource_touring | 5 | 4.37 | 20.57 | 193.82 | 89.93 | 899.25 | 52.74 | 2.27 | 0.37 | 93.58% | 80.38% | 43.73 |
| finalTuning | baseline_touring | 1 | 60.85 | 659.97 | 1810.74 | 661.3 | 815.08 | 40.97 | 12.01 | 8.08 | 61.49% | 0% | 75 |
| finalTuning | baseline_touring | 2 | 29.58 | 275.21 | 907.43 | 387.8 | 976.09 | 53.86 | 7.63 | 4.2 | 55.82% | 1.92% | 74.45 |
| finalTuning | baseline_touring | 3 | 16.06 | 125.36 | 490.46 | 223.91 | 1002.37 | 53.52 | 5.43 | 2.17 | 73.47% | 15.38% | 71.88 |
| finalTuning | baseline_touring | 4 | 8.2 | 39.81 | 272.62 | 124.53 | 946.57 | 54.44 | 3.77 | 1.06 | 87.76% | 53.85% | 62.3 |
| finalTuning | baseline_touring | 5 | 5.18 | 18.4 | 189.53 | 91.2 | 948.66 | 53.65 | 2.85 | 0.45 | 94.7% | 76.54% | 53.89 |
| finalTuning | low_resource_touring | 1 | 61.52 | 684.77 | 1831.58 | 673.84 | 821.19 | 38.62 | 12.03 | 8.05 | 62% | 0.38% | 74.98 |
| finalTuning | low_resource_touring | 2 | 29.52 | 266.31 | 901.33 | 411.41 | 1042.62 | 54.72 | 7.71 | 4.15 | 56.34% | 0.77% | 74.8 |
| finalTuning | low_resource_touring | 3 | 14.98 | 116.4 | 461.12 | 212.63 | 992.34 | 51.98 | 5.17 | 2.02 | 74.2% | 18.46% | 69.9 |
| finalTuning | low_resource_touring | 4 | 8.06 | 45.03 | 294.17 | 137.01 | 1025.86 | 55.58 | 3.65 | 0.96 | 88.36% | 54.23% | 60.36 |
| finalTuning | low_resource_touring | 5 | 4.49 | 25.75 | 202.42 | 91.62 | 906.04 | 52.99 | 2.34 | 0.39 | 93.31% | 78.85% | 44.43 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":205.68,"famePerDayAdvantagePct":77.93,"harmonyDelta":-15.13,"repairsDelta":4.33,"bankruptcyDeltaPct":-1.15},"low_resource_touring":{"moneyPerDayAdvantagePct":190.82,"famePerDayAdvantagePct":63.5,"harmonyDelta":-16.93,"repairsDelta":4.27,"bankruptcyDeltaPct":-0.77}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":139.81,"famePerDayAdvantagePct":70.53,"harmonyDelta":-12.89,"repairsDelta":4.38,"bankruptcyDeltaPct":-1.92},"low_resource_touring":{"moneyPerDayAdvantagePct":157.13,"famePerDayAdvantagePct":63.79,"harmonyDelta":-16.1,"repairsDelta":4.32,"bankruptcyDeltaPct":-0.39}}

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Day 20 Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-demand-5-15 | -12.01% | -4.43% | 1.03% | 0 pp | -1 | Fail |
| touring-demand-5-20 | -10.72% | -0.29% | 1.46% | 0 pp | -2 | Fail |
| touring-demand-7.5-25 | -12.83% | -5.25% | 1.52% | -0.38 pp | 0 | Fail |
| touring-demand-10-40-window-10 | -25.91% | -15.35% | -2.83% | -0.38 pp | -1 | Fail |
| touring-demand-10-40-window-8 | -23.3% | -18.04% | -4.15% | -0.38 pp | 0 | Pass |
| touring-demand-10-40-after-20 | -17.42% | -14.64% | 3.19% | -0.38 pp | -1 | Fail |
| touring-demand-12-45-after-20 | -26.48% | -22.01% | 2.02% | 0 pp | 0 | Fail |
| touring-demand-13.5-48-after-25 | -24.48% | -18.41% | 2.58% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-28 | -23.42% | -20.78% | 1.98% | -0.38 pp | 0 | Pass |
| touring-demand-17-55-after-29 | -25.87% | -19.04% | 1.21% | -0.38 pp | 0 | Fail |
| touring-demand-16-55-after-29 | -26.57% | -23.82% | 2.73% | -0.38 pp | -2.5 | Fail |
| touring-stress-1 | -4.2% | -1.19% | 2.78% | -0.38 pp | 0 | Fail |
| touring-stress-2 | -6.16% | -5.19% | 1.8% | -0.38 pp | -3 | Fail |
| touring-stress-1-recovery-90 | -6.49% | 3.14% | 2.44% | -0.38 pp | -1.5 | Fail |
| touring-wear-105 | -3.29% | -0.93% | 2.84% | -0.38 pp | -1 | Fail |
| touring-wear-110 | -9.98% | -2.62% | 0.98% | -0.38 pp | 0 | Fail |
| touring-wear-115 | -5.44% | -0.58% | 2.6% | -0.38 pp | -1 | Fail |

## Late-Game-Ranking

1. touring-demand-16-55-after-28
2. touring-demand-10-40-window-8
3. touring-demand-13.5-48-after-25
4. touring-demand-10-40-after-20
5. touring-demand-7.5-25
6. touring-demand-5-15
7. touring-demand-5-20
8. touring-wear-110
9. touring-demand-10-40-window-10
10. touring-demand-17-55-after-29
11. touring-demand-12-45-after-20
12. touring-demand-16-55-after-29
13. touring-stress-1-recovery-90
14. touring-stress-2
15. touring-wear-115
16. touring-stress-1
17. touring-wear-105

## Gewählter Late-Game-Hebel

`touring-demand-16-55-after-28` had the best snowball-reduction versus side-effect trade-off.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 0.38% | 0% | -0.38 pp | -5876.5 | -2.07% | -2 | 1.2 | Pass |
| bootstrap_struggle | failed | passed | 86.92% | 57.69% | -29.23 pp | 0 | -0.25% | 0 | 0.56 | Pass |
| aggressive_marketing | passed | passed | 1.15% | 0.77% | -0.38 pp | 1261.5 | 0.46% | 0 | -4.37 | Pass |
| scandal_recovery | passed | passed | 36.54% | 18.46% | -18.08 pp | 2393.5 | 0.93% | 0 | -5.46 | Pass |
| festival_push | passed | passed | 28.08% | 12.69% | -15.38 pp | 1658.5 | 1.11% | 0 | -6.52 | Pass |
| chaos_tour | passed | passed | 6.92% | 0.77% | -6.15 pp | 1732 | 3.63% | 0 | -5.75 | Pass |
| cult_hypergrowth | passed | passed | 0.38% | 1.15% | 0.77 pp | -449.5 | -1.32% | 0 | -2.99 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 5% | 0.77% | -4.23 pp | 1683 | -1.88% | 0 | -6.58 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 6.92% | 3.08% | -3.85 pp | 601 | -2.4% | 0 | -6.64 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 0.77% | 0% | -0.77 pp | 1359 | -1.81% | 0 | -6.02 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 2.69% | 0% | -2.69 pp | 2139 | -0.17% | 0 | -4.83 | Pass |
| late_game_probe | not_evaluated | not_evaluated | 0% | 0% | 0 pp | 242 | 0.49% | 0 | -1.23 | Pass |

Final gate: **PASS**. Bootstrap Struggle bankruptcy must remain <= 60%.

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and day-20/day-40 money are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production.

## Fazit

Selection is based on paired deltas, distributions, deterministic bootstrap intervals, transition matrices, and explicit side-effect limits.
