# Game Balance Simulation – Analyse

Erstellt am: 2026-07-16T13:21:15.378Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Fame-Gates | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |

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
| Baseline Touring | €500 | 0 | €77.468 | 56.9% | 0.07 | 3.9% | 14788 | 8 | 60 | 15.13 | 58.91 | 16.09 | 0% | €2.040 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €12.761 | 21.8% | 0.07 | 2.8% | 1126 | 2 | 59 | 1.9 | 11.18 | 5.21 | 12.69% | €2.188 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €31.750 | 55% | 0.06 | 4% | 2884 | 3 | 65 | 7.03 | 28.56 | 8.38 | 0.38% | €2.302 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €23.174 | 22.7% | 0.07 | 3% | 1807 | 3 | 59 | 3.78 | 18.28 | 6.56 | 1.15% | €2.143 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €25.479 | 26.2% | 0.06 | 4% | 2073 | 3 | 63 | 3.02 | 18.44 | 6.2 | 1.92% | €2.384 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €27.555 | 46.1% | 0.07 | 3.6% | 2828 | 3 | 63 | 6.98 | 28.25 | 8.57 | 0.77% | €2.054 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €34.161 | 55.6% | 0.06 | 3.6% | 2646 | 3 | 64 | 7.19 | 28.71 | 8.29 | 0% | €2.374 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €26.693 | 34.7% | 0.07 | 2.9% | 2883 | 3 | 63 | 0 | 28.44 | 8.56 | 0% | €2.014 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €26.561 | 45.3% | 0.07 | 2.7% | 2582 | 3 | 64 | 14.83 | 28 | 8.74 | 0.77% | €1.983 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €13.073 | 4.5% | 0.06 | 2.8% | 2050 | 3 | 56 | 5.02 | 8.1 | 1.9 | 0% | €2.011 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €25.110 | 14.5% | 0.06 | 2.6% | 2280 | 3 | 58 | 5.27 | 15.43 | 4.54 | 0.38% | €2.251 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.387 | 48.1% | 0.06 | 3.6% | 7383 | 6 | 61 | 10.52 | 24.13 | 5.87 | 0% | €2.158 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €78.076 | €500 | €2.040 | 18.43 | 4.72 | 21.94 | 8.37 | 11.73 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €14.778 | €216 | €2.188 | 3.42 | 2.2 | 7.62 | 1.19 | 4.86 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €40.549 | €415 | €2.302 | 10.33 | 3.62 | 16.31 | 4.14 | 7.71 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €26.340 | €324 | €2.143 | 6.28 | 2.91 | 10.68 | 2.5 | 6.11 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €31.299 | €324 | €2.384 | 6.07 | 2.94 | 12.26 | 2.52 | 5.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €37.511 | €411 | €2.054 | 10.17 | 3.47 | 15.85 | 3.77 | 7.6 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €41.984 | €414 | €2.374 | 10.11 | 3.67 | 16.26 | 4.09 | 7.2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €34.820 | €412 | €2.014 | 0 | 0 | 15.49 | 4.07 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €36.730 | €397 | €1.983 | 9.89 | 3.37 | 15.24 | 3.98 | 7.71 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.268 | €414 | €2.011 | 1.53 | 0.77 | 3.27 | 0.87 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €28.017 | €1.373 | €2.251 | 4.49 | 1.85 | 7.79 | 2.1 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.780 | €4.927 | €2.158 | 6.7 | 1.85 | 8.76 | 3.28 | 4.35 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €27.251 | €31.981 | €55.927 | €77.468 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.015 | €7.061 | €10.292 | €12.761 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €14.477 | €25.412 | €26.113 | €31.750 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.137 | €14.381 | €18.953 | €23.174 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.174 | €16.680 | €22.316 | €25.479 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €11.633 | €22.089 | €26.492 | €27.555 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.744 | €26.059 | €26.653 | €34.161 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.958 | €19.897 | €25.414 | €26.693 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €8.871 | €19.224 | €26.279 | €26.561 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €11.655 | €0 | €0 | €13.073 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €14.481 | €23.961 | €0 | €25.110 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €29.650 | €0 | €0 | €29.387 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.040 | €96 | 21.3× | 12.26 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.188 | €72 | 30.6× | 11.43 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.302 | €89 | 26× | 10.86 | 0.65 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.143 | €82 | 26.3× | 11.67 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.384 | €83 | 28.6× | 10.49 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.054 | €87 | 23.5× | 12.17 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.374 | €89 | 26.8× | 10.53 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.014 | €87 | 23.1× | 12.41 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.983 | €85 | 23.3× | 12.61 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.011 | €70 | 28.7× | 12.43 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.251 | €86 | 26.1× | 11.11 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.158 | €94 | 22.9× | 11.58 | 0.69 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.6% | 73.9% | 14.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 22.8% | 68.3% | 8.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 10.8% | 69.4% | 19.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.3% | 71.3% | 9.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.6% | 57.5% | 38.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 13.2% | 69.1% | 17.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.3% | 69.7% | 15% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 16% | 71.7% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7 | 59 | 18.7% | 69.4% | 11.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 21.7% | 67.4% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19.1% | 71.5% | 9.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 60 | 13.3% | 72% | 14.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 16.09 | 3.71 | 1.36 | 8.14 | 10.65 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 5.21 | 1.71 | 1.32 | 7.32 | 2.05 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 65 | 8.38 | 2.85 | 1.78 | 8.36 | 5.14 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.56 | 2.32 | 1.72 | 8.28 | 3.16 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 63 | 6.2 | 2.26 | 1.68 | 8.23 | 3.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 63 | 8.57 | 2.68 | 1.6 | 8.28 | 5.1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 64 | 8.29 | 2.84 | 1.76 | 8.3 | 5.21 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 63 | 8.56 | 0 | 0 | 8.4 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 64 | 8.74 | 2.67 | 1.53 | 8.34 | 5.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 56 | 1.9 | 0.61 | 0.23 | 2.15 | 1.45 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 58 | 4.54 | 1.42 | 0.75 | 4.17 | 2.57 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 61 | 5.87 | 1.47 | 0.46 | 3.2 | 4.28 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.9 | 1.45 | 1.7 | 0.82 | 9.07 | 30.33 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.21 | 1.92 | 1.97 | 0.24 | 8.37 | 14.1 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Aggressive Marketing | 1.49 | 2.69 | 2.9 | 0.66 | 9.05 | 24.26 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.1 | 3.45 | 3.34 | 0.52 | 9.12 | 18.38 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.87 | 1.7 | 1.77 | 0.32 | 8.95 | 19.87 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.61 | 4.35 | 4.32 | 1.02 | 9 | 23.91 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.51 | 2.56 | 2.44 | 0.62 | 9 | 24.28 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.22 | 2.25 | 2.36 | 0.55 | 8.94 | 23.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.37 | 2.29 | 2.19 | 0.5 | 8.89 | 22.88 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.22 | 0.42 | 0.37 | 0.1 | 2.34 | 5.12 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.5 | 1.01 | 0.95 | 0.26 | 4.79 | 12.14 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.5 | 0.94 | 0.94 | 0.52 | 3.57 | 12.39 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.91 | 58.91 | 58.91 | 176.73 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 11.18 | 11.18 | 11.18 | 33.54 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.56 | 28.56 | 28.56 | 85.68 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.28 | 18.28 | 18.28 | 54.84 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.44 | 18.44 | 18.44 | 55.32 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.25 | 28.25 | 28.25 | 84.75 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.71 | 28.71 | 28.71 | 86.13 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.44 | 28.44 | 28.44 | 85.32 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28 | 28 | 28 | 84 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.1 | 8.1 | 8.1 | 24.3 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.43 | 15.43 | 15.43 | 46.29 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.13 | 24.13 | 24.13 | 72.39 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €77.468 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 14788 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 12.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €2.384 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €78.076 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.91 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.30 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €77.468 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 800 | 709.82 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 12.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €15.000 | €12.761 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 380 – 800 | 674.55 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €31.750 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 800 | 723.9 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €23.174 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 800 | 685.79 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €25.479 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 800 | 784.27 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €27.555 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 800 | 717.06 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €34.161 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 800 | 703.2 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-260 | -2.27 | -0.08 |
| Bootstrap Struggle | 1.54% | €103 | -0.92 | -0.07 |
| Aggressive Marketing | 0% | €-164 | 6.72 | -0.01 |
| Scandal Recovery | 0.38% | €211 | 0.66 | 0.03 |
| Festival Push | 0.38% | €-45 | 0.48 | -0.01 |
| Chaos Tour | 0.77% | €1.388 | 2.42 | -0.06 |
| Cult Hypergrowth | -0.38% | €1.293 | -0.57 | 0.19 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -0.38% | €115 | 2.63 | 0.04 |
| Early Game Probe (Fame 0–50) | 0% | €-39 | -3.02 | -0.02 |
| Mid Game Probe (Fame 60–150) | 0.38% | €-407 | -1.39 | -0.07 |
| Late Game Probe (Fame 175+) | 0% | €-223 | -0.02 | -0.01 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 12.69% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €77.468 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.30 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
