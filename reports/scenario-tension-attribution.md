# Phase 6A-7 Scenario Tension Diagnostics

Generated: 2026-09-03T20:13:14.563Z
Source fingerprint: 657deca419501eab1be193de48a3849e19a1429faca0fb4ff35629f8409f083f; generator fingerprint: 0043b15964dbb6cfef52c7ccfdea2101b93ffee995fac88850a126e589b70687; schema: 1; dirty: true
Cohorts: 2000 runs each; calibration #scenario-tension-attribution-v1; holdout #scenario-tension-attribution-v1#holdout; candidate selection: false.

## Tension matrix

| Scenario | Cohort | Bankruptcy | Before gig | After gig | Ever <€500 | P90 drawdown | Finale completed |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Bootstrap Struggle | Calibration | 9.3% | 1.6% | 7.7% | 18.1% | 74.35% | 88.5% |
| Bootstrap Struggle | Holdout | 8.6% | 0.65% | 7.95% | 19.25% | 68.9% | 88.95% |
| Scandal Recovery | Calibration | 8.1% | 1.1% | 7% | 18.9% | 68.73% | 89% |
| Scandal Recovery | Holdout | 9.45% | 1.15% | 8.3% | 21.4% | 76.75% | 86.85% |
| Festival Push | Calibration | 4.1% | 1.1% | 3% | 10.1% | 56% | 94.5% |
| Festival Push | Holdout | 3.55% | 1% | 2.55% | 9.2% | 52.21% | 95.45% |
| Chaos Tour | Calibration | 5% | 1.35% | 3.65% | 13.1% | 51.41% | 92.05% |
| Chaos Tour | Holdout | 4.35% | 1.15% | 3.2% | 11.6% | 51.45% | 91.4% |

Cohort comparison: **unstable**. Corridor differences are diagnostic, not missing evidence.

## Top actual loss sources (Calibration)

| Scenario | Top 3 |
| --- | --- |
| Bootstrap Struggle | daily_obligations: €3302637; assets_upgrades: €3005076; travel: €1214923 |
| Scandal Recovery | daily_obligations: €3456931; assets_upgrades: €3139254; travel: €1241043 |
| Festival Push | assets_upgrades: €6701600; daily_obligations: €3775806; travel: €1389580 |
| Chaos Tour | assets_upgrades: €4779887; daily_obligations: €3545769; travel: €1332125 |

Gross gig spending is published separately in JSON under `grossSpendAttribution` and never drives drawdown fields.

## Chaos event-loss candidate

Diagnostic only: ×1.25; production change: no; bankruptcy: 4.35%; before first gig: 1.5%; finale completed: 91.7%; paired Fame per gig: -0.12%; material loss sources: assets_upgrades, daily_obligations, travel; acceptance: failed.

## Scandal controversy comparison

| Start controversy | Bankruptcy | Final controversy | Finale completed |
| ---: | ---: | ---: | ---: |
| 0 | 6.15% | 4.87 | 92.65% |
| 50 | 9.85% | 44.42 | 87.05% |
| 65 | 17.6% | 50.49 | 74.4% |
| 80 | 28.05% | 57.76 | 63.7% |

## Progression diagnostics

| Scenario | First purchase day | Catalogue share | Liquidity deferrals | Residual money | HQ/Van/Module payback evidence |
| --- | ---: | ---: | ---: | ---: | --- |
| Bootstrap Struggle | 1 | 34.98% | 0.12 | €3868.9 | 2.74/null/— |
| Scandal Recovery | 1 | 35.18% | 0.14 | €4007.28 | 2.64/null/— |
| Festival Push | 1 | 36.45% | 0.11 | €5329.23 | 2.07/null/— |
| Chaos Tour | 1 | 35.86% | 0.1 | €4809.81 | 2.37/null/— |

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
