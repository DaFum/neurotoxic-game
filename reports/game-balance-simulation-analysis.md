# Game Balance Simulation – Analyse

Erstellt am: 2026-07-16T12:46:46.149Z

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
| Baseline Touring | €500 | 0 | €75.340 | 57.4% | 0.07 | 4% | 15437 | 8 | 60 | 14.31 | 58.88 | 16.12 | 0% | €2.005 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €2.968 | 32% | 0.09 | 2.3% | 1029 | 2 | 60 | 1.17 | 4.59 | 1.8 | 74.23% | €1.464 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €27.223 | 46.3% | 0.07 | 3.3% | 2606 | 3 | 63 | 5.93 | 28.06 | 8.39 | 1.54% | €1.948 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €17.036 | 26.1% | 0.08 | 2.6% | 1807 | 3 | 59 | 4.07 | 16.36 | 5.89 | 12.31% | €1.677 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €20.336 | 22.8% | 0.07 | 3.1% | 2032 | 3 | 62 | 3.67 | 17.2 | 5.89 | 8.08% | €1.835 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €26.543 | 35.4% | 0.08 | 3.1% | 2800 | 3 | 65 | 7.44 | 28.12 | 8.61 | 0.77% | €1.764 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €28.701 | 50.5% | 0.07 | 3% | 2598 | 3 | 63 | 6.3 | 28.4 | 8.46 | 0.38% | €2.002 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €25.672 | 27.2% | 0.08 | 2.8% | 2831 | 3 | 63 | 0 | 28.21 | 8.68 | 0.38% | €1.734 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €26.154 | 38.5% | 0.08 | 2.3% | 2637 | 3 | 62 | 15.49 | 27.71 | 8.78 | 1.54% | €1.724 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €10.366 | 10.2% | 0.07 | 2.1% | 2105 | 3 | 55 | 4.98 | 8.08 | 1.9 | 0.38% | €1.661 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €20.643 | 10.7% | 0.08 | 1.9% | 2364 | 3 | 58 | 5.5 | 15.3 | 4.6 | 0.77% | €1.720 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.364 | 41.5% | 0.07 | 3.3% | 6734 | 5 | 62 | 8.83 | 24.1 | 5.9 | 0% | €2.005 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €75.818 | €497 | €2.005 | 18.98 | 4.63 | 21.42 | 8.37 | 11.73 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €4.091 | €100 | €1.464 | 1.15 | 0.84 | 2.59 | 0.42 | 1.71 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €37.153 | €400 | €1.948 | 9.67 | 3.42 | 15.67 | 4.1 | 7.53 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €18.188 | €260 | €1.677 | 5.63 | 2.57 | 9.46 | 2.27 | 5.44 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €22.543 | €286 | €1.835 | 6.37 | 2.83 | 11.1 | 2.37 | 5.43 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €33.712 | €394 | €1.764 | 10.5 | 3.48 | 15.35 | 3.82 | 7.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €38.755 | €406 | €2.002 | 9.99 | 3.44 | 15.71 | 4.17 | 7.2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €30.125 | €386 | €1.734 | 0 | 0 | 14.84 | 4.01 | 7.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €32.576 | €314 | €1.724 | 9.78 | 3.41 | 14.67 | 3.92 | 7.54 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €10.632 | €381 | €1.661 | 1.47 | 0.76 | 3.25 | 0.88 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €21.040 | €1.352 | €1.720 | 4.65 | 1.78 | 7.62 | 2.1 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.093 | €4.885 | €2.005 | 6.53 | 1.83 | 9.07 | 3.33 | 4.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.070 | €31.609 | €53.799 | €75.340 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.013 | €1.619 | €2.387 | €2.968 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €10.751 | €21.609 | €26.344 | €27.223 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.254 | €9.101 | €12.928 | €17.036 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €6.211 | €11.361 | €15.602 | €20.336 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €8.807 | €17.849 | €23.985 | €26.543 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €11.602 | €22.822 | €25.989 | €28.701 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €8.023 | €15.825 | €22.236 | €25.672 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.175 | €16.373 | €23.599 | €26.154 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.085 | €0 | €0 | €10.366 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €10.041 | €19.616 | €0 | €20.643 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €28.892 | €0 | €0 | €29.364 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.005 | €95 | 21× | 12.47 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.464 | €62 | 23.6× | 17.08 | 1.02 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.948 | €87 | 22.5× | 12.84 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.677 | €77 | 21.9× | 14.91 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.835 | €79 | 23.1× | 13.62 | 0.82 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.764 | €85 | 20.7× | 14.17 | 0.85 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.002 | €87 | 23.1× | 12.49 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.734 | €84 | 20.5× | 14.41 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.724 | €83 | 20.7× | 14.5 | 0.87 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.661 | €65 | 25.4× | 15.05 | 0.9 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.720 | €81 | 21.3× | 14.53 | 0.87 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.005 | €93 | 21.5× | 12.47 | 0.75 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.9% | 73.2% | 15% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.9 | 59 | 20.4% | 63.4% | 16.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 11.3% | 72.2% | 16.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.1 | 58 | 18.8% | 72.4% | 8.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 4.5% | 56.7% | 38.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.1% | 68.9% | 19.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 60 | 15.3% | 71.3% | 13.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.3% | 72.4% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 19.6% | 70.2% | 10.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 23.7% | 65.2% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.1 | 58 | 18.7% | 73.2% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 13.9% | 72.6% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 16.12 | 3.66 | 1.32 | 8.4 | 10.74 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 60 | 1.8 | 0.65 | 0.56 | 3.14 | 0.79 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 8.39 | 2.57 | 1.62 | 8.08 | 5.02 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 5.89 | 2.05 | 1.52 | 7.52 | 2.82 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 62 | 5.89 | 2.19 | 1.58 | 7.68 | 3.1 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 65 | 8.61 | 2.8 | 1.53 | 8.4 | 4.94 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 63 | 8.46 | 2.75 | 1.65 | 8.57 | 5.03 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 63 | 8.68 | 0 | 0 | 8.25 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 62 | 8.78 | 2.67 | 1.53 | 8.03 | 4.91 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.9 | 0.58 | 0.19 | 2.02 | 1.39 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 58 | 4.6 | 1.4 | 0.7 | 4.23 | 2.63 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 62 | 5.9 | 1.48 | 0.49 | 3.36 | 4.3 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.86 | 1.48 | 1.75 | 0.82 | 8.93 | 29.94 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.45 | 0.95 | 0.9 | 0.1 | 3.29 | 4.75 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.59 | 2.76 | 2.85 | 0.62 | 8.96 | 23.59 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.75 | 3.24 | 3.14 | 0.5 | 8 | 15.83 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.92 | 1.71 | 1.59 | 0.28 | 8.2 | 17.84 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.33 | 4.3 | 4.47 | 0.92 | 8.95 | 23.16 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.55 | 2.43 | 2.44 | 0.6 | 9.22 | 23.58 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.33 | 2.18 | 2.05 | 0.52 | 9.02 | 22.74 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.31 | 2.28 | 2.18 | 0.47 | 9.04 | 22.2 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.25 | 0.41 | 0.4 | 0.12 | 2.42 | 5.04 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.54 | 0.95 | 1.02 | 0.27 | 4.93 | 11.89 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.52 | 0.87 | 0.9 | 0.52 | 3.59 | 12.53 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.88 | 58.88 | 58.88 | 176.64 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.59 | 4.59 | 4.59 | 13.77 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.06 | 28.06 | 28.06 | 84.18 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 16.36 | 16.36 | 16.36 | 49.08 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.2 | 17.2 | 17.2 | 51.6 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.12 | 28.12 | 28.12 | 84.36 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.4 | 28.4 | 28.4 | 85.2 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.21 | 28.21 | 28.21 | 84.63 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 27.71 | 27.71 | 27.71 | 83.13 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.08 | 8.08 | 8.08 | 24.24 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.3 | 15.3 | 15.3 | 45.9 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.1 | 24.1 | 24.1 | 72.3 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €75.340 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15437 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 74.23% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Baseline Touring** | €2.005 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €75.818 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.88 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.01 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €75.340 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 800 | 709.67 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 74.23% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €2.968 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 380 – 800 | 696.44 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €27.223 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 800 | 716.57 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 12.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €17.036 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 800 | 684.31 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 8.08% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €20.336 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 800 | 783.76 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €26.543 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 800 | 718.55 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €28.701 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 800 | 701.64 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €671 | -1.56 | 0.02 |
| Bootstrap Struggle | 1.92% | €76 | 0.85 | -0.03 |
| Aggressive Marketing | 0% | €-545 | 1.33 | -0.01 |
| Scandal Recovery | 0% | €166 | 0.43 | -0.13 |
| Festival Push | 0.39% | €-1.035 | 1.48 | -0.29 |
| Chaos Tour | -1.15% | €1.085 | 1.44 | 0.24 |
| Cult Hypergrowth | -0.39% | €1.229 | -2.56 | 0.04 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0% | €417 | -2.64 | -0.01 |
| Early Game Probe (Fame 0–50) | -0.39% | €207 | -1.4 | 0.02 |
| Mid Game Probe (Fame 60–150) | 0% | €100 | 0.03 | 0.01 |
| Late Game Probe (Fame 175+) | 0% | €73 | 1.76 | 0 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 74.23% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €75.340 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.01 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
