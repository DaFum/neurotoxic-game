# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 71240 simulation runs in 142902 ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 30.38% | 30.38% | 0 pp | 0 | €24073 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 30.38% | 29.62% | -0.77 pp | 0 | €24214 | -1.87% | Pass |
| bootstrap-obligations-80-through-3 | 30.38% | 27.69% | -2.69 pp | 0 | €23935 | -2.86% | Pass |
| bootstrap-obligations-70-through-3 | 30.38% | 27.31% | -3.08 pp | 0 | €24135 | -3.72% | Pass |
| bootstrap-obligations-80-through-5 | 30.38% | 26.54% | -3.85 pp | 0 | €24002 | -3.27% | Pass |
| bootstrap-obligations-70-through-5 | 30.38% | 24.23% | -6.15 pp | 0 | €24221 | -3.65% | Pass |
| bootstrap-obligations-60-through-5 | 30.38% | 21.54% | -8.85 pp | 0 | €24652.5 | -2.48% | Pass |
| bootstrap-emergency-250 | 30.38% | 7.69% | -22.69 pp | 0 | €23757.5 | -0.4% | Pass |
| bootstrap-emergency-500 | 30.38% | 4.62% | -25.77 pp | 0 | €23920 | -0.64% | Pass |
| bootstrap-staged-60-80 | 30.38% | 23.46% | -6.92 pp | 0 | €24202 | -3.97% | Pass |
| bootstrap-staged-75 | 30.38% | 26.15% | -4.23 pp | 0 | €24028 | -3.76% | Pass |

## Bootstrap-Ranking

1. bootstrap-none
2. bootstrap-obligations-90-through-3
3. bootstrap-obligations-80-through-3
4. bootstrap-obligations-70-through-3
5. bootstrap-obligations-80-through-5
6. bootstrap-staged-75
7. bootstrap-obligations-70-through-5
8. bootstrap-staged-60-80
9. bootstrap-obligations-60-through-5
10. bootstrap-emergency-250
11. bootstrap-emergency-500

## Gewählter Bootstrap-Hebel

`bootstrap-emergency-250` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that clears BOTH blocking gates — the paired calibration validation and the hard holdout insolvency caps. The remaining pairs carry higher impact and so could not have been selected. A pair rejected by the holdout gate skips the paired comparison, so its calibration verdict is reported as not measured rather than as a pass. 54 of 154 pairs were evaluated, 100 skipped (53 rejected by the holdout gate, 0 by the calibration gate).

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 8.63 | 2850.39 | 3541.31 | 1389.05 | 1611.4 | 49.7 | 1.31 | 1.3 | 16.64% | 0.38% | 10 |
| control | baseline_touring | 2 | 6.71 | 2522.39 | 3089.79 | 1106.8 | 1608.25 | 51.93 | 1.25 | 1.23 | 38.02% | 3.85% | 9.88 |
| control | baseline_touring | 3 | 6.49 | 2498.09 | 2988.33 | 1079.19 | 1598.11 | 51.27 | 1.23 | 1.27 | 41.24% | 4.23% | 9.87 |
| control | baseline_touring | 4 | 5.81 | 2329.6 | 2816.64 | 989.49 | 1593.36 | 54.17 | 1.18 | 1.23 | 48.78% | 9.62% | 9.66 |
| control | baseline_touring | 5 | 5.52 | 2267.16 | 2695.96 | 939.83 | 1451.75 | 53.19 | 1.12 | 1.11 | 45.52% | 13.08% | 9.52 |
| control | low_resource_touring | 1 | 8.5 | 2785.31 | 3486.63 | 1336.33 | 1559.61 | 49 | 1.3 | 1.28 | 19.1% | 1.15% | 9.95 |
| control | low_resource_touring | 2 | 6.37 | 2467.35 | 3001.29 | 1078.68 | 1499.48 | 51.45 | 1.17 | 1.22 | 46.11% | 9.23% | 9.54 |
| control | low_resource_touring | 3 | 5.7 | 2394.63 | 2847.85 | 987.7 | 1357.26 | 52.52 | 1.07 | 1.1 | 49.55% | 17.31% | 9.13 |
| control | low_resource_touring | 4 | 5.26 | 2278.71 | 2750.97 | 946.07 | 1347.57 | 53.32 | 1 | 1 | 51.85% | 20.38% | 9.02 |
| control | low_resource_touring | 5 | 4.95 | 2199.59 | 2613.37 | 907.42 | 1281.28 | 55.17 | 1.01 | 0.99 | 53.67% | 24.23% | 8.78 |
| finalTuning | baseline_touring | 1 | 8.63 | 2850.39 | 3541.31 | 1389.05 | 1611.4 | 49.7 | 1.31 | 1.3 | 16.64% | 0.38% | 10 |
| finalTuning | baseline_touring | 2 | 6.71 | 2522.39 | 3089.79 | 1106.8 | 1608.25 | 51.93 | 1.25 | 1.23 | 38.02% | 3.85% | 9.88 |
| finalTuning | baseline_touring | 3 | 6.49 | 2498.09 | 2988.33 | 1079.19 | 1598.11 | 51.27 | 1.23 | 1.27 | 41.24% | 4.23% | 9.87 |
| finalTuning | baseline_touring | 4 | 5.81 | 2329.6 | 2816.64 | 989.49 | 1593.36 | 54.17 | 1.18 | 1.23 | 48.78% | 9.62% | 9.66 |
| finalTuning | baseline_touring | 5 | 5.52 | 2267.16 | 2695.96 | 939.83 | 1451.75 | 53.19 | 1.12 | 1.11 | 45.52% | 13.08% | 9.52 |
| finalTuning | low_resource_touring | 1 | 8.5 | 2785.31 | 3486.63 | 1336.33 | 1559.61 | 49 | 1.3 | 1.28 | 19.1% | 1.15% | 9.95 |
| finalTuning | low_resource_touring | 2 | 6.37 | 2467.35 | 3001.29 | 1078.68 | 1499.48 | 51.45 | 1.17 | 1.22 | 46.11% | 9.23% | 9.54 |
| finalTuning | low_resource_touring | 3 | 5.7 | 2394.63 | 2847.85 | 987.7 | 1357.26 | 52.52 | 1.07 | 1.1 | 49.55% | 17.31% | 9.13 |
| finalTuning | low_resource_touring | 4 | 5.26 | 2278.71 | 2750.97 | 946.07 | 1347.57 | 53.32 | 1 | 1 | 51.85% | 20.38% | 9.02 |
| finalTuning | low_resource_touring | 5 | 4.95 | 2199.59 | 2613.37 | 907.42 | 1281.28 | 55.17 | 1.01 | 0.99 | 53.67% | 24.23% | 8.78 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":13,"famePerDayAdvantagePct":25.5,"harmonyDelta":-2.23,"repairsDelta":0.06,"bankruptcyDeltaPct":-3.47},"low_resource_touring":{"moneyPerDayAdvantagePct":12.89,"famePerDayAdvantagePct":23.89,"harmonyDelta":-2.45,"repairsDelta":0.13,"bankruptcyDeltaPct":-8.08}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":13,"famePerDayAdvantagePct":25.5,"harmonyDelta":-2.23,"repairsDelta":0.06,"bankruptcyDeltaPct":-3.47},"low_resource_touring":{"moneyPerDayAdvantagePct":12.89,"famePerDayAdvantagePct":23.89,"harmonyDelta":-2.45,"repairsDelta":0.13,"bankruptcyDeltaPct":-8.08}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 13% | 13% | 0 pp | No |
| low_resource_touring | 12.89% | 12.89% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 13% is below the 20-25% target (was 13%)
- low_resource_touring money-per-day advantage 12.89% is below the 20-25% target (was 12.89%)

Gap-1 money-per-day advantage now sits BELOW the 20-25% target band (baseline_touring money-per-day advantage 13% is below the 20-25% target (was 13%); low_resource_touring money-per-day advantage 12.89% is below the 20-25% target (was 12.89%)). No dampener is warranted — a lever here would push dense touring below paced touring. The target band was set when the simulator gated travel on the gig cadence, which made the advantage look far larger than it is; the band itself is what wants revisiting.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -1.49% | -1.58% | 0% | 0 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -2.27% | -1.4% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -1.99% | -1.58% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -3.07% | -2.24% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -3.76% | -2.24% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -4.5% | -2.99% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -5.48% | -3.76% | 0% | 0 pp | 0 | Pass |
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

`touring-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that clears BOTH blocking gates — the paired calibration validation and the hard holdout insolvency caps. The remaining pairs carry higher impact and so could not have been selected. A pair rejected by the holdout gate skips the paired comparison, so its calibration verdict is reported as not measured rather than as a pass. 54 of 154 pairs were evaluated, 100 skipped (53 rejected by the holdout gate, 0 by the calibration gate).

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 2.69% | 0.77% | -1.92 pp | 0 | 0.04% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 30.38% | 7.69% | -22.69 pp | 0 | -0.4% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 10% | 3.46% | -6.54 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 26.54% | 8.46% | -18.08 pp | 0 | -0.13% | 0 | 0 | Pass |
| festival_push | passed | passed | 27.31% | 5% | -22.31 pp | 0 | -0.11% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 13.46% | 5.38% | -8.08 pp | 0 | -0.01% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 10.38% | 1.15% | -9.23 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 12.31% | 3.46% | -8.85 pp | 0 | -0.06% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 31.92% | 18.08% | -13.85 pp | 0 | -0.7% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 15.77% | 6.54% | -9.23 pp | 0 | -0.03% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 2.69% | 1.92% | -0.77 pp | 0 | 0% | 0 | 0 | Pass |
| late_game_probe | not_evaluated | not_evaluated | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |

Kalibrierungs-Gate: **PASS**. Bootstrap Struggle bankruptcy must remain <= 60%. Dies ist nur das erste von zwei blockierenden Gates — das Gesamturteil steht unter „Release-Gesamtstatus“.

### Harte Sicherheitsgrenzen auf dem Holdout-Strom

Zweites blockierendes Gate: die ausgelieferte Tuning-Variante wird auf einem disjunkten Seed-Strom gegen die harten `KPI_TARGETS.bankruptcyMax`-Obergrenzen geprüft. Der gepaarte Vergleich oben läuft auf dem Kalibrierungsstrom und kann eine Überschreitung, die nur auf unabhängigen Seeds auftritt, nicht sehen.

Holdout-Sicherheitsgate: **PASS**

| Szenario | Holdout-Insolvenz | harte Grenze | Status |
|---|---:|---:|---|
| baseline_touring | 0.38% (1/260) | 10% | bestanden |
| cult_hypergrowth | 2.69% (7/260) | 12% | bestanden |
| aggressive_marketing | 3.08% (8/260) | 15% | bestanden |
| chaos_tour | 4.23% (11/260) | 25% | bestanden |
| festival_push | 6.54% (17/260) | 35% | bestanden |
| scandal_recovery | 5% (13/260) | 50% | bestanden |
| bootstrap_struggle | 8.08% (21/260) | 60% | bestanden |

#### Designkorridore (nicht blockierend)

Die harten Caps sind Obergrenzen. Ein Hebel kann sie alle bestehen und trotzdem das Risiko entfernen, für das ein Szenario existiert — diese Liste macht "sicherer als beabsichtigt" sichtbar.

| Szenario | Holdout-Insolvenz | Designkorridor | Lage |
|---|---:|---:|---|
| baseline_touring | 0.38% | 1–5% | unter Korridor |
| cult_hypergrowth | 2.69% | 2–10% | im Korridor |
| aggressive_marketing | 3.08% | 2–8% | im Korridor |
| chaos_tour | 4.23% | 8–20% | unter Korridor |
| festival_push | 6.54% | 5–15% | im Korridor |
| scandal_recovery | 5% | 8–20% | unter Korridor |
| bootstrap_struggle | 8.08% | 15–30% | unter Korridor |

**Sicherer als beabsichtigt:** `baseline_touring`, `chaos_tour`, `scandal_recovery`, `bootstrap_struggle`. Die harten Caps sind bestanden, aber diese Szenarien erzeugen nicht mehr das Risiko, für das sie existieren. Kein Gate prüft die Untergrenze — diese Entscheidung liegt beim Design.



### Release-Gesamtstatus

Beide Gates müssen bestehen. Kalibrierung: **PASS** · Holdout-Sicherheit: **PASS** → Gesamt: **PASS** (`accepted-for-production-partial`).

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
| Holdout-Sicherheitsgrenzen (harte Caps) | bestanden |
| Late-Game-Snowball | nicht verbessert |
| Gap-1-Dominanz im Zielband | nicht gelöst |
| Phase 3C Gesamtstatus | partial |
| Kombinationssuche | fully-validated |
| Produktionskandidat | accepted-for-production-partial |
