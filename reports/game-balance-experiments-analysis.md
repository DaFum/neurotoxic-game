# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 15340 simulation runs in 84982 ms.

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

## Bootstrap-Ranking

1. bootstrap-obligations-50-through-60
2. bootstrap-obligations-70
3. bootstrap-emergency-750
4. bootstrap-emergency-500
5. bootstrap-emergency-250
6. bootstrap-obligations-80
7. bootstrap-staged-60-80
8. bootstrap-staged-75
9. bootstrap-obligations-90
10. bootstrap-staged-85

## Gewählter Bootstrap-Hebel

`bootstrap-obligations-50-through-60` showed the best accepted paired outcome.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Profile | Gig Gap | Gigs | Money/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Bankruptcy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline_touring | 1 | 60.57 | 846.97 | 665.68 | 824.34 | 39.41 | 11.88 | 0% |
| baseline_touring | 2 | 29.52 | 295.48 | 380.35 | 966.23 | 54.02 | 7.64 | 0% |
| baseline_touring | 3 | 16.19 | 136.17 | 215.37 | 971.53 | 51.63 | 5.49 | 11.92% |
| baseline_touring | 4 | 8.6 | 48.88 | 133.63 | 978.14 | 54.47 | 3.88 | 51.15% |
| baseline_touring | 5 | 5.22 | 22.1 | 87.94 | 908.84 | 53.23 | 2.87 | 75.77% |
| low_resource_touring | 1 | 61.3 | 852.85 | 664.34 | 812.87 | 37.59 | 11.95 | 0% |
| low_resource_touring | 2 | 29.55 | 297.72 | 416.96 | 1054.93 | 54.88 | 7.65 | 0.77% |
| low_resource_touring | 3 | 15.28 | 128.79 | 218.84 | 1005.02 | 52.36 | 5.25 | 18.08% |
| low_resource_touring | 4 | 8.05 | 45.73 | 136.28 | 1004.53 | 54.23 | 3.6 | 53.08% |
| low_resource_touring | 5 | 4.41 | 18.71 | 87.31 | 884.23 | 52.95 | 2.27 | 80.38% |

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Day 20 Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-demand-5-15 | -2.56% | -4.44% | 6.06% | 0 pp | 0 | Fail |
| touring-demand-5-20 | -2.6% | -2.77% | 4.73% | 0.38 pp | 1 | Fail |
| touring-demand-7.5-25 | -3.25% | -7.52% | -0.5% | 0 pp | 1 | Fail |
| touring-demand-10-40-window-10 | -19.63% | -18.36% | -0.08% | 0 pp | 0 | Pass |
| touring-demand-10-40-window-8 | -16.45% | -18.92% | -2.67% | 0.38 pp | 1 | Fail |
| touring-demand-10-40-after-20 | -13.41% | -12.58% | 4.44% | 0 pp | 0 | Fail |
| touring-demand-12-45-after-20 | -20.39% | -17.82% | 6.45% | 0.38 pp | -1 | Fail |
| touring-stress-1 | 7.26% | 0.61% | 4.19% | 0 pp | 0 | Fail |
| touring-stress-2 | 3.69% | -1.87% | 3.31% | 0 pp | 1 | Fail |
| touring-stress-1-recovery-90 | 2.28% | -3.66% | 5.77% | 0.38 pp | 2 | Fail |
| touring-wear-105 | 5.85% | 2.24% | 2.96% | 0.38 pp | 1 | Fail |
| touring-wear-110 | 5.03% | 0.47% | 2.96% | 0 pp | 2 | Fail |
| touring-wear-115 | 4.87% | 4.38% | 2.05% | 0 pp | 0 | Fail |

## Late-Game-Ranking

1. touring-demand-10-40-window-10
2. touring-demand-10-40-window-8
3. touring-demand-12-45-after-20
4. touring-demand-10-40-after-20
5. touring-demand-7.5-25
6. touring-demand-5-20
7. touring-demand-5-15
8. touring-stress-1-recovery-90
9. touring-stress-2
10. touring-wear-115
11. touring-wear-110
12. touring-wear-105
13. touring-stress-1

## Gewählter Late-Game-Hebel

`touring-demand-10-40-window-10` had the best snowball-reduction versus side-effect trade-off.

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
