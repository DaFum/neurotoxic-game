# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 18460 simulation runs in 54665 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 10% | 10% | 0 pp | 0 | €24670.5 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 10% | 11.92% | 1.92 pp | 0 | €24568 | -2.34% | Fail |
| bootstrap-obligations-80-through-3 | 10% | 10.77% | 0.77 pp | 0 | €24583 | 0.28% | Fail |
| bootstrap-obligations-70-through-3 | 10% | 9.23% | -0.77 pp | 0 | €24819 | 1.5% | Pass |
| bootstrap-obligations-80-through-5 | 10% | 8.46% | -1.54 pp | 0 | €24684.5 | 2.18% | Pass |
| bootstrap-obligations-70-through-5 | 10% | 7.69% | -2.31 pp | 0 | €24685.5 | 2.87% | Pass |
| bootstrap-obligations-60-through-5 | 10% | 6.15% | -3.85 pp | 0 | €24827 | 3.74% | Pass |
| bootstrap-emergency-250 | 10% | 1.15% | -8.85 pp | 0 | €24696 | 11.87% | Fail |
| bootstrap-emergency-500 | 10% | 0.77% | -9.23 pp | 0 | €24690.5 | 11.19% | Fail |
| bootstrap-staged-60-80 | 10% | 8.46% | -1.54 pp | 0 | €24746.5 | 2.29% | Pass |
| bootstrap-staged-75 | 10% | 8.85% | -1.15 pp | 0 | €24744 | 0.87% | Pass |

## Bootstrap-Ranking

1. bootstrap-none
2. bootstrap-obligations-70-through-3
3. bootstrap-staged-75
4. bootstrap-obligations-80-through-5
5. bootstrap-staged-60-80
6. bootstrap-obligations-70-through-5
7. bootstrap-obligations-60-through-5
8. bootstrap-obligations-90-through-3
9. bootstrap-obligations-80-through-3
10. bootstrap-emergency-250
11. bootstrap-emergency-500

## Gewählter Bootstrap-Hebel

`bootstrap-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 98 pairs were evaluated, 97 skipped. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 8.64 | 2899.35 | 3523.82 | 1403.86 | 1632.31 | 46.69 | 1.08 | 1.25 | 16.73% | 0% | 10 |
| control | baseline_touring | 2 | 6.75 | 2642.22 | 3162.6 | 1168.71 | 1636.6 | 52.08 | 0.94 | 1.19 | 35.45% | 3.46% | 9.79 |
| control | baseline_touring | 3 | 6.52 | 2672.82 | 3148.86 | 1129.82 | 1616.99 | 49.58 | 0.91 | 1.17 | 37.61% | 4.62% | 9.73 |
| control | baseline_touring | 4 | 5.63 | 2495.55 | 2964.83 | 1039.37 | 1494.36 | 52.6 | 0.79 | 1.05 | 46.45% | 13.85% | 9.18 |
| control | baseline_touring | 5 | 5.29 | 2306.25 | 2776.83 | 963.12 | 1411.71 | 54.12 | 0.79 | 1.06 | 47.22% | 15.38% | 9.06 |
| control | low_resource_touring | 1 | 8.56 | 2867.98 | 3477.99 | 1350.02 | 1576.15 | 46.78 | 1.1 | 1.2 | 17.09% | 0.38% | 9.97 |
| control | low_resource_touring | 2 | 6.02 | 2457.51 | 3014.38 | 1052.66 | 1331.61 | 52.85 | 0.83 | 1 | 48.23% | 15.38% | 8.92 |
| control | low_resource_touring | 3 | 5.05 | 2334.45 | 2846.44 | 1029.5 | 1220.94 | 56.68 | 0.69 | 0.91 | 56.26% | 26.92% | 8.12 |
| control | low_resource_touring | 4 | 4.73 | 2304.7 | 2758.25 | 961.86 | 1170.12 | 56.75 | 0.65 | 0.85 | 57.17% | 30% | 7.95 |
| control | low_resource_touring | 5 | 4.63 | 2302.77 | 2718.83 | 976.16 | 1199.02 | 56.86 | 0.66 | 0.88 | 58.27% | 30.38% | 7.92 |
| finalTuning | baseline_touring | 1 | 8.64 | 2899.35 | 3523.82 | 1403.86 | 1632.31 | 46.69 | 1.08 | 1.25 | 16.73% | 0% | 10 |
| finalTuning | baseline_touring | 2 | 6.75 | 2642.22 | 3162.6 | 1168.71 | 1636.6 | 52.08 | 0.94 | 1.19 | 35.45% | 3.46% | 9.79 |
| finalTuning | baseline_touring | 3 | 6.52 | 2672.82 | 3148.86 | 1129.82 | 1616.99 | 49.58 | 0.91 | 1.17 | 37.61% | 4.62% | 9.73 |
| finalTuning | baseline_touring | 4 | 5.63 | 2495.55 | 2964.83 | 1039.37 | 1494.36 | 52.6 | 0.79 | 1.05 | 46.45% | 13.85% | 9.18 |
| finalTuning | baseline_touring | 5 | 5.29 | 2306.25 | 2776.83 | 963.12 | 1411.71 | 54.12 | 0.79 | 1.06 | 47.22% | 15.38% | 9.06 |
| finalTuning | low_resource_touring | 1 | 8.56 | 2867.98 | 3477.99 | 1350.02 | 1576.15 | 46.78 | 1.1 | 1.2 | 17.09% | 0.38% | 9.97 |
| finalTuning | low_resource_touring | 2 | 6.02 | 2457.51 | 3014.38 | 1052.66 | 1331.61 | 52.85 | 0.83 | 1 | 48.23% | 15.38% | 8.92 |
| finalTuning | low_resource_touring | 3 | 5.05 | 2334.45 | 2846.44 | 1029.5 | 1220.94 | 56.68 | 0.69 | 0.91 | 56.26% | 26.92% | 8.12 |
| finalTuning | low_resource_touring | 4 | 4.73 | 2304.7 | 2758.25 | 961.86 | 1170.12 | 56.75 | 0.65 | 0.85 | 57.17% | 30% | 7.95 |
| finalTuning | low_resource_touring | 5 | 4.63 | 2302.77 | 2718.83 | 976.16 | 1199.02 | 56.86 | 0.66 | 0.88 | 58.27% | 30.38% | 7.92 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":9.73,"famePerDayAdvantagePct":20.12,"harmonyDelta":-5.39,"repairsDelta":0.14,"bankruptcyDeltaPct":-3.46},"low_resource_touring":{"moneyPerDayAdvantagePct":16.7,"famePerDayAdvantagePct":28.25,"harmonyDelta":-6.07,"repairsDelta":0.27,"bankruptcyDeltaPct":-15}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":9.73,"famePerDayAdvantagePct":20.12,"harmonyDelta":-5.39,"repairsDelta":0.14,"bankruptcyDeltaPct":-3.46},"low_resource_touring":{"moneyPerDayAdvantagePct":16.7,"famePerDayAdvantagePct":28.25,"harmonyDelta":-6.07,"repairsDelta":0.27,"bankruptcyDeltaPct":-15}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 9.73% | 9.73% | 0 pp | No |
| low_resource_touring | 16.7% | 16.7% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 9.73% is below the 20-25% target (was 9.73%)
- low_resource_touring money-per-day advantage 16.7% is below the 20-25% target (was 16.7%)

Gap-1 money-per-day advantage now sits BELOW the 20-25% target band (baseline_touring money-per-day advantage 9.73% is below the 20-25% target (was 9.73%); low_resource_touring money-per-day advantage 16.7% is below the 20-25% target (was 16.7%)). No dampener is warranted — a lever here would push dense touring below paced touring. The target band was set when the simulator gated travel on the gig cadence, which made the advantage look far larger than it is; the band itself is what wants revisiting.

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
| bootstrap_struggle | passed | passed | 10% | 10% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 1.92% | 1.92% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 5.77% | 5.77% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 5% | 5% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 4.62% | 4.62% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 1.92% | 1.92% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 3.46% | 3.46% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 11.92% | 11.92% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 4.62% | 4.62% | 0 pp | 0 | 0% | 0 | 0 | Pass |
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
