# Game Balancing Simulation Guide

Dieses Dokument beschreibt, wie die neue Simulation ausgeführt wird, welche Szenarien enthalten sind und wie die Ergebnisse interpretiert werden.

## Ziel

Mit der Simulation werden verschiedene ökonomische und progressionstechnische Pfade automatisiert durchgespielt, damit Balance-Änderungen messbar bewertet werden können (statt nur nach Gefühl).

## Dateiübersicht

- **Simulator:** `scripts/game-balance-simulation.mjs`
- **JSON-Ergebnis:** `reports/game-balance-simulation-results.json`
- **Markdown-Analyse:** `reports/game-balance-simulation-analysis.md`

## Ausführung

```bash
node scripts/game-balance-simulation.mjs
```

Optional als pnpm Script:

```bash
pnpm run simulate:balance
```

## Enthaltene Szenarien

1. **Baseline Touring**
   - Solide Standardtour.
2. **Bootstrap Struggle**
   - Niedriges Startkapital, anfällige Bandwerte.
3. **Aggressive Marketing**
   - Hoher Einsatz von Modifikatoren und dichte Tour.
4. **Scandal Recovery**
   - Start mit hoher Kontroverse und Reputationsdruck.
5. **Festival Push**
   - Mid-/Endgame mit Fokus auf große Venues.
6. **Chaos Tour**
   - Extrem volatile Tour mit hoher Event-Dichte.
7. **Cult Hypergrowth**
   - Zealotry-getriebene Monetarisierung mit starkem Wachstumspotenzial.

## Wichtige Konstanten

`SIMULATION_CONSTANTS` in `scripts/game-balance-simulation.mjs` steuert u. a.:

- Runs je Szenario (`runsPerScenario`)
- Tage pro Run (`daysPerRun`)
- Gig-Frequenz (`baseGigGapDays` + Szenario-Override)
- Follower-/Fame-Deltas und Harmony-Effekte
- Report-Ausgabepfade

## Was wird simuliert?

Pro Tag:

- `calculateDailyUpdates()` für laufende Kosten, Zustandsdrift und soziale Effekte
- Geplante Gigs inkl. Reise, Performance, Modifikator-Set, Financial-Report
- Fortschreibung von Geld, Fame, Followern, Harmony, Kontroverse
- Sponsoring-Zyklen (Signings, Payouts, Drops)
- Welt-Events (viral spikes, cash swings, Band-/Equipment-Events)
- Wartung (Tanken/Reparatur) sowie Investitionsentscheidungen (HQ/Van-Upgrades)

Dabei werden bestehende Spielregeln wiederverwendet, z. B.:

- `calculateGigFinancials()`
- `calculateTravelExpenses()`
- `calculateFuelCost()`
- `calculateTravelMinigameResult()`
- `calculateRoadieMinigameResult()`
- `calculateKabelsalatMinigameResult()`
- `getGigModifiers()` / `calculateGigPhysics()`

Zusätzlich analysiert die Simulation zentrale App-Feature-Kataloge und integriert diese in den Report:

- `EVENTS_DB` (Event-System)
- `BRAND_DEALS` (Deal-Möglichkeiten)
- `POST_OPTIONS` (Social Content)
- `ALLOWED_TRENDS` + `SOCIAL_PLATFORMS` (Trend-/Channel-Dynamik)
- `_CONTRABAND_DB_FOR_TESTING` (Contraband-Katalog)
- `getUnifiedUpgradeCatalog()` (Shop-/Upgrade-Breite)

## Interpretation der Ergebnisdateien

### JSON (`reports/game-balance-simulation-results.json`)

Geeignet für automatisierte Auswertung in BI/Notebook/CI.

Wichtige Kennzahlen je Szenario:

- `avgFinalMoney`
- `avgFinalFame`
- `avgFinalHarmony`
- `bankruptcyRate`
- `avgGigNet`
- `avgSponsorPayouts`, `avgSponsorDrops`
- `avgTravelMinigames`, `avgRoadieMinigames`, `avgKabelsalatMinigames`
- `avgViralSpikes`, `avgCashSwings`, `avgBandEvents`
- `avgTrendShifts`, `avgBrandDealsActivated`, `avgContrabandDrops`
- `sampleTimeline` (frühe Beispiel-Toursteps)

### Markdown (`reports/game-balance-simulation-analysis.md`)

Direkt lesbarer Kurzreport mit:

- kompakter Tabellenübersicht
- Risikohinweisen pro Szenario
- Kurzfazit für Priorisierung der nächsten Balance-Iteration

## Empfohlener Workflow für Balance-Änderungen

1. Baseline-Simulation laufen lassen.
2. Zielgrößen definieren (z. B. Insolvenzrate Early-Game < 10%).
3. Balance-Lever in Daten/Utils ändern (Venue pay, modifier cost, daily cost …).
4. Simulation erneut ausführen.
5. Vorher/Nachher der KPI-Werte vergleichen.
6. Nur Änderungen übernehmen, die Zielkorridor verbessern.
