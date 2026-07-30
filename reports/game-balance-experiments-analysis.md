# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 266000 simulation runs in 1210460 ms.

## Alt/Neu-Vergleich der vollständigen Reports

Dieser Vergleich ist **deskriptiv und ungepaart**. Übereinstimmende Kohortenfelder: Runs je Szenario und Seed-Namensraum. Die Source-Fingerprints unterscheiden sich; daraus wird kein gepaarter Effektschätzer abgeleitet.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Fingerprint | `a353b1135aa2c7ab9f1d754a8428e0bab85ca717abe5d343192eb8f821c1def1` | `dc10477b09968a6b557ee1a597cea2457d1f43081e7ceb94a963118af0dfe394` |
| Runs je Szenario | 2000 | 2000 |
| Seed-Namensraum | `#first-income-full-reports-v1` | `#first-income-full-reports-v1` |
| Empfehlung | `accepted-for-production-partial` | `accepted-for-production-partial` |

| Szenario | Insolvenz alt | Insolvenz neu | Delta | Stichprobe alt/neu |
|---|---:|---:|---:|---:|
| `aggressive_marketing` | 2.6% | 2.6% | 0 pp | 2000 / 2000 |
| `baseline_touring` | 1.15% | 1.15% | 0 pp | 2000 / 2000 |
| `bootstrap_struggle` | 8.05% | 8.05% | 0 pp | 2000 / 2000 |
| `chaos_tour` | 3.55% | 3.55% | 0 pp | 2000 / 2000 |
| `cult_hypergrowth` | 2.5% | 2.5% | 0 pp | 2000 / 2000 |
| `festival_push` | 4.25% | 4.25% | 0 pp | 2000 / 2000 |
| `scandal_recovery` | 8.45% | 8.45% | 0 pp | 2000 / 2000 |

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 7.95% | 7.95% | 0 pp | 0 | €24512 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 7.95% | 8.2% | 0.25 pp | 0 | €24430.5 | -0.13% | Fail |
| bootstrap-obligations-80-through-3 | 7.95% | 7.9% | -0.05 pp | 0 | €24592.5 | -0.2% | Pass |
| bootstrap-obligations-70-through-3 | 7.95% | 7.2% | -0.75 pp | 0 | €24628 | -0.14% | Pass |
| bootstrap-obligations-80-through-5 | 7.95% | 7.05% | -0.9 pp | 0 | €24602 | -0.12% | Pass |
| bootstrap-obligations-70-through-5 | 7.95% | 6.25% | -1.7 pp | 0 | €24694 | -0.22% | Pass |
| bootstrap-obligations-60-through-5 | 7.95% | 5.15% | -2.8 pp | 0 | €24744 | -0.44% | Pass |
| bootstrap-emergency-250 | 7.95% | 4.55% | -3.4 pp | 0 | €24385 | -0.1% | Pass |
| bootstrap-emergency-500 | 7.95% | 3.75% | -4.2 pp | 0 | €24385 | -0.24% | Pass |
| bootstrap-staged-60-80 | 7.95% | 6.5% | -1.45 pp | 0 | €24740.5 | -0.25% | Pass |
| bootstrap-staged-75 | 7.95% | 7.25% | -0.7 pp | 0 | €24697 | -0.11% | Pass |

## Bootstrap-Ranking

1. bootstrap-none
2. bootstrap-obligations-80-through-3
3. bootstrap-obligations-70-through-3
4. bootstrap-obligations-80-through-5
5. bootstrap-staged-75
6. bootstrap-obligations-70-through-5
7. bootstrap-staged-60-80
8. bootstrap-obligations-60-through-5
9. bootstrap-emergency-250
10. bootstrap-emergency-500
11. bootstrap-obligations-90-through-3

## Gewählter Bootstrap-Hebel

`bootstrap-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that clears BOTH blocking gates — the paired calibration validation and the hard holdout insolvency caps. The remaining pairs carry higher impact and so could not have been selected. A pair rejected by the holdout gate skips the paired comparison, so its calibration verdict is reported as not measured rather than as a pass. Of 140 available pairs, 1 were evaluated on the `selection` stream (0 rejected by the hard caps, 0 by the calibration gate, 1 clearing both) and 139 were never reached, because the search stops at the first pair that clears both gates and every remaining pair carries higher impact. The reserved `validation` stream is measured once, on that pair alone. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| control | baseline_touring | 1 | 8.46 | 2770.78 | 3450.79 | 1363.84 | 1595.72 | 50.34 | 1.27 | 1.25 | 18.72% | 1.45% | 9.93 |
| control | baseline_touring | 2 | 7.38 | 2683.38 | 3250.19 | 1204.25 | 1605.06 | 51.61 | 1.26 | 1.25 | 24.41% | 3.1% | 9.86 |
| control | baseline_touring | 3 | 6.73 | 2535.42 | 3046.94 | 1127.37 | 1625.67 | 52.41 | 1.23 | 1.24 | 29.09% | 5.6% | 9.76 |
| control | baseline_touring | 4 | 6.66 | 2514.11 | 3001.92 | 1106.87 | 1624.48 | 51.96 | 1.22 | 1.22 | 30.15% | 6.2% | 9.73 |
| control | baseline_touring | 5 | 6.41 | 2419.03 | 2895.73 | 1080.65 | 1643.59 | 52.89 | 1.2 | 1.23 | 31.59% | 6.85% | 9.74 |
| control | low_resource_touring | 1 | 8.02 | 2691.95 | 3355.1 | 1311.26 | 1486.96 | 50.34 | 1.21 | 1.21 | 21.58% | 7.4% | 9.52 |
| control | low_resource_touring | 2 | 6.91 | 2586.69 | 3142.12 | 1177.61 | 1531.64 | 52.1 | 1.17 | 1.18 | 28.51% | 9.85% | 9.41 |
| control | low_resource_touring | 3 | 6.31 | 2426.85 | 2930.98 | 1091.59 | 1564.21 | 52.92 | 1.15 | 1.16 | 32.81% | 12.3% | 9.33 |
| control | low_resource_touring | 4 | 6.28 | 2424.21 | 2917.87 | 1089.97 | 1557.08 | 52.76 | 1.13 | 1.14 | 33.79% | 13.5% | 9.29 |
| control | low_resource_touring | 5 | 6.01 | 2319.78 | 2795.43 | 1046.41 | 1554.35 | 53.73 | 1.14 | 1.14 | 35.26% | 14.35% | 9.25 |
| finalTuning | baseline_touring | 1 | 8.46 | 2770.78 | 3450.79 | 1363.84 | 1595.72 | 50.34 | 1.27 | 1.25 | 18.72% | 1.45% | 9.93 |
| finalTuning | baseline_touring | 2 | 7.38 | 2683.38 | 3250.19 | 1204.25 | 1605.06 | 51.61 | 1.26 | 1.25 | 24.41% | 3.1% | 9.86 |
| finalTuning | baseline_touring | 3 | 6.73 | 2535.42 | 3046.94 | 1127.37 | 1625.67 | 52.41 | 1.23 | 1.24 | 29.09% | 5.6% | 9.76 |
| finalTuning | baseline_touring | 4 | 6.66 | 2514.11 | 3001.92 | 1106.87 | 1624.48 | 51.96 | 1.22 | 1.22 | 30.15% | 6.2% | 9.73 |
| finalTuning | baseline_touring | 5 | 6.41 | 2419.03 | 2895.73 | 1080.65 | 1643.59 | 52.89 | 1.2 | 1.23 | 31.59% | 6.85% | 9.74 |
| finalTuning | low_resource_touring | 1 | 8.02 | 2691.95 | 3355.1 | 1311.26 | 1486.96 | 50.34 | 1.21 | 1.21 | 21.58% | 7.4% | 9.52 |
| finalTuning | low_resource_touring | 2 | 6.91 | 2586.69 | 3142.12 | 1177.61 | 1531.64 | 52.1 | 1.17 | 1.18 | 28.51% | 9.85% | 9.41 |
| finalTuning | low_resource_touring | 3 | 6.31 | 2426.85 | 2930.98 | 1091.59 | 1564.21 | 52.92 | 1.15 | 1.16 | 32.81% | 12.3% | 9.33 |
| finalTuning | low_resource_touring | 4 | 6.28 | 2424.21 | 2917.87 | 1089.97 | 1557.08 | 52.76 | 1.13 | 1.14 | 33.79% | 13.5% | 9.29 |
| finalTuning | low_resource_touring | 5 | 6.01 | 2319.78 | 2795.43 | 1046.41 | 1554.35 | 53.73 | 1.14 | 1.14 | 35.26% | 14.35% | 9.25 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":3.26,"famePerDayAdvantagePct":13.25,"harmonyDelta":-1.27,"repairsDelta":0.01,"bankruptcyDeltaPct":-1.65},"low_resource_touring":{"moneyPerDayAdvantagePct":4.07,"famePerDayAdvantagePct":11.35,"harmonyDelta":-1.76,"repairsDelta":0.04,"bankruptcyDeltaPct":-2.45}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":3.26,"famePerDayAdvantagePct":13.25,"harmonyDelta":-1.27,"repairsDelta":0.01,"bankruptcyDeltaPct":-1.65},"low_resource_touring":{"moneyPerDayAdvantagePct":4.07,"famePerDayAdvantagePct":11.35,"harmonyDelta":-1.76,"repairsDelta":0.04,"bankruptcyDeltaPct":-2.45}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 3.26% | 3.26% | 0 pp | No |
| low_resource_touring | 4.07% | 4.07% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 3.26% is below the 20-25% target (was 3.26%)
- low_resource_touring money-per-day advantage 4.07% is below the 20-25% target (was 4.07%)

Gap-1 money-per-day advantage now sits BELOW the 20-25% target band. No dampener is warranted — a lever here would push dense touring below paced touring. The target band was set when the simulator gated travel on the gig cadence, which made the advantage look far larger than it is; the band itself is what wants revisiting.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -1.54% | -1.49% | -0.21% | 0.05 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -2.26% | -1.75% | -0.21% | 0.1 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -1.78% | -1.55% | -0.21% | 0.05 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -2.83% | -2.02% | 0% | 0.05 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -3.32% | -2.4% | 0% | 0.05 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -4.75% | -3.38% | 0% | 0.05 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -5.51% | -3.97% | 0% | 0 pp | 0 | Pass |
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

`touring-none` was selected by the combination search. Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that clears BOTH blocking gates — the paired calibration validation and the hard holdout insolvency caps. The remaining pairs carry higher impact and so could not have been selected. A pair rejected by the holdout gate skips the paired comparison, so its calibration verdict is reported as not measured rather than as a pass. Of 140 available pairs, 1 were evaluated on the `selection` stream (0 rejected by the hard caps, 0 by the calibration gate, 1 clearing both) and 139 were never reached, because the search stops at the first pair that clears both gates and every remaining pair carries higher impact. The reserved `validation` stream is measured once, on that pair alone. Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.

## Phase 6E – Harmony Recovery

Alle 5 Varianten werden auf `bootstrap_struggle` und `chaos_tour` vollständig auf den getrennten `calibration`- und `selection`-Strömen gemessen. Nur der bereits ausgewählte Kandidat wird einmal auf `validation` geprüft.

| Candidate | Scenario | Activation runs | Median Harmony delta | Finale delta | Bankruptcy delta | Fame/Gig delta | Avg money cost | Avg days | Avg gigs forgone | Calibration + Selection |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| harmony-recovery-none | bootstrap_struggle | 0/2000 | 0 | 0 pp | 0 pp | 0% | €0 | 0 | 0 | Fail |
| harmony-recovery-none | chaos_tour | 0/2000 | 0 | 0 pp | 0 pp | 0% | €0 | 0 | 0 | Fail |
| harmony-recovery-40-day | bootstrap_struggle | 679/2000 | 0 | -32.2 pp | 0.05 pp | 2.22% | €0 | 0.39 | 0.09 | Fail |
| harmony-recovery-40-day | chaos_tour | 1108/2000 | 5 | -51.7 pp | 0 pp | 4.88% | €0 | 0.69 | 0.27 | Fail |
| harmony-recovery-40-money | bootstrap_struggle | 679/2000 | 0 | 0.35 pp | 0.15 pp | 2.01% | €112.42 | 0 | 0 | Pass |
| harmony-recovery-40-money | chaos_tour | 1108/2000 | 5 | 0.6 pp | 0 pp | 4.9% | €209.16 | 0 | 0 | Pass |
| harmony-recovery-45-day | bootstrap_struggle | 1001/2000 | 0 | -47.25 pp | 0 pp | 3.13% | €0 | 0.61 | 0.14 | Fail |
| harmony-recovery-45-day | chaos_tour | 1401/2000 | 17 | -65.55 pp | 0.05 pp | 5.98% | €0 | 0.97 | 0.37 | Fail |
| harmony-recovery-45-money | bootstrap_struggle | 1001/2000 | 0 | 0.25 pp | 0.25 pp | 2.87% | €179.06 | 0 | 0 | Fail |
| harmony-recovery-45-money | chaos_tour | 1401/2000 | 12 | 0.25 pp | 0.15 pp | 6.09% | €298.2 | 0 | 0 | Fail |

Outcome: **no-production-recommendation-final-validation-failed**. Suchgewinner vor der finalen Validierung: `harmony-recovery-40-money`. Produktionsempfehlung nach der finalen Validierung: `none`.

### Globale Sicherheitsvalidierung des Gewinners

Der fest ausgewählte Gewinner wird auf dem reservierten `validation`-Strom genau einmal über die vollständige Hauptszenario-Matrix geprüft; es findet keine Ersatzsuche statt.

| Scenario | Activation runs | Median Harmony delta | Finale delta | Bankruptcy delta | Fame/Gig delta | Costs measured |
|---|---:|---:|---:|---:|---:|---|
| baseline_touring | 454/2000 | 0 | -0.15 pp | 0.05 pp | 1.17% | Pass |
| bootstrap_struggle | 697/2000 | 0 | 0.55 pp | 0.05 pp | 2.32% | Pass |
| aggressive_marketing | 372/2000 | 0 | 0.05 pp | 0 pp | 0.85% | Pass |
| scandal_recovery | 566/2000 | 0 | 0.25 pp | 0 pp | 1.7% | Pass |
| festival_push | 277/2000 | 0 | 0.15 pp | 0.05 pp | 0.44% | Pass |
| chaos_tour | 1097/2000 | 6 | 1.35 pp | 0.1 pp | 4.75% | Pass |
| cult_hypergrowth | 287/2000 | 0 | 0.15 pp | 0 pp | 0.7% | Pass |
| no_social_probe | 526/2000 | 0 | -0.05 pp | 0.05 pp | 1.39% | Pass |
| high_controversy_probe | 669/2000 | 0 | 0.8 pp | 0.9 pp | 2.34% | Pass |
| early_game_probe | 630/2000 | 0 | -0.05 pp | 0.2 pp | 1.81% | Pass |
| mid_game_probe | 601/2000 | 0 | -0.15 pp | 0 pp | 1.69% | Pass |
| late_game_probe | 376/2000 | 0 | 0.1 pp | 0 pp | 0.98% | Pass |

Global safety: **FAIL** — fehlgeschlagener Check: `finaleNotWorse` in `baseline_touring`, `early_game_probe` und `mid_game_probe`.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 1.4% | 1.4% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 7.95% | 7.95% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 2.3% | 2.3% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 7.45% | 7.45% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 3.7% | 3.7% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 4% | 4% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 2.15% | 2.15% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 4.6% | 4.6% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 23.7% | 23.7% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 4.3% | 4.3% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 1.1% | 1.1% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| late_game_probe | not_evaluated | not_evaluated | 0.25% | 0.25% | 0 pp | 0 | 0% | 0 | 0 | Pass |

Kalibrierungs-Gate: **PASS**. Bootstrap Struggle bankruptcy must remain <= 60%. Dies ist nur das erste von zwei blockierenden Gates — das Gesamturteil steht unter „Release-Gesamtstatus“.

### Harte Sicherheitsgrenzen auf dem Holdout-Strom

Drei disjunkte Seed-Ströme, mit getrennten Aufgaben: `calibration` trägt den gepaarten Vergleich, `selection` trägt die Kandidatensuche gegen die harten `KPI_TARGETS.bankruptcyMax`-Obergrenzen, und `validation` wird **genau einmal** gemessen — auf der Kombination, die die Suche bereits gewählt hat. Ein Strom, auf dem bis zu 140 Kandidaten ausprobiert werden, kann nicht gleichzeitig belegen, dass der Gewinner generalisiert; deshalb entscheidet die Suche auf `selection` und `validation` bleibt unberührt.

Suchstrom-Gate (`selection`, nicht der Unabhängigkeitsbeleg): **PASS**

Holdout-Sicherheitsgate: **PASS**

| Szenario | Holdout-Insolvenz | harte Grenze | Status |
|---|---:|---:|---|
| baseline_touring | 1.15% (23/2000) | 10% | bestanden |
| cult_hypergrowth | 2.5% (50/2000) | 12% | bestanden |
| aggressive_marketing | 2.6% (52/2000) | 15% | bestanden |
| chaos_tour | 3.55% (71/2000) | 25% | bestanden |
| festival_push | 4.25% (85/2000) | 35% | bestanden |
| scandal_recovery | 8.45% (169/2000) | 50% | bestanden |
| bootstrap_struggle | 8.05% (161/2000) | 60% | bestanden |

#### Designkorridore (nicht blockierend)

Die harten Caps sind Obergrenzen. Ein Hebel kann sie alle bestehen und trotzdem das Risiko entfernen, für das ein Szenario existiert — diese Liste macht "sicherer als beabsichtigt" sichtbar.

| Szenario | Holdout-Insolvenz | Designkorridor | Lage |
|---|---:|---:|---|
| baseline_touring | 1.15% | 1–5% | im Korridor |
| cult_hypergrowth | 2.5% | 2–10% | im Korridor |
| aggressive_marketing | 2.6% | 2–8% | im Korridor |
| chaos_tour | 3.55% | 8–20% | unter Korridor |
| festival_push | 4.25% | 5–15% | unter Korridor |
| scandal_recovery | 8.45% | 8–20% | im Korridor |
| bootstrap_struggle | 8.05% | 15–30% | unter Korridor |

**Sicherer als beabsichtigt:** `chaos_tour`, `festival_push`, `bootstrap_struggle`. Die harten Caps sind bestanden, aber diese Szenarien erzeugen nicht mehr das Risiko, für das sie existieren. Kein Gate prüft die Untergrenze — diese Entscheidung liegt beim Design.



### Release-Gesamtstatus

Die folgenden Statuswerte betreffen nur die unabhängigen Phase-3-Balance-Gates: Kalibrierung **PASS** · Holdout-Sicherheit **PASS**. Phase 6E bleibt wegen der fehlgeschlagenen finalen Global-Safety-Validierung **FAIL** (`no-production-recommendation-final-validation-failed`); der Suchgewinner `harmony-recovery-40-money` ist keine Produktionsempfehlung.

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and the early/mid progression checkpoints (days 3 and 5) are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production. The rejected Phase 6E recovery search winner is not included.

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
| Produktionskandidat (nur Phase 3B/3C) | accepted-for-production-partial |
| Phase-6E-Produktionsempfehlung | keine – finale Global-Safety-Validierung fehlgeschlagen |
