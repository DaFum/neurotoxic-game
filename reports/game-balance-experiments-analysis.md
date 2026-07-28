# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 18460 simulation runs in 37822 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 30.38% | 30.38% | 0 pp | 0 | €24417 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 30.38% | 32.31% | 1.92 pp | 0 | €24614 | -1.93% | Fail |
| bootstrap-obligations-80-through-3 | 30.38% | 30% | -0.38 pp | 0 | €24633 | 0.41% | Pass |
| bootstrap-obligations-70-through-3 | 30.38% | 28.46% | -1.92 pp | 0 | €24985.5 | 0.88% | Pass |
| bootstrap-obligations-80-through-5 | 30.38% | 28.46% | -1.92 pp | 0 | €24695.5 | 1.44% | Pass |
| bootstrap-obligations-70-through-5 | 30.38% | 25% | -5.38 pp | 0 | €24870 | 4.24% | Pass |
| bootstrap-obligations-60-through-5 | 30.38% | 20.77% | -9.62 pp | 0 | €24820 | 9.49% | Fail |
| bootstrap-emergency-250 | 30.38% | 7.69% | -22.69 pp | 0 | €23975.5 | 29.51% | Fail |
| bootstrap-emergency-500 | 30.38% | 1.92% | -28.46 pp | 0 | €24008 | 37.46% | Fail |
| bootstrap-staged-60-80 | 30.38% | 26.15% | -4.23 pp | 0 | €24910.5 | 3.2% | Pass |
| bootstrap-staged-75 | 30.38% | 26.92% | -3.46 pp | 0 | €25144 | 2.83% | Pass |

## Bootstrap-Ranking

1. bootstrap-obligations-80-through-3
2. bootstrap-none
3. bootstrap-obligations-70-through-3
4. bootstrap-obligations-80-through-5
5. bootstrap-staged-75
6. bootstrap-staged-60-80
7. bootstrap-obligations-70-through-5
8. bootstrap-obligations-90-through-3
9. bootstrap-obligations-60-through-5
10. bootstrap-emergency-250
11. bootstrap-emergency-500

## Gewählter Bootstrap-Hebel

`bootstrap-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected. 1 of 98 pairs were evaluated, 97 skipped. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 8.52 | 2809.9 | 3501.72 | 1358.59 | 1587.7 | 48.7 | 1.08 | 1.28 | 20.14% | 1.15% | 9.95 |
| control | baseline_touring | 2 | 5.98 | 2466.75 | 2974.59 | 1063.45 | 1434.03 | 53.33 | 0.82 | 1.15 | 38.75% | 16.15% | 9.14 |
| control | baseline_touring | 3 | 5.62 | 2421.51 | 2888.75 | 1031.86 | 1316.58 | 54.62 | 0.78 | 1.08 | 43.04% | 20.38% | 8.87 |
| control | baseline_touring | 4 | 4.58 | 2144.58 | 2596.13 | 870.7 | 1114.58 | 57.5 | 0.64 | 0.91 | 50.74% | 31.92% | 8.28 |
| control | baseline_touring | 5 | 4.43 | 2103.37 | 2489.05 | 925.65 | 1264.78 | 57.42 | 0.65 | 0.94 | 51.28% | 30.77% | 8.33 |
| control | low_resource_touring | 1 | 8.27 | 2776.63 | 3463.55 | 1352.58 | 1526.5 | 49.95 | 1.04 | 1.25 | 20.12% | 5% | 9.68 |
| control | low_resource_touring | 2 | 2.92 | 1778.18 | 2140.08 | 815.39 | 633.9 | 63.24 | 0.4 | 0.49 | 62.59% | 61.54% | 5.71 |
| control | low_resource_touring | 3 | 2.48 | 1616.57 | 1939.31 | 726.1 | 574.42 | 64.8 | 0.34 | 0.46 | 66.5% | 66.92% | 5.37 |
| control | low_resource_touring | 4 | 2.43 | 1603.42 | 1976.02 | 703.33 | 608.14 | 65.43 | 0.34 | 0.45 | 66.61% | 65.77% | 5.5 |
| control | low_resource_touring | 5 | 2.22 | 1551.79 | 1825.14 | 661.62 | 574.47 | 65.28 | 0.3 | 0.41 | 68.03% | 68.46% | 5.31 |
| finalTuning | baseline_touring | 1 | 8.52 | 2809.9 | 3501.72 | 1358.59 | 1587.7 | 48.7 | 1.08 | 1.28 | 20.14% | 1.15% | 9.95 |
| finalTuning | baseline_touring | 2 | 5.98 | 2466.75 | 2974.59 | 1063.45 | 1434.03 | 53.33 | 0.82 | 1.15 | 38.75% | 16.15% | 9.14 |
| finalTuning | baseline_touring | 3 | 5.62 | 2421.51 | 2888.75 | 1031.86 | 1316.58 | 54.62 | 0.78 | 1.08 | 43.04% | 20.38% | 8.87 |
| finalTuning | baseline_touring | 4 | 4.58 | 2144.58 | 2596.13 | 870.7 | 1114.58 | 57.5 | 0.64 | 0.91 | 50.74% | 31.92% | 8.28 |
| finalTuning | baseline_touring | 5 | 4.43 | 2103.37 | 2489.05 | 925.65 | 1264.78 | 57.42 | 0.65 | 0.94 | 51.28% | 30.77% | 8.33 |
| finalTuning | low_resource_touring | 1 | 8.27 | 2776.63 | 3463.55 | 1352.58 | 1526.5 | 49.95 | 1.04 | 1.25 | 20.12% | 5% | 9.68 |
| finalTuning | low_resource_touring | 2 | 2.92 | 1778.18 | 2140.08 | 815.39 | 633.9 | 63.24 | 0.4 | 0.49 | 62.59% | 61.54% | 5.71 |
| finalTuning | low_resource_touring | 3 | 2.48 | 1616.57 | 1939.31 | 726.1 | 574.42 | 64.8 | 0.34 | 0.46 | 66.5% | 66.92% | 5.37 |
| finalTuning | low_resource_touring | 4 | 2.43 | 1603.42 | 1976.02 | 703.33 | 608.14 | 65.43 | 0.34 | 0.45 | 66.61% | 65.77% | 5.5 |
| finalTuning | low_resource_touring | 5 | 2.22 | 1551.79 | 1825.14 | 661.62 | 574.47 | 65.28 | 0.3 | 0.41 | 68.03% | 68.46% | 5.31 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":13.91,"famePerDayAdvantagePct":27.75,"harmonyDelta":-4.63,"repairsDelta":0.26,"bankruptcyDeltaPct":-15},"low_resource_touring":{"moneyPerDayAdvantagePct":56.15,"famePerDayAdvantagePct":65.88,"harmonyDelta":-13.29,"repairsDelta":0.64,"bankruptcyDeltaPct":-56.54}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":13.91,"famePerDayAdvantagePct":27.75,"harmonyDelta":-4.63,"repairsDelta":0.26,"bankruptcyDeltaPct":-15},"low_resource_touring":{"moneyPerDayAdvantagePct":56.15,"famePerDayAdvantagePct":65.88,"harmonyDelta":-13.29,"repairsDelta":0.64,"bankruptcyDeltaPct":-56.54}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 13.91% | 13.91% | 0 pp | No |
| low_resource_touring | 56.15% | 56.15% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 13.91% is below the 20-25% target (was 13.91%)
- low_resource_touring money-per-day advantage 56.15% is above the 20-25% target (was 56.15%)

The two profiles miss the 20-25% target band in OPPOSITE directions (baseline_touring money-per-day advantage 13.91% is below the 20-25% target (was 13.91%); low_resource_touring money-per-day advantage 56.15% is above the 20-25% target (was 56.15%)). No single late-game dampener can serve both: the same lever that pulls the resource-constrained profile down would push the well-funded one further below the band. This is a target-definition question, not a tuning one.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -1.26% | -1.56% | -0.31% | 0 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -2.87% | -1.59% | -0.52% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -1.52% | -1.73% | -0.31% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -2.87% | -2.82% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -4.69% | -3.56% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -5.65% | -4.27% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -5.74% | -5.43% | 0% | 0 pp | 0 | Pass |
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
4. touring-demand-7.5-25-window-3
5. touring-demand-10-40-after-3-window-3
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
| baseline_touring | passed | passed | 3.08% | 3.08% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 30.38% | 30.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 10.77% | 10.77% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 25% | 25% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 25.77% | 25.77% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 13.46% | 13.46% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 10.38% | 10.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 13.46% | 13.46% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 28.85% | 28.85% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 12.31% | 12.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 2.31% | 2.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
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
