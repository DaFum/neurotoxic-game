# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 22100 simulation runs in 38760 ms.

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

`bootstrap-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that clears BOTH blocking gates — the paired calibration validation and the hard holdout insolvency caps. The remaining pairs carry higher impact and so could not have been selected. A pair rejected by the holdout gate skips the paired comparison, so its calibration verdict is reported as not measured rather than as a pass. Of 154 available pairs, 1 were evaluated on the `selection` stream (0 rejected by the hard caps, 0 by the calibration gate, 1 clearing both) and 153 were never reached, because the search stops at the first pair that clears both gates and every remaining pair carries higher impact. The reserved `validation` stream is measured once, on that pair alone. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 8.6 | 2846.88 | 3537.59 | 1388.1 | 1605.46 | 49.81 | 1.31 | 1.29 | 16.7% | 0.77% | 9.98 |
| control | baseline_touring | 2 | 6.01 | 2460.01 | 3005.09 | 1075.71 | 1437.02 | 54.79 | 1.09 | 1.08 | 40.26% | 16.54% | 9.13 |
| control | baseline_touring | 3 | 5.37 | 2354.4 | 2820.62 | 1014.3 | 1266.12 | 55.48 | 0.99 | 0.97 | 45.12% | 24.62% | 8.65 |
| control | baseline_touring | 4 | 4.59 | 2119.09 | 2539.53 | 886.78 | 1168.18 | 57.6 | 0.88 | 0.91 | 53.21% | 32.31% | 8.34 |
| control | baseline_touring | 5 | 4.77 | 2182.09 | 2599.42 | 913.45 | 1230.34 | 56.71 | 0.93 | 0.93 | 48.34% | 27.69% | 8.51 |
| control | low_resource_touring | 1 | 8.3 | 2786.17 | 3467.37 | 1331.37 | 1510.28 | 49.41 | 1.27 | 1.25 | 19.86% | 3.85% | 9.74 |
| control | low_resource_touring | 2 | 2.91 | 1747.87 | 2189.23 | 794.96 | 611.04 | 64.25 | 0.49 | 0.52 | 63.36% | 61.92% | 5.7 |
| control | low_resource_touring | 3 | 2.48 | 1643.06 | 1988.07 | 733.91 | 582.69 | 65.04 | 0.43 | 0.43 | 66.43% | 66.54% | 5.4 |
| control | low_resource_touring | 4 | 2.48 | 1639.63 | 2031.91 | 706.69 | 611.83 | 64.59 | 0.44 | 0.45 | 66.32% | 64.62% | 5.55 |
| control | low_resource_touring | 5 | 2.23 | 1522.84 | 1832.36 | 681.08 | 588.46 | 65.76 | 0.43 | 0.42 | 68.04% | 68.46% | 5.3 |
| finalTuning | baseline_touring | 1 | 8.6 | 2846.88 | 3537.59 | 1388.1 | 1605.46 | 49.81 | 1.31 | 1.29 | 16.7% | 0.77% | 9.98 |
| finalTuning | baseline_touring | 2 | 6.01 | 2460.01 | 3005.09 | 1075.71 | 1437.02 | 54.79 | 1.09 | 1.08 | 40.26% | 16.54% | 9.13 |
| finalTuning | baseline_touring | 3 | 5.37 | 2354.4 | 2820.62 | 1014.3 | 1266.12 | 55.48 | 0.99 | 0.97 | 45.12% | 24.62% | 8.65 |
| finalTuning | baseline_touring | 4 | 4.59 | 2119.09 | 2539.53 | 886.78 | 1168.18 | 57.6 | 0.88 | 0.91 | 53.21% | 32.31% | 8.34 |
| finalTuning | baseline_touring | 5 | 4.77 | 2182.09 | 2599.42 | 913.45 | 1230.34 | 56.71 | 0.93 | 0.93 | 48.34% | 27.69% | 8.51 |
| finalTuning | low_resource_touring | 1 | 8.3 | 2786.17 | 3467.37 | 1331.37 | 1510.28 | 49.41 | 1.27 | 1.25 | 19.86% | 3.85% | 9.74 |
| finalTuning | low_resource_touring | 2 | 2.91 | 1747.87 | 2189.23 | 794.96 | 611.04 | 64.25 | 0.49 | 0.52 | 63.36% | 61.92% | 5.7 |
| finalTuning | low_resource_touring | 3 | 2.48 | 1643.06 | 1988.07 | 733.91 | 582.69 | 65.04 | 0.43 | 0.43 | 66.43% | 66.54% | 5.4 |
| finalTuning | low_resource_touring | 4 | 2.48 | 1639.63 | 2031.91 | 706.69 | 611.83 | 64.59 | 0.44 | 0.45 | 66.32% | 64.62% | 5.55 |
| finalTuning | low_resource_touring | 5 | 2.23 | 1522.84 | 1832.36 | 681.08 | 588.46 | 65.76 | 0.43 | 0.42 | 68.04% | 68.46% | 5.3 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":15.73,"famePerDayAdvantagePct":29.04,"harmonyDelta":-4.98,"repairsDelta":0.22,"bankruptcyDeltaPct":-15.77},"low_resource_touring":{"moneyPerDayAdvantagePct":59.4,"famePerDayAdvantagePct":67.48,"harmonyDelta":-14.84,"repairsDelta":0.78,"bankruptcyDeltaPct":-58.07}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":15.73,"famePerDayAdvantagePct":29.04,"harmonyDelta":-4.98,"repairsDelta":0.22,"bankruptcyDeltaPct":-15.77},"low_resource_touring":{"moneyPerDayAdvantagePct":59.4,"famePerDayAdvantagePct":67.48,"harmonyDelta":-14.84,"repairsDelta":0.78,"bankruptcyDeltaPct":-58.07}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 15.73% | 15.73% | 0 pp | No |
| low_resource_touring | 59.4% | 59.4% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 15.73% is below the 20-25% target (was 15.73%)
- low_resource_touring money-per-day advantage 59.4% is above the 20-25% target (was 59.4%)

The two profiles miss the 20-25% target band in OPPOSITE directions (baseline_touring money-per-day advantage 15.73% is below the 20-25% target (was 15.73%); low_resource_touring money-per-day advantage 59.4% is above the 20-25% target (was 59.4%)). No single late-game dampener can serve both: the same lever that pulls the resource-constrained profile down would push the well-funded one further below the band. This is a target-definition question, not a tuning one.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -1.52% | -1.84% | 0% | 0 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -2.28% | -1.57% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -2.13% | -1.84% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -3.09% | -2.18% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -3.58% | -2.18% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -4.55% | -2.93% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -5.56% | -3.69% | 0% | 0 pp | 0 | Pass |
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

`touring-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that clears BOTH blocking gates — the paired calibration validation and the hard holdout insolvency caps. The remaining pairs carry higher impact and so could not have been selected. A pair rejected by the holdout gate skips the paired comparison, so its calibration verdict is reported as not measured rather than as a pass. Of 154 available pairs, 1 were evaluated on the `selection` stream (0 rejected by the hard caps, 0 by the calibration gate, 1 clearing both) and 153 were never reached, because the search stops at the first pair that clears both gates and every remaining pair carries higher impact. The reserved `validation` stream is measured once, on that pair alone. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 2.69% | 2.69% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 30.38% | 30.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 10% | 10% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 26.54% | 26.54% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 27.31% | 27.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 13.46% | 13.46% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 10.38% | 10.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 12.31% | 12.31% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 31.92% | 31.92% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 15.77% | 15.77% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 2.69% | 2.69% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| late_game_probe | not_evaluated | not_evaluated | 0.38% | 0.38% | 0 pp | 0 | 0% | 0 | 0 | Pass |

Kalibrierungs-Gate: **PASS**. Bootstrap Struggle bankruptcy must remain <= 60%. Dies ist nur das erste von zwei blockierenden Gates — das Gesamturteil steht unter „Release-Gesamtstatus“.

### Harte Sicherheitsgrenzen auf dem Holdout-Strom

Drei disjunkte Seed-Ströme, mit getrennten Aufgaben: `calibration` trägt den gepaarten Vergleich, `selection` trägt die Kandidatensuche gegen die harten `KPI_TARGETS.bankruptcyMax`-Obergrenzen, und `validation` wird **genau einmal** gemessen — auf der Kombination, die die Suche bereits gewählt hat. Ein Strom, auf dem bis zu 154 Kandidaten ausprobiert werden, kann nicht gleichzeitig belegen, dass der Gewinner generalisiert; deshalb entscheidet die Suche auf `selection` und `validation` bleibt unberührt.

Suchstrom-Gate (`selection`, nicht der Unabhängigkeitsbeleg): **PASS**

Holdout-Sicherheitsgate: **FAIL** — `cult_hypergrowth` bankruptcyRate 13.85% > 12% (n=260)

| Szenario | Holdout-Insolvenz | harte Grenze | Status |
|---|---:|---:|---|
| baseline_touring | 1.15% (3/260) | 10% | bestanden |
| cult_hypergrowth | 13.85% (36/260) | 12% | überschritten |
| aggressive_marketing | 11.92% (31/260) | 15% | bestanden |
| chaos_tour | 15% (39/260) | 25% | bestanden |
| festival_push | 25.77% (67/260) | 35% | bestanden |
| scandal_recovery | 25.38% (66/260) | 50% | bestanden |
| bootstrap_struggle | 33.46% (87/260) | 60% | bestanden |

#### Designkorridore (nicht blockierend)

Die harten Caps sind Obergrenzen. Ein Hebel kann sie alle bestehen und trotzdem das Risiko entfernen, für das ein Szenario existiert — diese Liste macht "sicherer als beabsichtigt" sichtbar.

| Szenario | Holdout-Insolvenz | Designkorridor | Lage |
|---|---:|---:|---|
| baseline_touring | 1.15% | 1–5% | im Korridor |
| cult_hypergrowth | 13.85% | 2–10% | über Korridor |
| aggressive_marketing | 11.92% | 2–8% | über Korridor |
| chaos_tour | 15% | 8–20% | im Korridor |
| festival_push | 25.77% | 5–15% | über Korridor |
| scandal_recovery | 25.38% | 8–20% | über Korridor |
| bootstrap_struggle | 33.46% | 15–30% | über Korridor |

**Riskanter als beabsichtigt:** `cult_hypergrowth`, `aggressive_marketing`, `festival_push`, `scandal_recovery`, `bootstrap_struggle`.

**Keine Produktionsempfehlung.** Die Messimplementierung ist vollständig, und die Suche hat jede der 1 erreichten Kombinationen gegen dieses Gate geprüft — keine besteht es. Die betroffenen Szenarien müssen neu balanciert werden, bevor eine Empfehlung möglich ist.

### Release-Gesamtstatus

Beide Gates müssen bestehen. Kalibrierung: **PASS** · Holdout-Sicherheit: **FAIL** → Gesamt: **FAIL** (`no-production-recommendation-final-validation-failed`).

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and the early/mid progression checkpoints (days 3 and 5) are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production.

Recommendation: **no-production-recommendation-final-validation-failed**

> **Nicht ausgeliefert.** `BALANCE_RECOMMENDATION_HOLD` in `src/utils/balanceTuning.ts` hält diese Empfehlung zurück, die Produktionswerte bleiben neutral: null

## Fazit

Selection is based on paired deltas, distributions, deterministic bootstrap intervals, transition matrices, and explicit side-effect limits.

| Ergebnis | Status |
|---|---|
| Phase 3B (Bootstrap-Insolvenz) | bestanden |
| Finale Sicherheits-Gates | bestanden |
| Holdout-Sicherheitsgrenzen (harte Caps) | fehlgeschlagen |
| Late-Game-Snowball | nicht verbessert |
| Gap-1-Dominanz im Zielband | nicht gelöst |
| Phase 3C Gesamtstatus | partial |
| Kombinationssuche | fully-validated |
| Produktionskandidat | no-production-recommendation-final-validation-failed |
