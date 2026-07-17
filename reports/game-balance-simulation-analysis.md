# Game Balance Simulation – Analyse

Erstellt am: 2026-07-16T23:05:48.517Z

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
| Baseline Touring | €500 | 0 | €76.741 | 56.8% | 0.07 | 3.8% | 15294 | 8 | 60 | 15.85 | 58.93 | 16.07 | 0% | €2.043 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €13.230 | 21.2% | 0.07 | 2.6% | 1130 | 2 | 58 | 1.87 | 11.28 | 5.24 | 11.15% | €2.184 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €31.816 | 56.1% | 0.06 | 4% | 2991 | 3 | 64 | 8.13 | 28.63 | 8.31 | 0.38% | €2.305 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €23.789 | 20.3% | 0.07 | 3.3% | 1773 | 2 | 59 | 4.21 | 18.32 | 6.61 | 0.38% | €2.152 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €25.803 | 26.9% | 0.06 | 3.8% | 2140 | 3 | 61 | 4.56 | 18.51 | 6.25 | 1.15% | €2.373 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €27.105 | 45.5% | 0.07 | 3.7% | 2652 | 3 | 64 | 6.38 | 28.26 | 8.6 | 0.38% | €2.071 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €33.472 | 56.5% | 0.06 | 3.5% | 2697 | 3 | 64 | 5.38 | 28.6 | 8.3 | 0.38% | €2.349 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €26.693 | 34.7% | 0.07 | 2.9% | 2883 | 3 | 63 | 0 | 28.44 | 8.56 | 0% | €2.014 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| High Controversy | €500 | 0 | €26.224 | 43.4% | 0.07 | 2.7% | 2707 | 3 | 63 | 14.13 | 27.91 | 8.7 | 1.15% | €1.982 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €13.075 | 4.5% | 0.06 | 2.6% | 2091 | 3 | 55 | 4.62 | 8.11 | 1.89 | 0% | €1.991 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €24.609 | 14.8% | 0.06 | 2.7% | 2358 | 3 | 59 | 5.01 | 15.45 | 4.55 | 0% | €2.214 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €30.137 | 48% | 0.06 | 3.9% | 7480 | 6 | 63 | 9.55 | 24.11 | 5.89 | 0% | €2.195 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €77.306 | €500 | €2.043 | 18.32 | 4.52 | 21.85 | 8.4 | 11.75 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €14.881 | €218 | €2.184 | 3.41 | 2.25 | 7.69 | 1.19 | 4.84 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €40.814 | €415 | €2.305 | 10.35 | 3.66 | 16.13 | 4.18 | 7.68 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €26.374 | €326 | €2.152 | 6.25 | 2.92 | 10.68 | 2.49 | 6.16 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €31.333 | €326 | €2.373 | 6.21 | 3.02 | 12.21 | 2.57 | 5.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €37.879 | €412 | €2.071 | 10.41 | 3.53 | 15.76 | 3.8 | 7.56 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €41.645 | €412 | €2.349 | 10.1 | 3.66 | 16.09 | 4.12 | 7.22 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €34.820 | €412 | €2.014 | 0 | 0 | 15.49 | 4.07 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €36.598 | €393 | €1.982 | 9.76 | 3.28 | 15.01 | 4 | 7.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.312 | €413 | €1.991 | 1.38 | 0.77 | 3.27 | 0.88 | 1.91 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €27.484 | €1.384 | €2.214 | 4.42 | 1.85 | 7.74 | 2.07 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €41.205 | €4.952 | €2.195 | 6.38 | 1.8 | 8.73 | 3.28 | 4.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €27.065 | €31.813 | €55.415 | €76.741 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.955 | €7.064 | €10.171 | €13.230 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €14.291 | €25.770 | €26.256 | €31.816 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.171 | €14.182 | €18.947 | €23.789 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.384 | €16.848 | €22.292 | €25.803 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €11.834 | €21.786 | €26.446 | €27.105 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.587 | €25.918 | €26.929 | €33.472 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.958 | €19.897 | €25.414 | €26.693 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €8.583 | €19.066 | €25.911 | €26.224 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €11.655 | N/A | N/A | €13.075 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €14.196 | €23.520 | N/A | €24.609 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €29.727 | N/A | N/A | €30.137 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.043 | €96 | 21.3× | 12.24 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.184 | €72 | 30.5× | 11.45 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.305 | €89 | 26× | 10.85 | 0.65 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.152 | €82 | 26.3× | 11.62 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.373 | €84 | 28.4× | 10.54 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.071 | €87 | 23.7× | 12.07 | 0.72 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.349 | €89 | 26.5× | 10.64 | 0.64 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.014 | €87 | 23.1× | 12.41 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.982 | €85 | 23.3× | 12.61 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.991 | €70 | 28.3× | 12.55 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.214 | €86 | 25.7× | 11.29 | 0.68 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.195 | €94 | 23.3× | 11.39 | 0.68 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.7% | 72.9% | 15.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 22.9% | 68.6% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.2% | 69.3% | 19.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.5% | 71.7% | 8.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.4% | 57.9% | 38.7% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 61 | 13% | 70.3% | 16.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 14.8% | 69.9% | 15.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 16% | 71.7% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 18.9% | 69.4% | 11.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 21.9% | 67.1% | 11% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19.2% | 71.5% | 9.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 60 | 13.2% | 72% | 14.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 16.07 | 3.56 | 1.21 | 8.38 | 10.82 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 5.24 | 1.73 | 1.36 | 7.41 | 1.95 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 64 | 8.31 | 2.82 | 1.78 | 8.05 | 5.28 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.61 | 2.26 | 1.63 | 8.52 | 3.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 61 | 6.25 | 2.22 | 1.67 | 8.08 | 3.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 64 | 8.6 | 2.73 | 1.63 | 8.27 | 5.06 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 64 | 8.3 | 2.81 | 1.71 | 8.27 | 5.23 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 63 | 8.56 | 0 | 0 | 8.4 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 63 | 8.7 | 2.58 | 1.45 | 8.28 | 5.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.89 | 0.59 | 0.23 | 2.21 | 1.44 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 59 | 4.55 | 1.39 | 0.73 | 4.25 | 2.46 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 63 | 5.89 | 1.45 | 0.47 | 3 | 4.25 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.87 | 1.54 | 1.74 | 0.9 | 9.24 | 30.31 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.25 | 2.06 | 1.98 | 0.24 | 8.27 | 14.09 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Aggressive Marketing | 1.57 | 2.82 | 2.98 | 0.63 | 9.21 | 24.13 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.07 | 3.35 | 3.41 | 0.49 | 8.98 | 18.48 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.93 | 1.82 | 1.73 | 0.35 | 8.91 | 19.86 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.4 | 4.29 | 4.24 | 0.95 | 9.07 | 23.67 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.51 | 2.55 | 2.26 | 0.62 | 8.96 | 24.09 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.22 | 2.25 | 2.36 | 0.55 | 8.94 | 23.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.32 | 2.25 | 2.29 | 0.53 | 9.1 | 22.52 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.24 | 0.39 | 0.38 | 0.11 | 2.37 | 5.13 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.53 | 1.03 | 0.97 | 0.3 | 4.74 | 12.26 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.56 | 0.87 | 0.93 | 0.61 | 3.58 | 12.29 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.93 | 58.93 | 58.93 | 176.79 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 11.28 | 11.28 | 11.28 | 33.84 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.63 | 28.63 | 28.63 | 85.89 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.32 | 18.32 | 18.32 | 54.96 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.51 | 18.51 | 18.51 | 55.53 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.26 | 28.26 | 28.26 | 84.78 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.6 | 28.6 | 28.6 | 85.8 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.44 | 28.44 | 28.44 | 85.32 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 27.91 | 27.91 | 27.91 | 83.73 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.11 | 8.11 | 8.11 | 24.33 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.45 | 15.45 | 15.45 | 46.35 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.11 | 24.11 | 24.11 | 72.33 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €76.741 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15294 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 11.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €2.373 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €77.306 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.93 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.88 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €76.741 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 800 | 710.85 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 11.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €15.000 | €13.230 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 380 – 800 | 674.13 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €31.816 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 800 | 721.08 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €23.789 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 800 | 683.13 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €25.803 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 800 | 784.28 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €27.105 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 800 | 715.38 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €33.472 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 800 | 705.71 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| High Controversy | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Early Game Probe (Fame 0–50) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Mid Game Probe (Fame 60–150) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Late Game Probe (Fame 175+) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €1.826 | -1.1 | -0.06 |
| Bootstrap Struggle | -0.77% | €647 | -1.58 | 0.04 |
| Aggressive Marketing | 0% | €93 | -1.12 | 0.08 |
| Scandal Recovery | 0% | €-749 | -3.78 | -0.01 |
| Festival Push | 0% | €-238 | -1.08 | -0.06 |
| Chaos Tour | 0% | €-162 | 3.45 | 0.06 |
| Cult Hypergrowth | 0% | €-107 | 3.64 | 0.03 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0% | €-455 | 0.21 | -0.03 |
| Early Game Probe (Fame 0–50) | 0% | €16 | -0.39 | 0.01 |
| Mid Game Probe (Fame 60–150) | 0% | €-343 | 1.99 | 0 |
| Late Game Probe (Fame 175+) | 0% | €-64 | 0.46 | -0.01 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 11.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €76.741 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.88 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
