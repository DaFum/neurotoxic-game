# Game Balance Simulation – Analyse

Erstellt am: 2026-07-18T07:23:41.118Z

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
| 70 | 800 | 7 | 19 | 30 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 950 | 6 | 16 | 25 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 1100 | 5 | 14 | 22 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 162 |
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
| special | 24 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €136.432 | 54.6% | 0.06 | 7% | 15004 | 8 | 46 | 14.79 | 65.95 | 6.03 | 0% | €3.590 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €2.904 | 39.5% | 0.18 | 3.2% | 809 | 2 | 55 | 1.09 | 6.35 | 3.7 | 67.69% | €2.567 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €37.974 | 54.7% | 0.08 | 6.7% | 2973 | 3 | 56 | 6.22 | 30.18 | 5.97 | 0.77% | €3.502 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €13.545 | 50.7% | 0.12 | 4.5% | 1551 | 2 | 53 | 2.03 | 15.5 | 5.01 | 19.62% | €2.890 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €17.119 | 51.2% | 0.1 | 7.4% | 1833 | 3 | 54 | 2.6 | 16.52 | 5.07 | 11.15% | €3.301 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €27.593 | 51% | 0.1 | 4% | 2279 | 3 | 50 | 4.02 | 28.85 | 6.31 | 0.77% | €3.085 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €40.444 | 53.5% | 0.08 | 7.8% | 3212 | 4 | 57 | 5.32 | 30.5 | 5.95 | 0.77% | €3.648 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €29.972 | 50.8% | 0.09 | 4.7% | 2495 | 3 | 55 | 0 | 29.82 | 5.94 | 1.54% | €3.137 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €29.917 | 50.7% | 0.1 | 4.9% | 2527 | 3 | 53 | 11.86 | 28.89 | 6.06 | 1.92% | €3.126 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €16.263 | 13% | 0.09 | 3.9% | 1930 | 3 | 45 | 4.12 | 9.18 | 2.35 | 0% | €2.782 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €22.416 | 32.4% | 0.11 | 4.1% | 1998 | 3 | 50 | 4.95 | 16.15 | 5.63 | 0.38% | €3.069 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €46.014 | 52.2% | 0.07 | 5.9% | 8002 | 6 | 47 | 11.74 | 27.5 | 4.98 | 0% | €3.469 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €137.131 | €500 | €3.590 | 7.8 | 2.43 | 21.66 | 8.66 | 12.62 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €7.867 | €114 | €2.567 | 0.2 | 0.18 | 3.96 | 0.57 | 2.9 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €44.392 | €410 | €3.502 | 2.84 | 1.17 | 15.31 | 4.23 | 7.86 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €18.657 | €257 | €2.890 | 0.98 | 0.52 | 8.69 | 2.07 | 5.4 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €23.255 | €294 | €3.301 | 0.84 | 0.53 | 9.93 | 2.16 | 5.44 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €35.850 | €404 | €3.085 | 3.07 | 1.29 | 13.72 | 3.85 | 7.69 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €47.476 | €407 | €3.648 | 3.27 | 1.24 | 15.36 | 4.28 | 7.43 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €37.929 | €400 | €3.137 | 0 | 0 | 14.2 | 4.14 | 7.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €37.320 | €340 | €3.126 | 3.01 | 1.26 | 13.93 | 4 | 7.72 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.090 | €405 | €2.782 | 0.27 | 0.13 | 3.35 | 0.97 | 2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €26.715 | €1.347 | €3.069 | 0.95 | 0.42 | 7.23 | 2.16 | 4.08 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €51.131 | €4.983 | €3.469 | 1.66 | 0.57 | 8.79 | 3.74 | 4.84 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €30.900 | €54.675 | €97.649 | €136.432 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.947 | €2.612 | €2.255 | €2.904 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €17.580 | €21.941 | €27.550 | €37.974 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €9.308 | €8.785 | €9.337 | €13.545 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.368 | €11.011 | €12.370 | €17.119 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €14.443 | €17.901 | €23.344 | €27.593 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €18.544 | €23.256 | €29.495 | €40.444 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €14.588 | €18.615 | €24.325 | €29.972 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €12.567 | €17.220 | €23.615 | €29.917 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €14.769 | €0 | €0 | €16.263 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €15.856 | €21.198 | €0 | €22.416 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €32.029 | €0 | €0 | €46.014 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.590 | €97 | 37.1× | 6.96 | 0.42 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.567 | €63 | 40.9× | 9.74 | 0.58 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.502 | €89 | 39.4× | 7.14 | 0.43 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.890 | €76 | 37.9× | 8.65 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.301 | €80 | 41.5× | 7.57 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €3.085 | €88 | 35.1× | 8.1 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.648 | €89 | 40.8× | 6.85 | 0.41 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €3.137 | €88 | 35.7× | 7.97 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €3.126 | €87 | 36.1× | 8 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.782 | €76 | 36.6× | 8.98 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €3.069 | €86 | 35.8× | 8.15 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.469 | €95 | 36.5× | 7.21 | 0.43 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8 | 53 | 39.8% | 51.7% | 8.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.4 | 50 | 49.6% | 42.7% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.7 | 55 | 34.9% | 55.2% | 9.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.2 | 52 | 44.2% | 48.7% | 7.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7 | 59 | 22.4% | 60.3% | 17.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 8.5 | 50 | 51.3% | 42.8% | 5.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 7.6 | 55 | 33.3% | 55.4% | 11.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.4 | 51 | 48.5% | 45.4% | 6.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.4 | 51 | 46.6% | 47.3% | 6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8 | 53 | 40.1% | 51.7% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.3 | 51 | 44.3% | 50.8% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 7.8 | 54 | 36.5% | 54.6% | 8.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 46 | 6.03 | 1.87 | 0.48 | 8.15 | 12.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 55 | 3.7 | 0.15 | 0.12 | 5.19 | 1.16 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 56 | 5.97 | 0.91 | 0.42 | 8.37 | 5.32 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 53 | 5.01 | 0.44 | 0.27 | 7.5 | 2.85 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 54 | 5.07 | 0.42 | 0.28 | 7.85 | 2.97 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 50 | 6.31 | 1.07 | 0.54 | 7.72 | 5.09 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 57 | 5.95 | 0.99 | 0.39 | 8.07 | 5.19 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 55 | 5.94 | 0 | 0 | 8.35 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| High Controversy | 53 | 6.06 | 1 | 0.45 | 8.33 | 5.07 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 45 | 2.35 | 0.12 | 0.02 | 2.36 | 1.6 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 50 | 5.63 | 0.34 | 0.12 | 4.16 | 2.95 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 47 | 4.98 | 0.46 | 0.06 | 3.23 | 5.15 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.22 | 1.7 | 1.67 | 1.07 | 4.45 | 9.26 | 29.89 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.76 | 1.45 | 1.45 | 0.11 | 0.67 | 5.71 | 7.55 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.84 | 2.75 | 2.94 | 0.72 | 3.46 | 8.78 | 23.12 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.96 | 3.26 | 3.21 | 0.49 | 2.35 | 8.12 | 15.15 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.12 | 1.73 | 1.65 | 0.3 | 1.26 | 8.48 | 16.64 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.8 | 4.33 | 4.38 | 1.12 | 5.32 | 9.31 | 21.47 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.53 | 2.67 | 2.53 | 0.68 | 3.14 | 9.02 | 23.05 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.5 | 2.38 | 2.32 | 0.53 | 2.98 | 8.78 | 22.06 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.58 | 2.23 | 2.2 | 0.59 | 2.78 | 8.98 | 21.45 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.18 | 0.41 | 0.41 | 0.13 | 0.47 | 2.42 | 5.21 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.58 | 0.91 | 0.9 | 0.25 | 1.18 | 4.92 | 11.46 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.6 | 0.91 | 0.82 | 0.57 | 2.74 | 3.73 | 12.46 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 65.95 | 22.01 | 22.08 | 21.86 | 131.9 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 6.35 | 2.12 | 2.24 | 1.99 | 12.7 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.18 | 9.98 | 10.15 | 10.06 | 60.37 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 15.5 | 5.23 | 5.08 | 5.18 | 30.99 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 16.52 | 5.55 | 5.47 | 5.5 | 33.04 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 28.85 | 9.48 | 9.77 | 9.6 | 57.7 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 30.5 | 10.27 | 10.09 | 10.14 | 61 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 29.82 | 9.7 | 10.06 | 10.06 | 59.64 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 28.89 | 9.67 | 9.52 | 9.7 | 57.78 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.18 | 3.16 | 3.05 | 2.97 | 18.36 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 16.15 | 5.34 | 5.38 | 5.43 | 32.3 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 27.5 | 8.98 | 9.3 | 9.22 | 55 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 3.01 | 0.2 | 6.96 | 0.95 | 3.65 | 4.88 | €3.035 | 4.68 | 100% |
| Bootstrap Struggle | 0.68 | 0.38 | 1.68 | 1.08 | 1.24 | 1.33 | €1.541 | 3.95 | 100% |
| Aggressive Marketing | 2.97 | 0.55 | 6.28 | 0.97 | 3.55 | 2.93 | €2.984 | 4.91 | 100% |
| Scandal Recovery | 1.97 | 0.86 | 4.52 | 1.19 | 2.63 | 2.66 | €2.200 | 6.25 | 100% |
| Festival Push | 2.33 | 0.78 | 5.33 | 1.2 | 3.08 | 1.6 | €2.257 | 6.09 | 100% |
| Chaos Tour | 2.85 | 0.6 | 6.38 | 1.12 | 3.56 | 3.4 | €3.121 | 5.82 | 100% |
| Cult Hypergrowth | 3 | 0.37 | 6.44 | 1.02 | 3.62 | 4.05 | €2.976 | 4.63 | 100% |
| No Social (Fame 0-50) | 2.84 | 0.65 | 6.28 | 1.02 | 3.47 | 2.88 | €2.919 | 5.26 | 100% |
| High Controversy | 2.75 | 0.7 | 6.2 | 1.1 | 3.47 | 3.65 | €2.979 | 5.91 | 100% |
| Early Game Probe (Fame 0–50) | 1 | 0.3 | 0.82 | 0.54 | 1.15 | 1.67 | €799 | 0.01 | 100% |
| Mid Game Probe (Fame 60–150) | 1.99 | 0.51 | 3.16 | 0.83 | 2.41 | 2.37 | €2.707 | 2.22 | 100% |
| Late Game Probe (Fame 175+) | 2.11 | 0.21 | 2.71 | 0.63 | 2.4 | 2.91 | €2.371 | 0.43 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €136.432 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15004 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 67.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.648 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €137.131 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 65.95 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.63 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €136.432 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 623.32 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 67.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €2.904 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 587.07 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €37.974 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 643.3 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 19.62% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €13.545 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 607.1 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 11.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €17.119 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 689.9 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €27.593 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 585.01 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €40.444 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 651.33 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -1.54% | €24.021 | 4.76 | -1 |
| Bootstrap Struggle | -20.39% | €1.347 | 7.58 | 0.58 |
| Aggressive Marketing | -10% | €8.482 | 1.79 | -0.45 |
| Scandal Recovery | -37.3% | €5.898 | 1.63 | 1.4 |
| Festival Push | -37.31% | €5.259 | 10.99 | 1.1 |
| Chaos Tour | -12.69% | €8.066 | 8.92 | 0.18 |
| Cult Hypergrowth | -8.85% | €8.383 | 6.66 | -0.27 |
| No Social (Fame 0-50) | -15% | €8.897 | 11.59 | 0.19 |
| High Controversy | -13.85% | €8.133 | 7.22 | -0.17 |
| Early Game Probe (Fame 0–50) | -0.38% | €-138 | -0.14 | -0.02 |
| Mid Game Probe (Fame 60–150) | -1.16% | €3.541 | -1.16 | -0.61 |
| Late Game Probe (Fame 175+) | 0% | €945 | -0.47 | 0.09 |

## Feature-Abdeckung in der Simulation

- ✅ daily_updates
- ✅ gig_financials
- ✅ travel_expenses
- ✅ fuel_cost
- ✅ travel_minigame
- ✅ roadie_minigame
- ✅ kabelsalat_minigame
- ✅ amp_calibration_minigame
- ✅ gig_modifiers
- ✅ gig_physics
- ✅ world_events
- ✅ gig_events
- ✅ events_db
- ✅ brand_deals
- ✅ social_trends
- ✅ social_platforms
- ✅ post_options
- ✅ contraband
- ✅ sponsorship
- ✅ maintenance
- ✅ upgrades
- ✅ clinic
- ✅ rest_stops
- ✅ songs
- ✅ trait_unlocks
- ✅ region_reputation
- ✅ quest_events
- ✅ asset_acquisition
- ✅ asset_modules
- ✅ crowdfunding

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 67.69% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €136.432 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.63 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
