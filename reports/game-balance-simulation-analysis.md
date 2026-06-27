# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T21:38:26.112Z

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
| Baseline Touring | €500 | 0 | €137.753 | 51.3% | 0.04 | 7.2% | 15150 | 8 | 60 | 14.61 | 58.91 | 16.09 | 0% | €3.212 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €12.591 | 20.9% | 0.06 | 3.5% | 970 | 2 | 57 | 1.49 | 9.21 | 4.11 | 28.08% | €2.505 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €52.767 | 54.9% | 0.04 | 6.8% | 2790 | 3 | 60 | 7.38 | 28.7 | 8.16 | 0.38% | €3.204 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €25.991 | 30.3% | 0.05 | 4.6% | 1683 | 2 | 60 | 3.46 | 18.02 | 6.58 | 1.92% | €2.681 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €28.130 | 38.6% | 0.05 | 6.3% | 1977 | 3 | 64 | 4.33 | 18.42 | 6.21 | 1.54% | €2.981 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €40.595 | 55.4% | 0.05 | 5.5% | 2801 | 3 | 61 | 7.12 | 28.4 | 8.6 | 0% | €2.853 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €55.495 | 54.4% | 0.04 | 6.4% | 2824 | 3 | 62 | 5.86 | 28.5 | 8.22 | 0.77% | €3.274 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €35.252 | 57.9% | 0.05 | 5.1% | 2896 | 3 | 62 | 0 | 28.55 | 8.37 | 0.38% | €2.848 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €37.899 | 56.1% | 0.05 | 4.8% | 2735 | 3 | 62 | 15.07 | 28.08 | 8.79 | 0.38% | €2.785 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €18.042 | 4.5% | 0.04 | 4.3% | 1954 | 3 | 55 | 4.4 | 8.09 | 1.87 | 0.38% | €2.673 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.421 | 23.7% | 0.05 | 4.8% | 2420 | 3 | 60 | 5.86 | 15.42 | 4.51 | 0.38% | €2.897 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €50.829 | 51% | 0.04 | 6.6% | 7311 | 6 | 58 | 9.34 | 24.25 | 5.75 | 0% | €3.259 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €138.256 | €500 | €3.212 | 17.7 | 4.58 | 21.72 | 8.42 | 11.71 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €14.582 | €184 | €2.505 | 2.55 | 1.81 | 6.2 | 0.96 | 3.92 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €54.643 | €413 | €3.204 | 9.98 | 3.5 | 16.54 | 4.16 | 7.67 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €32.461 | €310 | €2.681 | 6.27 | 2.92 | 10.64 | 2.46 | 6.03 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.477 | €317 | €2.981 | 6.02 | 2.97 | 12.43 | 2.55 | 5.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €45.807 | €411 | €2.853 | 10.37 | 3.62 | 15.95 | 3.91 | 7.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €57.067 | €411 | €3.274 | 10.26 | 3.48 | 15.92 | 4.17 | 7.17 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.203 | €407 | €2.848 | 0 | 0 | 15.96 | 4.03 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.178 | €364 | €2.785 | 9.99 | 3.43 | 15.65 | 3.99 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.520 | €404 | €2.673 | 1.36 | 0.74 | 3.36 | 0.85 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.277 | €1.374 | €2.897 | 4.62 | 1.78 | 7.94 | 2.04 | 3.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €52.855 | €4.948 | €3.259 | 6.33 | 1.76 | 9.26 | 3.3 | 4.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.707 | €62.850 | €104.685 | €137.753 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.895 | €6.934 | €10.165 | €12.591 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.503 | €27.874 | €36.710 | €52.767 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.248 | €18.014 | €23.049 | €25.991 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.148 | €20.907 | €25.404 | €28.130 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.802 | €27.873 | €29.338 | €40.595 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.528 | €27.128 | €38.513 | €55.495 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.707 | €26.691 | €27.589 | €35.252 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.191 | €26.180 | €28.170 | €37.899 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.979 | €0 | €0 | €18.042 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.632 | €27.834 | €0 | €29.421 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.984 | €0 | €0 | €50.829 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.212 | €96 | 33.3× | 7.78 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.505 | €74 | 33.7× | 9.98 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.204 | €89 | 35.8× | 7.8 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.681 | €83 | 32.1× | 9.33 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.981 | €85 | 35.1× | 8.39 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.853 | €89 | 32.1× | 8.76 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.274 | €90 | 36.5× | 7.64 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.848 | €89 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.785 | €88 | 31.8× | 8.98 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.673 | €74 | 36× | 9.35 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.897 | €86 | 33.6× | 8.63 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.259 | €94 | 34.6× | 7.67 | 0.46 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.6% | 73% | 15.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 57 | 23.7% | 68.2% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 11.7% | 70.5% | 17.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.3% | 72.3% | 8.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 3.7% | 57.5% | 38.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.8% | 70.3% | 17% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15% | 70.7% | 14.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.6% | 70.9% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 18.8% | 70.4% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 22.7% | 66.8% | 10.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19.3% | 71.4% | 9.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.6 | 61 | 12.4% | 71.2% | 16.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 16.09 | 3.59 | 1.42 | 8.18 | 10.64 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 57 | 4.11 | 1.33 | 1.12 | 6 | 1.69 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 60 | 8.16 | 2.69 | 1.7 | 8.12 | 5.14 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 6.58 | 2.24 | 1.65 | 8.25 | 3.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 64 | 6.21 | 2.28 | 1.71 | 8.22 | 3.44 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 61 | 8.6 | 2.86 | 1.68 | 8.3 | 5 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 62 | 8.22 | 2.69 | 1.55 | 8.44 | 5 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.37 | 0 | 0 | 8.11 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 62 | 8.79 | 2.68 | 1.58 | 8.31 | 5.14 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.87 | 0.58 | 0.2 | 2.18 | 1.39 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 60 | 4.51 | 1.37 | 0.73 | 4.2 | 2.58 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 58 | 5.75 | 1.39 | 0.47 | 3.15 | 4.43 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.76 | 1.62 | 1.69 | 0.85 | 9.3 | 30.27 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.99 | 1.72 | 1.73 | 0.17 | 6.9 | 11.13 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.54 | 2.8 | 2.9 | 0.68 | 8.85 | 24.5 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.15 | 3.43 | 3.31 | 0.52 | 8.75 | 18.08 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.93 | 1.85 | 1.8 | 0.28 | 8.78 | 19.67 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.48 | 4.45 | 4.05 | 1.11 | 9.16 | 23.92 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.56 | 2.58 | 2.13 | 0.56 | 9.07 | 23.72 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.28 | 2.4 | 2.29 | 0.53 | 9.19 | 23.55 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.34 | 2.28 | 2.38 | 0.44 | 9.22 | 23.23 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.4 | 0.4 | 0.1 | 2.34 | 5.01 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.57 | 0.99 | 0.95 | 0.28 | 4.72 | 12.39 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.49 | 0.87 | 0.87 | 0.49 | 3.63 | 12.93 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.91 | 58.91 | 58.91 | 176.73 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.21 | 9.21 | 9.21 | 27.63 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.7 | 28.7 | 28.7 | 86.1 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.02 | 18.02 | 18.02 | 54.06 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.42 | 18.42 | 18.42 | 55.26 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.4 | 28.4 | 28.4 | 85.2 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.5 | 28.5 | 28.5 | 85.5 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.55 | 28.55 | 28.55 | 85.65 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.08 | 28.08 | 28.08 | 84.24 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.09 | 8.09 | 8.09 | 24.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.42 | 15.42 | 15.42 | 46.26 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.25 | 24.25 | 24.25 | 72.75 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €137.753 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15150 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 28.08% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.274 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €138.256 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.91 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.09 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €137.753 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 712.31 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 28.08% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €12.591 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 670.02 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €52.767 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 717.47 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €25.991 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 679.78 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €28.130 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 781.71 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €40.595 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 714.57 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €55.495 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 702.79 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-3.633 | 1.29 | -0.15 |
| Bootstrap Struggle | 2.7% | €-811 | -2.77 | -0.26 |
| Aggressive Marketing | 0% | €-1.337 | 0.27 | 0.03 |
| Scandal Recovery | 0.38% | €-373 | -3.58 | -0.12 |
| Festival Push | 0.39% | €-499 | -2 | -0.11 |
| Chaos Tour | 0% | €189 | -3.72 | 0.02 |
| Cult Hypergrowth | 0.39% | €-212 | 1.73 | -0.12 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -0.39% | €-473 | -1.02 | 0 |
| Early Game Probe (Fame 0–50) | -0.39% | €3 | -1.53 | 0.02 |
| Mid Game Probe (Fame 60–150) | 0% | €593 | -2.51 | 0.02 |
| Late Game Probe (Fame 175+) | 0% | €101 | 1.75 | 0.02 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 28.08% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €137.753 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.09 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
