# Game Balance Simulation – Analyse

Erstellt am: 2026-07-27T13:20:08.155Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.1
- Basis-Commit: e0dbeb8c7e52c01beb6ed6a18801b1eeaa3431db
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 97e8a7e4b21cbf114556c49e59dd2b587a2d3d511d2d9d6b9c9393f48d709eb6
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
| Baseline Touring | €500 | 0 | €48.654 | 61.55% | 0.11 | 1.1% | 21350 | 10 | 40 | 11.32 | 60.18 | 6.46 | 0% | €2.216 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.650 | 91.25% | 0.25 | 0.8% | 1651 | 2 | 54 | 0.7 | 7.84 | 4.65 | 60.38% | €1.843 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €23.586 | 58.23% | 0.12 | 1.9% | 8207 | 6 | 55 | 5.6 | 29.78 | 5.97 | 0.77% | €2.615 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €7.215 | 77.29% | 0.17 | 1.4% | 3774 | 4 | 51 | 2.67 | 14.98 | 4.85 | 19.23% | €2.049 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €11.441 | 71.19% | 0.14 | 2.7% | 5330 | 5 | 53 | 2.43 | 15.87 | 5.07 | 13.46% | €2.471 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €17.396 | 57.92% | 0.15 | 1.1% | 7521 | 6 | 41 | 4.75 | 27.04 | 5.81 | 2.69% | €2.160 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €24.746 | 57.49% | 0.11 | 2.3% | 8421 | 6 | 52 | 5.07 | 29.87 | 5.87 | 0.77% | €2.674 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €17.259 | 54.75% | 0.15 | 1% | 9031 | 6 | 51 | 0 | 28.82 | 5.65 | 0.77% | €2.043 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €17.189 | 56.81% | 0.15 | 0.8% | 6627 | 5 | 49 | 11.32 | 27.28 | 5.76 | 3.85% | €1.966 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €12.049 | 27.53% | 0.13 | 1.8% | 3221 | 4 | 42 | 5.65 | 9.13 | 2.42 | 0% | €2.054 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €15.593 | 44.71% | 0.15 | 1.6% | 4398 | 4 | 48 | 4.13 | 15.8 | 5.14 | 0.77% | €2.265 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €30.719 | 50.75% | 0.1 | 2.8% | 10797 | 7 | 40 | 11.28 | 25.99 | 5.08 | 0% | €2.624 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €52.835 | €500 | €2.216 | 6.66 | 2.17 | 21.42 | 8.02 | 11.86 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €7.497 | €159 | €1.843 | 0.23 | 0.23 | 5.96 | 0.71 | 3.68 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €32.414 | €447 | €2.615 | 2.67 | 1.12 | 17.03 | 4.21 | 7.76 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €12.642 | €336 | €2.049 | 0.87 | 0.5 | 10.17 | 2 | 5.44 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €16.514 | €359 | €2.471 | 1.08 | 0.6 | 11.77 | 2.07 | 5.39 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €22.858 | €437 | €2.160 | 2.25 | 1.06 | 14.55 | 3.6 | 7.4 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.162 | €448 | €2.674 | 2.73 | 1.18 | 17.21 | 4.19 | 7.4 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €22.750 | €448 | €2.043 | 0 | 0 | 15.59 | 4.03 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €21.466 | €409 | €1.966 | 2.28 | 1.06 | 14.61 | 3.78 | 7.43 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.711 | €450 | €2.054 | 0.21 | 0.17 | 3.89 | 1 | 1.92 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €19.686 | €1.393 | €2.265 | 0.97 | 0.43 | 8.19 | 2.12 | 4.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.070 | €4.936 | €2.624 | 1.35 | 0.55 | 8.96 | 3.6 | 4.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €26.090 | €27.937 | €38.265 | €48.654 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €5.150 | €2.732 | €2.088 | €1.650 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €14.110 | €17.799 | €21.696 | €23.586 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €7.181 | €6.695 | €6.241 | €7.215 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.363 | €8.329 | €8.944 | €11.441 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €10.834 | €12.563 | €15.562 | €17.396 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €15.423 | €18.654 | €23.138 | €24.746 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.926 | €12.765 | €16.092 | €17.259 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €8.302 | €11.279 | €14.876 | €17.189 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €10.781 | — | — | €12.049 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €12.519 | €14.848 | — | €15.593 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.947 | — | — | €30.719 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.216 | €97 | 22.7× | 11.28 | 0.68 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.843 | €60 | 31.6× | 13.56 | 0.81 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.615 | €90 | 29.3× | 9.56 | 0.57 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.049 | €72 | 29× | 12.2 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.471 | €77 | 32.3× | 10.12 | 0.61 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.160 | €85 | 25.5× | 11.57 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.674 | €90 | 29.9× | 9.35 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.043 | €86 | 23.8× | 12.24 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.966 | €83 | 24.1× | 12.72 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.054 | €74 | 27.9× | 12.17 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.265 | €85 | 26.9× | 11.04 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.624 | €96 | 27.5× | 9.53 | 0.57 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.4 | 50 | 50.4% | 43.1% | 6.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.8 | 48 | 57.2% | 38% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.8 | 54 | 36.9% | 52.5% | 10.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.4 | 50 | 47.7% | 45.9% | 6.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.4 | 56 | 28.7% | 59.2% | 12.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.8% | 32.7% | 3.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8 | 53 | 39.3% | 53.5% | 7.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.6 | 49 | 53.4% | 41.5% | 5.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 48 | 55.3% | 40% | 4.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 47.7% | 44.6% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 49 | 50.8% | 44.8% | 4.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 47.2% | 45.4% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 40 | 6.46 | 1.71 | 0.56 | 8.3 | 10.71 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 54 | 4.65 | 0.19 | 0.13 | 6.58 | 1.43 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 55 | 5.97 | 0.93 | 0.44 | 8.34 | 5.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 51 | 4.85 | 0.42 | 0.27 | 7.75 | 2.68 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 5.07 | 0.52 | 0.33 | 8.07 | 2.8 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 41 | 5.81 | 0.82 | 0.45 | 8.35 | 4.65 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 52 | 5.87 | 0.93 | 0.43 | 8.24 | 5.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 51 | 5.65 | 0 | 0 | 8.4 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 49 | 5.76 | 0.81 | 0.4 | 8.05 | 4.92 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.42 | 0.12 | 0.05 | 2.15 | 1.75 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 5.14 | 0.37 | 0.14 | 4.35 | 2.67 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 5.08 | 0.44 | 0.1 | 3.22 | 4.72 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1 | 1.78 | 1.61 | 0.74 | 3.99 | 9.07 | 29.62 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.17 | 1.8 | 1.78 | 0.15 | 0.73 | 7.1 | 10.76 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.93 | 2.71 | 2.66 | 0.67 | 3.58 | 8.81 | 24.81 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.92 | 3.15 | 3.18 | 0.46 | 2.15 | 8.22 | 16.96 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.09 | 1.74 | 1.76 | 0.27 | 1.28 | 8.75 | 18.66 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.75 | 4.33 | 4.35 | 1.15 | 5.18 | 8.91 | 22.37 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.63 | 2.73 | 2.35 | 0.62 | 3.05 | 8.93 | 25.08 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.44 | 2.23 | 2.21 | 0.52 | 2.6 | 9.1 | 23.57 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.31 | 2.23 | 2.27 | 0.53 | 2.62 | 8.46 | 21.95 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.2 | 0.36 | 0.39 | 0.11 | 0.67 | 2.34 | 5.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.62 | 1 | 0.83 | 0.26 | 1.19 | 4.79 | 12.52 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.6 | 0.84 | 0.98 | 0.49 | 2.54 | 3.46 | 12.58 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.18 | 19.94 | 20.26 | 19.98 | 120.36 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 7.84 | 2.69 | 2.48 | 2.67 | 15.68 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.78 | 10.19 | 9.86 | 9.74 | 59.57 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 14.98 | 4.98 | 4.93 | 5.07 | 29.96 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 15.87 | 5.37 | 5.27 | 5.23 | 31.74 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 27.04 | 9 | 9.1 | 8.93 | 54.07 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.87 | 9.98 | 10 | 9.89 | 59.74 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 28.82 | 9.39 | 9.78 | 9.65 | 57.64 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 27.28 | 9.21 | 9.05 | 9.02 | 54.56 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.13 | 3.04 | 2.98 | 3.12 | 18.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.8 | 5.27 | 5.35 | 5.18 | 31.6 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 25.99 | 8.69 | 8.69 | 8.61 | 51.98 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.85 | 0.33 | 6.77 | 1.06 | 3.61 | 4.75 | €3.273 | 6.39 | 100% |
| Bootstrap Struggle | 0.61 | 0.4 | 1.77 | 1.46 | 1.33 | 1.72 | €1.911 | 5.5 | 73.5% |
| Aggressive Marketing | 2.87 | 0.7 | 6.53 | 0.99 | 3.5 | 3.07 | €2.936 | 5.39 | 100% |
| Scandal Recovery | 1.52 | 0.75 | 4.08 | 1.55 | 2.36 | 2.67 | €2.052 | 7.22 | 94.6% |
| Festival Push | 1.94 | 0.92 | 5.02 | 1.33 | 2.78 | 1.56 | €2.201 | 7.02 | 100% |
| Chaos Tour | 2.55 | 0.9 | 6 | 1.18 | 3.27 | 3.12 | €2.757 | 6.84 | 94.6% |
| Cult Hypergrowth | 2.88 | 0.55 | 6.32 | 1.06 | 3.54 | 3.82 | €2.910 | 5.32 | 99.6% |
| No Social (Fame 0-50) | 2.43 | 0.82 | 5.88 | 1.3 | 3.25 | 2.78 | €2.644 | 6.47 | 99.2% |
| High Controversy | 2.37 | 0.9 | 5.34 | 1.25 | 3.17 | 3.37 | €2.704 | 7.44 | 95.8% |
| Early Game Probe (Fame 0–50) | 0.79 | 0.35 | 0.7 | 0.53 | 0.92 | 1.67 | €825 | 0.02 | 94.2% |
| Mid Game Probe (Fame 60–150) | 1.9 | 0.59 | 2.91 | 0.84 | 2.42 | 2.3 | €2.340 | 2.8 | 96.9% |
| Late Game Probe (Fame 175+) | 2.13 | 0.27 | 2.73 | 0.55 | 2.42 | 2.81 | €2.433 | 0.57 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €48.654 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 21350 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 60.38% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.674 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €52.835 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.18 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.76 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 47743 | 26351 | 0 | 26351 | 43 | 0 | 260/260 |
| Bootstrap Struggle | 6860 | 5191 | 0 | 5191 | 18 | 0 | 260/260 |
| Aggressive Marketing | 28079 | 19855 | 0 | 19855 | 17 | 0 | 260/260 |
| Scandal Recovery | 14032 | 10240 | 0 | 10240 | 19 | 0 | 260/260 |
| Festival Push | 17889 | 12548 | 0 | 12548 | 10 | 0 | 260/260 |
| Chaos Tour | 24110 | 16547 | 0 | 16547 | 42 | 0 | 260/260 |
| Cult Hypergrowth | 28655 | 20216 | 0 | 20216 | 18 | 0 | 260/260 |
| No Social (Fame 0-50) | 27251 | 18188 | 0 | 18188 | 32 | 0 | 260/260 |
| High Controversy | 23421 | 16762 | 0 | 16762 | 32 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7593 | 4363 | 0 | 4363 | 8 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13820 | 9467 | 0 | 9467 | 15 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 21106 | 10467 | 0 | 10467 | 18 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €48.654 | €47.726 | €16.586 | €29.037 | €71.316 |
| Bootstrap Struggle | €1.650 | €0 | €3.077 | €0 | €5.830 |
| Aggressive Marketing | €23.586 | €23.778 | €9.040 | €12.314 | €35.217 |
| Scandal Recovery | €7.215 | €5.817 | €6.468 | €0 | €16.636 |
| Festival Push | €11.441 | €10.246 | €8.508 | €0 | €22.610 |
| Chaos Tour | €17.396 | €16.638 | €8.732 | €7.013 | €29.032 |
| Cult Hypergrowth | €24.746 | €24.124 | €9.008 | €14.015 | €36.535 |
| No Social (Fame 0-50) | €17.259 | €16.241 | €8.480 | €6.898 | €29.155 |
| High Controversy | €17.189 | €15.819 | €8.622 | €6.996 | €29.121 |
| Early Game Probe (Fame 0–50) | €12.049 | €11.573 | €4.880 | €5.956 | €18.995 |
| Mid Game Probe (Fame 60–150) | €15.593 | €15.050 | €6.650 | €7.227 | €24.977 |
| Late Game Probe (Fame 175+) | €30.719 | €29.844 | €10.028 | €18.551 | €43.234 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 157 | 260 | 60.38% | 54.33% | 66.14% |
| Aggressive Marketing | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Scandal Recovery | 50 | 260 | 19.23% | 14.90% | 24.46% |
| Festival Push | 35 | 260 | 13.46% | 9.84% | 18.15% |
| Chaos Tour | 7 | 260 | 2.69% | 1.31% | 5.45% |
| Cult Hypergrowth | 2 | 260 | 0.77% | 0.21% | 2.76% |
| No Social (Fame 0-50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| High Controversy | 10 | 260 | 3.85% | 2.10% | 6.93% |
| Early Game Probe (Fame 0–50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Mid Game Probe (Fame 60–150) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €48.654 | 260 / €48.654 | 0 / €0 |
| Bootstrap Struggle | 260 / €1.650 | 103 / €4.166 | 157 / €0 |
| Aggressive Marketing | 260 / €23.586 | 258 / €23.768 | 2 / €0 |
| Scandal Recovery | 260 / €7.215 | 210 / €8.933 | 50 / €0 |
| Festival Push | 260 / €11.441 | 225 / €13.221 | 35 / €0 |
| Chaos Tour | 260 / €17.396 | 253 / €17.878 | 7 / €0 |
| Cult Hypergrowth | 260 / €24.746 | 258 / €24.938 | 2 / €0 |
| No Social (Fame 0-50) | 260 / €17.259 | 258 / €17.393 | 2 / €0 |
| High Controversy | 260 / €17.189 | 250 / €17.877 | 10 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €12.049 | 260 / €12.049 | 0 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €15.593 | 258 / €15.714 | 2 / €0 |
| Late Game Probe (Fame 175+) | 260 / €30.719 | 260 / €30.719 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €16.586 | 0.3409 | 61.55% | 74.46% |
| Bootstrap Struggle | €3.077 | 1.8648 | 91.25% | 99.83% |
| Aggressive Marketing | €9.040 | 0.3833 | 58.23% | 82.16% |
| Scandal Recovery | €6.468 | 0.8965 | 77.29% | 99.40% |
| Festival Push | €8.508 | 0.7436 | 71.19% | 99.24% |
| Chaos Tour | €8.732 | 0.502 | 57.92% | 91.94% |
| Cult Hypergrowth | €9.008 | 0.364 | 57.49% | 80.57% |
| No Social (Fame 0-50) | €8.480 | 0.4913 | 54.75% | 84.05% |
| High Controversy | €8.622 | 0.5016 | 56.81% | 90.31% |
| Early Game Probe (Fame 0–50) | €4.880 | 0.405 | 27.53% | 55.83% |
| Mid Game Probe (Fame 60–150) | €6.650 | 0.4265 | 44.71% | 72.34% |
| Late Game Probe (Fame 175+) | €10.028 | 0.3264 | 50.75% | 68.47% |

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
| brandDeals | ✅ | 156635 | 2363 | 53 |
| postOptions | ✅ | 12234 | 12234 | 29 |
| socialTrends | ✅ | 191964 | 22869 | 5 |
| contraband | ✅ | 191964 | 21267 | 37 |
| minigamesTravel | ✅ | 76071 | 44860 | - |
| minigamesRoadie | ✅ | 25417 | 23083 | - |
| minigamesKabelsalat | ✅ | 25412 | 17759 | - |
| minigamesAmp | ✅ | 25242 | 18208 | - |
| sponsorship | ✅ | 172570 | 1880 | - |
| restStops | ✅ | 98773 | 15853 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €48.654 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 790.74 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 60.38% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €1.650 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 831.62 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €23.586 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 943.7 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 19.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €7.215 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 919.13 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 13.46% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €8.500 – €50.000 | €11.441 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1104.28 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 2.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €17.396 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 886.96 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €24.746 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 963.59 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 60.38% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €48.654 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.76 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
