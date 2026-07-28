# Gig-Kadenz-Phasenvergleich (Phase 5, Schritt 1)

Erzeugt: 2026-07-28T16:08:16.147Z
Runs pro Szenario und Stream: 260 · Streams: calibration, holdout
Seed-Strategie: `scenario-id-plus-run-index (holdout: scenario-id#holdout-plus-run-index)`

## Frage

Der Holdout-Bruch in `cult_hypergrowth` entsteht in Runs, die **vor dem ersten bezahlten Gig** insolvent werden. Wie viele unbezahlte Kostentage davor liegen, entscheidet die *Phase* der Gig-Kadenz — und die ist derzeit ein Artefakt: `day % gigGapDays === 0` lässt ein Szenario mit `gigGapDays: 2` an Tag 1 bewusst nicht spielen.

Verglichen werden drei Phasen auf **denselben Seeds**:

| Variante | Politik | Auftrittstage bei `gigGapDays: 2` |
| --- | --- | --- |
| A (ausgeliefert) | `gap-aligned` | 2, 4, 6, 8, 10 |
| B | `gap-offset` | 1, 3, 5, 7, 9 |
| C | `first-income` | erster erreichbarer Gig, danach Zweierkadenz ab diesem Tag |

Bei `gigGapDays: 1` sind alle drei identisch — solche Zeilen sind keine Bestätigung, sondern konstruktionsbedingt gleich.

## Ergebnis des Holdout-Gates je Variante

| Variante | Holdout-Gate | Verletzungen | max. Δ Geld (solvent) | max. Δ Fame/Gig (alle Runs) | max. Δ Fame/Gig (nur Runs mit Gig) |
| --- | --- | --- | --- | --- | --- |
| `gap-aligned` (aktuell) | **FAIL** | `cult_hypergrowth` 13.85% > 12% | 0% | 0% | 0% |
| `gap-offset` | **PASS** | — | 4.77% | 28.08% | 5.36% |
| `first-income` | **PASS** | — | 4.69% | 30.59% | 5.4% |

> Die beiden Fame-Spalten müssen zusammen gelesen werden. `calculateAverageFameEarnedPerGig` bewertet einen Run ohne jeden Gig mit 0, also hebt jede Variante, die die Zahl der gig-losen Runs senkt, den Wert über alle Runs an, ohne dass ein einziger Gig mehr Fame zahlt. Nur die rechte Spalte vergleicht denselben Nenner.

## `cult_hypergrowth`: der Lauf vor dem ersten Gig (Holdout-Stream)

| Kennzahl | `gap-aligned` | `gap-offset` | `first-income` |
| --- | --- | --- | --- |
| Insolvenzrate | 13.85% | 1.92% | 1.92% |
| davon vor dem ersten Gig | 33 (91.67%) | 0 (0%) | 0 (0%) |
| Insolvenz vor erstem Gig (Rate) | 12.69% | 0% | 0% |
| Tag des ersten Gigs (Median) | 2 | 1 | 1 |
| frühester erster Gig | 1 | 1 | 1 |
| Runs ohne jeden Gig | 33 | 0 | 0 |
| Ø Tage ohne Einnahme vor erstem Gig | 1.1 | 0.03 | 0.02 |
| Geld direkt vor erstem Gig (Median) | €232 | €365 | €365 |
| Geld direkt vor erstem Gig (P10) | €140 | €220 | €221 |
| Ø Verpflichtungen vor erstem Gig | €170 | €88 | €88 |
| Ø Ausgaben vor erstem Gig | €152 | €131 | €131 |
| Runs mit blockierter Reise vor erstem Gig | 12.69% | 0% | 0% |
| erste blockierte Reise (Median-Tag) | 3 | — | — |
| Ø Gigs | 6.13 | 7.47 | 7.46 |
| solventes Endgeld (Median) | €28.708 | €29.160 | €28.994 |
| Fame/Gig (alle Runs) | 1490.62 | 1675.33 | 1677.58 |
| Fame/Gig (nur Runs mit Gig) | 1707.32 | 1675.33 | 1677.58 |

## Alle Szenarien, Holdout-Insolvenz je Variante

| Szenario | Gap | `gap-aligned` | `gap-offset` | `first-income` | harte Grenze | Designkorridor |
| --- | --- | --- | --- | --- | --- | --- |
| `baseline_touring` | 1 (phasenneutral) | 1.15% | 1.15% | 1.15% | 10% | 1–5% |
| `bootstrap_struggle` | 4 | 33.46% | 15% | 13.08% | 60% | 15–30% |
| `aggressive_marketing` | 2 | 11.92% | 2.69% | 2.31% | 15% | 2–8% |
| `scandal_recovery` | 3 | 25.38% | 3.46% | 3.08% | 50% | 8–20% |
| `festival_push` | 3 | 25.77% | 5% | 4.23% | 35% | 5–15% |
| `chaos_tour` | 2 | 15% | 4.62% | 3.85% | 25% | 8–20% |
| `cult_hypergrowth` | 2 | 13.85% ❌ | 1.92% | 1.92% | 12% | 2–10% |

## Schlussfolgerung

Allein die Kadenz-Phase bringt das Holdout-Gate von `cult_hypergrowth` von FAIL auf PASS (gap-offset, first-income). Der Bruch ist mindestens teilweise ein Artefakt der Simulationspolitik. Die Phase ist danach zu entscheiden, was das Spiel vorgibt — erst danach ist messbar, ob überhaupt noch ein Early-Runway-Eingriff nötig ist.

- `gap-aligned`: über dem Designkorridor: `bootstrap_struggle`, `aggressive_marketing`, `scandal_recovery`, `festival_push`, `cult_hypergrowth`; kein Szenario unter dem Designkorridor
- `gap-offset`: kein Szenario über dem Designkorridor; unter dem Designkorridor: `scandal_recovery`, `chaos_tour`, `cult_hypergrowth`
- `first-income`: kein Szenario über dem Designkorridor; unter dem Designkorridor: `bootstrap_struggle`, `scandal_recovery`, `festival_push`, `chaos_tour`, `cult_hypergrowth`

Die Designkorridore (`RISK_TARGETS`) sind an der ausgelieferten Phase kalibriert. Verschiebt die Phase das Risiko um eine Größenordnung, sagt eine Korridorverletzung zuerst etwas über die Phase und erst danach über das Szenariodesign — die Korridore sollten deshalb nicht an eine Variante angepasst werden, deren Phase noch nicht entschieden ist.

Anteil der Insolvenzen, die vor dem ersten Gig eintreten (`cult_hypergrowth`, Holdout): `gap-aligned` 91.67% · `gap-offset` 0% · `first-income` 0%

> Diese Auswertung ändert keinen Produktionswert. Sie entscheidet nur, ob der nächste Schritt eine Korrektur der Simulationspolitik oder ein echter Early-Runway-Eingriff ist. Eine Variante, die das Gate besteht, ist Evidenz — kein Grund, sie deshalb zu übernehmen: die Phase muss zu dem passen, was das Spiel vorgibt.
