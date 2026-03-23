# Game Balancing Simulation Guide

Dieses Dokument beschreibt, wie die Simulation ausgeführt wird, welche Szenarien enthalten sind und wie die Ergebnisse interpretiert werden.

## Ziel

Mit der Simulation werden verschiedene ökonomische und progressionstechnische Pfade automatisiert durchgespielt, damit Balance-Änderungen messbar bewertet werden können (statt nur nach Gefühl).

## Dateiübersicht

| Datei | Zweck |
|---|---|
| `scripts/game-balance-simulation.mjs` | Vollständiger Simulator (7 Szenarien × 260 Runs) |
| `scripts/calculate-baseline-fame.mjs` | Isolierter Fame- und Wirtschafts-Debug-Log (1 Run, tageweise) |
| `reports/game-balance-simulation-results.json` | Maschinenlesbare Ergebnisse |
| `reports/game-balance-simulation-analysis.md` | Menschenlesbarer Kurzreport |

## Ausführung

```bash
node scripts/game-balance-simulation.mjs
node scripts/calculate-baseline-fame.mjs
```

Optional als pnpm Script:

```bash
pnpm run simulate:balance
```

## Enthaltene Szenarien

| # | Name | Gig-Frequenz | Startkapital | Besonderheit |
|---|---|---|---|---|
| 1 | **Baseline Touring** | täglich | €500 | Ausgeglichene Referenztour |
| 2 | **Bootstrap Struggle** | alle 4 Tage | €240 | Geringes Kapital, fragile Band |
| 3 | **Aggressive Marketing** | alle 2 Tage | €650 | Hohe Modifikator-Nutzung |
| 4 | **Scandal Recovery** | alle 3 Tage | €450 | Startet mit Kontroverse 72 |
| 5 | **Festival Push** | alle 3 Tage | €1.400 | Mid-/Endgame, große Venues |
| 6 | **Chaos Tour** | alle 2 Tage | €380 | Extreme Volatilität, Event-Dichte 0.95 |
| 7 | **Cult Hypergrowth** | alle 2 Tage | €900 | Zealotry-getriebene Monetarisierung |

## Wichtige Konstanten

`SIMULATION_CONSTANTS` in `scripts/game-balance-simulation.mjs` steuert u. a.:

- `runsPerScenario` – statistische Stabilität (Standard: 260)
- `daysPerRun` – Simulationshorizont (Standard: 75)
- `baseGigGapDays` – Default-Gig-Frequenz (Standard: 1 = täglich)
- `fameLossBadGig` – Abgeleitet von `BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG`
- Report-Ausgabepfade

## Venue-Selektion (Schwierigkeitsgrad-Gates)

Venues werden auf Basis des aktuellen Fame-Werts zugeordnet:

| Fame | Venue-Schwierigkeitsgrad | Ø Kapazität | Ø Ticketpreis |
|---|---|---|---|
| 0–59 | diff-2 | ~185 | €6 |
| 60–199 | diff-3 | ~321 | €14 |
| 200–399 | diff-4 | ~700 | €20 |
| 400+ | diff-5 | ~2.150 | €30 |

> **Wichtig:** Die Gates sind absichtlich konservativ gesetzt. diff-5-Venues erst ab Fame 400 stellt sicher,
> dass die Einnahmen realistisch zur Fanbase passen und keine Revenue-Explosion in den ersten 20 Spieltagen entsteht.

## Fame-Level-Skala

`calculateFameLevel` berechnet das Spieler-Level als `Math.floor(fame / 100)`:

| Fame | Level | Auswirkungen |
|---|---|---|
| 0–99 | 0 | Tageskosten: Basis |
| 100–199 | 1 | Lifestyle-Inflation: +15 €/Tag |
| 200–299 | 2 | Lifestyle-Inflation: +39 €/Tag |
| 300–399 | 3 | Lifestyle-Inflation: +69 €/Tag |
| 400+ | 4+ | Eskalierender Burn-Rate |

Level beeinflusst außerdem `useMerchPress` (Multiplikator) und Reiselogistikkosten.

## Insolvenzlogik

Insolvenz wird an **zwei Stellen** geprüft:

1. **Nach täglichen Kosten** (`calculateDailyUpdates`): Wenn Geld durch Lebenshaltungskosten auf €0 gedrückt wird und der tägliche Saldo negativ war → Insolvenz.
2. **Nach einem Gig** (`shouldTriggerBankruptcy`): Wenn Geld ≤ 0 und Gig-Nettoeinkommen < 0.

> Vor diesem Fix wurde Insolvenz nur nach Gigs geprüft, was dazu führte, dass Szenarien mit niedrigem Startkapital (z. B. Bootstrap Struggle mit €240 bei €64/Tag) immer 0% Insolvenzrate zeigten, obwohl die Band schon vor dem ersten Gig pleite war.

## Merch-Inventar-Erschöpfung

Die Simulation zieht nach jedem Gig anteilig vom Band-Inventar ab (basierend auf `estimateMerchBuyers`). Das Startinventar beträgt 210 Einheiten (50 Shirts, 20 Hoodies, 30 CDs, 100 Patches, 10 Vinyl). Bei ~35–45 Käufern/Gig ist das Inventar nach ca. 5–6 Gigs erschöpft — danach entfällt der Merch-Einkommensanteil, was die Gig-Nettowerte realistisch absenkt.

## Was wird pro Tag simuliert?

```
für jeden Tag (1–75):
  1. calculateDailyUpdates()    → Kosten, Zustandsdrift, soziale Effekte
  2. Insolvenzcheck (täglich)   → NEU: bricht bei Geldmangel ab
  3. Welt-Events                → financial, special, band, transport
  4. Social-Mechaniken          → Trend-Shift, Brand Deals, Post Pulse
  5. Contraband                 → zufällige Drops
  6. Sponsoring                 → Signing/Payout/Drop
  7. Wartung                    → Tanken, Reparatur, HQ/Van-Upgrades
  8. Gig-Pipeline (wenn fällig):
     a. Klinikbesuch?           → Recovery + Kosten, kein Gig
     b. Show-Absage?            → Harmony < 15, 25% Chance
     c. Reise + Minigames       → Travel, Roadie, Kabelsalat
     d. Performance-Score       → Harmony, Mood, Stamina, Modifikatoren
     e. Gig-Finanzen            → Tickets, Merch, Bar, Kosten, Net
     f. Merch-Depletion         → NEU: Inventar wird abgezogen
     g. Post-Gig-State          → Fame, Follower, Harmony-Anpassung
     h. Insolvenzcheck (Gig)    → bricht bei Totalverlust ab
```

Wiederverwendete Spiellogik:

- `calculateGigFinancials()`
- `calculateTravelExpenses()` / `calculateFuelCost()`
- `calculateTravelMinigameResult()` / `calculateRoadieMinigameResult()` / `calculateKabelsalatMinigameResult()`
- `getGigModifiers()` / `calculateGigPhysics()`
- `eventEngine.checkEvent()` / `resolveEventChoice()`

## `calculate-baseline-fame.mjs` – Einfacher Debug-Logger

Dieses Skript isoliert Fame- und Wirtschaftsverhalten für eine einzelne, tageweise lesbare Ausgabe. Es modelliert:

- Fame-Gewinn/-Verlust pro Gig (via `calculateFameGain`, gleiche Logik wie Spiel)
- Tageskosten (€64/Tag)
- Klinikbesuche (€150 pro Besuch)
- Gig-Einnahmen (Tier-Schätzung nach Fame-Stufe, konservativ nach Merch-Erschöpfung)
- Harmony-Schwellenwerte korrekt: Harmony-Bonus erst ab Score ≥ 78 (übereinstimmend mit `applyPostGigState`)

**Einschränkungen:** Das Skript verwendet vereinfachte Gig-Einnahmen (kein `calculateGigFinancials`). Für vollständige Wirtschaftsanalyse ist `game-balance-simulation.mjs` der richtige Einstiegspunkt.

## Interpretation der Ergebnisdateien

### JSON (`reports/game-balance-simulation-results.json`)

Geeignet für automatisierte Auswertung in BI/Notebook/CI.

Wichtige Kennzahlen je Szenario:

- `avgFinalMoney`, `avgFinalFame`, `avgFinalHarmony`
- `bankruptcyRate` – Anteil der Runs mit Insolvenz in Prozent (0–100)
- `avgGigNet` – Durchschnittlicher Netto-Gewinn pro Gig
- `avgSponsorPayouts`, `avgSponsorDrops`
- `avgTravelMinigames`, `avgRoadieMinigames`, `avgKabelsalatMinigames`
- `avgSpecialEvents`, `avgCashSwings`, `avgBandEvents`
- `avgTrendShifts`, `avgBrandDealsActivated`, `avgContrabandDrops`
- `sampleTimeline` – frühe Beispiel-Toursteps

### Markdown (`reports/game-balance-simulation-analysis.md`)

Direkt lesbarer Kurzreport mit:

- Kompakter Tabellenübersicht aller Szenarien
- Risikohinweisen (`✅` / `⚠️`) pro Szenario
- Kurzfazit für Priorisierung der nächsten Balance-Iteration

## Empfohlener Workflow für Balance-Änderungen

1. Baseline-Simulation laufen lassen → Referenzwerte sichern.
2. Zielkorridore definieren (Beispiele):
   - Insolvenzrate Baseline: < 5%
   - Insolvenzrate Bootstrap: 30–70% (Early-Game-Challenge)
   - Ø Endgeld Baseline: €10.000–€50.000 nach 75 Tagen
   - Ø Fame Baseline: 250–450
3. Balance-Lever ändern (Venue-Pay, Modifier-Kosten, Tageskosten, Fame-Gates …).
4. Simulation erneut ausführen.
5. Vorher/Nachher der KPI-Werte vergleichen.
6. Nur Änderungen übernehmen, die den Zielkorridor verbessern.

## Bekannte Limitierungen

- Die Simulation modelliert kein manuelles Spielerverhalten (z. B. strategische Kaufentscheidungen im Shop).
- Merch-Restocking (Nachkaufen im HQ-Shop) ist nicht modelliert — Inventar erschöpft sich permanent.
- `calculate-baseline-fame.mjs` nutzt Tier-Schätzungen statt `calculateGigFinancials`; die absoluten Geldwerte sind approximativ.
- `gigGapDays = 1` (Baseline) bedeutet theoretisch ein Gig pro Tag ohne Reisetag — das entspricht dem in-game-Mechanismus (Reisen kostet 1 Tag, Gig danach am selben Tag), ist aber für echte Touren ungewöhnlich dicht.
