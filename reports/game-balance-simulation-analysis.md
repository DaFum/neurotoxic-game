# Game Balance Simulation – Analyse

Erstellt am: 2026-04-14T21:06:06.970Z

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
| Baseline Touring | €500 | 0 | €31.631 | 56.4% | 0.29 | 0.9% | 355 | 3 | 50 | 0.44 | 57.8 | 17.2 | 0% | €1.771 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €412 | 39.7% | 0.12 | 0% | 162 | 1 | 58 | 0.17 | 4.71 | 2.47 | 85% | €1.248 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €20.132 | 35.2% | 0.18 | 0.9% | 366 | 3 | 53 | 0.57 | 27.3 | 9.07 | 1.92% | €1.807 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €4.426 | 52.3% | 0.13 | 0% | 268 | 2 | 56 | 0.4 | 13.98 | 6.99 | 29.23% | €1.442 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €11.670 | 43.4% | 0.11 | 2.3% | 412 | 4 | 56 | 0.46 | 14.69 | 6.35 | 24.23% | €2.106 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €15.880 | 42.2% | 0.16 | 1.1% | 382 | 3 | 54 | 0.57 | 26.38 | 9.61 | 3.85% | €1.695 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €19.390 | 33.3% | 0.19 | 0.3% | 329 | 3 | 54 | 0.52 | 26.97 | 9.37 | 1.92% | €1.736 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €5.407 | 29.7% | 0.11 | 0% | 219 | 2 | 50 | 0.65 | 7.9 | 1.98 | 2.31% | €1.468 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €11.012 | 31.5% | 0.15 | 0% | 300 | 3 | 53 | 0.59 | 14.87 | 5.06 | 0.77% | €1.644 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €25.368 | 17.9% | 0.24 | 0.4% | 337 | 3 | 52 | 0.53 | 23.53 | 6.47 | 0% | €1.790 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €39.662 | €500 | €1.771 | 0 | 3.5 | 1.59 | 10.94 | 11.6 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €2.469 | €75 | €1.248 | 0 | 0.93 | 0.41 | 0.58 | 1.85 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €22.277 | €395 | €1.807 | 0 | 3.28 | 1.01 | 5.22 | 7.47 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €6.505 | €203 | €1.442 | 0 | 2.7 | 0.9 | 2.55 | 4.98 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €13.418 | €238 | €2.106 | 0 | 2.56 | 0.96 | 2.61 | 4.82 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €17.975 | €374 | €1.695 | 0 | 3.14 | 0.99 | 4.72 | 7.21 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €21.278 | €392 | €1.736 | 0 | 3.22 | 0.99 | 5.1 | 6.95 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €6.211 | €385 | €1.468 | 0 | 0.75 | 0.94 | 1.13 | 1.81 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €11.839 | €1.186 | €1.644 | 0 | 1.75 | 1 | 2.67 | 3.9 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €26.902 | €4.813 | €1.790 | 0 | 1.3 | 1.02 | 4.32 | 4.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €14.259 | €24.543 | €28.106 | €31.631 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €597 | €540 | €463 | €412 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €5.724 | €10.443 | €15.605 | €20.132 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €2.670 | €3.005 | €3.379 | €4.426 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €3.677 | €4.408 | €6.762 | €11.670 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €4.443 | €7.811 | €12.028 | €15.880 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €6.151 | €10.878 | €15.904 | €19.390 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €4.638 | €0 | €0 | €5.407 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €6.275 | €10.293 | €0 | €11.012 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €19.469 | €0 | €0 | €25.368 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.771 | €468 | 3.8× | 14.11 | 0.85 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.248 | €78 | 16.1× | 20.02 | 1.2 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.807 | €266 | 6.8× | 13.84 | 0.83 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.442 | €120 | 12.1× | 17.34 | 1.04 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.106 | €171 | 12.3× | 11.87 | 0.71 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.695 | €221 | 7.7× | 14.75 | 0.88 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.736 | €270 | 6.4× | 14.4 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.468 | €112 | 13.1× | 17.03 | 1.02 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.644 | €187 | 8.8× | 15.21 | 0.91 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.790 | €383 | 4.7× | 13.97 | 0.84 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 13.5% | 81% | 5.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 56 | 27.3% | 62.7% | 10% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.9 | 59 | 12.2% | 77.9% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.3 | 57 | 18.6% | 75.2% | 6.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.9 | 65 | 5.4% | 62.9% | 31.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 152 | 6.8 | 60 | 12.5% | 75.6% | 11.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.1 | 58 | 16% | 77.6% | 6.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 23.2% | 66.8% | 10% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 17.5% | 76.1% | 6.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 7.1 | 58 | 15.2% | 76.4% | 8.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 50 | 17.2 | 0 | 0 | 8.29 | 13.6 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 2.47 | 0 | 0 | 3.51 | 5.79 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 53 | 9.07 | 0 | 0 | 8.29 | 13.13 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 56 | 6.99 | 0 | 0 | 7.2 | 11.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 56 | 6.35 | 0 | 0 | 6.75 | 11.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 54 | 9.61 | 0 | 0 | 7.91 | 13.35 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 9.37 | 0 | 0 | 8.46 | 13.47 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 1.98 | 0 | 0 | 2.23 | 3.45 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 53 | 5.06 | 0 | 0 | 4.37 | 7.34 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 52 | 6.47 | 0 | 0 | 3.27 | 5.38 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.31 | 1.47 | 1.31 | 0.79 | 9.08 | 15.02 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.19 | 0.78 | 0.68 | 0.1 | 3.58 | 3.21 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.42 | 2.36 | 2.25 | 0.66 | 8.52 | 14.37 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.6 | 2.78 | 2.28 | 0.4 | 7.83 | 10.15 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.35 | 1.5 | 1.26 | 0.27 | 7.85 | 11.23 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.73 | 3.88 | 3.42 | 1 | 8.73 | 13.91 | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | 0.42 | 2.32 | 1.93 | 0.63 | 8.85 | 14.15 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.07 | 0.32 | 0.25 | 0.07 | 2.39 | 3.17 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.18 | 0.91 | 0.79 | 0.2 | 4.7 | 8.42 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.18 | 0.83 | 0.7 | 0.5 | 3.47 | 6.56 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 57.8 | 57.8 | 57.8 | 173.4 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.71 | 4.71 | 4.71 | 14.13 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.3 | 27.3 | 27.3 | 81.9 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 13.98 | 13.98 | 13.98 | 41.94 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 14.69 | 14.69 | 14.69 | 44.07 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 26.38 | 26.38 | 26.38 | 79.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 26.97 | 26.97 | 26.97 | 80.91 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 7.9 | 7.9 | 7.9 | 23.7 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 14.87 | 14.87 | 14.87 | 44.61 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 23.53 | 23.53 | 23.53 | 70.59 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €31.631 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 412 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 85% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €2.106 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €39.662 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 57.8 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.03 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €31.631 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 355 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 85% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €412 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Endfame | 120 – 320 | 162 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €20.132 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 366 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 29.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €4.426 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Endfame | 150 – 360 | 268 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 24.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €11.670 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 412 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 3.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €15.880 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Endfame | 200 – 430 | 382 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €19.390 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 329 | ✅ | Im Zielband – leicht außermittig. |

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
- ⚪ sponsorship
- ✅ maintenance
- ✅ upgrades

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 85% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €31.631 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.03 Event-Impulsen.
- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Festival Push (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
