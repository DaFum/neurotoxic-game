# Game Balance Simulation – Analyse

Erstellt am: 2026-07-17T13:13:13.884Z

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
| Baseline Touring | €500 | 0 | €76.449 | 56.5% | 0.07 | 3.8% | 15464 | 8 | 61 | 14.77 | 58.93 | 16.07 | 0% | €2.028 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €12.662 | 21.6% | 0.07 | 2.4% | 1100 | 2 | 59 | 1.27 | 11.22 | 5.15 | 12.69% | €2.161 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €32.683 | 53.7% | 0.06 | 4.1% | 2917 | 3 | 64 | 7.17 | 28.5 | 8.43 | 0.38% | €2.316 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €24.104 | 21.3% | 0.07 | 3.2% | 1821 | 3 | 58 | 4.09 | 18.3 | 6.63 | 0.38% | €2.164 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €25.842 | 26.7% | 0.06 | 3.7% | 2116 | 3 | 63 | 4.54 | 18.5 | 6.24 | 1.54% | €2.361 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €26.624 | 45.7% | 0.07 | 3.6% | 2643 | 3 | 63 | 7.02 | 28.2 | 8.67 | 0.38% | €2.060 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €34.379 | 56.8% | 0.06 | 3.7% | 2823 | 3 | 63 | 6.03 | 28.65 | 8.35 | 0% | €2.387 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €26.693 | 34.7% | 0.07 | 2.9% | 2883 | 3 | 63 | 0 | 28.44 | 8.56 | 0% | €2.014 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| High Controversy | €500 | 0 | €25.342 | 46.1% | 0.07 | 2.7% | 2519 | 3 | 63 | 15.12 | 27.81 | 8.67 | 1.54% | €1.957 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €12.845 | 4.7% | 0.06 | 2.4% | 2004 | 3 | 56 | 4.51 | 8.12 | 1.88 | 0% | €1.980 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €25.262 | 12.6% | 0.06 | 2.6% | 2257 | 3 | 59 | 6.38 | 15.47 | 4.48 | 0.38% | €2.230 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.978 | 46.4% | 0.06 | 3.5% | 7609 | 6 | 63 | 10.82 | 24.11 | 5.89 | 0% | €2.162 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €77.063 | €500 | €2.028 | 17.32 | 4.63 | 21.75 | 8.42 | 11.73 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €14.612 | €215 | €2.161 | 3.38 | 2.24 | 7.64 | 1.21 | 4.87 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €41.182 | €414 | €2.316 | 10.13 | 3.58 | 16.01 | 4.15 | 7.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €26.798 | €324 | €2.164 | 6.17 | 3.01 | 10.66 | 2.53 | 6.11 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €31.410 | €326 | €2.361 | 6.31 | 3 | 12.26 | 2.58 | 5.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €37.043 | €412 | €2.060 | 10.25 | 3.47 | 15.77 | 3.77 | 7.59 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €42.162 | €413 | €2.387 | 10.31 | 3.67 | 15.96 | 4.11 | 7.22 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €34.820 | €412 | €2.014 | 0 | 0 | 15.49 | 4.07 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €35.739 | €396 | €1.957 | 10.23 | 3.36 | 15 | 4.03 | 7.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.077 | €413 | €1.980 | 1.39 | 0.75 | 3.35 | 0.89 | 1.91 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €27.934 | €1.379 | €2.230 | 4.57 | 1.81 | 7.88 | 2.05 | 3.95 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €41.118 | €4.965 | €2.162 | 6.45 | 1.85 | 8.74 | 3.27 | 4.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €27.056 | €32.186 | €54.696 | €76.449 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.001 | €6.879 | €9.971 | €12.662 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €14.222 | €25.515 | €26.930 | €32.683 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.112 | €14.446 | €19.436 | €24.104 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.258 | €16.764 | €22.381 | €25.842 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €11.848 | €21.997 | €26.220 | €26.624 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.684 | €26.619 | €27.199 | €34.379 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.958 | €19.897 | €25.414 | €26.693 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €8.600 | €18.694 | €25.743 | €25.342 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €11.472 | N/A | N/A | €12.845 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €14.314 | €24.001 | N/A | €25.262 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €29.584 | N/A | N/A | €29.978 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.028 | €96 | 21.1× | 12.33 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.161 | €71 | 30.2× | 11.57 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.316 | €89 | 26.2× | 10.79 | 0.65 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.164 | €82 | 26.5× | 11.55 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.361 | €84 | 28.2× | 10.59 | 0.64 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.060 | €87 | 23.6× | 12.13 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.387 | €89 | 26.9× | 10.48 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.014 | €87 | 23.1× | 12.41 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.957 | €85 | 23.1× | 12.77 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.980 | €70 | 28.2× | 12.63 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.230 | €86 | 25.8× | 11.21 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.162 | €94 | 22.9× | 11.56 | 0.69 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.5% | 73.5% | 15% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 22.8% | 68.2% | 9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 10.8% | 70% | 19.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.2% | 72.1% | 8.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.7% | 56.6% | 39.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 61 | 12.9% | 70.1% | 17% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 14.5% | 70.6% | 14.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 16% | 71.7% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 19.6% | 69.4% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 21.6% | 67.3% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19.6% | 70.4% | 10% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 13.9% | 71.6% | 14.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 61 | 16.07 | 3.52 | 1.29 | 8.18 | 10.64 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 5.15 | 1.7 | 1.38 | 7.23 | 1.99 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 64 | 8.43 | 2.75 | 1.77 | 8.12 | 5.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 58 | 6.63 | 2.26 | 1.71 | 8.56 | 3.11 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 63 | 6.24 | 2.32 | 1.75 | 8.18 | 3.44 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 63 | 8.67 | 2.72 | 1.59 | 8.3 | 5.19 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 63 | 8.35 | 2.87 | 1.81 | 8.34 | 5.18 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 63 | 8.56 | 0 | 0 | 8.4 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 63 | 8.67 | 2.65 | 1.57 | 8.27 | 4.94 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 56 | 1.88 | 0.57 | 0.22 | 2.2 | 1.51 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 59 | 4.48 | 1.4 | 0.72 | 4.23 | 2.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 63 | 5.89 | 1.46 | 0.45 | 3.2 | 4.31 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.82 | 1.44 | 1.62 | 0.78 | 9.17 | 30.21 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.18 | 2.02 | 2.05 | 0.24 | 8.32 | 14.02 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Aggressive Marketing | 1.49 | 2.76 | 2.77 | 0.64 | 9.17 | 24.02 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.02 | 3.47 | 3.43 | 0.54 | 8.97 | 18.38 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.01 | 1.84 | 1.72 | 0.32 | 8.96 | 19.77 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.48 | 4.29 | 4.1 | 1.02 | 9.04 | 23.62 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.5 | 2.61 | 2.23 | 0.6 | 9.04 | 24.13 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.22 | 2.25 | 2.36 | 0.55 | 8.94 | 23.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.4 | 2.25 | 2.16 | 0.5 | 8.93 | 23 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.37 | 0.39 | 0.1 | 2.34 | 5.2 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.52 | 1.03 | 1 | 0.29 | 4.79 | 12.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.56 | 0.92 | 0.84 | 0.56 | 3.57 | 12.28 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.93 | 58.93 | 58.93 | 176.79 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 11.22 | 11.22 | 11.22 | 33.66 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.5 | 28.5 | 28.5 | 85.5 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.3 | 18.3 | 18.3 | 54.9 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.5 | 18.5 | 18.5 | 55.5 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.2 | 28.2 | 28.2 | 84.6 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.65 | 28.65 | 28.65 | 85.95 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.44 | 28.44 | 28.44 | 85.32 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 27.81 | 27.81 | 27.81 | 83.43 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.12 | 8.12 | 8.12 | 24.36 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.47 | 15.47 | 15.47 | 46.41 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.11 | 24.11 | 24.11 | 72.33 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €76.449 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15464 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 12.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.387 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €77.063 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.93 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.89 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €76.449 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 800 | 710.81 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 12.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €15.000 | €12.662 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 380 – 800 | 674.86 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €32.683 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 800 | 722.68 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €24.104 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 800 | 684.39 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €25.842 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 800 | 785.63 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €26.624 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 800 | 715.28 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €34.379 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 800 | 704.9 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| High Controversy | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Early Game Probe (Fame 0–50) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Mid Game Probe (Fame 60–150) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Late Game Probe (Fame 175+) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €1.534 | -1.14 | -0.06 |
| Bootstrap Struggle | 0.77% | €79 | -0.85 | -0.02 |
| Aggressive Marketing | 0% | €960 | 0.48 | -0.05 |
| Scandal Recovery | 0% | €-434 | -2.52 | -0.03 |
| Festival Push | 0.39% | €-199 | 0.27 | -0.07 |
| Chaos Tour | 0% | €-643 | 3.35 | 0 |
| Cult Hypergrowth | -0.38% | €800 | 2.83 | 0.08 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0.39% | €-1.337 | -1.53 | -0.13 |
| Early Game Probe (Fame 0–50) | 0% | €-214 | 0.79 | 0.02 |
| Mid Game Probe (Fame 60–150) | 0.38% | €310 | 1.9 | 0.02 |
| Late Game Probe (Fame 175+) | 0% | €-223 | -1.54 | -0.01 |

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
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €76.449 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.89 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
