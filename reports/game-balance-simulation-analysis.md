# Game Balance Simulation – Analyse

Erstellt am: 2026-04-14T12:03:55.255Z

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
| Events gesamt | 121 |
| Brand Deals | 4 |
| Post Options | 32 |
| Contraband-Items | 27 |
| Upgrade-Katalog | 60 |
| Social Platforms | 4 |
| Trends | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 22 | travel |
| band | 40 | random, post_gig, travel |
| gig | 19 | gig_mid, gig_intro |
| financial | 27 | random, post_gig |
| special | 13 | special_location, travel, post_gig, random |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €40.364 | 62.1% | 0.32 | 0.7% | 351 | 3 | 50 | 0.55 | 57.81 | 17.19 | 0% | €1.735 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.225 | 39.1% | 0.12 | 0% | 167 | 1 | 58 | 0.21 | 4.83 | 2.57 | 80% | €1.260 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €27.368 | 40.9% | 0.23 | 1.1% | 369 | 3 | 54 | 0.61 | 27.08 | 9.3 | 1.92% | €1.843 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €13.109 | 40% | 0.18 | 0% | 283 | 2 | 56 | 0.46 | 14.37 | 7.39 | 18.46% | €1.451 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €22.865 | 34.4% | 0.15 | 2.8% | 431 | 4 | 55 | 0.44 | 15.86 | 6.79 | 11.92% | €2.165 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €25.832 | 42.2% | 0.22 | 1% | 380 | 3 | 54 | 0.62 | 26.85 | 9.65 | 1.54% | €1.701 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.477 | 37.8% | 0.24 | 0.3% | 333 | 3 | 54 | 0.51 | 27.16 | 9.2 | 1.92% | €1.741 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €6.324 | 26.2% | 0.11 | 0% | 218 | 2 | 50 | 0.72 | 7.9 | 1.98 | 2.31% | €1.461 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €16.838 | 27.6% | 0.17 | 0% | 307 | 3 | 53 | 0.56 | 14.87 | 5.09 | 0.38% | €1.655 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €28.549 | 19.5% | 0.26 | 0.3% | 335 | 3 | 53 | 0.42 | 23.53 | 6.47 | 0% | €1.767 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €44.455 | €497 | €1.735 | 60.86 | 3.55 | 1.87 | 11 | 11.56 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €2.997 | €81 | €1.260 | 2.9 | 1.03 | 0.41 | 0.6 | 1.92 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €33.485 | €393 | €1.843 | 53.69 | 3.25 | 1.23 | 5.15 | 7.42 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Scandal Recovery | €14.356 | €226 | €1.451 | 33.52 | 2.68 | 0.91 | 2.65 | 5.18 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €25.767 | €267 | €2.165 | 43.69 | 2.9 | 1.01 | 2.85 | 5.18 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €30.085 | €385 | €1.701 | 54.06 | 3.56 | 1.11 | 4.81 | 7.31 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €32.760 | €392 | €1.741 | 54.11 | 3.28 | 1.22 | 5.17 | 7 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Early Game Probe (Fame 0–50) | €6.822 | €387 | €1.461 | 2.52 | 0.75 | 0.95 | 1.1 | 1.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €17.710 | €1.202 | €1.655 | 22.06 | 1.74 | 1 | 2.65 | 3.9 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €30.921 | €4.767 | €1.767 | 18.07 | 1.24 | 1.07 | 4.3 | 4.26 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €16.122 | €29.167 | €29.450 | €40.364 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €612 | €622 | €882 | €1.225 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €6.806 | €15.675 | €24.683 | €27.368 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €2.710 | €5.411 | €9.080 | €13.109 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €4.138 | €9.017 | €16.019 | €22.865 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €5.628 | €13.641 | €21.395 | €25.832 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €7.114 | €16.310 | €24.966 | €26.477 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €5.216 | €0 | €0 | €6.324 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €7.796 | €15.979 | €0 | €16.838 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €21.803 | €0 | €0 | €28.549 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.735 | €517 | 3.4× | 14.41 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.260 | €86 | 14.7× | 19.84 | 1.19 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.843 | €360 | 5.1× | 13.56 | 0.81 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.451 | €186 | 7.8× | 17.23 | 1.03 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.165 | €271 | 8× | 11.55 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.701 | €326 | 5.2× | 14.7 | 0.88 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.741 | €368 | 4.7× | 14.36 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.461 | €116 | 12.6× | 17.11 | 1.03 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.655 | €230 | 7.2× | 15.11 | 0.91 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.767 | €415 | 4.3× | 14.15 | 0.85 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 14.1% | 80.6% | 5.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.5 | 56 | 26.5% | 63.9% | 9.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.9 | 60 | 11.6% | 78.3% | 10.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 17.3% | 76.5% | 6.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.8 | 66 | 4.9% | 63.3% | 31.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 12% | 76.4% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.2 | 58 | 17.1% | 76.4% | 6.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 22.4% | 67.7% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18% | 75.7% | 6.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 7.1 | 58 | 15.4% | 76.5% | 8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 50 | 17.19 | 1 | 0 | 7.94 | 13.67 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 2.57 | 0.23 | 0.13 | 3.59 | 5.88 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 9.3 | 0.99 | 0.01 | 8.13 | 13.13 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 56 | 7.39 | 0.9 | 0.1 | 7.2 | 11.73 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 6.79 | 0.93 | 0.05 | 7.28 | 12.07 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 54 | 9.65 | 0.99 | 0.01 | 8.11 | 13.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 9.2 | 0.98 | 0 | 8.27 | 12.85 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 1.98 | 0.45 | 0 | 2.15 | 3.52 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 53 | 5.09 | 0.96 | 0 | 4.13 | 7.33 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 53 | 6.47 | 0.95 | 0 | 3.47 | 5.28 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.3 | 1.33 | 1.34 | 0.78 | 9.12 | 14.96 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.17 | 0.79 | 0.78 | 0.11 | 3.66 | 3.53 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.52 | 2.3 | 2.14 | 0.64 | 8.63 | 14.5 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.53 | 2.87 | 2.4 | 0.5 | 8.08 | 10.7 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.28 | 1.59 | 1.38 | 0.3 | 8.2 | 12.6 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.66 | 4 | 3.54 | 1.03 | 8.64 | 13.97 | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | 0.46 | 2.24 | 2.04 | 0.65 | 9.13 | 14.39 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.07 | 0.34 | 0.25 | 0.1 | 2.35 | 3.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.14 | 0.91 | 0.83 | 0.21 | 4.96 | 8.48 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.19 | 0.79 | 0.75 | 0.52 | 3.65 | 6.52 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 57.81 | 57.81 | 57.81 | 173.43 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.83 | 4.83 | 4.83 | 14.49 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.08 | 27.08 | 27.08 | 81.24 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 14.37 | 14.37 | 14.37 | 43.11 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 15.86 | 15.86 | 15.86 | 47.58 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 26.85 | 26.85 | 26.85 | 80.55 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 27.16 | 27.16 | 27.16 | 81.48 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 7.9 | 7.9 | 7.9 | 23.7 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 14.87 | 14.87 | 14.87 | 44.61 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 23.53 | 23.53 | 23.53 | 70.59 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €40.364 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 431 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 80% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €2.165 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €44.455 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 57.81 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.23 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €40.364 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 351 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 80% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €1.225 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 167 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €27.368 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Endfame | 200 – 430 | 369 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 18.46% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €13.109 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Endfame | 150 – 360 | 283 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 11.92% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €22.865 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 431 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €25.832 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Endfame | 200 – 430 | 380 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.477 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 333 | ✅ | Im Zielband – leicht außermittig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 80% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €40.364 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.23 Event-Impulsen.
- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate) · Scandal Recovery (Insolvenzrate) · Festival Push (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
