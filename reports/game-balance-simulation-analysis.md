# Game Balance Simulation – Analyse

Erstellt am: 2026-04-15T05:28:44.040Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €70 |
| Modifier-Kosten | Catering €20, Promo €30, Merch €30, Soundcheck €50, Guestlist €60 |
| Venue-Fame-Gates | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |
| Fame-Level-Skala | Level = floor(fame / 100) |

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 122 |
| Brand Deals | 4 |
| Post Options | 32 |
| Contraband-Items | 27 |
| Upgrade-Katalog | 60 |
| Social Platforms | 4 |
| Trends | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 23 | travel |
| band | 40 | random, post_gig, travel |
| gig | 19 | gig_mid, gig_intro |
| financial | 27 | random, post_gig |
| special | 13 | special_location, travel, post_gig, random |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €30.742 | 52.9% | 0.29 | 0.7% | 354 | 3 | 50 | 0.42 | 57.74 | 17.26 | 0% | €1.740 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €205 | 39.7% | 0.11 | 0% | 153 | 1 | 58 | 0.13 | 4.6 | 2.38 | 88.85% | €1.236 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €19.945 | 35.6% | 0.17 | 1% | 377 | 3 | 53 | 0.5 | 27.23 | 9.14 | 1.92% | €1.841 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €3.658 | 53.3% | 0.12 | 0% | 267 | 2 | 57 | 0.28 | 13.67 | 6.81 | 34.23% | €1.459 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €11.009 | 45.4% | 0.11 | 2.4% | 417 | 4 | 56 | 0.27 | 14.76 | 6.38 | 24.62% | €2.134 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €14.998 | 43.9% | 0.16 | 0.9% | 379 | 3 | 54 | 0.35 | 26.38 | 9.57 | 3.85% | €1.685 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €18.280 | 34.6% | 0.18 | 0.3% | 337 | 3 | 54 | 0.43 | 27.02 | 9.31 | 2.31% | €1.736 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €5.256 | 29.7% | 0.11 | 0% | 218 | 2 | 50 | 0.38 | 7.9 | 1.99 | 2.31% | €1.471 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €10.349 | 33.6% | 0.14 | 0% | 303 | 3 | 53 | 0.37 | 14.91 | 5.06 | 0.38% | €1.655 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €25.179 | 16.8% | 0.24 | 0.3% | 338 | 3 | 53 | 0.37 | 23.49 | 6.51 | 0% | €1.784 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €38.468 | €500 | €1.740 | 15.05 | 2.01 | 1.5 | 10.94 | 11.53 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €2.313 | €72 | €1.236 | 3.67 | 0.53 | 0.39 | 0.52 | 1.77 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €21.922 | €394 | €1.841 | 12.26 | 1.83 | 1 | 5.19 | 7.42 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €5.797 | €198 | €1.459 | 10.69 | 1.45 | 0.88 | 2.54 | 4.86 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €13.005 | €237 | €2.134 | 11.28 | 1.43 | 0.96 | 2.59 | 4.82 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €16.972 | €369 | €1.685 | 14.6 | 1.81 | 0.99 | 4.71 | 7.2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €20.436 | €390 | €1.736 | 12.61 | 1.93 | 0.99 | 5.16 | 6.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €6.070 | €385 | €1.471 | 2.14 | 0.53 | 0.94 | 1.14 | 1.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €11.349 | €1.183 | €1.655 | 7.28 | 1.09 | 1 | 2.65 | 3.92 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €26.460 | €4.834 | €1.784 | 3.49 | 0.9 | 1.01 | 4.32 | 4.24 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €14.142 | €24.412 | €28.868 | €30.742 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €578 | €516 | €314 | €205 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €5.657 | €9.846 | €14.919 | €19.945 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €2.571 | €2.712 | €2.730 | €3.658 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €3.552 | €4.157 | €6.568 | €11.009 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €4.300 | €7.198 | €11.146 | €14.998 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €6.081 | €10.609 | €15.324 | €18.280 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €4.467 | €0 | €0 | €5.256 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €6.050 | €9.608 | €0 | €10.349 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €19.361 | €0 | €0 | €25.179 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.740 | €466 | 3.7× | 14.37 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.236 | €75 | 16.5× | 20.23 | 1.21 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.841 | €260 | 7.1× | 13.58 | 0.81 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.459 | €113 | 12.9× | 17.13 | 1.03 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.134 | €165 | 12.9× | 11.71 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.685 | €212 | 7.9× | 14.83 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.736 | €264 | 6.6× | 14.4 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.471 | €111 | 13.2× | 16.99 | 1.02 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.655 | €181 | 9.1× | 15.11 | 0.91 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.784 | €381 | 4.7× | 14.01 | 0.84 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 13.7% | 81% | 5.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.5 | 56 | 27.8% | 62.5% | 9.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.9 | 60 | 11.6% | 78.2% | 10.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.3 | 57 | 18.1% | 75.6% | 6.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.8 | 66 | 4.8% | 62.6% | 32.5% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 12.3% | 76.2% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.1 | 58 | 15.8% | 77.5% | 6.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 23.6% | 66.5% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 57 | 17.8% | 76.2% | 6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 7.1 | 58 | 15.2% | 76.4% | 8.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 50 | 17.26 | 0 | 1.54 | 8.45 | 13.45 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 2.38 | 0 | 0.35 | 3.35 | 5.51 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 53 | 9.14 | 0 | 1.32 | 8.11 | 13.18 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 57 | 6.81 | 0 | 1.04 | 6.91 | 10.93 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 56 | 6.38 | 0 | 1.05 | 6.85 | 11.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 54 | 9.57 | 0 | 1.3 | 8.17 | 13.22 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 9.31 | 0 | 1.46 | 8.22 | 13.47 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 1.99 | 0 | 0.18 | 2.19 | 3.44 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 53 | 5.06 | 0 | 0.65 | 4.37 | 7.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 53 | 6.51 | 0 | 0.45 | 3.32 | 5.23 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.28 | 1.5 | 1.43 | 0.79 | 9.35 | 15.05 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.18 | 0.76 | 0.78 | 0.09 | 3.5 | 3 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.38 | 2.56 | 2.28 | 0.6 | 8.6 | 14.45 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.54 | 2.67 | 2.24 | 0.42 | 7.46 | 9.67 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.34 | 1.38 | 1.31 | 0.27 | 7.84 | 11.27 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.74 | 4.02 | 3.46 | 0.95 | 8.52 | 13.64 | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | 0.46 | 2.27 | 1.98 | 0.62 | 8.81 | 14.38 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.07 | 0.32 | 0.25 | 0.07 | 2.42 | 3.14 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.14 | 0.97 | 0.76 | 0.22 | 4.62 | 8.43 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.18 | 0.82 | 0.67 | 0.47 | 3.5 | 6.47 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 57.74 | 57.74 | 57.74 | 173.22 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.6 | 4.6 | 4.6 | 13.8 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.23 | 27.23 | 27.23 | 81.69 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 13.67 | 13.67 | 13.67 | 41.01 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 14.76 | 14.76 | 14.76 | 44.28 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 26.38 | 26.38 | 26.38 | 79.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 27.02 | 27.02 | 27.02 | 81.06 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 7.9 | 7.9 | 7.9 | 23.7 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 14.91 | 14.91 | 14.91 | 44.73 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 23.49 | 23.49 | 23.49 | 70.47 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €30.742 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 417 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 88.85% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €2.134 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €38.468 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 57.74 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.17 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €30.742 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 354 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 88.85% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €205 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Endfame | 120 – 320 | 153 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €19.945 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 377 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 34.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €3.658 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Endfame | 150 – 360 | 267 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 24.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €11.009 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 417 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 3.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €14.998 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Endfame | 200 – 430 | 379 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €18.280 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 337 | ✅ | Im Zielband – leicht außermittig. |

## Feature-Abdeckung in der Simulation

- ✅ daily_updates
- ✅ gig_financials
- ✅ travel_expenses
- ✅ fuel_cost
- ✅ travel_minigame
- ✅ roadie_minigame
- ✅ kabelsalat_minigame
- ✅ gig_modifiers
- ✅ gig_physics
- ✅ world_events
- ✅ events_db
- ✅ brand_deals
- ✅ social_trends
- ✅ social_platforms
- ✅ post_options
- ✅ contraband
- ✅ sponsorship
- ✅ maintenance
- ✅ upgrades

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 88.85% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €30.742 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.17 Event-Impulsen.
- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Festival Push (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
