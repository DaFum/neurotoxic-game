# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 18460 simulation runs in 51843 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 30.77% | 30.77% | 0 pp | 0 | €1190 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 30.77% | 36.92% | 6.15 pp | 0 | €1251 | -7.31% | Fail |
| bootstrap-obligations-80-through-3 | 30.77% | 35.38% | 4.62 pp | 0 | €1283.5 | -7.16% | Fail |
| bootstrap-obligations-70-through-3 | 30.77% | 31.15% | 0.38 pp | 0 | €1267 | -2.82% | Fail |
| bootstrap-obligations-80-through-5 | 30.77% | 28.08% | -2.69 pp | 0 | €1231 | -2.27% | Pass |
| bootstrap-obligations-70-through-5 | 30.77% | 15% | -15.77 pp | 0 | €1328 | 4.46% | Pass |
| bootstrap-obligations-60-through-5 | 30.77% | 12.69% | -18.08 pp | 0 | €1324 | 4.77% | Pass |
| bootstrap-emergency-250 | 30.77% | 16.54% | -14.23 pp | 0 | €1383 | 3.93% | Pass |
| bootstrap-emergency-500 | 30.77% | 16.15% | -14.62 pp | 0 | €1408.5 | 8.11% | Fail |
| bootstrap-staged-60-80 | 30.77% | 25.77% | -5 pp | 0 | €1318 | -2.73% | Pass |
| bootstrap-staged-75 | 30.77% | 28.08% | -2.69 pp | 0 | €1219 | -2.6% | Pass |

## Bootstrap-Ranking

1. bootstrap-none
2. bootstrap-obligations-80-through-5
3. bootstrap-staged-75
4. bootstrap-staged-60-80
5. bootstrap-emergency-250
6. bootstrap-obligations-70-through-5
7. bootstrap-obligations-60-through-5
8. bootstrap-obligations-70-through-3
9. bootstrap-obligations-80-through-3
10. bootstrap-obligations-90-through-3
11. bootstrap-emergency-500

## Gewählter Bootstrap-Hebel

`bootstrap-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 98 pairs were evaluated, 97 skipped. Der gewaehlte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unveraendert auf dem Kontrollzustand.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 9.18 | 2932.62 | 3665.46 | 1433.34 | 1562.91 | 46.97 | 1.15 | 1.23 | 12.95% | 0% | 10 |
| control | baseline_touring | 2 | 4.55 | 653.57 | 879.09 | 753.69 | 1642.91 | 54.95 | 0.81 | 0.28 | 38.01% | 1.15% | 9.95 |
| control | baseline_touring | 3 | 2.74 | 362.07 | 511.7 | 461.96 | 1645.14 | 60.26 | 0.33 | 0.02 | 54.65% | 5% | 9.81 |
| control | baseline_touring | 4 | 1.7 | 159.6 | 260.86 | 294.84 | 1615.16 | 62.12 | 0.02 | 0 | 71.27% | 19.62% | 9.51 |
| control | baseline_touring | 5 | 0.91 | 103.6 | 153.91 | 191.51 | 937.09 | 64.8 | 0 | 0 | 84.93% | 61.92% | 7.67 |
| control | low_resource_touring | 1 | 9.17 | 2911.83 | 3641.49 | 1403.3 | 1534.49 | 45.63 | 1.17 | 1.21 | 14.2% | 0% | 10 |
| control | low_resource_touring | 2 | 4.48 | 608.09 | 837.58 | 752.86 | 1618.97 | 52.69 | 0.79 | 0.28 | 41.33% | 3.46% | 9.81 |
| control | low_resource_touring | 3 | 0.08 | 31.95 | 43.21 | 36.51 | 46.75 | 73.36 | 0 | 0 | 69.06% | 97.69% | 3.19 |
| control | low_resource_touring | 4 | 0.01 | 2.19 | 3.12 | 3.49 | 5.29 | 73.79 | 0 | 0 | 69.07% | 99.62% | 3.03 |
| control | low_resource_touring | 5 | 0 | 0 | 0 | 0.15 | 0 | 73.99 | 0 | 0 | 69.36% | 100% | 3.01 |
| finalTuning | baseline_touring | 1 | 9.18 | 2932.62 | 3665.46 | 1433.34 | 1562.91 | 46.97 | 1.15 | 1.23 | 12.95% | 0% | 10 |
| finalTuning | baseline_touring | 2 | 4.55 | 653.57 | 879.09 | 753.69 | 1642.91 | 54.95 | 0.81 | 0.28 | 38.01% | 1.15% | 9.95 |
| finalTuning | baseline_touring | 3 | 2.74 | 362.07 | 511.7 | 461.96 | 1645.14 | 60.26 | 0.33 | 0.02 | 54.65% | 5% | 9.81 |
| finalTuning | baseline_touring | 4 | 1.7 | 159.6 | 260.86 | 294.84 | 1615.16 | 62.12 | 0.02 | 0 | 71.27% | 19.62% | 9.51 |
| finalTuning | baseline_touring | 5 | 0.91 | 103.6 | 153.91 | 191.51 | 937.09 | 64.8 | 0 | 0 | 84.93% | 61.92% | 7.67 |
| finalTuning | low_resource_touring | 1 | 9.17 | 2911.83 | 3641.49 | 1403.3 | 1534.49 | 45.63 | 1.17 | 1.21 | 14.2% | 0% | 10 |
| finalTuning | low_resource_touring | 2 | 4.48 | 608.09 | 837.58 | 752.86 | 1618.97 | 52.69 | 0.79 | 0.28 | 41.33% | 3.46% | 9.81 |
| finalTuning | low_resource_touring | 3 | 0.08 | 31.95 | 43.21 | 36.51 | 46.75 | 73.36 | 0 | 0 | 69.06% | 97.69% | 3.19 |
| finalTuning | low_resource_touring | 4 | 0.01 | 2.19 | 3.12 | 3.49 | 5.29 | 73.79 | 0 | 0 | 69.07% | 99.62% | 3.03 |
| finalTuning | low_resource_touring | 5 | 0 | 0 | 0 | 0.15 | 0 | 73.99 | 0 | 0 | 69.36% | 100% | 3.01 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":348.71,"famePerDayAdvantagePct":90.18,"harmonyDelta":-7.98,"repairsDelta":0.34,"bankruptcyDeltaPct":-1.15},"low_resource_touring":{"moneyPerDayAdvantagePct":378.85,"famePerDayAdvantagePct":86.4,"harmonyDelta":-7.06,"repairsDelta":0.38,"bankruptcyDeltaPct":-3.46}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":348.71,"famePerDayAdvantagePct":90.18,"harmonyDelta":-7.98,"repairsDelta":0.34,"bankruptcyDeltaPct":-1.15},"low_resource_touring":{"moneyPerDayAdvantagePct":378.85,"famePerDayAdvantagePct":86.4,"harmonyDelta":-7.06,"repairsDelta":0.38,"bankruptcyDeltaPct":-3.46}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 348.71% | 348.71% | 0 pp | No |
| low_resource_touring | 378.85% | 378.85% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 348.71% is outside the 20-25% target (was 348.71%)
- low_resource_touring money-per-day advantage 378.85% is outside the 20-25% target (was 378.85%)

Gap-1 dominance is unchanged (baseline_touring money-per-day advantage 348.71% is outside the 20-25% target (was 348.71%); low_resource_touring money-per-day advantage 378.85% is outside the 20-25% target (was 378.85%)). The selected combination applies no late-game dampener, so the remaining advantage reflects simply playing more gig nodes rather than a compounding effect a lever could remove.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -1.94% | -0.5% | 0% | 0 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -2.58% | -0.5% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -2.35% | -0.74% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -3.01% | -1.16% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -3.75% | -1.93% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -5.21% | -1.69% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -6.55% | -2.3% | 0% | 0 pp | 0 | Pass |
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

`touring-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 98 pairs were evaluated, 97 skipped. Der gewaehlte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unveraendert auf dem Kontrollzustand.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 0% | 0% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 30.77% | 30.77% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 2.31% | 2.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 6.92% | 6.92% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 2.69% | 2.69% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 3.08% | 3.08% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 2.31% | 2.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 14.62% | 14.62% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 3.85% | 3.85% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
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
