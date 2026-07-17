# Game Balance Simulation – Analyse

Erstellt am: 2026-07-17T08:57:26.784Z

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
| 70 | 340 | 15 | 45 | 69 | Fame-Gewinn liegt im Zielkorridor von 50-70 guten Gigs bis 24.390 Fame. |
| 85 | 400 | 13 | 38 | 59 | Fame-Gewinn liegt im Zielkorridor von 50-70 guten Gigs bis 24.390 Fame. |
| 100 | 460 | 11 | 34 | 51 | Fame-Gewinn liegt im Zielkorridor von 50-70 guten Gigs bis 24.390 Fame. |

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
| Baseline Touring | €500 | 0 | €76.862 | 57% | 0.07 | 2.9% | 2374 | 3 | 61 | 12.18 | 58.69 | 16.03 | 0.38% | €1.931 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €3.856 | 34.1% | 0.09 | 1.6% | 625 | 1 | 59 | 1.12 | 6.26 | 2.89 | 57.69% | €1.462 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €27.514 | 49.3% | 0.07 | 2.7% | 1131 | 2 | 63 | 5.4 | 27.98 | 8.56 | 1.54% | €1.967 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €16.494 | 26.3% | 0.08 | 2.5% | 999 | 2 | 58 | 3.75 | 16.35 | 6.19 | 11.15% | €1.652 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €22.869 | 23.7% | 0.07 | 3.1% | 1119 | 2 | 59 | 3.25 | 17.85 | 6.2 | 4.23% | €1.910 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €26.559 | 36.2% | 0.08 | 2.7% | 1101 | 2 | 62 | 5.9 | 27.87 | 9.03 | 0.38% | €1.765 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €28.149 | 51.7% | 0.07 | 2.8% | 1171 | 2 | 63 | 4.15 | 28.24 | 8.48 | 1.15% | €2.019 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €25.303 | 28.3% | 0.08 | 2.3% | 1203 | 2 | 64 | 0 | 28.3 | 8.57 | 0.38% | €1.695 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €25.972 | 38.3% | 0.08 | 1.9% | 1178 | 2 | 60 | 15.77 | 27.58 | 8.9 | 1.54% | €1.685 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €9.948 | 9% | 0.07 | 2% | 1122 | 2 | 55 | 3.35 | 8.08 | 1.92 | 0% | €1.586 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €21.414 | 11.4% | 0.07 | 1.9% | 1214 | 2 | 58 | 5.13 | 15.32 | 4.68 | 0% | €1.772 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.805 | 43.7% | 0.06 | 3% | 1930 | 3 | 61 | 11.25 | 24.07 | 5.93 | 0% | €2.022 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €77.389 | €497 | €1.931 | 17.1 | 4.52 | 14.95 | 8.74 | 11.66 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €5.045 | €119 | €1.462 | 1.59 | 1.09 | 2.6 | 0.72 | 2.55 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €38.107 | €403 | €1.967 | 10.22 | 3.43 | 9.27 | 4.35 | 7.6 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €18.113 | €271 | €1.652 | 5.37 | 2.48 | 5.9 | 2.5 | 5.5 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €25.314 | €298 | €1.910 | 6.17 | 2.85 | 6.94 | 2.63 | 5.64 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €34.485 | €396 | €1.765 | 9.51 | 3.38 | 8.91 | 3.93 | 7.5 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €38.798 | €404 | €2.019 | 9.72 | 3.4 | 9.37 | 4.24 | 7.13 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €30.409 | €395 | €1.695 | 0 | 0 | 8.94 | 4.22 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €32.985 | €330 | €1.685 | 9.42 | 3.35 | 8.61 | 4.15 | 7.6 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €10.133 | €391 | €1.586 | 1.32 | 0.78 | 1.83 | 0.97 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €22.379 | €1.371 | €1.772 | 4.54 | 1.83 | 4.35 | 2.2 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.304 | €4.909 | €2.022 | 6.07 | 1.79 | 6.03 | 3.42 | 4.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €24.662 | €30.502 | €54.472 | €76.862 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.004 | €2.030 | €3.073 | €3.856 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €10.456 | €22.146 | €26.704 | €27.514 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €4.688 | €8.733 | €12.766 | €16.494 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €6.448 | €12.961 | €18.084 | €22.869 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €8.233 | €17.595 | €24.747 | €26.559 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €11.241 | €22.982 | €26.338 | €28.149 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €7.642 | €15.967 | €23.369 | €25.303 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €6.645 | €15.660 | €23.672 | €25.972 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €8.409 | €0 | €0 | €9.948 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €10.582 | €20.217 | €0 | €21.414 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €28.596 | €0 | €0 | €29.805 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.931 | €91 | 21.3× | 12.95 | 0.78 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.462 | €60 | 24.4× | 17.09 | 1.03 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.967 | €85 | 23.1× | 12.71 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.652 | €75 | 22.1× | 15.14 | 0.91 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.910 | €79 | 24.1× | 13.09 | 0.79 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.765 | €83 | 21.2× | 14.16 | 0.85 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.019 | €86 | 23.6× | 12.38 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.695 | €83 | 20.4× | 14.75 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.685 | €82 | 20.6× | 14.83 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.586 | €63 | 25.1× | 15.77 | 0.95 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.772 | €81 | 21.9× | 14.11 | 0.85 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.022 | €91 | 22.2× | 12.36 | 0.74 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.6 | 61 | 11.3% | 71.9% | 16.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.2 | 58 | 21.1% | 68.9% | 10% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.7 | 61 | 11.1% | 73.5% | 15.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.2% | 72.6% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 67 | 4.3% | 57.4% | 38.2% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 12.3% | 73.4% | 14.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 59 | 15.4% | 72.3% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7 | 59 | 17% | 71.1% | 11.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 58 | 20.2% | 71.6% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 23.3% | 65.6% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18.6% | 73.2% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 14.2% | 72.3% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 61 | 16.03 | 3.47 | 1.38 | 8.23 | 10.33 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 2.89 | 0.87 | 0.67 | 4.29 | 1.07 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 8.56 | 2.69 | 1.63 | 8.02 | 4.85 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 58 | 6.19 | 1.9 | 1.41 | 7.59 | 2.77 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 59 | 6.2 | 2.13 | 1.68 | 7.7 | 3.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 62 | 9.03 | 2.57 | 1.62 | 8.57 | 4.93 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 63 | 8.48 | 2.62 | 1.58 | 8.19 | 4.91 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 64 | 8.57 | 0 | 0 | 8.3 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 60 | 8.9 | 2.64 | 1.58 | 8.1 | 4.87 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.92 | 0.61 | 0.25 | 2.08 | 1.44 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 58 | 4.68 | 1.41 | 0.75 | 4.24 | 2.6 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 61 | 5.93 | 1.41 | 0.49 | 3.33 | 4.34 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.87 | 1.41 | 1.58 | 0.75 | 8.94 | 22.75 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.72 | 1.36 | 1.27 | 0.14 | 4.74 | 5.46 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.65 | 2.57 | 2.66 | 0.65 | 8.85 | 16.72 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.72 | 3 | 3.13 | 0.5 | 7.85 | 12.15 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.98 | 1.8 | 1.64 | 0.29 | 8.29 | 13.7 | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | 2.33 | 4.22 | 4.35 | 1.07 | 8.89 | 16.38 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.4 | 2.53 | 2.45 | 0.62 | 9.08 | 16.73 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.27 | 2.38 | 2.22 | 0.53 | 8.82 | 16.29 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.27 | 2.1 | 2.24 | 0.57 | 8.98 | 15.8 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.21 | 0.37 | 0.4 | 0.1 | 2.29 | 3.39 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.55 | 0.97 | 0.97 | 0.27 | 4.83 | 8.58 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.43 | 0.94 | 0.85 | 0.47 | 3.62 | 9.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.69 | 58.69 | 58.69 | 176.07 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 6.26 | 6.26 | 6.26 | 18.78 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.98 | 27.98 | 27.98 | 83.94 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 16.35 | 16.35 | 16.35 | 49.05 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.85 | 17.85 | 17.85 | 53.55 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 27.87 | 27.87 | 27.87 | 83.61 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.24 | 28.24 | 28.24 | 84.72 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.3 | 28.3 | 28.3 | 84.9 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 27.58 | 27.58 | 27.58 | 82.74 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.08 | 8.08 | 8.08 | 24.24 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.32 | 15.32 | 15.32 | 45.96 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.07 | 24.07 | 24.07 | 72.21 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €76.862 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 2374 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 57.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €2.022 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €77.389 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.69 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.97 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €76.862 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 306.46 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 57.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €3.856 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 250 – 500 | 294.09 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €27.514 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 305.74 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 11.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €16.494 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 294.18 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €22.869 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 331.6 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €26.559 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 303.59 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €28.149 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 299.91 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-762 | 3.58 | -0.01 |
| Bootstrap Struggle | -0.77% | €-34 | 0.35 | 0.06 |
| Aggressive Marketing | 0.39% | €549 | 0.31 | -0.06 |
| Scandal Recovery | 1.53% | €86 | 0.52 | -0.23 |
| Festival Push | 0% | €-22 | -1.86 | -0.1 |
| Chaos Tour | 0.38% | €197 | -2.04 | -0.09 |
| Cult Hypergrowth | 0.77% | €-97 | 1.39 | -0.05 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -1.15% | €316 | -1.58 | 0.24 |
| Early Game Probe (Fame 0–50) | -0.77% | €81 | -0.53 | 0.05 |
| Mid Game Probe (Fame 60–150) | 0% | €-70 | -0.84 | -0.03 |
| Late Game Probe (Fame 175+) | 0% | €-146 | -1.55 | -0.01 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 57.69% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €76.862 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.97 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
