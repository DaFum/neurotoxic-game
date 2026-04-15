# Game Balance Simulation – Analyse

Erstellt am: 2026-04-15T15:49:55.819Z

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
| Brand Deals | 54 |
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
| Baseline Touring | €500 | 0 | €32.072 | 56.7% | 0.3 | 0.8% | 354 | 3 | 50 | 0.93 | 57.81 | 17.19 | 0% | €1.781 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €107 | 39.3% | 0.11 | 0% | 152 | 1 | 59 | 0.15 | 4.29 | 2.16 | 94.23% | €1.211 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €21.254 | 37.3% | 0.18 | 0.8% | 369 | 3 | 54 | 0.12 | 27.18 | 9.05 | 2.69% | €1.846 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €3.095 | 55.8% | 0.12 | 0% | 261 | 2 | 57 | 0.33 | 13.03 | 6.44 | 43.08% | €1.444 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €12.156 | 41.6% | 0.11 | 2.3% | 413 | 4 | 56 | 0.64 | 14.82 | 6.37 | 23.46% | €2.146 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €17.783 | 43.8% | 0.16 | 1% | 382 | 3 | 54 | 0.28 | 26.5 | 9.59 | 3.08% | €1.724 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €21.045 | 34.7% | 0.18 | 0.3% | 335 | 3 | 54 | 0.44 | 26.93 | 9.32 | 2.31% | €1.768 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €5.015 | 30% | 0.11 | 0% | 222 | 2 | 49 | 0.59 | 7.9 | 2 | 2.31% | €1.475 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €10.777 | 33.1% | 0.14 | 0% | 300 | 3 | 53 | 0.59 | 14.9 | 5.04 | 0.38% | €1.662 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €25.972 | 18.9% | 0.24 | 0.4% | 338 | 3 | 52 | 1.33 | 23.51 | 6.49 | 0% | €1.802 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €41.086 | €500 | €1.781 | 15.92 | 4.27 | 1.75 | 10.92 | 11.62 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €2.123 | €64 | €1.211 | 0.43 | 0.38 | 0.33 | 0.5 | 1.62 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €24.380 | €392 | €1.846 | 8.52 | 3.13 | 1.03 | 5.21 | 7.42 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €5.361 | €181 | €1.444 | 2.67 | 1.53 | 0.87 | 2.35 | 4.62 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €14.001 | €240 | €2.146 | 3.93 | 2.1 | 0.95 | 2.61 | 4.85 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €19.899 | €378 | €1.724 | 7.55 | 2.94 | 1 | 4.68 | 7.12 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €22.788 | €388 | €1.768 | 8.11 | 3.19 | 0.99 | 5.12 | 6.96 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €5.814 | €387 | €1.475 | 0.76 | 0.45 | 0.94 | 1.13 | 1.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €11.703 | €1.186 | €1.662 | 3.25 | 1.49 | 1 | 2.67 | 3.91 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €27.804 | €4.798 | €1.802 | 4.65 | 1.52 | 1.02 | 4.27 | 4.24 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €14.439 | €26.696 | €29.127 | €32.072 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €470 | €328 | €171 | €107 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €5.447 | €10.506 | €17.330 | €21.254 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €2.481 | €2.321 | €2.234 | €3.095 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €3.398 | €4.267 | €7.034 | €12.156 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €4.192 | €7.460 | €13.140 | €17.783 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €5.750 | €10.664 | €16.329 | €21.045 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €4.247 | €0 | €0 | €5.015 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €6.020 | €10.070 | €0 | €10.777 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €19.867 | €0 | €0 | €25.972 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.781 | €482 | 3.7× | 14.04 | 0.84 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.211 | €71 | 17.1× | 20.64 | 1.24 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.846 | €277 | 6.7× | 13.54 | 0.81 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.444 | €108 | 13.4× | 17.32 | 1.04 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.146 | €171 | 12.6× | 11.65 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.724 | €227 | 7.6× | 14.5 | 0.87 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.768 | €273 | 6.5× | 14.14 | 0.85 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.475 | €109 | 13.5× | 16.95 | 1.02 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.662 | €183 | 9.1× | 15.04 | 0.9 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.802 | €388 | 4.6× | 13.87 | 0.83 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 13.6% | 80.9% | 5.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.5 | 56 | 28.3% | 61.4% | 10.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.9 | 59 | 12.1% | 77.9% | 10% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.3 | 57 | 18.2% | 75.2% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.8 | 66 | 4.9% | 63.8% | 31.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 12.8% | 75.7% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.1 | 58 | 15.9% | 77.8% | 6.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 23.6% | 66.3% | 10% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 57 | 18.1% | 75.7% | 6.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 7.1 | 58 | 15.6% | 75.8% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 50 | 17.19 | 3.27 | 1.2 | 8.33 | 13.54 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 2.16 | 0.3 | 0.23 | 3.16 | 5.18 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 9.05 | 2.43 | 1.4 | 8.1 | 13.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 57 | 6.44 | 1.15 | 0.8 | 6.5 | 10.45 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 56 | 6.37 | 1.58 | 1.1 | 6.94 | 11.45 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 54 | 9.59 | 2.22 | 1.39 | 8.01 | 13.28 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 9.32 | 2.43 | 1.49 | 8.3 | 13.21 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 49 | 2 | 0.35 | 0.11 | 2.23 | 3.52 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 53 | 5.04 | 1.12 | 0.53 | 4.31 | 7.22 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 52 | 6.49 | 1.18 | 0.38 | 3.34 | 5.21 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.28 | 1.42 | 1.32 | 0.83 | 9.2 | 15.4 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.13 | 0.78 | 0.7 | 0.1 | 3.23 | 2.34 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.43 | 2.48 | 2.13 | 0.61 | 8.47 | 13.99 | ✅ Gesunde Event-Verteilung. |
| Scandal Recovery | 0.47 | 2.61 | 2.08 | 0.37 | 7.2 | 8.98 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.3 | 1.41 | 1.36 | 0.27 | 7.8 | 11.12 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.77 | 3.88 | 3.39 | 0.96 | 8.46 | 13.65 | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | 0.47 | 2.23 | 2.09 | 0.65 | 8.74 | 14.27 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.06 | 0.33 | 0.25 | 0.06 | 2.42 | 3.19 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.15 | 0.93 | 0.77 | 0.22 | 4.77 | 8.27 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.18 | 0.87 | 0.68 | 0.51 | 3.52 | 6.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 57.81 | 57.81 | 57.81 | 173.43 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.29 | 4.29 | 4.29 | 12.87 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.18 | 27.18 | 27.18 | 81.54 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 13.03 | 13.03 | 13.03 | 39.09 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.82 | 14.82 | 14.82 | 44.46 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 26.5 | 26.5 | 26.5 | 79.5 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 26.93 | 26.93 | 26.93 | 80.79 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 7.9 | 7.9 | 7.9 | 23.7 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 14.9 | 14.9 | 14.9 | 44.7 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 23.51 | 23.51 | 23.51 | 70.53 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €32.072 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 413 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 94.23% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €2.146 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €41.086 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 57.81 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.00 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €32.072 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 354 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 94.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €107 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Endfame | 120 – 320 | 152 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 2.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €21.254 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 369 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 43.08% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €3.095 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Endfame | 150 – 360 | 261 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 23.46% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €12.156 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 413 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 3.08% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €17.783 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Endfame | 200 – 430 | 382 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €21.045 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 335 | ✅ | Im Zielband – leicht außermittig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 94.23% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €32.072 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.00 Event-Impulsen.
- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Festival Push (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
