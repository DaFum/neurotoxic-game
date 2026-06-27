# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T20:51:35.992Z

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
| Baseline Touring | €500 | 0 | €137.399 | 52.1% | 0.04 | 7.4% | 15406 | 8 | 60 | 13.28 | 58.96 | 16.04 | 0% | €3.216 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €13.707 | 19.9% | 0.06 | 3.9% | 990 | 2 | 58 | 1.9 | 9.47 | 4.25 | 25.38% | €2.545 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €52.463 | 54.7% | 0.04 | 6.9% | 2782 | 3 | 61 | 5.98 | 28.69 | 8.17 | 0.38% | €3.188 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €26.132 | 32.1% | 0.05 | 4.6% | 1783 | 2 | 59 | 3.97 | 18.11 | 6.49 | 1.92% | €2.700 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €27.461 | 41.1% | 0.05 | 6.2% | 2009 | 3 | 65 | 3.87 | 18.38 | 6.25 | 1.54% | €2.993 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €39.604 | 55% | 0.05 | 5.7% | 2749 | 3 | 63 | 6.54 | 28.31 | 8.49 | 0.77% | €2.854 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €55.916 | 54.8% | 0.04 | 6.2% | 2630 | 3 | 60 | 4.84 | 28.6 | 8.27 | 0.38% | €3.270 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €35.252 | 57.9% | 0.05 | 5.1% | 2896 | 3 | 62 | 0 | 28.55 | 8.37 | 0.38% | €2.848 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €39.235 | 56% | 0.05 | 5% | 2727 | 3 | 62 | 13.85 | 28.33 | 8.67 | 0% | €2.808 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €17.730 | 4.2% | 0.04 | 4.2% | 1965 | 3 | 56 | 4.65 | 8.04 | 1.86 | 1.15% | €2.659 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.130 | 23.7% | 0.05 | 4.9% | 2394 | 3 | 60 | 5.58 | 15.41 | 4.52 | 0.38% | €2.905 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €51.331 | 51.1% | 0.04 | 7.3% | 7297 | 6 | 58 | 8.99 | 24.22 | 5.78 | 0% | €3.299 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €138.141 | €500 | €3.216 | 18.38 | 4.74 | 21.85 | 8.39 | 11.73 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.648 | €189 | €2.545 | 2.72 | 1.9 | 6.4 | 0.99 | 4.02 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €54.384 | €412 | €3.188 | 10.12 | 3.58 | 16.69 | 4.22 | 7.7 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €32.894 | €308 | €2.700 | 6.27 | 2.92 | 10.95 | 2.48 | 6.04 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.467 | €317 | €2.993 | 6.04 | 2.97 | 12.49 | 2.54 | 5.8 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €45.374 | €407 | €2.854 | 10.42 | 3.65 | 16.14 | 3.88 | 7.55 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €57.421 | €412 | €3.270 | 10.33 | 3.49 | 16.31 | 4.15 | 7.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.203 | €407 | €2.848 | 0 | 0 | 15.96 | 4.03 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.713 | €365 | €2.808 | 9.82 | 3.54 | 15.78 | 4.09 | 7.81 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.208 | €403 | €2.659 | 1.28 | 0.72 | 3.36 | 0.85 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.413 | €1.379 | €2.905 | 4.55 | 1.78 | 7.98 | 2.07 | 3.94 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €53.189 | €4.949 | €3.299 | 6.44 | 1.81 | 9.18 | 3.32 | 4.37 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.468 | €62.233 | €104.491 | €137.399 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.114 | €7.520 | €11.067 | €13.707 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.318 | €28.125 | €36.267 | €52.463 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €9.976 | €18.383 | €23.806 | €26.132 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.089 | €21.088 | €25.442 | €27.461 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.786 | €26.951 | €29.200 | €39.604 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.765 | €28.377 | €38.116 | €55.916 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.707 | €26.691 | €27.589 | €35.252 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.548 | €25.881 | €27.972 | €39.235 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.815 | €0 | €0 | €17.730 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.670 | €27.958 | €0 | €29.130 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.855 | €0 | €0 | €51.331 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.216 | €96 | 33.3× | 7.77 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.545 | €75 | 33.9× | 9.82 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.188 | €89 | 35.7× | 7.84 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.700 | €83 | 32.3× | 9.26 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.993 | €85 | 35.2× | 8.35 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.854 | €89 | 32.2× | 8.76 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.270 | €90 | 36.5× | 7.64 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.848 | €89 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.808 | €88 | 32× | 8.9 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.659 | €74 | 35.8× | 9.4 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.905 | €86 | 33.7× | 8.61 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.299 | €94 | 35× | 7.58 | 0.45 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.6% | 73.9% | 14.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 56 | 23.9% | 68.1% | 8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.5% | 69.7% | 18.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 18.7% | 72.1% | 9.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.6% | 56.6% | 39.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.4% | 68.9% | 18.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.2% | 70.6% | 14.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.6% | 70.9% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7 | 59 | 18.1% | 68.6% | 13.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 22.2% | 67% | 10.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18% | 73.4% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.6 | 61 | 13% | 70.6% | 16.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 16.04 | 3.7 | 1.42 | 8.41 | 10.58 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 4.25 | 1.41 | 1.15 | 6.1 | 1.73 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 61 | 8.17 | 2.74 | 1.78 | 8.11 | 5.09 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.49 | 2.32 | 1.65 | 8.27 | 3.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 65 | 6.25 | 2.25 | 1.72 | 8.08 | 3.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 63 | 8.49 | 2.88 | 1.79 | 8.45 | 4.99 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 60 | 8.27 | 2.75 | 1.6 | 8.48 | 5.14 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.37 | 0 | 0 | 8.11 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 62 | 8.67 | 2.78 | 1.65 | 8.41 | 5.22 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 56 | 1.86 | 0.54 | 0.22 | 2.1 | 1.38 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 60 | 4.52 | 1.38 | 0.72 | 4.17 | 2.58 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 58 | 5.78 | 1.41 | 0.5 | 3.11 | 4.41 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.82 | 1.56 | 1.73 | 0.73 | 9.28 | 30.14 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.02 | 1.78 | 1.79 | 0.18 | 6.88 | 11.39 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.52 | 2.7 | 2.77 | 0.65 | 8.84 | 24.47 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.15 | 3.32 | 3.33 | 0.55 | 8.79 | 18.46 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.92 | 1.82 | 1.71 | 0.28 | 8.98 | 19.92 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.48 | 4.23 | 4.2 | 0.97 | 9.05 | 24 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.47 | 2.6 | 2.34 | 0.63 | 8.98 | 24.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.28 | 2.4 | 2.29 | 0.53 | 9.19 | 23.55 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.41 | 2.23 | 2.29 | 0.48 | 8.88 | 23.42 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.25 | 0.4 | 0.39 | 0.08 | 2.35 | 5.01 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.52 | 1.02 | 1.01 | 0.28 | 4.78 | 12.42 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.52 | 0.9 | 0.9 | 0.5 | 3.66 | 12.75 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.96 | 58.96 | 58.96 | 176.88 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.47 | 9.47 | 9.47 | 28.41 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.69 | 28.69 | 28.69 | 86.07 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.11 | 18.11 | 18.11 | 54.33 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.38 | 18.38 | 18.38 | 55.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.31 | 28.31 | 28.31 | 84.93 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.6 | 28.6 | 28.6 | 85.8 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.55 | 28.55 | 28.55 | 85.65 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.33 | 28.33 | 28.33 | 84.99 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.04 | 8.04 | 8.04 | 24.12 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.41 | 15.41 | 15.41 | 46.23 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.22 | 24.22 | 24.22 | 72.66 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €137.399 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15406 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 25.38% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €3.299 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €138.141 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.96 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.89 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €137.399 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 710.47 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 25.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €13.707 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 670.6 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €52.463 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 719.79 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €26.132 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 683.76 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €27.461 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 786.22 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €39.604 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 719.97 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €55.916 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 703.34 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €188 | -2.01 | -0.06 |
| Bootstrap Struggle | 0% | €141 | -1.23 | -0.06 |
| Aggressive Marketing | 0% | €716 | 3.85 | 0.09 |
| Scandal Recovery | 0.38% | €88 | 0.9 | -0.15 |
| Festival Push | -0.77% | €-522 | 2.15 | 0.08 |
| Chaos Tour | 0.77% | €-78 | 1.61 | -0.1 |
| Cult Hypergrowth | 0% | €-196 | -0.86 | -0.02 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -0.38% | €708 | 3.94 | 0.14 |
| Early Game Probe (Fame 0–50) | 0.38% | €-109 | -3.87 | 0.01 |
| Mid Game Probe (Fame 60–150) | 0% | €-388 | -0.45 | 0.01 |
| Late Game Probe (Fame 175+) | 0% | €-77 | 0.41 | -0.04 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 25.38% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €137.399 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.89 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
