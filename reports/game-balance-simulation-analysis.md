# Game Balance Simulation – Analyse

Erstellt am: 2026-07-15T10:24:36.127Z

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
| 70 | 305 | 17 | 50 | 77 | Fame-Gewinn liegt im Zielkorridor von 55-77 guten Gigs bis 24.390 Fame. |
| 85 | 365 | 14 | 42 | 64 | Fame-Gewinn liegt im Zielkorridor von 55-77 guten Gigs bis 24.390 Fame. |
| 100 | 425 | 12 | 36 | 55 | Fame-Gewinn liegt im Zielkorridor von 55-77 guten Gigs bis 24.390 Fame. |

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
| Baseline Touring | €500 | 0 | €62.728 | 58.3% | 0.08 | 2.3% | 1954 | 3 | 58 | 16.33 | 58.95 | 16.05 | 0% | €1.640 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.983 | 36.2% | 0.1 | 0.7% | 516 | 1 | 58 | 0.8 | 4.31 | 1.82 | 77.31% | €1.191 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €24.968 | 43.9% | 0.08 | 2.4% | 1098 | 2 | 62 | 4.96 | 28.17 | 8.69 | 0.38% | €1.681 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €13.178 | 28.7% | 0.1 | 1.2% | 1010 | 2 | 60 | 3.46 | 15.65 | 5.95 | 16.15% | €1.390 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €19.315 | 22.9% | 0.08 | 2.5% | 1047 | 2 | 60 | 2.56 | 17.47 | 6.24 | 5.77% | €1.611 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €23.935 | 32.2% | 0.09 | 2.1% | 1062 | 2 | 61 | 6.51 | 27.74 | 8.85 | 1.54% | €1.464 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €27.172 | 42.2% | 0.08 | 3.1% | 1080 | 2 | 61 | 5.01 | 28.05 | 8.54 | 1.15% | €1.744 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €20.764 | 27.3% | 0.09 | 0.8% | 1113 | 2 | 62 | 0 | 27.64 | 8.51 | 2.69% | €1.416 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €23.994 | 35.1% | 0.09 | 0.9% | 1045 | 2 | 59 | 15.35 | 26.87 | 8.84 | 3.85% | €1.419 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €7.870 | 13.8% | 0.08 | 0.6% | 982 | 2 | 54 | 4.17 | 8.04 | 1.92 | 0.77% | €1.314 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €17.823 | 13.2% | 0.09 | 1.4% | 1177 | 2 | 57 | 5.91 | 15.35 | 4.65 | 0% | €1.492 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.426 | 30.4% | 0.08 | 2.5% | 1649 | 2 | 58 | 11.63 | 24.07 | 5.93 | 0% | €1.702 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €63.471 | €497 | €1.640 | 17.9 | 4.58 | 14.07 | 8.7 | 11.78 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €3.036 | €88 | €1.191 | 0.88 | 0.67 | 1.49 | 0.43 | 1.6 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €35.195 | €401 | €1.681 | 10.03 | 3.51 | 8.61 | 4.35 | 7.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €14.258 | €244 | €1.390 | 5.35 | 2.49 | 5.22 | 2.37 | 5.28 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €20.700 | €289 | €1.611 | 6.34 | 2.8 | 6.41 | 2.62 | 5.6 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €28.723 | €390 | €1.464 | 9.75 | 3.41 | 8.27 | 3.94 | 7.38 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €35.968 | €403 | €1.744 | 9.44 | 3.37 | 8.38 | 4.27 | 7.17 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €24.076 | €379 | €1.416 | 0 | 0 | 8.09 | 4.21 | 7.55 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €28.070 | €309 | €1.419 | 9.69 | 3.34 | 7.62 | 4.11 | 7.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €8.147 | €379 | €1.314 | 1.24 | 0.72 | 1.76 | 0.98 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.441 | €1.353 | €1.492 | 4.41 | 1.88 | 3.99 | 2.3 | 3.95 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €37.319 | €4.893 | €1.702 | 6.27 | 1.72 | 5.38 | 3.47 | 4.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €21.112 | €29.011 | €43.806 | €62.728 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €597 | €1.178 | €1.568 | €1.983 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €9.043 | €19.249 | €25.468 | €24.968 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €3.485 | €6.782 | €9.887 | €13.178 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €5.281 | €10.158 | €14.704 | €19.315 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €6.695 | €14.516 | €21.035 | €23.935 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €9.280 | €19.344 | €25.559 | €27.172 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €6.018 | €11.904 | €17.929 | €20.764 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €5.546 | €12.676 | €19.973 | €23.994 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €6.863 | €0 | €0 | €7.870 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €8.595 | €16.735 | €0 | €17.823 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €26.155 | €0 | €0 | €29.426 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.640 | €90 | 18.2× | 15.24 | 0.91 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.191 | €56 | 21.1× | 20.99 | 1.26 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.681 | €84 | 20× | 14.87 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.390 | €71 | 19.6× | 17.99 | 1.08 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.611 | €77 | 21× | 15.52 | 0.93 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.464 | €81 | 18× | 17.07 | 1.02 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.744 | €84 | 20.7× | 14.33 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.416 | €80 | 17.6× | 17.66 | 1.06 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.419 | €80 | 17.8× | 17.62 | 1.06 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.314 | €60 | 21.8× | 19.03 | 1.14 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.492 | €78 | 19.2× | 16.76 | 1.01 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.702 | €91 | 18.8× | 14.69 | 0.88 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 12% | 73% | 15% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.2 | 58 | 21.7% | 66.9% | 11.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.7 | 60 | 12.3% | 73.5% | 14.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.5% | 72.3% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.6 | 67 | 3.9% | 59% | 37.1% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 61 | 12.7% | 72% | 15.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7 | 59 | 15.8% | 73.7% | 10.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7 | 59 | 17.1% | 71.7% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 57 | 20.1% | 72.2% | 7.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 23.4% | 65.9% | 10.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18.9% | 73% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.9 | 60 | 14.8% | 72.5% | 12.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 16.05 | 3.57 | 1.35 | 8.46 | 10.79 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 1.82 | 0.49 | 0.44 | 2.86 | 0.69 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 62 | 8.69 | 2.67 | 1.67 | 8.4 | 4.99 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 5.95 | 1.93 | 1.42 | 7 | 2.72 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 60 | 6.24 | 2.13 | 1.54 | 7.74 | 3.16 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 61 | 8.85 | 2.62 | 1.59 | 8.33 | 4.99 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.54 | 2.59 | 1.61 | 8.2 | 4.9 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.51 | 0 | 0 | 7.92 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 59 | 8.84 | 2.6 | 1.54 | 7.95 | 4.64 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 54 | 1.92 | 0.55 | 0.2 | 2.09 | 1.38 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 57 | 4.65 | 1.48 | 0.77 | 4.09 | 2.72 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 58 | 5.93 | 1.38 | 0.44 | 3.22 | 4.45 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.87 | 1.46 | 1.79 | 0.9 | 9.28 | 22.06 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.48 | 0.83 | 0.8 | 0.11 | 3.16 | 3.1 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.59 | 2.69 | 2.7 | 0.67 | 9.14 | 16.03 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.62 | 2.91 | 2.98 | 0.47 | 7.53 | 10.83 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 1 | 1.72 | 1.61 | 0.26 | 8.35 | 12.82 | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | 2.53 | 4.23 | 4.27 | 1.05 | 8.9 | 15.47 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.47 | 2.45 | 2.38 | 0.63 | 9.05 | 15.72 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.09 | 2.32 | 2.07 | 0.48 | 8.83 | 15.27 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.15 | 2.22 | 2.31 | 0.51 | 8.48 | 14.43 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.2 | 0.33 | 0.4 | 0.12 | 2.34 | 3.33 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.52 | 1 | 1.04 | 0.29 | 4.82 | 8.25 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.43 | 0.99 | 0.77 | 0.52 | 3.67 | 8.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.95 | 58.95 | 58.95 | 176.85 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.31 | 4.31 | 4.31 | 12.93 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.17 | 28.17 | 28.17 | 84.51 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 15.65 | 15.65 | 15.65 | 46.95 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.47 | 17.47 | 17.47 | 52.41 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 27.74 | 27.74 | 27.74 | 83.22 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.05 | 28.05 | 28.05 | 84.15 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 27.64 | 27.64 | 27.64 | 82.92 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 26.87 | 26.87 | 26.87 | 80.61 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.04 | 8.04 | 8.04 | 24.12 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.35 | 15.35 | 15.35 | 46.05 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.07 | 24.07 | 24.07 | 72.21 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €62.728 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 1954 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 77.31% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €1.744 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €63.471 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.95 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.09 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €62.728 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 269.82 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 77.31% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €1.983 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 250 – 500 | 259.42 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €24.968 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 250 – 500 | 268.66 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 16.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €13.178 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 258.45 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 5.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €19.315 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 297.32 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €23.935 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 269.68 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €27.172 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 500 | 262.54 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-106 | 1.72 | -0.03 |
| Bootstrap Struggle | -0.38% | €114 | -0.92 | -0.02 |
| Aggressive Marketing | 0% | €-850 | -0.32 | -0.06 |
| Scandal Recovery | 2.69% | €-652 | -0.6 | -0.28 |
| Festival Push | 0% | €217 | 1.29 | -0.01 |
| Chaos Tour | 1.54% | €-637 | 1.2 | -0.23 |
| Cult Hypergrowth | -0.77% | €1.083 | -0.77 | 0.21 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0% | €-589 | -0.57 | -0.05 |
| Early Game Probe (Fame 0–50) | 0% | €180 | 0 | 0.02 |
| Mid Game Probe (Fame 60–150) | 0% | €-61 | -0.21 | 0.06 |
| Late Game Probe (Fame 175+) | 0% | €-99 | 0.53 | -0.03 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 77.31% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €62.728 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.09 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
