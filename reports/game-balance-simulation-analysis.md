# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T21:00:13.102Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.2
- Basis-Commit: 852cf6274b22e78697de661251b3c499e6678ff9
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 3871d90f28836c6dbf21ba71f28149219a903ea066be1c194fd4512a0234ec32
- Szenariokonfiguration SHA-256: e2f97ba93da6a842fa33908edf7acf33b2404c753b18903421f900c04aa7c6c0
- KPI-Zielkonfiguration SHA-256: 7e243b1d2ee21d2c19e764cba96afa604f633f210757fa6e9eb8843aa226cfa7
- Seed-Strategie: scenario-id-plus-run-index

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |
| Klinik-Heilung | €280 × 1.2^Besuche · +30 Stamina / +10 Mood |

## Fame-Shop-Audit

Shop-only kosten **15290 Fame**, mit Legacy-Upgrades **24390 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 45 | 690 | 8 | 23 | 34 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 50 | 750 | 7 | 21 | 32 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 55 | 810 | 7 | 19 | 29 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 60 | 870 | 6 | 18 | 27 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 70 | 990 | 6 | 16 | 24 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 1170 | 5 | 13 | 20 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 1350 | 4 | 12 | 18 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 164 |
| Brand Deals | 54 |
| Post Options | 36 |
| Contraband-Items | 37 |
| Upgrade-Katalog | 67 |
| Social Platforms | 4 |
| Trends | 5 |
| Songs | 7 |
| Quests (Registry) | 32 |
| Asset-Chassis-Arten | 4 |
| Asset-Module | 63 |
| Kredit-Profile | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 26 | travel, random |
| band | 59 | random, post_gig, travel |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 26 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €55.731 | 62.03% | 0.1 | 2.8% | 23597 | 10 | 41 | 12.27 | 60.53 | 6.52 | 0.38% | €2.480 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €623 | 91.48% | 0.25 | 1.2% | 1058 | 2 | 56 | 0.77 | 4.23 | 2.46 | 86.54% | €1.143 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €24.259 | 59.32% | 0.11 | 4% | 8772 | 6 | 55 | 4.73 | 29.54 | 5.88 | 1.15% | €2.723 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €5.765 | 82.19% | 0.17 | 1.8% | 2763 | 3 | 55 | 1.84 | 13.18 | 4.4 | 38.08% | €1.907 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.738 | 76.75% | 0.13 | 3.7% | 4520 | 4 | 55 | 1.21 | 14.47 | 4.7 | 27.31% | €2.393 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.384 | 62.39% | 0.14 | 1.9% | 6301 | 5 | 42 | 4.96 | 26.33 | 5.77 | 4.23% | €2.266 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.389 | 56.75% | 0.1 | 4.3% | 7902 | 6 | 53 | 5.79 | 29.67 | 5.76 | 1.54% | €2.853 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €16.129 | 61.49% | 0.14 | 1.5% | 8843 | 6 | 50 | 0 | 27.87 | 5.51 | 5% | €2.138 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €15.797 | 63.26% | 0.14 | 1.8% | 6151 | 5 | 51 | 14.59 | 25.58 | 5.22 | 11.15% | €1.951 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €10.889 | 31.37% | 0.13 | 1.7% | 3059 | 3 | 41 | 5.29 | 9.08 | 2.45 | 0.77% | €2.048 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €13.882 | 47.5% | 0.15 | 1.8% | 4384 | 4 | 48 | 5.39 | 15.67 | 4.93 | 1.54% | €2.290 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.073 | 48.94% | 0.1 | 3% | 10527 | 7 | 41 | 9.58 | 26.08 | 5.18 | 0% | €2.652 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €58.918 | €498 | €2.480 | 6.3 | 2.12 | 21.05 | 8.07 | 11.92 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €3.983 | €85 | €1.143 | 0.21 | 0.13 | 2.62 | 0.3 | 1.69 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €31.701 | €405 | €2.723 | 2.51 | 1.12 | 16.86 | 4.23 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €10.635 | €224 | €1.907 | 0.83 | 0.48 | 8.82 | 1.77 | 4.74 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €14.561 | €256 | €2.393 | 0.9 | 0.44 | 10.41 | 1.89 | 4.84 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €21.824 | €391 | €2.266 | 2.48 | 1.15 | 14.11 | 3.5 | 7.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €34.060 | €407 | €2.853 | 2.98 | 1.26 | 17.01 | 4.1 | 7.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €21.811 | €379 | €2.138 | 0 | 0 | 15.13 | 3.89 | 7.56 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.035 | €315 | €1.951 | 2.16 | 1.02 | 13.62 | 3.56 | 6.99 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.651 | €398 | €2.048 | 0.3 | 0.18 | 3.84 | 1 | 1.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.130 | €1.335 | €2.290 | 0.92 | 0.43 | 8.12 | 2.11 | 3.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.398 | €4.956 | €2.652 | 1.4 | 0.53 | 8.88 | 3.57 | 4.65 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.348 | €28.408 | €40.312 | €55.731 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.498 | €976 | €634 | €623 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €12.994 | €15.941 | €20.579 | €24.259 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.869 | €4.919 | €4.528 | €5.765 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.345 | €6.984 | €6.795 | €9.738 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €9.883 | €11.261 | €13.908 | €16.384 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.199 | €17.694 | €21.983 | €26.389 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.233 | €11.236 | €13.816 | €16.129 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €6.969 | €9.524 | €12.534 | €15.797 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.687 | — | — | €10.889 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.680 | €13.041 | — | €13.882 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.867 | — | — | €29.073 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.480 | €98 | 25.4× | 10.08 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.143 | €56 | 31.8× | 21.87 | 1.31 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.723 | €89 | 31× | 9.18 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.907 | €69 | 30.3× | 13.11 | 0.79 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.393 | €75 | 34.4× | 10.45 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.266 | €83 | 27.5× | 11.03 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.853 | €89 | 32.2× | 8.76 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.138 | €84 | 25.5× | 11.69 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.951 | €80 | 26.1× | 12.81 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.048 | €72 | 28.6× | 12.21 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.290 | €83 | 27.7× | 10.92 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.652 | €96 | 27.8× | 9.43 | 0.57 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.4 | 50 | 50.5% | 44% | 5.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.5 | 54 | 50.5% | 42.9% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 54 | 37.2% | 53.4% | 9.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.2 | 53 | 45.6% | 45.3% | 9.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.2 | 58 | 27.3% | 56.8% | 15.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 62.7% | 34.2% | 3.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8 | 53 | 39.6% | 53.7% | 6.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.3% | 40.8% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 49 | 54.2% | 40.5% | 5.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 47.6% | 44.6% | 7.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 50 | 49.4% | 46% | 4.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 46.5% | 45.9% | 7.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 41 | 6.52 | 1.66 | 0.55 | 8.2 | 11.15 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 56 | 2.46 | 0.11 | 0.06 | 3.27 | 0.81 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 55 | 5.88 | 0.86 | 0.41 | 7.93 | 5.37 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 55 | 4.4 | 0.39 | 0.23 | 6.95 | 2.52 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 55 | 4.7 | 0.35 | 0.19 | 7.35 | 2.48 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 42 | 5.77 | 0.9 | 0.48 | 8.32 | 4.68 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.76 | 1.02 | 0.49 | 8.26 | 5.27 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.51 | 0 | 0 | 8.23 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 5.22 | 0.77 | 0.42 | 7.57 | 4.47 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 41 | 2.45 | 0.13 | 0.04 | 2.07 | 1.69 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 4.93 | 0.36 | 0.15 | 4.37 | 2.81 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 41 | 5.18 | 0.43 | 0.07 | 3.19 | 4.47 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.07 | 1.57 | 1.54 | 0.86 | 4.22 | 9.15 | 29.37 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.58 | 0.94 | 0.81 | 0.09 | 0.38 | 3.53 | 4.75 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.78 | 2.7 | 2.73 | 0.75 | 3.44 | 9.08 | 24.62 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.57 | 3.03 | 2.84 | 0.4 | 1.95 | 7.22 | 14.59 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.93 | 1.66 | 1.6 | 0.19 | 1.02 | 7.96 | 16.6 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.69 | 4.35 | 4.23 | 1.05 | 4.85 | 8.87 | 21.82 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.56 | 2.5 | 2.49 | 0.67 | 2.98 | 8.52 | 24.75 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.37 | 2.1 | 2.25 | 0.53 | 2.49 | 9.03 | 22.97 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.24 | 2.04 | 2.04 | 0.48 | 2.5 | 8.4 | 20.49 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.2 | 0.37 | 0.42 | 0.09 | 0.57 | 2.37 | 5.77 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.61 | 0.98 | 0.96 | 0.23 | 1.13 | 4.8 | 12.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.6 | 0.83 | 0.91 | 0.62 | 2.59 | 3.53 | 12.54 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.53 | 20 | 20.18 | 20.35 | 121.06 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 4.23 | 1.43 | 1.44 | 1.35 | 8.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.54 | 9.85 | 9.85 | 9.85 | 59.09 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 13.18 | 4.4 | 4.34 | 4.44 | 26.36 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.47 | 4.92 | 4.83 | 4.72 | 28.94 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.33 | 8.75 | 8.91 | 8.66 | 52.65 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.67 | 9.91 | 9.91 | 9.85 | 59.34 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 27.87 | 9.07 | 9.45 | 9.36 | 55.75 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 25.58 | 8.42 | 8.76 | 8.4 | 51.16 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.08 | 3.02 | 2.95 | 3.11 | 18.16 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.67 | 5.14 | 5.3 | 5.22 | 31.33 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.08 | 8.61 | 8.72 | 8.75 | 52.16 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.93 | 0.32 | 6.53 | 0.96 | 3.63 | 4.8 | €3.312 | 6.2 | 100% |
| Bootstrap Struggle | 0.25 | 0.16 | 0.57 | 0.79 | 0.51 | 0.97 | €1.004 | 2.07 | 66.5% |
| Aggressive Marketing | 2.75 | 0.77 | 6.25 | 1.03 | 3.43 | 3.03 | €2.882 | 5.62 | 100% |
| Scandal Recovery | 1.12 | 0.6 | 2.93 | 1.44 | 1.9 | 2.43 | €1.831 | 6.22 | 93.5% |
| Festival Push | 1.6 | 0.75 | 4.07 | 1.28 | 2.34 | 1.45 | €2.024 | 6.18 | 98.5% |
| Chaos Tour | 2.41 | 0.89 | 5.69 | 1.25 | 3.14 | 3.06 | €2.708 | 7.42 | 97.3% |
| Cult Hypergrowth | 2.77 | 0.61 | 6.33 | 1.13 | 3.45 | 3.8 | €2.827 | 5.46 | 100% |
| No Social (Fame 0-50) | 2.31 | 0.9 | 5.44 | 1.31 | 3.11 | 2.68 | €2.548 | 6.97 | 98.1% |
| High Controversy | 2.02 | 0.83 | 4.78 | 1.23 | 2.77 | 3.28 | €2.370 | 7.01 | 96.5% |
| Early Game Probe (Fame 0–50) | 0.72 | 0.33 | 0.55 | 0.52 | 0.86 | 1.67 | €841 | 0.03 | 93.5% |
| Mid Game Probe (Fame 60–150) | 1.77 | 0.61 | 2.74 | 0.91 | 2.27 | 2.38 | €2.204 | 2.89 | 96.9% |
| Late Game Probe (Fame 175+) | 2.17 | 0.27 | 2.64 | 0.6 | 2.49 | 2.85 | €2.488 | 0.63 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €55.731 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 23597 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 86.54% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.853 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €58.918 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.53 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.17 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Verworfen/Clamped |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 49095 | 25739 | 279 | 25460 | 41 | -3 |
| Bootstrap Struggle | 3288 | 2235 | 12 | 2222 | 8 | -1 |
| Aggressive Marketing | 28291 | 19714 | 208 | 19506 | 16 | -3 |
| Scandal Recovery | 11580 | 8861 | 60 | 8801 | 18 | -2 |
| Festival Push | 15434 | 11007 | 100 | 10907 | 10 | -3 |
| Chaos Tour | 22150 | 15934 | 127 | 15807 | 45 | -3 |
| Cult Hypergrowth | 27493 | 19732 | 157 | 19575 | 19 | -3 |
| No Social (Fame 0-50) | 26291 | 17572 | 152 | 17420 | 32 | -3 |
| High Controversy | 21792 | 15770 | 155 | 15615 | 29 | -3 |
| Early Game Probe (Fame 0–50) | 7439 | 4408 | 35 | 4372 | 9 | -1 |
| Mid Game Probe (Fame 60–150) | 13615 | 9388 | 111 | 9277 | 16 | -2 |
| Late Game Probe (Fame 175+) | 20721 | 10467 | 117 | 10350 | 20 | -2 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*
| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €55.731 | €55.171 | €19.921 | €31.937 | €80.204 |
| Bootstrap Struggle | €623 | €0 | €2.211 | €0 | €1.289 |
| Aggressive Marketing | €24.259 | €23.387 | €11.081 | €10.715 | €37.141 |
| Scandal Recovery | €5.765 | €3.108 | €7.054 | €0 | €15.232 |
| Festival Push | €9.738 | €7.900 | €9.278 | €0 | €23.552 |
| Chaos Tour | €16.384 | €15.801 | €8.718 | €6.006 | €27.533 |
| Cult Hypergrowth | €26.389 | €25.889 | €10.858 | €14.361 | €39.313 |
| No Social (Fame 0-50) | €16.129 | €15.021 | €8.569 | €5.131 | €27.560 |
| High Controversy | €15.797 | €14.766 | €10.074 | €0 | €28.666 |
| Early Game Probe (Fame 0–50) | €10.889 | €10.266 | €4.605 | €5.464 | €17.118 |
| Mid Game Probe (Fame 60–150) | €13.882 | €13.489 | €7.010 | €5.409 | €23.413 |
| Late Game Probe (Fame 175+) | €29.073 | €29.775 | €8.902 | €17.335 | €39.650 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 225 | 260 | 86.54% | 81.85% | 90.16% |
| Aggressive Marketing | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Scandal Recovery | 99 | 260 | 38.08% | 32.39% | 44.11% |
| Festival Push | 71 | 260 | 27.31% | 22.25% | 33.02% |
| Chaos Tour | 11 | 260 | 4.23% | 2.38% | 7.42% |
| Cult Hypergrowth | 4 | 260 | 1.54% | 0.60% | 3.89% |
| No Social (Fame 0-50) | 13 | 260 | 5.00% | 2.94% | 8.37% |
| High Controversy | 29 | 260 | 11.15% | 7.88% | 15.56% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 4 | 260 | 1.54% | 0.60% | 3.89% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €55.731 | 259 / €55.946 | 1 / €0 |
| Bootstrap Struggle | 260 / €623 | 35 / €4.631 | 225 / €0 |
| Aggressive Marketing | 260 / €24.259 | 257 / €24.542 | 3 / €0 |
| Scandal Recovery | 260 / €5.765 | 161 / €9.310 | 99 / €0 |
| Festival Push | 260 / €9.738 | 189 / €13.397 | 71 / €0 |
| Chaos Tour | 260 / €16.384 | 249 / €17.108 | 11 / €0 |
| Cult Hypergrowth | 260 / €26.389 | 256 / €26.801 | 4 / €0 |
| No Social (Fame 0-50) | 260 / €16.129 | 247 / €16.978 | 13 / €0 |
| High Controversy | 260 / €15.797 | 231 / €17.780 | 29 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €10.889 | 258 / €10.973 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €13.882 | 256 / €14.099 | 4 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.073 | 260 / €29.073 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €19.921 | 0.3574 | 62.03% | 76.46% |
| Bootstrap Struggle | €2.211 | 3.549 | 91.48% | 99.49% |
| Aggressive Marketing | €11.081 | 0.4568 | 59.32% | 82.89% |
| Scandal Recovery | €7.054 | 1.2236 | 82.19% | 99.30% |
| Festival Push | €9.278 | 0.9528 | 76.75% | 99.08% |
| Chaos Tour | €8.718 | 0.5321 | 62.39% | 91.00% |
| Cult Hypergrowth | €10.858 | 0.4115 | 56.75% | 76.61% |
| No Social (Fame 0-50) | €8.569 | 0.5313 | 61.49% | 88.95% |
| High Controversy | €10.074 | 0.6377 | 63.26% | 92.00% |
| Early Game Probe (Fame 0–50) | €4.605 | 0.4229 | 31.37% | 51.30% |
| Mid Game Probe (Fame 60–150) | €7.010 | 0.505 | 47.50% | 77.46% |
| Late Game Probe (Fame 175+) | €8.902 | 0.3062 | 48.94% | 67.66% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 164 |
| brandDealsAvailable | 54 |
| postOptionsAvailable | 36 |
| contrabandItemsAvailable | 37 |
| upgradesAvailable | 67 |
| socialPlatformsAvailable | 4 |
| trendsAvailable | 5 |
| songsAvailable | 7 |
| questsAvailable | 32 |
| assetChassisAvailable | 24 |
| assetModulesAvailable | 63 |
| loanProfilesAvailable | 5 |

## Ausführungsabdeckung (Coverage)

| Feature | Covered | Evaluations / Attempts | Activations / Successes | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 143770 | 2296 | 53 |
| postOptions | ✅ | 11885 | 11885 | 28 |
| socialTrends | ✅ | 178296 | 21437 | 5 |
| contraband | ✅ | 178296 | 19678 | 37 |
| minigamesTravel | ✅ | 73378 | 73378 | - |
| minigamesRoadie | ✅ | 24314 | 24314 | - |
| minigamesKabelsalat | ✅ | 24605 | 24605 | - |
| minigamesAmp | ✅ | 24459 | 24459 | - |
| sponsorship | ✅ | 159232 | 1817 | - |
| restStops | ✅ | 94474 | 14743 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €55.731 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 816.22 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 86.54% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €623 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 815.53 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €24.259 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 964.49 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 38.08% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €5.765 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 880.32 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 27.31% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.738 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1053.17 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.384 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 848.77 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.389 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 937.02 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -0.77% | €-1.354 | 86.83 | 0.41 |
| Bootstrap Struggle | 0.77% | €-240 | 114.3 | -0.5 |
| Aggressive Marketing | -1.16% | €576 | 175.21 | -0.07 |
| Scandal Recovery | -0.77% | €-409 | 117.92 | 0.28 |
| Festival Push | 5.39% | €-865 | 217.89 | -1 |
| Chaos Tour | -1.15% | €-1.119 | 179.92 | -0.44 |
| Cult Hypergrowth | 0% | €56 | 144.36 | 0.16 |
| No Social (Fame 0-50) | 1.54% | €144 | 239.7 | 0.26 |
| High Controversy | 6.15% | €-817 | 149.39 | -1.48 |
| Early Game Probe (Fame 0–50) | -0.77% | €278 | 89.99 | 0.01 |
| Mid Game Probe (Fame 60–150) | 0.39% | €-903 | 147.53 | -0.21 |
| Late Game Probe (Fame 175+) | 0% | €-561 | 52.73 | 0.06 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 86.54% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €55.731 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.17 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
