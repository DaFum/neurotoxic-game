# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T15:07:25.853Z

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
| Baseline Touring | €500 | 0 | €129.606 | 52.5% | 0.04 | 6.5% | 16014 | 8 | 59 | -1.58 | 59.1 | 15.9 | 0% | €3.085 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €11.566 | 24.5% | 0.06 | 2.3% | 960 | 2 | 60 | -0.97 | 9.02 | 4.25 | 28.85% | €2.379 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €42.956 | 56% | 0.05 | 5.5% | 2812 | 3 | 61 | -2.68 | 28.6 | 8.26 | 0.38% | €2.881 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €25.345 | 27.3% | 0.06 | 3.6% | 1762 | 2 | 59 | -1.94 | 17.84 | 6.46 | 3.08% | €2.526 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €26.310 | 31.8% | 0.05 | 4.7% | 1987 | 3 | 62 | -1.63 | 17.94 | 6.1 | 4.23% | €2.630 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €34.292 | 54.7% | 0.05 | 4.5% | 2755 | 3 | 64 | -1.97 | 28.15 | 8.73 | 0.38% | €2.648 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €43.467 | 55.8% | 0.05 | 4.9% | 2902 | 3 | 61 | -1.99 | 28.5 | 8.4 | 0.38% | €2.872 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €54.995 | 54.8% | 0.04 | 6% | 2704 | 3 | 60 | -2.33 | 28.59 | 8.29 | 0.38% | €3.370 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €56.380 | 54.7% | 0.04 | 6.1% | 2430 | 3 | 61 | 3.91 | 28.4 | 8.46 | 0.38% | €3.399 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €16.526 | 5% | 0.05 | 3.9% | 2032 | 3 | 55 | 0.76 | 8.07 | 1.93 | 0% | €2.516 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.369 | 20.9% | 0.05 | 4.5% | 2551 | 3 | 60 | -0.37 | 15.6 | 4.39 | 0.38% | €2.800 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €44.477 | 52.1% | 0.04 | 6.1% | 7576 | 6 | 59 | -0.22 | 24.24 | 5.76 | 0% | €2.996 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €130.269 | €500 | €3.085 | 18.03 | 4.52 | 21.37 | 8.57 | 11.75 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €13.174 | €181 | €2.379 | 2.59 | 1.7 | 6.08 | 0.96 | 3.8 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €47.118 | €405 | €2.881 | 10.11 | 3.43 | 16.39 | 4.14 | 7.67 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €30.422 | €303 | €2.526 | 5.82 | 2.77 | 10.49 | 2.5 | 5.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €32.133 | €312 | €2.630 | 6.1 | 2.73 | 11.9 | 2.47 | 5.68 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €42.408 | €405 | €2.648 | 9.45 | 3.49 | 16.1 | 3.83 | 7.61 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €47.448 | €407 | €2.872 | 10 | 3.46 | 15.81 | 4.13 | 7.16 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €57.011 | €413 | €3.370 | 10.27 | 3.46 | 16.12 | 4.06 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €58.160 | €404 | €3.399 | 10.19 | 3.47 | 15.86 | 4.01 | 7.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €16.870 | €405 | €2.516 | 1.26 | 0.7 | 3.23 | 0.87 | 1.92 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.075 | €1.372 | €2.800 | 4.39 | 1.89 | 7.87 | 2.11 | 3.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €48.246 | €4.965 | €2.996 | 5.88 | 1.81 | 8.98 | 3.3 | 4.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.708 | €55.668 | €96.676 | €129.606 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.580 | €6.403 | €9.385 | €11.566 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €15.464 | €26.832 | €30.479 | €42.956 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.777 | €16.396 | €21.193 | €25.345 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.184 | €17.829 | €21.957 | €26.310 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €13.436 | €25.929 | €27.108 | €34.292 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €15.414 | €27.437 | €30.253 | €43.467 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €18.991 | €27.946 | €37.859 | €54.995 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €18.694 | €27.739 | €39.244 | €56.380 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €14.525 | €0 | €0 | €16.526 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €16.796 | €28.194 | €0 | €29.369 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €30.810 | €0 | €0 | €44.477 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.085 | €97 | 32× | 8.1 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.379 | €73 | 32.8× | 10.51 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.881 | €89 | 32.5× | 8.68 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.526 | €82 | 30.7× | 9.9 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.630 | €83 | 31.5× | 9.51 | 0.57 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.648 | €88 | 30.1× | 9.44 | 0.57 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.872 | €89 | 32.4× | 8.71 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €3.370 | €89 | 37.7× | 7.42 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €3.399 | €89 | 38.1× | 7.36 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.516 | €73 | 34.7× | 9.94 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.800 | €86 | 32.5× | 8.93 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.996 | €94 | 31.8× | 8.34 | 0.5 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.4% | 73.3% | 15.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 58 | 20.9% | 68.8% | 10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 11.3% | 71% | 17.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 57 | 20.8% | 71.7% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.6 | 67 | 4.1% | 58.4% | 37.5% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.5 | 62 | 11.6% | 69.9% | 18.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 59 | 15.2% | 71.9% | 12.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7 | 59 | 17.4% | 70.7% | 11.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 18.4% | 70.2% | 11.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 21.5% | 68.5% | 10.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 21.2% | 70.1% | 8.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 61 | 12.7% | 71.6% | 15.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59 | 15.9 | 3.6 | 1.36 | 8.31 | 0 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 60 | 4.25 | 1.3 | 1.08 | 5.87 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 61 | 8.26 | 2.65 | 1.67 | 8.24 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.46 | 2.08 | 1.52 | 8.32 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 62 | 6.1 | 2.1 | 1.55 | 7.8 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 64 | 8.73 | 2.67 | 1.64 | 8.35 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.4 | 2.7 | 1.57 | 8.25 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 60 | 8.29 | 2.67 | 1.57 | 7.85 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 61 | 8.46 | 2.67 | 1.64 | 8.05 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.93 | 0.58 | 0.2 | 2.34 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 60 | 4.39 | 1.44 | 0.8 | 4.38 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 59 | 5.76 | 1.39 | 0.4 | 3.3 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.01 | 1.61 | 1.6 | 0.87 | 9.41 | 29.78 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.07 | 1.74 | 1.57 | 0.17 | 6.48 | 10.87 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.52 | 2.72 | 2.78 | 0.67 | 8.84 | 24.26 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.89 | 3.28 | 3.37 | 0.48 | 8.86 | 17.66 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.99 | 1.77 | 1.74 | 0.29 | 8.57 | 18.89 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.52 | 4.15 | 4.35 | 1.13 | 9.25 | 23.98 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.49 | 2.57 | 2.39 | 0.64 | 9.11 | 23.96 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.28 | 2.13 | 2.18 | 0.54 | 8.84 | 23.94 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.21 | 2.15 | 2.33 | 0.52 | 8.77 | 23.9 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.19 | 0.34 | 0.32 | 0.08 | 2.35 | 5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.58 | 0.97 | 0.95 | 0.26 | 4.68 | 12.44 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.51 | 0.88 | 0.82 | 0.49 | 3.47 | 12.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 59.1 | 59.1 | 59.1 | 177.3 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.02 | 9.02 | 9.02 | 27.06 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.6 | 28.6 | 28.6 | 85.8 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 17.84 | 17.84 | 17.84 | 53.52 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.94 | 17.94 | 17.94 | 53.82 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.15 | 28.15 | 28.15 | 84.45 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.5 | 28.5 | 28.5 | 85.5 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.59 | 28.59 | 28.59 | 85.77 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.4 | 28.4 | 28.4 | 85.2 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.07 | 8.07 | 8.07 | 24.21 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.6 | 15.6 | 15.6 | 46.8 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.24 | 24.24 | 24.24 | 72.72 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €129.606 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 16014 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 28.85% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **High Controversy** | €3.399 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €130.269 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 59.1 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.15 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €129.606 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 711.29 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 28.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €11.566 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 679.13 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €42.956 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 717.72 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 3.08% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €25.345 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 678.82 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €26.310 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 779.62 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €34.292 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 721.59 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €43.467 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 701 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 28.85% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €129.606 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.15 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
