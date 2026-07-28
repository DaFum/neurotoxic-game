# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 18460 simulation runs in 53078 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 37.31% | 37.31% | 0 pp | 0 | €1069 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 37.31% | 43.46% | 6.15 pp | 0 | €1194 | -7.62% | Fail |
| bootstrap-obligations-80-through-3 | 37.31% | 42.31% | 5 pp | 0 | €1220.5 | -6.99% | Fail |
| bootstrap-obligations-70-through-3 | 37.31% | 38.46% | 1.15 pp | 0 | €1267 | -3.02% | Fail |
| bootstrap-obligations-80-through-5 | 37.31% | 35.77% | -1.54 pp | 0 | €1287 | -3.45% | Pass |
| bootstrap-obligations-70-through-5 | 37.31% | 23.08% | -14.23 pp | 0 | €1274 | 3.43% | Pass |
| bootstrap-obligations-60-through-5 | 37.31% | 19.23% | -18.08 pp | 0 | €1269 | 3.73% | Pass |
| bootstrap-emergency-250 | 37.31% | 26.92% | -10.38 pp | 0 | €1287 | 3.74% | Pass |
| bootstrap-emergency-500 | 37.31% | 21.54% | -15.77 pp | 0 | €1278.5 | 9.54% | Fail |
| bootstrap-staged-60-80 | 37.31% | 33.08% | -4.23 pp | 0 | €1255 | -3.55% | Pass |
| bootstrap-staged-75 | 37.31% | 37.31% | 0 pp | 0 | €1268 | -2.87% | Pass |

## Bootstrap-Ranking

1. bootstrap-emergency-250
2. bootstrap-staged-60-80
3. bootstrap-obligations-80-through-5
4. bootstrap-none
5. bootstrap-obligations-70-through-5
6. bootstrap-staged-75
7. bootstrap-obligations-60-through-5
8. bootstrap-obligations-70-through-3
9. bootstrap-emergency-500
10. bootstrap-obligations-80-through-3
11. bootstrap-obligations-90-through-3

## Gewählter Bootstrap-Hebel

`bootstrap-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 98 pairs were evaluated, 97 skipped. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 8.64 | 2899.35 | 3523.82 | 1403.86 | 1632.31 | 46.69 | 1.08 | 1.25 | 16.73% | 0% | 10 |
| control | baseline_touring | 2 | 4.17 | 599.74 | 814.44 | 717.46 | 1662.77 | 56.2 | 0.72 | 0.25 | 41.52% | 3.85% | 9.84 |
| control | baseline_touring | 3 | 2.56 | 326.28 | 468.19 | 428.95 | 1599.23 | 60.71 | 0.32 | 0.02 | 57.25% | 8.46% | 9.71 |
| control | baseline_touring | 4 | 1.63 | 155.48 | 253.12 | 284.7 | 1588.92 | 62.5 | 0.01 | 0 | 71.8% | 20.77% | 9.43 |
| control | baseline_touring | 5 | 0.87 | 100.47 | 149.9 | 182.47 | 904.93 | 65.23 | 0 | 0 | 85.15% | 61.92% | 7.63 |
| control | low_resource_touring | 1 | 8.56 | 2867.98 | 3477.99 | 1350.02 | 1576.15 | 46.78 | 1.1 | 1.2 | 17.09% | 0.38% | 9.97 |
| control | low_resource_touring | 2 | 4.05 | 565.96 | 789.76 | 697.43 | 1588.18 | 54.46 | 0.7 | 0.25 | 45.5% | 8.85% | 9.55 |
| control | low_resource_touring | 3 | 0.07 | 29.58 | 38.95 | 34.92 | 47.31 | 73.44 | 0.01 | 0 | 69.13% | 97.69% | 3.19 |
| control | low_resource_touring | 4 | 0.01 | 2.19 | 3.12 | 3.49 | 5.29 | 73.79 | 0 | 0 | 69.07% | 99.62% | 3.03 |
| control | low_resource_touring | 5 | 0 | 0 | 0 | 0.15 | 0 | 73.99 | 0 | 0 | 69.36% | 100% | 3.01 |
| finalTuning | baseline_touring | 1 | 8.64 | 2899.35 | 3523.82 | 1403.86 | 1632.31 | 46.69 | 1.08 | 1.25 | 16.73% | 0% | 10 |
| finalTuning | baseline_touring | 2 | 4.17 | 599.74 | 814.44 | 717.46 | 1662.77 | 56.2 | 0.72 | 0.25 | 41.52% | 3.85% | 9.84 |
| finalTuning | baseline_touring | 3 | 2.56 | 326.28 | 468.19 | 428.95 | 1599.23 | 60.71 | 0.32 | 0.02 | 57.25% | 8.46% | 9.71 |
| finalTuning | baseline_touring | 4 | 1.63 | 155.48 | 253.12 | 284.7 | 1588.92 | 62.5 | 0.01 | 0 | 71.8% | 20.77% | 9.43 |
| finalTuning | baseline_touring | 5 | 0.87 | 100.47 | 149.9 | 182.47 | 904.93 | 65.23 | 0 | 0 | 85.15% | 61.92% | 7.63 |
| finalTuning | low_resource_touring | 1 | 8.56 | 2867.98 | 3477.99 | 1350.02 | 1576.15 | 46.78 | 1.1 | 1.2 | 17.09% | 0.38% | 9.97 |
| finalTuning | low_resource_touring | 2 | 4.05 | 565.96 | 789.76 | 697.43 | 1588.18 | 54.46 | 0.7 | 0.25 | 45.5% | 8.85% | 9.55 |
| finalTuning | low_resource_touring | 3 | 0.07 | 29.58 | 38.95 | 34.92 | 47.31 | 73.44 | 0.01 | 0 | 69.13% | 97.69% | 3.19 |
| finalTuning | low_resource_touring | 4 | 0.01 | 2.19 | 3.12 | 3.49 | 5.29 | 73.79 | 0 | 0 | 69.07% | 99.62% | 3.03 |
| finalTuning | low_resource_touring | 5 | 0 | 0 | 0 | 0.15 | 0 | 73.99 | 0 | 0 | 69.36% | 100% | 3.01 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":383.43,"famePerDayAdvantagePct":95.67,"harmonyDelta":-9.51,"repairsDelta":0.36,"bankruptcyDeltaPct":-3.85},"low_resource_touring":{"moneyPerDayAdvantagePct":406.75,"famePerDayAdvantagePct":93.57,"harmonyDelta":-7.68,"repairsDelta":0.4,"bankruptcyDeltaPct":-8.47}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":383.43,"famePerDayAdvantagePct":95.67,"harmonyDelta":-9.51,"repairsDelta":0.36,"bankruptcyDeltaPct":-3.85},"low_resource_touring":{"moneyPerDayAdvantagePct":406.75,"famePerDayAdvantagePct":93.57,"harmonyDelta":-7.68,"repairsDelta":0.4,"bankruptcyDeltaPct":-8.47}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 383.43% | 383.43% | 0 pp | No |
| low_resource_touring | 406.75% | 406.75% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 383.43% is outside the 20-25% target (was 383.43%)
- low_resource_touring money-per-day advantage 406.75% is outside the 20-25% target (was 406.75%)

Gap-1 dominance is unchanged (baseline_touring money-per-day advantage 383.43% is outside the 20-25% target (was 383.43%); low_resource_touring money-per-day advantage 406.75% is outside the 20-25% target (was 406.75%)). The selected combination applies no late-game dampener, so the remaining advantage reflects simply playing more gig nodes rather than a compounding effect a lever could remove.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -1.97% | -2.23% | 0% | 0 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -2.69% | -1.13% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -2.07% | -2.64% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -3.9% | -2.23% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -4.33% | -2.67% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -5.65% | -2.72% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -6% | -2.76% | 0% | 0 pp | 0 | Pass |
| touring-stress-1 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-stress-2 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-stress-1-recovery-90 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-wear-105 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-wear-110 | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-wear-115 | 0% | 0% | 0% | 0 pp | 0 | Pass |

## Late-Game-Ranking

1. touring-demand-16-55-after-5
2. touring-demand-13.5-48-after-3-window-5
3. touring-demand-10-40-after-3-window-5
4. touring-demand-10-40-after-3-window-3
5. touring-demand-7.5-25-window-3
6. touring-demand-5-20-window-5
7. touring-demand-5-15-window-3
8. touring-none
9. touring-stress-1
10. touring-stress-2
11. touring-wear-105
12. touring-wear-110
13. touring-wear-115
14. touring-stress-1-recovery-90

## Gewählter Late-Game-Hebel

`touring-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 98 pairs were evaluated, 97 skipped. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 37.31% | 37.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 4.23% | 4.23% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 10.38% | 10.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 7.31% | 7.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 4.23% | 4.23% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 5% | 5% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 7.69% | 7.69% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 19.62% | 19.62% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 6.54% | 6.54% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 1.15% | 1.15% | 0 pp | 0 | 0% | 0 | 0 | Pass |
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
