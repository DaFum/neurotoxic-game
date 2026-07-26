# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T22:24:50.715Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.2
- Basis-Commit: c60a079143201b39f878c4d69ae8a5ee2e52de35
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 9fe00b42a75a62090c23cdf62086b266cd964330d4d1b7d6d1ca6e58d0d6889e
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
| Baseline Touring | €500 | 0 | €56.304 | 60.82% | 0.1 | 3% | 22719 | 10 | 39 | 13.77 | 60.36 | 6.44 | 0% | €2.498 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €708 | 90.98% | 0.24 | 1.5% | 1083 | 2 | 56 | 1.38 | 4.37 | 2.49 | 86.15% | €1.158 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €24.007 | 58.88% | 0.11 | 3.8% | 9584 | 6 | 54 | 4.63 | 29.38 | 5.88 | 1.92% | €2.748 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €6.016 | 82.35% | 0.17 | 2% | 3433 | 4 | 53 | 2.16 | 13.33 | 4.44 | 39.62% | €1.943 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.490 | 77.46% | 0.14 | 3.5% | 4167 | 4 | 55 | 2.34 | 14.65 | 4.74 | 24.62% | €2.386 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.882 | 61.57% | 0.14 | 2% | 6447 | 5 | 43 | 4.48 | 26.47 | 5.78 | 5.38% | €2.248 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €24.767 | 59.8% | 0.1 | 4.2% | 7890 | 6 | 53 | 5.85 | 29.14 | 5.83 | 3.08% | €2.826 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €16.129 | 61.49% | 0.14 | 1.5% | 8843 | 6 | 50 | 0 | 27.87 | 5.51 | 5% | €2.138 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €15.306 | 65.4% | 0.14 | 1.7% | 5914 | 5 | 51 | 12.83 | 26.08 | 5.44 | 8.08% | €2.023 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €10.821 | 32.02% | 0.13 | 1.6% | 3046 | 3 | 41 | 5.78 | 9.07 | 2.5 | 0.77% | €2.041 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €14.116 | 46.96% | 0.15 | 1.8% | 4439 | 4 | 48 | 4.86 | 15.72 | 4.97 | 2.31% | €2.275 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €28.676 | 49.06% | 0.1 | 3% | 10619 | 7 | 40 | 11.44 | 25.98 | 5.17 | 0% | €2.647 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €59.507 | €498 | €2.498 | 6.78 | 2.34 | 21.31 | 8 | 11.85 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €4.109 | €88 | €1.158 | 0.2 | 0.14 | 2.82 | 0.31 | 1.73 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €31.398 | €400 | €2.748 | 2.8 | 1.17 | 16.87 | 4.17 | 7.68 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €10.894 | €220 | €1.943 | 0.77 | 0.41 | 8.8 | 1.77 | 4.76 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €14.707 | €261 | €2.386 | 0.87 | 0.52 | 10.58 | 2 | 4.96 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €22.326 | €383 | €2.248 | 2.71 | 1.06 | 14.12 | 3.5 | 7.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €32.852 | €404 | €2.826 | 2.8 | 1.15 | 16.65 | 4.02 | 7.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €21.811 | €379 | €2.138 | 0 | 0 | 15.13 | 3.89 | 7.56 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.423 | €315 | €2.023 | 2.31 | 1.09 | 14.09 | 3.68 | 7.09 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.642 | €397 | €2.041 | 0.31 | 0.17 | 3.84 | 1.01 | 1.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.094 | €1.320 | €2.275 | 0.78 | 0.38 | 8.18 | 2.13 | 4 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €38.915 | €4.952 | €2.647 | 1.37 | 0.56 | 8.83 | 3.54 | 4.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.034 | €28.430 | €41.665 | €56.304 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.537 | €1.042 | €796 | €708 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €13.002 | €16.341 | €20.093 | €24.007 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.878 | €4.961 | €4.605 | €6.016 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.450 | €6.829 | €7.157 | €9.490 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €9.743 | €11.822 | €14.179 | €16.882 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.301 | €17.603 | €21.167 | €24.767 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.233 | €11.236 | €13.816 | €16.129 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.285 | €10.015 | €13.148 | €15.306 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.676 | — | — | €10.821 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.575 | €13.350 | — | €14.116 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.378 | — | — | €28.676 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.498 | €98 | 25.6× | 10.01 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.158 | €57 | 32× | 21.59 | 1.3 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.748 | €89 | 31.1× | 9.1 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.943 | €69 | 30.6× | 12.87 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.386 | €75 | 34× | 10.48 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.248 | €84 | 27.2× | 11.12 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.826 | €89 | 32.1× | 8.85 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.138 | €84 | 25.5× | 11.69 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.023 | €80 | 26.4× | 12.36 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.041 | €72 | 28.5× | 12.25 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.275 | €83 | 27.5× | 10.99 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.647 | €96 | 27.7× | 9.44 | 0.57 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.4 | 50 | 50.2% | 43.6% | 6.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.4 | 54 | 49.9% | 43.2% | 6.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.8 | 54 | 37.1% | 53% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.3 | 52 | 46.7% | 45.6% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.3 | 57 | 28.1% | 57.3% | 14.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 62.8% | 33.2% | 4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8.1 | 53 | 40.7% | 53% | 6.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.3% | 40.8% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 49 | 55% | 39.2% | 5.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 48.4% | 44.1% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 50 | 49.1% | 46.7% | 4.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 48.4% | 44.4% | 7.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.44 | 1.8 | 0.57 | 8.07 | 11.03 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 56 | 2.49 | 0.13 | 0.07 | 3.4 | 0.85 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 5.88 | 0.93 | 0.41 | 8.12 | 5.23 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 53 | 4.44 | 0.33 | 0.21 | 6.92 | 2.55 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 4.74 | 0.41 | 0.25 | 7.42 | 2.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 43 | 5.78 | 0.86 | 0.37 | 8.32 | 4.71 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.83 | 0.91 | 0.47 | 8.41 | 5.17 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.51 | 0 | 0 | 8.23 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 5.44 | 0.83 | 0.43 | 7.9 | 4.66 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 41 | 2.5 | 0.14 | 0.03 | 2.07 | 1.69 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 4.97 | 0.3 | 0.1 | 4.37 | 2.72 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 5.17 | 0.42 | 0.11 | 3.34 | 4.53 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.01 | 1.66 | 1.53 | 0.79 | 4.16 | 8.8 | 29.62 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.63 | 0.95 | 0.82 | 0.08 | 0.37 | 3.56 | 4.94 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.85 | 2.71 | 2.7 | 0.66 | 3.4 | 9.08 | 24.74 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.65 | 2.99 | 2.8 | 0.39 | 1.99 | 7.37 | 14.49 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.93 | 1.64 | 1.57 | 0.17 | 0.99 | 8.08 | 16.98 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.67 | 4.23 | 4.35 | 0.98 | 5.19 | 8.54 | 21.7 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.58 | 2.42 | 2.46 | 0.68 | 2.92 | 8.74 | 24.4 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.37 | 2.1 | 2.25 | 0.53 | 2.49 | 9.03 | 22.97 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.27 | 2.18 | 2.24 | 0.43 | 2.47 | 8.33 | 21.12 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.21 | 0.38 | 0.4 | 0.1 | 0.58 | 2.38 | 5.72 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.64 | 0.99 | 1.02 | 0.23 | 1.19 | 4.74 | 12.43 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.65 | 0.91 | 0.98 | 0.61 | 2.5 | 3.43 | 12.45 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.36 | 20.13 | 20.27 | 19.96 | 120.72 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 4.37 | 1.48 | 1.47 | 1.42 | 8.74 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.38 | 9.7 | 9.75 | 9.93 | 58.76 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 13.33 | 4.4 | 4.43 | 4.5 | 26.66 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.65 | 4.92 | 4.94 | 4.79 | 29.3 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.47 | 8.73 | 8.91 | 8.83 | 52.94 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.14 | 9.67 | 9.86 | 9.61 | 58.28 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 27.87 | 9.07 | 9.45 | 9.36 | 55.75 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 26.08 | 8.8 | 8.71 | 8.57 | 52.16 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.07 | 3.05 | 2.95 | 3.08 | 18.15 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.72 | 5.2 | 5.35 | 5.18 | 31.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 25.98 | 8.64 | 8.7 | 8.64 | 51.96 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.88 | 0.36 | 6.85 | 0.99 | 3.59 | 4.87 | €3.255 | 5.96 | 100% |
| Bootstrap Struggle | 0.3 | 0.2 | 0.64 | 0.77 | 0.57 | 0.97 | €1.021 | 2.01 | 65.4% |
| Aggressive Marketing | 2.78 | 0.74 | 6.27 | 1 | 3.45 | 3.07 | €2.878 | 5.62 | 100% |
| Scandal Recovery | 1.12 | 0.6 | 3.01 | 1.43 | 1.92 | 2.34 | €1.849 | 6.16 | 93.5% |
| Festival Push | 1.62 | 0.79 | 4.05 | 1.23 | 2.37 | 1.49 | €2.035 | 6.36 | 98.5% |
| Chaos Tour | 2.4 | 0.94 | 5.69 | 1.19 | 3.12 | 3.04 | €2.714 | 6.88 | 96.2% |
| Cult Hypergrowth | 2.79 | 0.57 | 6.04 | 1.07 | 3.46 | 3.66 | €2.859 | 5.69 | 99.6% |
| No Social (Fame 0-50) | 2.31 | 0.9 | 5.44 | 1.31 | 3.11 | 2.68 | €2.548 | 6.97 | 98.1% |
| High Controversy | 2.12 | 0.83 | 4.93 | 1.25 | 2.92 | 3.4 | €2.503 | 7.42 | 96.5% |
| Early Game Probe (Fame 0–50) | 0.71 | 0.33 | 0.58 | 0.52 | 0.84 | 1.6 | €860 | 0.03 | 93.5% |
| Mid Game Probe (Fame 60–150) | 1.78 | 0.6 | 2.63 | 0.92 | 2.29 | 2.32 | €2.215 | 2.82 | 96.2% |
| Late Game Probe (Fame 175+) | 2.21 | 0.26 | 2.68 | 0.57 | 2.52 | 2.8 | €2.474 | 0.65 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €56.304 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 22719 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 86.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.826 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €59.507 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.36 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.42 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 48774 | 26013 | 0 | 26013 | 42 | 0 | 260/260 |
| Bootstrap Struggle | 3497 | 2407 | 0 | 2407 | 8 | 0 | 260/260 |
| Aggressive Marketing | 29197 | 19596 | 0 | 19596 | 16 | 0 | 260/260 |
| Scandal Recovery | 12234 | 8786 | 0 | 8786 | 15 | 0 | 260/260 |
| Festival Push | 15324 | 11148 | 0 | 11148 | 10 | 0 | 260/260 |
| Chaos Tour | 22395 | 15902 | 0 | 15902 | 45 | 0 | 260/260 |
| Cult Hypergrowth | 27188 | 19281 | 0 | 19281 | 17 | 0 | 260/260 |
| No Social (Fame 0-50) | 26446 | 17572 | 0 | 17572 | 32 | 0 | 260/260 |
| High Controversy | 22076 | 16134 | 0 | 16134 | 29 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7452 | 4396 | 0 | 4396 | 10 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13762 | 9368 | 0 | 9368 | 15 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 20752 | 10289 | 0 | 10289 | 20 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €56.304 | €52.895 | €20.662 | €31.739 | €83.606 |
| Bootstrap Struggle | €708 | €0 | €2.294 | €0 | €1.962 |
| Aggressive Marketing | €24.007 | €23.875 | €9.661 | €11.341 | €35.367 |
| Scandal Recovery | €6.016 | €3.885 | €7.262 | €0 | €17.093 |
| Festival Push | €9.490 | €7.877 | €9.019 | €0 | €22.036 |
| Chaos Tour | €16.882 | €16.470 | €9.106 | €4.523 | €28.849 |
| Cult Hypergrowth | €24.767 | €24.737 | €10.454 | €12.361 | €36.622 |
| No Social (Fame 0-50) | €16.129 | €15.021 | €8.569 | €5.131 | €27.560 |
| High Controversy | €15.306 | €14.305 | €9.051 | €3.134 | €28.281 |
| Early Game Probe (Fame 0–50) | €10.821 | €10.249 | €4.663 | €5.601 | €16.816 |
| Mid Game Probe (Fame 60–150) | €14.116 | €13.664 | €6.903 | €5.294 | €23.130 |
| Late Game Probe (Fame 175+) | €28.676 | €28.405 | €9.014 | €18.146 | €39.503 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 224 | 260 | 86.15% | 81.43% | 89.83% |
| Aggressive Marketing | 5 | 260 | 1.92% | 0.82% | 4.42% |
| Scandal Recovery | 103 | 260 | 39.62% | 33.86% | 45.67% |
| Festival Push | 64 | 260 | 24.62% | 19.77% | 30.20% |
| Chaos Tour | 14 | 260 | 5.38% | 3.23% | 8.83% |
| Cult Hypergrowth | 8 | 260 | 3.08% | 1.57% | 5.95% |
| No Social (Fame 0-50) | 13 | 260 | 5.00% | 2.94% | 8.37% |
| High Controversy | 21 | 260 | 8.08% | 5.34% | 12.03% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €56.304 | 260 / €56.304 | 0 / €0 |
| Bootstrap Struggle | 260 / €708 | 36 / €5.110 | 224 / €0 |
| Aggressive Marketing | 260 / €24.007 | 255 / €24.478 | 5 / €0 |
| Scandal Recovery | 260 / €6.016 | 157 / €9.963 | 103 / €0 |
| Festival Push | 260 / €9.490 | 196 / €12.588 | 64 / €0 |
| Chaos Tour | 260 / €16.882 | 246 / €17.843 | 14 / €0 |
| Cult Hypergrowth | 260 / €24.767 | 252 / €25.553 | 8 / €0 |
| No Social (Fame 0-50) | 260 / €16.129 | 247 / €16.978 | 13 / €0 |
| High Controversy | 260 / €15.306 | 239 / €16.651 | 21 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €10.821 | 258 / €10.904 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €14.116 | 254 / €14.449 | 6 / €0 |
| Late Game Probe (Fame 175+) | 260 / €28.676 | 260 / €28.676 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €20.662 | 0.367 | 60.82% | 76.10% |
| Bootstrap Struggle | €2.294 | 3.2401 | 90.98% | 99.43% |
| Aggressive Marketing | €9.661 | 0.4024 | 58.88% | 79.46% |
| Scandal Recovery | €7.262 | 1.2071 | 82.35% | 99.30% |
| Festival Push | €9.019 | 0.9504 | 77.46% | 98.94% |
| Chaos Tour | €9.106 | 0.5394 | 61.57% | 92.63% |
| Cult Hypergrowth | €10.454 | 0.4221 | 59.80% | 83.78% |
| No Social (Fame 0-50) | €8.569 | 0.5313 | 61.49% | 88.95% |
| High Controversy | €9.051 | 0.5913 | 65.40% | 93.08% |
| Early Game Probe (Fame 0–50) | €4.663 | 0.4309 | 32.02% | 52.86% |
| Mid Game Probe (Fame 60–150) | €6.903 | 0.489 | 46.96% | 77.56% |
| Late Game Probe (Fame 175+) | €9.014 | 0.3143 | 49.06% | 67.78% |

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

| Feature | Covered | Evaluations / Attempts | Activations / Completions | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 144429 | 2334 | 50 |
| postOptions | ✅ | 11877 | 11877 | 28 |
| socialTrends | ✅ | 178928 | 21344 | 5 |
| contraband | ✅ | 178928 | 19905 | 37 |
| minigamesTravel | ✅ | 73433 | 43381 | - |
| minigamesRoadie | ✅ | 24385 | 22227 | - |
| minigamesKabelsalat | ✅ | 24646 | 17276 | - |
| minigamesAmp | ✅ | 24402 | 17654 | - |
| sponsorship | ✅ | 159864 | 1838 | - |
| restStops | ✅ | 94742 | 14705 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €56.304 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 804.3 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 86.15% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €708 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 828.03 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €24.007 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 993.58 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 39.62% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €6.016 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 910.05 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 24.62% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.490 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1032.44 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 5.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.882 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 843.02 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 3.08% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €24.767 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 937.21 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -1.15% | €-781 | 74.91 | 0.24 |
| Bootstrap Struggle | 0.38% | €-155 | 126.8 | -0.36 |
| Aggressive Marketing | -0.39% | €324 | 204.3 | -0.23 |
| Scandal Recovery | 0.77% | €-158 | 147.65 | 0.43 |
| Festival Push | 2.7% | €-1.113 | 197.16 | -0.82 |
| Chaos Tour | 0% | €-621 | 174.17 | -0.3 |
| Cult Hypergrowth | 1.54% | €-1.566 | 144.55 | -0.37 |
| No Social (Fame 0-50) | 1.54% | €144 | 240.85 | 0.26 |
| High Controversy | 3.08% | €-1.308 | 142.17 | -0.98 |
| Early Game Probe (Fame 0–50) | -0.77% | €210 | 91.11 | 0 |
| Mid Game Probe (Fame 60–150) | 1.16% | €-669 | 146.75 | -0.16 |
| Late Game Probe (Fame 175+) | 0% | €-958 | 53.36 | -0.04 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 86.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €56.304 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.42 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
