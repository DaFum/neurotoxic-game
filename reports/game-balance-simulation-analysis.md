# Game Balance Simulation – Analyse

Erstellt am: 2026-07-18T19:17:57.003Z

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
| Baseline Touring | €500 | 0 | €106.235 | 55.7% | 0.07 | 4.7% | 10925 | 7 | 38 | 11.95 | 61.18 | 6.24 | 0% | €3.293 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €1.636 | 37.7% | 0.2 | 2.2% | 740 | 1 | 54 | 1.22 | 5.5 | 3.42 | 77.69% | €2.392 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €33.269 | 53.8% | 0.09 | 5.2% | 2888 | 3 | 53 | 4.59 | 30.13 | 6.08 | 0.38% | €3.326 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €12.025 | 51.9% | 0.13 | 3.6% | 1467 | 2 | 51 | 2.63 | 15.49 | 4.88 | 17.31% | €2.718 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €15.178 | 49.6% | 0.11 | 5% | 1695 | 2 | 54 | 2.93 | 16.22 | 5 | 14.23% | €3.113 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €23.184 | 51.4% | 0.12 | 2.7% | 1941 | 3 | 42 | 4.68 | 27.05 | 6.3 | 2.31% | €2.855 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €34.257 | 53.2% | 0.09 | 5.6% | 3094 | 3 | 57 | 5.28 | 29.72 | 5.95 | 1.15% | €3.404 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €25.652 | 51.1% | 0.11 | 3.2% | 2419 | 3 | 52 | 0 | 29.61 | 5.98 | 1.15% | €2.852 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €24.733 | 51.1% | 0.11 | 3.5% | 2414 | 3 | 52 | 11.24 | 28.37 | 6.15 | 2.31% | €2.870 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €15.521 | 14.7% | 0.1 | 3.4% | 1778 | 2 | 42 | 3.98 | 9.14 | 2.45 | 0% | €2.706 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €21.205 | 31.4% | 0.12 | 3.3% | 1964 | 3 | 47 | 4.33 | 16.05 | 5.49 | 0.77% | €2.952 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €40.978 | 52.6% | 0.08 | 5.1% | 6149 | 5 | 39 | 10.47 | 26.16 | 5.3 | 0% | €3.379 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €107.365 | €497 | €3.293 | 7.02 | 2.23 | 21.16 | 8.13 | 11.97 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €6.735 | €104 | €2.392 | 0.22 | 0.22 | 3.15 | 0.47 | 2.43 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €40.789 | €410 | €3.326 | 2.91 | 1.25 | 14.82 | 4.31 | 7.84 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €16.600 | €258 | €2.718 | 0.89 | 0.53 | 8.36 | 2.07 | 5.45 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €21.013 | €289 | €3.113 | 0.95 | 0.6 | 9.62 | 2.14 | 5.36 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €30.669 | €394 | €2.855 | 2.69 | 1.22 | 12.17 | 3.65 | 7.37 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €42.044 | €405 | €3.404 | 3 | 1.32 | 14.9 | 4.2 | 7.35 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €33.496 | €396 | €2.852 | 0 | 0 | 13.56 | 4.13 | 7.9 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €33.029 | €327 | €2.870 | 2.68 | 1.1 | 13.07 | 3.92 | 7.65 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €17.275 | €400 | €2.706 | 0.2 | 0.09 | 3.34 | 0.96 | 1.99 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €25.064 | €1.353 | €2.952 | 0.89 | 0.39 | 7.09 | 2.1 | 4.06 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €47.381 | €4.971 | €3.379 | 1.73 | 0.58 | 8.95 | 3.55 | 4.61 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €29.695 | €45.737 | €76.751 | €106.235 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.630 | €1.922 | €1.399 | €1.636 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €17.313 | €21.654 | €26.306 | €33.269 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.281 | €8.090 | €8.484 | €12.025 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €10.382 | €10.279 | €10.972 | €15.178 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €13.617 | €15.803 | €19.810 | €23.184 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €17.388 | €21.530 | €27.432 | €34.257 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €13.417 | €17.146 | €21.599 | €25.652 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €11.897 | €16.060 | €21.287 | €24.733 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €13.863 | — | — | €15.521 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €15.447 | €19.823 | — | €21.205 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €29.930 | — | — | €40.978 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.293 | €95 | 34.5× | 7.59 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.392 | €61 | 39.2× | 10.45 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.326 | €89 | 37.4× | 7.52 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.718 | €75 | 36.2× | 9.2 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.113 | €79 | 39.4× | 8.03 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.855 | €86 | 33.1× | 8.76 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.404 | €89 | 38.2× | 7.34 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.852 | €87 | 32.7× | 8.77 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.870 | €86 | 33.4× | 8.71 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.706 | €76 | 35.7× | 9.24 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.952 | €86 | 34.5× | 8.47 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.379 | €95 | 35.7× | 7.4 | 0.44 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.4 | 50 | 49.9% | 44.1% | 6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.7 | 49 | 55.4% | 38% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 8 | 53 | 40% | 52.1% | 7.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 8.4 | 51 | 49.4% | 44.3% | 6.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.3 | 57 | 26% | 60.5% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.8% | 33.5% | 2.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 7.7 | 55 | 35.8% | 53.3% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.4% | 39.7% | 5.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.6 | 49 | 53.3% | 41.3% | 5.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 47.2% | 45.9% | 6.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.5 | 50 | 49.8% | 46.2% | 4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.2 | 51 | 45.3% | 47.9% | 6.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 38 | 6.24 | 1.77 | 0.52 | 8.09 | 11.2 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 54 | 3.42 | 0.18 | 0.16 | 4.47 | 1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 53 | 6.08 | 0.97 | 0.43 | 8.25 | 5.36 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 4.88 | 0.41 | 0.32 | 7.78 | 2.79 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 54 | 5 | 0.47 | 0.3 | 7.74 | 2.94 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 42 | 6.3 | 0.96 | 0.45 | 7.61 | 4.83 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 57 | 5.95 | 1 | 0.49 | 7.82 | 5.32 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 52 | 5.98 | 0 | 0 | 8.26 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 52 | 6.15 | 0.91 | 0.42 | 8.36 | 4.87 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.45 | 0.08 | 0.01 | 2.33 | 1.65 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 47 | 5.49 | 0.32 | 0.12 | 4.04 | 2.86 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 39 | 5.3 | 0.47 | 0.08 | 3.29 | 4.91 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.08 | 1.53 | 1.42 | 0.92 | 4.16 | 9.12 | 29.38 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.71 | 1.3 | 1.35 | 0.12 | 0.53 | 5.15 | 6.1 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.81 | 2.84 | 2.73 | 0.77 | 3.62 | 8.88 | 22.61 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.87 | 3.23 | 3.23 | 0.47 | 2.25 | 8.28 | 14.89 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.08 | 1.48 | 1.8 | 0.29 | 1.36 | 8.3 | 16.62 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.81 | 4.2 | 4.03 | 1.21 | 5.02 | 8.84 | 19.72 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.55 | 2.59 | 2.52 | 0.6 | 3.18 | 9.21 | 22.75 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.51 | 2.38 | 2.28 | 0.52 | 2.91 | 8.8 | 21.26 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.44 | 2.24 | 2.25 | 0.55 | 2.68 | 8.75 | 20.77 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.19 | 0.4 | 0.42 | 0.14 | 0.47 | 2.47 | 5.15 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.56 | 0.96 | 0.91 | 0.24 | 1.16 | 4.77 | 11.28 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.53 | 0.92 | 0.84 | 0.55 | 2.54 | 3.66 | 12.57 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 61.18 | 20.55 | 20.48 | 20.15 | 122.36 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 5.5 | 1.9 | 1.84 | 1.77 | 11.01 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.13 | 10.01 | 10.1 | 10.02 | 60.26 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 15.49 | 5.32 | 5.08 | 5.09 | 30.98 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 16.22 | 5.31 | 5.5 | 5.41 | 32.44 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 27.05 | 9.08 | 9.01 | 8.97 | 54.11 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.72 | 9.87 | 10.02 | 9.84 | 59.45 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 29.61 | 9.79 | 9.98 | 9.83 | 59.21 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 28.37 | 9.42 | 9.41 | 9.54 | 56.74 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.14 | 3.14 | 3.01 | 2.99 | 18.28 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 16.05 | 5.36 | 5.38 | 5.32 | 32.11 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.16 | 8.66 | 8.81 | 8.69 | 52.32 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.99 | 0.19 | 6.76 | 0.93 | 3.63 | 4.84 | €3.150 | 5.42 | 100% |
| Bootstrap Struggle | 0.62 | 0.35 | 1.41 | 0.9 | 1.07 | 1.11 | €1.422 | 3.54 | 72.7% |
| Aggressive Marketing | 3.03 | 0.55 | 6.58 | 0.98 | 3.63 | 2.94 | €3.038 | 5.03 | 99.6% |
| Scandal Recovery | 1.89 | 0.84 | 4.53 | 1.24 | 2.59 | 2.58 | €2.120 | 6.4 | 93.8% |
| Festival Push | 2.27 | 0.82 | 5.04 | 1.1 | 2.95 | 1.55 | €2.210 | 6.05 | 100% |
| Chaos Tour | 2.76 | 0.65 | 6.12 | 1.09 | 3.44 | 3.14 | €3.116 | 6.58 | 93.8% |
| Cult Hypergrowth | 2.95 | 0.38 | 6.42 | 1 | 3.56 | 3.95 | €2.980 | 5.22 | 100% |
| No Social (Fame 0-50) | 2.86 | 0.72 | 6.41 | 1.02 | 3.48 | 2.72 | €2.927 | 5.59 | 97.3% |
| High Controversy | 2.74 | 0.69 | 6.12 | 1.09 | 3.45 | 3.5 | €3.027 | 6.42 | 97.7% |
| Early Game Probe (Fame 0–50) | 0.97 | 0.32 | 0.8 | 0.53 | 1.13 | 1.61 | €837 | 0.02 | 93.1% |
| Mid Game Probe (Fame 60–150) | 2.07 | 0.54 | 3.01 | 0.83 | 2.5 | 2.35 | €2.624 | 2.38 | 98.5% |
| Late Game Probe (Fame 175+) | 2.23 | 0.23 | 2.67 | 0.59 | 2.52 | 2.83 | €2.542 | 0.6 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €106.235 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 10925 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 77.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.404 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €107.365 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 61.18 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.27 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €106.235 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 592.14 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 77.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €1.636 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 554.45 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €33.269 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 623.91 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 17.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €12.025 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 591.99 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 14.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €15.178 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 672.71 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €23.184 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 529.44 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €34.257 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 642.7 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €4.370 | 5.78 | 0.52 |
| Bootstrap Struggle | 1.92% | €-20 | 2.12 | -0.13 |
| Aggressive Marketing | -0.39% | €343 | 3.08 | -0.04 |
| Scandal Recovery | -5% | €488 | 1.91 | 0.11 |
| Festival Push | 0.38% | €-140 | -1.74 | -0.04 |
| Chaos Tour | 1.54% | €-239 | -2.48 | -0.28 |
| Cult Hypergrowth | 0.38% | €-1.221 | 1.77 | -0.24 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -1.15% | €250 | 6.42 | 0.45 |
| Early Game Probe (Fame 0–50) | -0.77% | €261 | -0.96 | 0.08 |
| Mid Game Probe (Fame 60–150) | -0.38% | €-115 | -0.7 | 0.07 |
| Late Game Probe (Fame 175+) | 0% | €393 | -2.53 | -0.11 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 77.69% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €106.235 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.27 Event-Impulsen (inkl. Gig-Events).
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
