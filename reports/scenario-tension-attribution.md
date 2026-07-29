# Phase 6A-7 Scenario Tension Diagnostics

Generated: 2026-07-29T17:35:00.073Z
Source: 4a0b40ebbb3d58f14990f463168ca94190e670da; dirty: false
Cohorts: 2000 runs each; calibration #scenario-tension-attribution-v1; holdout #scenario-tension-attribution-v1#holdout; candidate selection: false.

## Tension matrix

| Scenario | Cohort | Bankruptcy | Before gig | After gig | Ever <€500 | P90 drawdown | Finale completed |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Bootstrap Struggle | Calibration | 7.6% | 0.7% | 6.9% | 17.45% | 70.87% | 91.6% |
| Bootstrap Struggle | Holdout | 8.8% | 0.5% | 8.3% | 19.15% | 74.59% | 90.15% |
| Scandal Recovery | Calibration | 5.45% | 0.4% | 5.05% | 13.45% | 62.74% | 94.05% |
| Scandal Recovery | Holdout | 6.5% | 0.6% | 5.9% | 16.15% | 67.92% | 92.9% |
| Festival Push | Calibration | 3.95% | 0.4% | 3.55% | 11.35% | 60.38% | 95.9% |
| Festival Push | Holdout | 2.65% | 0.45% | 2.2% | 9.4% | 57.44% | 97.25% |
| Chaos Tour | Calibration | 3.45% | 0.7% | 2.75% | 11.45% | 52.79% | 95% |
| Chaos Tour | Holdout | 3.75% | 0.7% | 3.05% | 10.55% | 54.4% | 95.05% |

Cohort comparison: **unstable**. Corridor differences are diagnostic, not missing evidence.

## Top actual loss sources (Calibration)

| Scenario | Top 3 |
| --- | --- |
| Bootstrap Struggle | assets_upgrades: €3696342; daily_obligations: €3446589; travel: €1214969 |
| Scandal Recovery | assets_upgrades: €5292044; daily_obligations: €3645047; travel: €1286739 |
| Festival Push | assets_upgrades: €7446950; daily_obligations: €3948163; travel: €1374116 |
| Chaos Tour | assets_upgrades: €5635288; daily_obligations: €3697945; travel: €1326056 |

Gross gig spending is published separately in JSON under `grossSpendAttribution` and never drives drawdown fields.

## Scandal controversy comparison

| Start controversy | Bankruptcy | Final controversy | Finale completed |
| ---: | ---: | ---: | ---: |
| 0 | 5.85% | 4.93 | 93.75% |
| 50 | 8.6% | 44.51 | 89.8% |
| 65 | 14.15% | 50.8 | 80.95% |
| 80 | 22.2% | 59 | 69.85% |

## Progression diagnostics

| Scenario | First purchase day | Catalogue share | Liquidity deferrals | Residual money | HQ/Van/Module payback evidence |
| --- | ---: | ---: | ---: | ---: | --- |
| Bootstrap Struggle | 1 | 15.03% | 0.25 | €4207.85 | 3.14/0.2/— |
| Scandal Recovery | 1 | 15.21% | 0.22 | €4991.76 | 2.97/0.19/— |
| Festival Push | 1 | 15.5% | 0.2 | €5978.19 | 2.65/0.17/— |
| Chaos Tour | 1 | 15.41% | 0.2 | €5322.46 | 2.96/0.19/— |

## Phase decisions

- **phase6B:** diagnostic_complete; production change: no — Chaos actual-loss attribution is complete; no candidate was selected.
- **phase6C:** diagnostic_complete; production change: no — All controversy profiles are measured; no runtime value changed.
- **phase6D:** boundary_uncertain; production change: no — Bootstrap and Festival evidence is complete; corridor differences remain diagnostic.
- **phase7:** insufficient_evidence; production change: no — Progression requires purchase timing, deferrals, catalogue share, residual money, and HQ/van/module payback.

## Next experiments

- Do not change Bootstrap costs; its tension profile is already material.
- Treat Chaos/Festival corridor crossings as boundary uncertainty, not missing data.
- Complete module payback evidence before any Phase 7 candidate.
- Use actual-loss sources, never gross spend, to choose a Chaos candidate family.
