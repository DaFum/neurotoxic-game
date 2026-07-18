# Game Balance Simulation – Analyse

Erstellt am: 2026-07-18T15:53:09.326Z

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
| Baseline Touring | €500 | 0 | €101.865 | 55.4% | 0.07 | 4.4% | 10144 | 7 | 38 | 14.46 | 60.66 | 6.22 | 0% | €3.250 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €1.656 | 39.6% | 0.2 | 2.1% | 764 | 1 | 54 | 0.52 | 5.63 | 3.42 | 75.77% | €2.356 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €32.926 | 52.9% | 0.09 | 5.1% | 2444 | 3 | 54 | 4.31 | 30.17 | 6.08 | 0.77% | €3.292 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €11.537 | 53.9% | 0.13 | 3.6% | 1469 | 2 | 51 | 2.9 | 15.38 | 4.88 | 22.31% | €2.703 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €15.318 | 52.1% | 0.11 | 5.3% | 1758 | 2 | 54 | 2.43 | 16.26 | 5.05 | 13.85% | €3.127 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €23.423 | 51.8% | 0.12 | 3.2% | 1917 | 3 | 43 | 4.91 | 27.33 | 6.31 | 0.77% | €2.894 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €35.478 | 51.9% | 0.09 | 5.8% | 2986 | 3 | 57 | 4.5 | 29.96 | 5.98 | 0.77% | €3.380 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €25.652 | 51.1% | 0.11 | 3.2% | 2419 | 3 | 52 | 0 | 29.61 | 5.98 | 1.15% | €2.852 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €24.483 | 48.9% | 0.11 | 3.2% | 2255 | 3 | 51 | 11.41 | 27.92 | 6.15 | 3.46% | €2.836 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €15.260 | 14.8% | 0.1 | 3.6% | 1768 | 2 | 42 | 4.94 | 9.06 | 2.45 | 0.77% | €2.692 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €21.320 | 31% | 0.12 | 3.3% | 2013 | 3 | 47 | 4.37 | 15.98 | 5.56 | 1.15% | €2.944 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €40.585 | 52.7% | 0.08 | 5.1% | 6440 | 5 | 41 | 10.64 | 26.27 | 5.28 | 0% | €3.365 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €102.890 | €499 | €3.250 | 7.26 | 2.3 | 20.94 | 8.03 | 11.85 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €6.751 | €106 | €2.356 | 0.08 | 0.14 | 3.26 | 0.47 | 2.51 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €41.256 | €407 | €3.292 | 3.1 | 1.2 | 15.15 | 4.28 | 7.84 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €16.665 | €245 | €2.703 | 0.89 | 0.49 | 8.35 | 2.04 | 5.42 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €21.182 | €290 | €3.127 | 0.86 | 0.5 | 9.58 | 2.13 | 5.38 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €31.596 | €399 | €2.894 | 2.77 | 1.23 | 12.5 | 3.66 | 7.43 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €42.386 | €406 | €3.380 | 3.06 | 1.2 | 14.93 | 4.2 | 7.4 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €33.496 | €396 | €2.852 | 0 | 0 | 13.56 | 4.13 | 7.9 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €32.739 | €323 | €2.836 | 2.79 | 1.17 | 12.92 | 3.85 | 7.54 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €17.085 | €400 | €2.692 | 0.2 | 0.09 | 3.35 | 0.96 | 1.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €24.986 | €1.357 | €2.944 | 0.95 | 0.42 | 7 | 2.07 | 4.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €47.114 | €4.976 | €3.365 | 1.42 | 0.5 | 8.74 | 3.56 | 4.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €30.187 | €44.474 | €74.198 | €101.865 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €6.516 | €3.517 | €4.390 | €1.656 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €17.194 | €22.224 | €27.330 | €32.926 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.319 | €8.488 | €10.184 | €11.537 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €10.434 | €10.855 | €12.652 | €15.318 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €13.389 | €16.004 | €20.037 | €23.423 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €17.173 | €22.230 | €27.619 | €35.478 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €13.417 | €17.213 | €21.767 | €25.652 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €11.937 | €16.190 | €22.030 | €24.483 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €13.807 | — | — | €15.260 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €15.138 | €20.130 | — | €21.320 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €30.563 | — | — | €40.585 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.250 | €95 | 34.1× | 7.69 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.356 | €61 | 38.7× | 10.61 | 0.64 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.292 | €89 | 37.1× | 7.59 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.703 | €75 | 36.1× | 9.25 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.127 | €79 | 39.6× | 7.99 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.894 | €86 | 33.5× | 8.64 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.380 | €89 | 37.9× | 7.4 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.852 | €87 | 32.7× | 8.77 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.836 | €86 | 33.1× | 8.81 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.692 | €76 | 35.6× | 9.29 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.944 | €86 | 34.4× | 8.49 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.365 | €95 | 35.6× | 7.43 | 0.45 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 51.6% | 42.7% | 5.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.7 | 49 | 54.7% | 38.7% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 8.1 | 53 | 40.5% | 52.4% | 7.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.4 | 50 | 50.1% | 43.7% | 6.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.3 | 57 | 25.8% | 60.5% | 13.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.3% | 33.7% | 3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 7.7 | 55 | 36.1% | 53% | 10.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.4% | 39.7% | 5.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 49 | 54.2% | 41.3% | 4.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 47.3% | 46.2% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.5 | 50 | 48.5% | 47.2% | 4.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.2 | 52 | 44.8% | 48.6% | 6.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 38 | 6.22 | 1.82 | 0.53 | 8.19 | 10.9 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 54 | 3.42 | 0.09 | 0.08 | 4.43 | 0.98 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 54 | 6.08 | 1 | 0.4 | 8.01 | 5.27 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 4.88 | 0.43 | 0.27 | 7.73 | 2.72 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 54 | 5.05 | 0.4 | 0.24 | 7.91 | 2.85 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 43 | 6.31 | 0.99 | 0.52 | 8.03 | 4.9 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 57 | 5.98 | 0.98 | 0.4 | 8.19 | 5.17 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 52 | 5.98 | 0 | 0 | 8.26 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 6.15 | 0.93 | 0.44 | 8.1 | 4.99 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.45 | 0.08 | 0.02 | 2.32 | 1.6 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 47 | 5.56 | 0.36 | 0.12 | 4.12 | 2.89 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 41 | 5.28 | 0.41 | 0.08 | 3.38 | 5.04 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.03 | 1.59 | 1.62 | 0.91 | 4.1 | 9.23 | 29.3 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.72 | 1.34 | 1.39 | 0.13 | 0.55 | 5.08 | 6.34 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.88 | 2.77 | 2.84 | 0.75 | 3.45 | 9.01 | 22.98 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.82 | 3.2 | 3.26 | 0.52 | 2.26 | 8.08 | 14.86 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.05 | 1.59 | 1.75 | 0.28 | 1.28 | 8.23 | 16.49 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.83 | 4.37 | 4.15 | 1.15 | 4.98 | 8.9 | 20.05 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.55 | 2.69 | 2.58 | 0.63 | 3.09 | 8.8 | 22.67 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.51 | 2.38 | 2.28 | 0.52 | 2.91 | 8.8 | 21.26 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.5 | 2.16 | 2.19 | 0.56 | 2.7 | 8.49 | 20.54 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.18 | 0.41 | 0.42 | 0.13 | 0.47 | 2.42 | 5.16 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.57 | 0.94 | 0.96 | 0.22 | 1.2 | 4.74 | 11.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.58 | 0.92 | 0.75 | 0.49 | 2.54 | 3.68 | 12.32 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.66 | 20.1 | 20.26 | 20.3 | 121.32 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 5.63 | 1.93 | 1.93 | 1.78 | 11.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.17 | 10.1 | 9.9 | 10.17 | 60.34 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 15.38 | 5.21 | 5.1 | 5.07 | 30.76 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 16.26 | 5.33 | 5.44 | 5.48 | 32.51 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 27.33 | 8.92 | 9.19 | 9.23 | 54.67 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.96 | 10.1 | 9.78 | 10.08 | 59.92 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 29.61 | 9.79 | 9.98 | 9.83 | 59.21 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 27.92 | 9.35 | 9.04 | 9.53 | 55.84 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.06 | 3.12 | 2.97 | 2.97 | 18.12 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.98 | 5.29 | 5.38 | 5.32 | 31.97 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.27 | 8.55 | 8.81 | 8.91 | 52.54 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.96 | 0.18 | 6.9 | 0.96 | 3.63 | 4.83 | €3.139 | 5.55 | 100% |
| Bootstrap Struggle | 0.57 | 0.33 | 1.37 | 0.95 | 1.06 | 1.16 | €1.418 | 3.64 | 71.9% |
| Aggressive Marketing | 2.88 | 0.54 | 6.37 | 1 | 3.52 | 2.92 | €3.042 | 4.91 | 100% |
| Scandal Recovery | 1.89 | 0.86 | 4.49 | 1.21 | 2.6 | 2.55 | €2.122 | 6.25 | 94.2% |
| Festival Push | 2.25 | 0.78 | 5.16 | 1.12 | 2.94 | 1.6 | €2.244 | 6.13 | 100% |
| Chaos Tour | 2.83 | 0.72 | 6.19 | 1.08 | 3.53 | 3.07 | €3.120 | 6.57 | 94.6% |
| Cult Hypergrowth | 2.96 | 0.39 | 6.37 | 0.96 | 3.55 | 3.94 | €2.987 | 5.14 | 100% |
| No Social (Fame 0-50) | 2.86 | 0.72 | 6.41 | 1.02 | 3.48 | 2.72 | €2.927 | 5.59 | 97.3% |
| High Controversy | 2.77 | 0.69 | 5.94 | 1.08 | 3.43 | 3.42 | €3.022 | 6.52 | 98.5% |
| Early Game Probe (Fame 0–50) | 0.95 | 0.32 | 0.79 | 0.55 | 1.11 | 1.6 | €837 | 0.02 | 93.1% |
| Mid Game Probe (Fame 60–150) | 2.02 | 0.55 | 3.18 | 0.86 | 2.48 | 2.42 | €2.656 | 2.36 | 97.7% |
| Late Game Probe (Fame 175+) | 2.15 | 0.22 | 2.72 | 0.63 | 2.43 | 2.78 | €2.539 | 0.58 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €101.865 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 10144 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 75.77% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.380 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €102.890 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.66 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.50 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €101.865 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 586.36 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 75.77% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €1.656 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 552.33 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €32.926 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 620.83 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 22.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €11.537 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 590.08 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 13.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €15.318 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 674.45 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €23.423 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 531.92 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €35.478 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 640.93 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -0.38% | €-5.831 | -1.73 | 0.02 |
| Bootstrap Struggle | -3.46% | €80 | 4.17 | 0.15 |
| Aggressive Marketing | 0.39% | €-929 | 0.45 | -0.13 |
| Scandal Recovery | 5% | €-1.086 | -1.96 | -0.32 |
| Festival Push | -3.07% | €462 | 1.45 | 0.43 |
| Chaos Tour | -0.77% | €-292 | 1.97 | 0.1 |
| Cult Hypergrowth | -0.38% | €-348 | 2.05 | -0.18 |
| No Social (Fame 0-50) | -0.39% | €-642 | -2.48 | 0.04 |
| High Controversy | 1.54% | €-1.435 | -1.77 | -0.3 |
| Early Game Probe (Fame 0–50) | 0.77% | €-194 | 1.99 | -0.06 |
| Mid Game Probe (Fame 60–150) | 0.38% | €83 | 2.68 | -0.05 |
| Late Game Probe (Fame 175+) | 0% | €-119 | 5.42 | -0.05 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 75.77% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €101.865 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.50 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
