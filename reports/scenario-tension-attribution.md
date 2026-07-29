# Phase 6A-7 Scenario Tension Diagnostics

Generated: 2026-07-29T20:19:12.275Z
Source fingerprint: b20e1fa859f14c745572b3f5373100fe76b31011ce2e4059b3c8d38fabe0985b; generator fingerprint: 4b35acc1774f2fe53d8013e08e09af7504aeaac7bc4fc00f93dc38011f0f5c94; schema: 1; dirty: false
Cohorts: 2000 runs each; calibration #scenario-tension-attribution-v1; holdout #scenario-tension-attribution-v1#holdout; candidate selection: false.

## Tension matrix

| Scenario | Cohort | Bankruptcy | Before gig | After gig | Ever <€500 | P90 drawdown | Finale completed |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Bootstrap Struggle | Calibration | 7.6% | 0.7% | 6.9% | 17.45% | 70.87% | 91.6% |
| Bootstrap Struggle | Holdout | 8.8% | 0.5% | 8.3% | 19.15% | 74.59% | 90.15% |
| Scandal Recovery | Calibration | 7.35% | 0.4% | 6.95% | 17.65% | 67.34% | 91.25% |
| Scandal Recovery | Holdout | 8.55% | 0.6% | 7.95% | 20.5% | 76.25% | 89.7% |
| Festival Push | Calibration | 3.95% | 0.4% | 3.55% | 11.35% | 60.38% | 95.9% |
| Festival Push | Holdout | 2.65% | 0.45% | 2.2% | 9.4% | 57.44% | 97.25% |
| Chaos Tour | Calibration | 3.45% | 0.7% | 2.75% | 11.45% | 52.79% | 95% |
| Chaos Tour | Holdout | 3.75% | 0.7% | 3.05% | 10.55% | 54.4% | 95.05% |

Cohort comparison: **unstable**. Corridor differences are diagnostic, not missing evidence.

## Top actual loss sources (Calibration)

| Scenario | Top 3 |
| --- | --- |
| Bootstrap Struggle | assets_upgrades: €3696342; daily_obligations: €3446589; travel: €1214969 |
| Scandal Recovery | assets_upgrades: €4212393; daily_obligations: €3546300; travel: €1228352 |
| Festival Push | assets_upgrades: €7446950; daily_obligations: €3948163; travel: €1374116 |
| Chaos Tour | assets_upgrades: €5635288; daily_obligations: €3697945; travel: €1326056 |

Gross gig spending is published separately in JSON under `grossSpendAttribution` and never drives drawdown fields.

## Chaos event-loss candidate

Diagnostic only: ×1.25; production change: no; bankruptcy: 3.8%; before first gig: 0.85%; finale completed: 94.7%; paired Fame per gig: 0.01%; material loss sources: assets_upgrades, daily_obligations, travel; acceptance: failed.

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
| Scandal Recovery | 1 | 15.04% | 0.27 | €4457.95 | 3.16/0.21/— |
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
