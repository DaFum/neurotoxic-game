# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T19:44:30.181Z

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
| Baseline Touring | €500 | 0 | €131.321 | 52.3% | 0.04 | 6.9% | 15720 | 8 | 59 | 16.26 | 58.92 | 15.8 | 0.38% | €3.108 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €11.010 | 23.3% | 0.06 | 3.2% | 934 | 2 | 59 | 2.15 | 8.72 | 4.16 | 31.15% | €2.394 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €41.990 | 56.1% | 0.05 | 5.4% | 2976 | 3 | 63 | 5.1 | 28.59 | 8.27 | 0.38% | €2.839 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €24.720 | 28.6% | 0.06 | 3.7% | 1713 | 2 | 59 | 3.01 | 17.69 | 6.58 | 3.08% | €2.542 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €25.428 | 33.2% | 0.05 | 4.5% | 2008 | 3 | 63 | 2.88 | 17.8 | 6.15 | 5% | €2.633 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €35.151 | 56% | 0.05 | 4.6% | 2612 | 3 | 61 | 7.4 | 28.06 | 8.55 | 1.15% | €2.665 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €43.389 | 56% | 0.05 | 5.2% | 2734 | 3 | 60 | 6.34 | 28.41 | 8.31 | 0.77% | €2.856 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €55.206 | 54.4% | 0.04 | 6.5% | 2488 | 3 | 61 | 6 | 28.64 | 8.36 | 0% | €3.363 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €55.849 | 55.4% | 0.04 | 6.4% | 2644 | 3 | 60 | 12.1 | 28.19 | 8.43 | 1.15% | €3.384 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €17.137 | 4.2% | 0.05 | 4.5% | 1963 | 3 | 55 | 5.62 | 8.07 | 1.86 | 0.77% | €2.575 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €28.523 | 19.1% | 0.05 | 4.2% | 2543 | 3 | 59 | 5.8 | 15.37 | 4.56 | 0.38% | €2.718 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €43.621 | 51.8% | 0.04 | 6% | 7436 | 6 | 59 | 10.25 | 24.21 | 5.79 | 0% | €2.994 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €131.901 | €498 | €3.108 | 16.5 | 4.74 | 21.56 | 8.39 | 11.7 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €12.855 | €175 | €2.394 | 2.43 | 1.75 | 5.65 | 0.95 | 3.7 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €46.753 | €404 | €2.839 | 9.4 | 3.7 | 16.16 | 4.2 | 7.67 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €29.993 | €298 | €2.542 | 5.78 | 2.89 | 10.68 | 2.42 | 5.95 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €32.146 | €302 | €2.633 | 5.69 | 2.98 | 11.8 | 2.41 | 5.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €42.484 | €401 | €2.665 | 9.38 | 3.74 | 16.22 | 3.8 | 7.55 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €47.563 | €408 | €2.856 | 9.12 | 3.53 | 15.66 | 4.07 | 7.18 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €56.603 | €412 | €3.363 | 9.22 | 3.81 | 16.04 | 4.04 | 7.78 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €57.711 | €406 | €3.384 | 9.17 | 3.62 | 15.57 | 4.06 | 7.7 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €17.540 | €403 | €2.575 | 1.31 | 0.77 | 3.32 | 0.87 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €33.267 | €1.374 | €2.718 | 4.23 | 1.85 | 7.61 | 2.07 | 3.9 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €48.330 | €4.960 | €2.994 | 5.6 | 1.84 | 8.96 | 3.27 | 4.37 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €30.563 | €57.481 | €99.299 | €131.321 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.540 | €6.481 | €8.934 | €11.010 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €15.208 | €26.544 | €29.735 | €41.990 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.845 | €16.092 | €20.532 | €24.720 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.170 | €17.190 | €22.271 | €25.428 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €13.937 | €24.840 | €27.673 | €35.151 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €16.347 | €27.366 | €29.986 | €43.389 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €18.690 | €28.151 | €38.259 | €55.206 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €18.322 | €27.083 | €38.436 | €55.849 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.168 | €0 | €0 | €17.137 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €16.273 | €27.103 | €0 | €28.523 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.850 | €0 | €0 | €43.621 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.108 | €96 | 32.2× | 8.04 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.394 | €73 | 32.9× | 10.44 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.839 | €89 | 32.1× | 8.81 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.542 | €82 | 30.9× | 9.83 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.633 | €83 | 31.6× | 9.49 | 0.57 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.665 | €88 | 30.3× | 9.38 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.856 | €89 | 32.2× | 8.75 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €3.363 | €89 | 37.6× | 7.43 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €3.384 | €89 | 37.9× | 7.39 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.575 | €74 | 35× | 9.71 | 0.58 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.718 | €86 | 31.7× | 9.2 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.994 | €94 | 31.8× | 8.35 | 0.5 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 12.2% | 71.9% | 15.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 22.4% | 69% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 61 | 10.8% | 70.9% | 18.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.3% | 72.2% | 8.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.6% | 56.8% | 39.6% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 61 | 12.8% | 70.3% | 16.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 59 | 15.4% | 72.2% | 12.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.9% | 71.7% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 58 | 20.5% | 69.8% | 9.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 22.3% | 67% | 10.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18.1% | 73.4% | 8.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 60 | 12.9% | 72% | 15.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59 | 15.8 | 3.67 | 1.22 | 8.18 | 10.5 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 4.16 | 1.39 | 1.07 | 5.83 | 1.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 8.27 | 2.83 | 1.6 | 8.55 | 4.97 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.58 | 2.28 | 1.52 | 8.23 | 3.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 63 | 6.15 | 2.22 | 1.62 | 7.85 | 3.24 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 61 | 8.55 | 2.88 | 1.6 | 7.88 | 5.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 60 | 8.31 | 2.77 | 1.59 | 8.27 | 5.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 61 | 8.36 | 2.89 | 1.62 | 8.42 | 5.18 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 60 | 8.43 | 2.9 | 1.65 | 8.33 | 5.08 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.86 | 0.61 | 0.2 | 2.1 | 1.42 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 59 | 4.56 | 1.42 | 0.72 | 4.28 | 2.55 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 59 | 5.79 | 1.45 | 0.47 | 3.23 | 4.25 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.81 | 1.62 | 1.65 | 0.9 | 9.47 | 29.9 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.94 | 1.68 | 1.63 | 0.18 | 6.47 | 10.33 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.48 | 2.57 | 2.86 | 0.68 | 8.99 | 24.05 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.02 | 3.23 | 3.33 | 0.54 | 8.49 | 18.08 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.92 | 1.68 | 1.59 | 0.25 | 8.67 | 18.8 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.31 | 4.4 | 4.21 | 1.04 | 8.89 | 23.97 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.51 | 2.38 | 2.38 | 0.59 | 9.15 | 23.3 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.31 | 2.22 | 1.98 | 0.55 | 8.67 | 24.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.34 | 2.12 | 2.23 | 0.43 | 8.9 | 23.12 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.26 | 0.4 | 0.37 | 0.1 | 2.41 | 5.06 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.53 | 0.96 | 1.1 | 0.22 | 4.77 | 12.02 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.48 | 0.93 | 0.97 | 0.44 | 3.7 | 12.62 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.92 | 58.92 | 58.92 | 176.76 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 8.72 | 8.72 | 8.72 | 26.16 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.59 | 28.59 | 28.59 | 85.77 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 17.69 | 17.69 | 17.69 | 53.07 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.8 | 17.8 | 17.8 | 53.4 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.06 | 28.06 | 28.06 | 84.18 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.41 | 28.41 | 28.41 | 85.23 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.64 | 28.64 | 28.64 | 85.92 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.19 | 28.19 | 28.19 | 84.57 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.07 | 8.07 | 8.07 | 24.21 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.37 | 15.37 | 15.37 | 46.11 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.21 | 24.21 | 24.21 | 72.63 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €131.321 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15720 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 31.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **High Controversy** | €3.384 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €131.901 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.92 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.96 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €131.321 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 711.21 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 31.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €11.010 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 673.23 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €41.990 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 720.4 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 3.08% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €24.720 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 680.29 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 5% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €25.428 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 786.06 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €35.151 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 712.7 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €43.389 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 699.81 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.38% | €2.889 | -1.73 | -0.18 |
| Bootstrap Struggle | -1.93% | €536 | -1.69 | 0.2 |
| Aggressive Marketing | 0.38% | €-598 | 0.16 | 0.03 |
| Scandal Recovery | -1.54% | €-942 | -4.06 | 0.07 |
| Festival Push | 0.77% | €-951 | 0.77 | -0.1 |
| Chaos Tour | 0% | €-356 | -4.24 | -0.12 |
| Cult Hypergrowth | 0.77% | €-1.697 | -5.19 | -0.33 |
| No Social (Fame 0-50) | -0.77% | €667 | 2.12 | 0.19 |
| High Controversy | 0.77% | €-249 | -3.62 | -0.19 |
| Early Game Probe (Fame 0–50) | 0.39% | €399 | -1.86 | 0 |
| Mid Game Probe (Fame 60–150) | 0.38% | €161 | 0.14 | -0.12 |
| Late Game Probe (Fame 175+) | 0% | €-152 | -2.54 | -0.01 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 31.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €131.321 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.96 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
