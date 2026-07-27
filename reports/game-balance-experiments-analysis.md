# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 20800 simulation runs in 100029 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-obligations-90 | 87.69% | 81.92% | -5.77 pp | 1 | €4650 | -1.3% | Fail |
| bootstrap-obligations-80 | 88.08% | 82.31% | -5.77 pp | 2 | €5063 | -1.76% | Fail |
| bootstrap-obligations-70 | 88.46% | 78.08% | -10.38 pp | 11.5 | €4941 | -4.06% | Fail |
| bootstrap-emergency-250 | 88.08% | 79.23% | -8.85 pp | 2 | €3740 | -4.18% | Fail |
| bootstrap-emergency-500 | 87.31% | 80% | -7.31 pp | 12.5 | €3479 | -4.11% | Fail |
| bootstrap-emergency-750 | 87.31% | 77.69% | -9.62 pp | 15 | €4752.5 | -5.44% | Fail |
| bootstrap-staged-60-80 | 87.69% | 81.15% | -6.54 pp | 8 | €4562 | -3.44% | Fail |
| bootstrap-staged-75 | 86.92% | 81.92% | -5 pp | 1 | €4228 | -3.84% | Fail |
| bootstrap-staged-85 | 87.69% | 82.69% | -5 pp | 1 | €4218 | -2.72% | Fail |
| bootstrap-obligations-50-through-60 | 86.92% | 56.54% | -30.38 pp | 29 | €3983 | 0.86% | Pass |

## Bootstrap-Ranking

1. bootstrap-obligations-50-through-60
2. bootstrap-obligations-70
3. bootstrap-emergency-750
4. bootstrap-emergency-250
5. bootstrap-emergency-500
6. bootstrap-obligations-90
7. bootstrap-staged-60-80
8. bootstrap-obligations-80
9. bootstrap-staged-75
10. bootstrap-staged-85

## Gewählter Bootstrap-Hebel

`bootstrap-obligations-50-through-60` showed the best accepted paired outcome.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Profile | Gig Gap | Gigs | Money/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Bankruptcy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline_touring | 1 | 60.12 | 824.18 | 649.8 | 810.64 | 40.15 | 11.83 | 0% |
| baseline_touring | 2 | 29.49 | 288.98 | 374.65 | 951.92 | 55.5 | 7.65 | 0.38% |
| baseline_touring | 3 | 16.25 | 142.52 | 224.88 | 1000.66 | 53 | 5.48 | 14.62% |
| baseline_touring | 4 | 8.26 | 42.66 | 127.22 | 960.17 | 54.02 | 3.78 | 55.38% |
| baseline_touring | 5 | 5.28 | 20.88 | 89.63 | 913.8 | 53.19 | 2.88 | 77.31% |
| low_resource_touring | 1 | 61.32 | 852.69 | 666.12 | 812.57 | 40.12 | 11.88 | 0.38% |
| low_resource_touring | 2 | 29.34 | 287.16 | 405.1 | 1028.38 | 54.75 | 7.58 | 1.15% |
| low_resource_touring | 3 | 15.58 | 134.82 | 224.94 | 1008.2 | 52.16 | 5.25 | 18.85% |
| low_resource_touring | 4 | 7.92 | 45.96 | 139.48 | 1041.8 | 54.25 | 3.57 | 53.85% |
| low_resource_touring | 5 | 4.4 | 21.67 | 92.34 | 904.94 | 52.79 | 2.23 | 79.62% |

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Day 20 Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-demand-5-15 | -4.71% | -3.78% | -0.95% | 0 pp | 2 | Fail |
| touring-demand-5-20 | -6.61% | -7.04% | -2.78% | 0 pp | 1 | Fail |
| touring-demand-7.5-25 | -7.59% | -8.9% | 2.07% | 0 pp | 1 | Fail |
| touring-demand-10-40-window-10 | -21.24% | -14.83% | -6.09% | 0 pp | 2 | Fail |
| touring-demand-10-40-window-8 | -21.28% | -16.04% | -6.79% | 0 pp | 0.5 | Fail |
| touring-demand-10-40-after-20 | -13.12% | -14.48% | -0.59% | 0 pp | 3.5 | Fail |
| touring-demand-12-45-after-20 | -13.92% | -18.1% | 1.35% | 0 pp | 1 | Pass |
| touring-stress-1 | 2.44% | 0.62% | -0.33% | -0.38 pp | 1 | Fail |
| touring-stress-2 | -5.92% | 0.31% | 0.45% | 0 pp | 1 | Fail |
| touring-stress-1-recovery-90 | -5.23% | -1.94% | -0.84% | 0 pp | 0 | Fail |
| touring-wear-105 | -3.07% | -0.28% | -1.73% | 0 pp | 0 | Fail |
| touring-wear-110 | -3.26% | 1.12% | -1.2% | 0 pp | 0.5 | Fail |
| touring-wear-115 | -3.26% | 1.12% | -1.2% | 0 pp | 0.5 | Fail |

## Late-Game-Ranking

1. touring-demand-12-45-after-20
2. touring-demand-10-40-window-10
3. touring-demand-10-40-window-8
4. touring-demand-10-40-after-20
5. touring-demand-7.5-25
6. touring-demand-5-20
7. touring-stress-2
8. touring-stress-1-recovery-90
9. touring-demand-5-15
10. touring-wear-110
11. touring-wear-115
12. touring-wear-105
13. touring-stress-1

## Gewählter Late-Game-Hebel

`touring-demand-12-45-after-20` had the best snowball-reduction versus side-effect trade-off.

## Kombinierte Validierung

The selected overrides are validated together against original control in the JSON artifact.

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and day-20/day-40 money are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production.

## Fazit

Selection is based on paired deltas, distributions, deterministic bootstrap intervals, transition matrices, and explicit side-effect limits.
