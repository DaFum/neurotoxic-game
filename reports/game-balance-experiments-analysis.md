# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: `same-scenario-same-run-index-same-seed`; 170000 simulation runs in 313808 ms.

## Alt/Neu-Vergleich der vollständigen Reports

Dieser Vergleich ist **deskriptiv und ungepaart**: Die Reports verwenden unterschiedliche Seed-Namensräume und Stichprobengrößen.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Commit | `dc6f86a53f0c1070d9ca3c74f92abeb58225ddf0` | `aead877fdefa97e25e126eb50cb079a420ac72f9` |
| Runs je Szenario | 260 | 2000 |
| Seed-Namensraum | `legacy` | `#first-income-full-reports-v1` |
| Empfehlung | `no-production-recommendation-final-validation-failed` | `accepted-for-production-partial` |

| Szenario | Insolvenz alt | Insolvenz neu | Delta | Stichprobe alt/neu |
|---|---:|---:|---:|---:|
| `aggressive_marketing` | 11.92% | 2.65% | -9.27 pp | 260 / 2000 |
| `baseline_touring` | 1.15% | 1.6% | 0.45 pp | 260 / 2000 |
| `bootstrap_struggle` | 33.46% | 8.5% | -24.96 pp | 260 / 2000 |
| `chaos_tour` | 15% | 3.8% | -11.2 pp | 260 / 2000 |
| `cult_hypergrowth` | 13.85% | 2.25% | -11.6 pp | 260 / 2000 |
| `festival_push` | 25.77% | 3.95% | -21.82 pp | 260 / 2000 |
| `scandal_recovery` | 25.38% | 5.75% | -19.63 pp | 260 / 2000 |

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
| bootstrap-none | 7.85% | 7.85% | 0 pp | 0 | €24849 | 0% | Pass |
| bootstrap-obligations-90-through-3 | 7.85% | 7.9% | 0.05 pp | 0 | €24801 | -0.03% | Fail |
| bootstrap-obligations-80-through-3 | 7.85% | 7.05% | -0.8 pp | 0 | €24807 | -0.38% | Pass |
| bootstrap-obligations-70-through-3 | 7.85% | 6.7% | -1.15 pp | 0 | €24819 | -0.83% | Pass |
| bootstrap-obligations-80-through-5 | 7.85% | 6.65% | -1.2 pp | 0 | €24838 | -0.61% | Pass |
| bootstrap-obligations-70-through-5 | 7.85% | 5.65% | -2.2 pp | 0 | €24828 | -1.05% | Pass |
| bootstrap-obligations-60-through-5 | 7.85% | 4.7% | -3.15 pp | 0 | €24806.5 | -0.69% | Pass |
| bootstrap-emergency-250 | 7.85% | 4.4% | -3.45 pp | 0 | €24731 | -0.15% | Pass |
| bootstrap-emergency-500 | 7.85% | 3.55% | -4.3 pp | 0 | €24696 | -0.31% | Pass |
| bootstrap-staged-60-80 | 7.85% | 6.15% | -1.7 pp | 0 | €24804 | -1.03% | Pass |
| bootstrap-staged-75 | 7.85% | 6.5% | -1.35 pp | 0 | €24794 | -0.72% | Pass |

## Bootstrap-Ranking

1. bootstrap-none
2. bootstrap-obligations-80-through-3
3. bootstrap-obligations-80-through-5
4. bootstrap-obligations-70-through-3
5. bootstrap-staged-75
6. bootstrap-staged-60-80
7. bootstrap-obligations-70-through-5
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
| control | baseline_touring | 1 | 8.5 | 2831.31 | 3534.11 | 1368 | 1592.14 | 48.4 | 1.28 | 1.26 | 18.49% | 1.7% | 9.91 |
| control | baseline_touring | 2 | 7.39 | 2669.74 | 3268.44 | 1211.15 | 1614.51 | 49.9 | 1.25 | 1.25 | 25.25% | 3.25% | 9.86 |
| control | baseline_touring | 3 | 6.77 | 2537.3 | 3080.74 | 1122.67 | 1615.74 | 50.98 | 1.23 | 1.23 | 28.68% | 5.2% | 9.79 |
| control | baseline_touring | 4 | 6.65 | 2524.82 | 3028.07 | 1104.46 | 1616.6 | 50.37 | 1.22 | 1.22 | 30.71% | 6.55% | 9.73 |
| control | baseline_touring | 5 | 6.41 | 2434.04 | 2920.1 | 1083.87 | 1641.96 | 51.02 | 1.23 | 1.22 | 31.37% | 7.4% | 9.71 |
| control | low_resource_touring | 1 | 8.13 | 2773.09 | 3457.08 | 1337.09 | 1501.73 | 49.09 | 1.2 | 1.19 | 21.38% | 6.7% | 9.57 |
| control | low_resource_touring | 2 | 6.89 | 2594.58 | 3170.72 | 1180.17 | 1533.86 | 50.95 | 1.17 | 1.17 | 29.31% | 10.85% | 9.36 |
| control | low_resource_touring | 3 | 6.35 | 2451.72 | 2988.08 | 1092.61 | 1559.06 | 51.74 | 1.17 | 1.14 | 33.98% | 12.25% | 9.33 |
| control | low_resource_touring | 4 | 6.28 | 2445.29 | 2961.24 | 1078.68 | 1540.19 | 51.7 | 1.12 | 1.13 | 34.4% | 13.4% | 9.3 |
| control | low_resource_touring | 5 | 6.01 | 2344.52 | 2828.93 | 1050.07 | 1556.75 | 51.66 | 1.12 | 1.12 | 34.85% | 14.95% | 9.23 |
| finalTuning | baseline_touring | 1 | 8.5 | 2831.31 | 3534.11 | 1368 | 1592.14 | 48.4 | 1.28 | 1.26 | 18.49% | 1.7% | 9.91 |
| finalTuning | baseline_touring | 2 | 7.39 | 2669.74 | 3268.44 | 1211.15 | 1614.51 | 49.9 | 1.25 | 1.25 | 25.25% | 3.25% | 9.86 |
| finalTuning | baseline_touring | 3 | 6.77 | 2537.3 | 3080.74 | 1122.67 | 1615.74 | 50.98 | 1.23 | 1.23 | 28.68% | 5.2% | 9.79 |
| finalTuning | baseline_touring | 4 | 6.65 | 2524.82 | 3028.07 | 1104.46 | 1616.6 | 50.37 | 1.22 | 1.22 | 30.71% | 6.55% | 9.73 |
| finalTuning | baseline_touring | 5 | 6.41 | 2434.04 | 2920.1 | 1083.87 | 1641.96 | 51.02 | 1.23 | 1.22 | 31.37% | 7.4% | 9.71 |
| finalTuning | low_resource_touring | 1 | 8.13 | 2773.09 | 3457.08 | 1337.09 | 1501.73 | 49.09 | 1.2 | 1.19 | 21.38% | 6.7% | 9.57 |
| finalTuning | low_resource_touring | 2 | 6.89 | 2594.58 | 3170.72 | 1180.17 | 1533.86 | 50.95 | 1.17 | 1.17 | 29.31% | 10.85% | 9.36 |
| finalTuning | low_resource_touring | 3 | 6.35 | 2451.72 | 2988.08 | 1092.61 | 1559.06 | 51.74 | 1.17 | 1.14 | 33.98% | 12.25% | 9.33 |
| finalTuning | low_resource_touring | 4 | 6.28 | 2445.29 | 2961.24 | 1078.68 | 1540.19 | 51.7 | 1.12 | 1.13 | 34.4% | 13.4% | 9.3 |
| finalTuning | low_resource_touring | 5 | 6.01 | 2344.52 | 2828.93 | 1050.07 | 1556.75 | 51.66 | 1.12 | 1.12 | 34.85% | 14.95% | 9.23 |

Gap 1 vs Gap 2 advantage before: {"baseline_touring":{"moneyPerDayAdvantagePct":6.05,"famePerDayAdvantagePct":12.95,"harmonyDelta":-1.5,"repairsDelta":0.03,"bankruptcyDeltaPct":-1.55},"low_resource_touring":{"moneyPerDayAdvantagePct":6.88,"famePerDayAdvantagePct":13.3,"harmonyDelta":-1.86,"repairsDelta":0.03,"bankruptcyDeltaPct":-4.15}}

Gap 1 vs Gap 2 advantage after: {"baseline_touring":{"moneyPerDayAdvantagePct":6.05,"famePerDayAdvantagePct":12.95,"harmonyDelta":-1.5,"repairsDelta":0.03,"bankruptcyDeltaPct":-1.55},"low_resource_touring":{"moneyPerDayAdvantagePct":6.88,"famePerDayAdvantagePct":13.3,"harmonyDelta":-1.86,"repairsDelta":0.03,"bankruptcyDeltaPct":-4.15}}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **20–25%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
| baseline_touring | 6.05% | 6.05% | 0 pp | No |
| low_resource_touring | 6.88% | 6.88% | 0 pp | No |

Objective status: **partial**

- baseline_touring money-per-day advantage 6.05% is below the 20-25% target (was 6.05%)
- low_resource_touring money-per-day advantage 6.88% is below the 20-25% target (was 6.88%)

Gap-1 money-per-day advantage now sits BELOW the 20-25% target band (baseline_touring money-per-day advantage 6.05% is below the 20-25% target (was 6.05%); low_resource_touring money-per-day advantage 6.88% is below the 20-25% target (was 6.88%)). No dampener is warranted — a lever here would push dense touring below paced touring. The target band was set when the simulator gated travel on the gig cadence, which made the advantage look far larger than it is; the band itself is what wants revisiting.

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
| touring-none | 0% | 0% | 0% | 0 pp | 0 | Pass |
| touring-demand-5-15-window-3 | -1.26% | -1.28% | -0.2% | 0 pp | 0 | Pass |
| touring-demand-7.5-25-window-3 | -1.7% | -2.01% | -0.2% | 0 pp | 0 | Pass |
| touring-demand-5-20-window-5 | -1.38% | -1.62% | -0.2% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-3 | -2.36% | -2.43% | 0% | 0 pp | 0 | Pass |
| touring-demand-10-40-after-3-window-5 | -3.07% | -3.04% | 0% | 0 pp | 0 | Pass |
| touring-demand-13.5-48-after-3-window-5 | -4.36% | -3.9% | 0% | 0 pp | 0 | Pass |
| touring-demand-16-55-after-5 | -5.36% | -4.28% | 0% | 0 pp | 0 | Pass |
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

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| baseline_touring | passed | passed | 1.4% | 1.4% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| bootstrap_struggle | passed | passed | 7.85% | 7.85% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| aggressive_marketing | passed | passed | 2% | 2% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| scandal_recovery | passed | passed | 5.85% | 5.85% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| festival_push | passed | passed | 4.05% | 4.05% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| chaos_tour | passed | passed | 3.7% | 3.7% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| cult_hypergrowth | passed | passed | 2.2% | 2.2% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| no_social_probe | not_evaluated | not_evaluated | 4.8% | 4.8% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| high_controversy_probe | not_evaluated | not_evaluated | 20.05% | 20.05% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| early_game_probe | not_evaluated | not_evaluated | 4.35% | 4.35% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| mid_game_probe | not_evaluated | not_evaluated | 0.65% | 0.65% | 0 pp | 0 | 0% | 0 | 0 | Pass |
| late_game_probe | not_evaluated | not_evaluated | 0.1% | 0.1% | 0 pp | 0 | 0% | 0 | 0 | Pass |

Kalibrierungs-Gate: **PASS**. Bootstrap Struggle bankruptcy must remain <= 60%. Dies ist nur das erste von zwei blockierenden Gates — das Gesamturteil steht unter „Release-Gesamtstatus“.

### Harte Sicherheitsgrenzen auf dem Holdout-Strom

Drei disjunkte Seed-Ströme, mit getrennten Aufgaben: `calibration` trägt den gepaarten Vergleich, `selection` trägt die Kandidatensuche gegen die harten `KPI_TARGETS.bankruptcyMax`-Obergrenzen, und `validation` wird **genau einmal** gemessen — auf der Kombination, die die Suche bereits gewählt hat. Ein Strom, auf dem bis zu 140 Kandidaten ausprobiert werden, kann nicht gleichzeitig belegen, dass der Gewinner generalisiert; deshalb entscheidet die Suche auf `selection` und `validation` bleibt unberührt.

Suchstrom-Gate (`selection`, nicht der Unabhängigkeitsbeleg): **PASS**

Holdout-Sicherheitsgate: **PASS**

| Szenario | Holdout-Insolvenz | harte Grenze | Status |
|---|---:|---:|---|
| baseline_touring | 1.6% (32/2000) | 10% | bestanden |
| cult_hypergrowth | 2.25% (45/2000) | 12% | bestanden |
| aggressive_marketing | 2.65% (53/2000) | 15% | bestanden |
| chaos_tour | 3.8% (76/2000) | 25% | bestanden |
| festival_push | 3.95% (79/2000) | 35% | bestanden |
| scandal_recovery | 5.75% (115/2000) | 50% | bestanden |
| bootstrap_struggle | 8.5% (170/2000) | 60% | bestanden |

#### Designkorridore (nicht blockierend)

Die harten Caps sind Obergrenzen. Ein Hebel kann sie alle bestehen und trotzdem das Risiko entfernen, für das ein Szenario existiert — diese Liste macht "sicherer als beabsichtigt" sichtbar.

| Szenario | Holdout-Insolvenz | Designkorridor | Lage |
|---|---:|---:|---|
| baseline_touring | 1.6% | 1–5% | im Korridor |
| cult_hypergrowth | 2.25% | 2–10% | im Korridor |
| aggressive_marketing | 2.65% | 2–8% | im Korridor |
| chaos_tour | 3.8% | 8–20% | unter Korridor |
| festival_push | 3.95% | 5–15% | unter Korridor |
| scandal_recovery | 5.75% | 8–20% | unter Korridor |
| bootstrap_struggle | 8.5% | 15–30% | unter Korridor |

**Sicherer als beabsichtigt:** `chaos_tour`, `festival_push`, `scandal_recovery`, `bootstrap_struggle`. Die harten Caps sind bestanden, aber diese Szenarien erzeugen nicht mehr das Risiko, für das sie existieren. Kein Gate prüft die Untergrenze — diese Entscheidung liegt beim Design.



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
