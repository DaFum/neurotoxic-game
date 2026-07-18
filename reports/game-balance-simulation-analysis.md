# Game Balance Simulation – Analyse

Erstellt am: 2026-07-18T13:53:23.209Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |
| Klinik-Heilung | €280 × 1.2^Besuche · +30 Stamina / +10 Mood |

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
| Songs | 7 |
| Quests (Registry) | 32 |
| Asset-Chassis-Arten | 4 |
| Asset-Module | 63 |
| Kredit-Profile | 5 |

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
| Baseline Touring | €500 | 0 | €120.704 | 54.9% | 0.07 | 5.3% | 14858 | 8 | 46 | 14.29 | 65.73 | 6.06 | 0% | €3.362 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €2.231 | 40.8% | 0.19 | 2.4% | 783 | 1 | 55 | 0.99 | 6.21 | 3.66 | 69.62% | €2.410 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €33.474 | 55.3% | 0.09 | 5.3% | 2929 | 3 | 56 | 5.03 | 30.11 | 6 | 0% | €3.327 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €11.448 | 51.5% | 0.12 | 3.7% | 1609 | 2 | 53 | 2.17 | 15.62 | 4.83 | 23.46% | €2.716 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €15.903 | 50.4% | 0.11 | 5.6% | 1762 | 2 | 54 | 2.21 | 16.53 | 4.94 | 10.38% | €3.114 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €24.958 | 51.2% | 0.11 | 3.5% | 2149 | 3 | 49 | 5.19 | 28.55 | 6.21 | 1.54% | €2.905 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €36.708 | 53.7% | 0.08 | 5.9% | 2990 | 3 | 58 | 4.27 | 30.44 | 5.8 | 0.38% | €3.420 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €27.161 | 50.5% | 0.1 | 3.9% | 2481 | 3 | 54 | 0 | 29.81 | 5.95 | 1.15% | €2.950 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €26.653 | 50.9% | 0.1 | 3.9% | 2707 | 3 | 54 | 11.7 | 29.03 | 6.03 | 2.69% | €2.920 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €15.623 | 13.6% | 0.09 | 3.7% | 1925 | 3 | 45 | 4.68 | 9.17 | 2.32 | 0.38% | €2.711 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €21.062 | 32.1% | 0.12 | 3.8% | 2001 | 3 | 49 | 4.88 | 16.17 | 5.62 | 0% | €2.967 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €44.633 | 52.6% | 0.07 | 5.7% | 7941 | 6 | 45 | 11.11 | 27.54 | 4.79 | 0% | €3.383 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €121.888 | €498 | €3.362 | 8.43 | 2.58 | 21.33 | 8.53 | 12.63 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €7.433 | €114 | €2.410 | 0.16 | 0.18 | 3.9 | 0.56 | 2.84 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €40.613 | €411 | €3.327 | 2.94 | 1.22 | 15.33 | 4.21 | 7.83 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €17.153 | €245 | €2.716 | 1.02 | 0.55 | 8.72 | 2.05 | 5.36 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €21.554 | €294 | €3.114 | 1.09 | 0.61 | 9.87 | 2.2 | 5.38 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €33.593 | €402 | €2.905 | 3.12 | 1.27 | 13.8 | 3.8 | 7.57 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €43.590 | €409 | €3.420 | 3.23 | 1.29 | 15.53 | 4.24 | 7.47 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €35.294 | €401 | €2.950 | 0 | 0 | 14.09 | 4.13 | 7.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €34.789 | €337 | €2.920 | 2.69 | 1.17 | 13.87 | 4.05 | 7.76 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €17.464 | €404 | €2.711 | 0.25 | 0.12 | 3.31 | 1 | 1.99 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €25.585 | €1.359 | €2.967 | 1.07 | 0.44 | 7.29 | 2.15 | 4.08 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €49.868 | €4.983 | €3.383 | 1.65 | 0.57 | 8.88 | 3.74 | 4.78 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €30.480 | €50.600 | €87.930 | €120.704 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.910 | €2.355 | €1.765 | €2.231 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €17.331 | €21.598 | €25.629 | €33.474 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €9.110 | €8.224 | €8.721 | €11.448 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.106 | €10.410 | €11.640 | €15.903 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €14.177 | €17.638 | €22.043 | €24.958 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €18.285 | €22.115 | €27.235 | €36.708 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €14.316 | €18.190 | €23.071 | €27.161 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €12.412 | €17.841 | €21.773 | €26.653 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €14.249 | €0 | €0 | €15.623 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €15.507 | €19.927 | €0 | €21.062 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.021 | €0 | €0 | €44.633 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.362 | €97 | 34.8× | 7.44 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.410 | €62 | 39.1× | 10.37 | 0.62 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.327 | €89 | 37.5× | 7.51 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.716 | €76 | 35.7× | 9.2 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.114 | €79 | 39.3× | 8.03 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.905 | €87 | 33.3× | 8.61 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.420 | €89 | 38.3× | 7.31 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.950 | €88 | 33.6× | 8.47 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.920 | €87 | 33.7× | 8.56 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.711 | €76 | 35.7× | 9.22 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.967 | €86 | 34.6× | 8.43 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.383 | €95 | 35.5× | 7.39 | 0.44 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8 | 53 | 40.8% | 50.5% | 8.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.4 | 51 | 49% | 42.8% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.6 | 55 | 33.5% | 55.7% | 10.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.1 | 52 | 42.7% | 48.7% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.1 | 58 | 23.2% | 60.7% | 16.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 8.6 | 50 | 51.6% | 43.1% | 5.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 7.5 | 56 | 33% | 54.5% | 12.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.4 | 50 | 48.7% | 45.1% | 6.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.3 | 51 | 45.5% | 47.5% | 7.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8 | 53 | 40.1% | 51.7% | 8.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.3 | 51 | 44.1% | 50.8% | 5.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 7.8 | 54 | 37.5% | 53.8% | 8.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 46 | 6.06 | 2.04 | 0.54 | 8.23 | 12.03 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 55 | 3.66 | 0.14 | 0.13 | 5.08 | 1.15 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 56 | 6 | 0.97 | 0.43 | 8.28 | 5.13 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 53 | 4.83 | 0.47 | 0.32 | 7.56 | 2.79 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 54 | 4.94 | 0.45 | 0.27 | 7.82 | 2.96 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 49 | 6.21 | 1 | 0.45 | 7.73 | 5.11 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 58 | 5.8 | 1.01 | 0.45 | 7.98 | 5.42 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 54 | 5.95 | 0 | 0 | 8.43 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 54 | 6.03 | 0.94 | 0.45 | 8.27 | 5.21 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 45 | 2.32 | 0.11 | 0.02 | 2.35 | 1.65 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 49 | 5.62 | 0.37 | 0.12 | 4.2 | 2.85 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 45 | 4.79 | 0.45 | 0.12 | 3.24 | 5.11 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.07 | 1.61 | 1.55 | 1.05 | 4.65 | 8.92 | 29.48 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.76 | 1.39 | 1.47 | 0.13 | 0.64 | 5.66 | 7.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.69 | 2.83 | 2.91 | 0.71 | 3.56 | 9 | 23.23 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.98 | 3.07 | 3.2 | 0.48 | 2.41 | 8.04 | 15.09 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.11 | 1.72 | 1.84 | 0.31 | 1.3 | 8.45 | 16.72 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.68 | 4.49 | 4.25 | 1.18 | 5.45 | 9.12 | 21.06 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.59 | 2.68 | 2.5 | 0.63 | 3.12 | 8.87 | 23.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.54 | 2.39 | 2.27 | 0.54 | 2.95 | 8.78 | 21.87 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.47 | 2.4 | 2.26 | 0.56 | 2.86 | 8.76 | 21.56 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.18 | 0.39 | 0.44 | 0.13 | 0.45 | 2.43 | 5.17 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.56 | 0.93 | 0.9 | 0.26 | 1.2 | 4.87 | 11.62 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.5 | 0.91 | 0.72 | 0.53 | 2.71 | 3.87 | 12.56 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 65.73 | 21.64 | 22.15 | 21.93 | 131.45 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 6.21 | 2.06 | 2.15 | 1.99 | 12.41 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.11 | 10.01 | 9.89 | 10.21 | 60.22 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 15.62 | 5.36 | 5.14 | 5.12 | 31.24 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 16.53 | 5.58 | 5.45 | 5.51 | 33.07 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 28.55 | 9.35 | 9.61 | 9.59 | 57.1 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 30.44 | 10.1 | 10.29 | 10.04 | 60.87 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 29.81 | 9.78 | 9.99 | 10.04 | 59.62 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 29.03 | 9.73 | 9.55 | 9.75 | 58.06 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.17 | 3.13 | 3.06 | 2.97 | 18.33 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 16.17 | 5.35 | 5.36 | 5.45 | 32.33 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 27.54 | 8.88 | 9.36 | 9.3 | 55.08 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 3.03 | 0.15 | 6.81 | 0.92 | 3.64 | 4.95 | €3.039 | 4.96 | 100% |
| Bootstrap Struggle | 0.67 | 0.38 | 1.54 | 1.05 | 1.2 | 1.33 | €1.517 | 3.97 | 100% |
| Aggressive Marketing | 2.98 | 0.53 | 6.52 | 0.97 | 3.6 | 3.06 | €2.998 | 5.23 | 100% |
| Scandal Recovery | 1.98 | 0.9 | 4.52 | 1.21 | 2.67 | 2.69 | €2.086 | 5.69 | 100% |
| Festival Push | 2.32 | 0.8 | 5.29 | 1.15 | 3.02 | 1.64 | €2.179 | 6.12 | 100% |
| Chaos Tour | 2.78 | 0.67 | 6.18 | 1.17 | 3.53 | 3.27 | €3.072 | 5.87 | 100% |
| Cult Hypergrowth | 2.97 | 0.33 | 6.6 | 0.97 | 3.58 | 4.07 | €2.896 | 4.68 | 100% |
| No Social (Fame 0-50) | 2.81 | 0.67 | 6.28 | 1.06 | 3.44 | 2.84 | €2.917 | 5.37 | 100% |
| High Controversy | 2.72 | 0.65 | 6.01 | 1.09 | 3.47 | 3.72 | €2.966 | 5.7 | 100% |
| Early Game Probe (Fame 0–50) | 1 | 0.32 | 0.85 | 0.53 | 1.15 | 1.67 | €788 | 0.01 | 100% |
| Mid Game Probe (Fame 60–150) | 1.99 | 0.52 | 3.3 | 0.83 | 2.43 | 2.46 | €2.701 | 2.26 | 100% |
| Late Game Probe (Fame 175+) | 2.11 | 0.2 | 2.68 | 0.67 | 2.41 | 2.92 | €2.254 | 0.38 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €120.704 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 14858 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 69.62% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.420 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €121.888 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 65.73 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.59 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €120.704 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 622.55 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 69.62% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €2.231 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 588.04 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €33.474 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 648.58 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 23.46% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €11.448 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 614.56 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 10.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €15.903 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 685.48 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €24.958 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 583.55 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €36.708 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 655.73 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-15.728 | -0.77 | -0.22 |
| Bootstrap Struggle | 1.93% | €-673 | 0.97 | -0.14 |
| Aggressive Marketing | -0.77% | €-4.500 | 5.28 | -0.07 |
| Scandal Recovery | 3.84% | €-2.097 | 7.46 | 0.12 |
| Festival Push | -0.77% | €-1.216 | -4.42 | 0.01 |
| Chaos Tour | 0.77% | €-2.635 | -1.46 | -0.3 |
| Cult Hypergrowth | -0.39% | €-3.736 | 4.4 | -0.06 |
| No Social (Fame 0-50) | -0.39% | €-2.811 | -0.8 | -0.01 |
| High Controversy | 0.77% | €-3.264 | 4.74 | 0.14 |
| Early Game Probe (Fame 0–50) | 0.38% | €-640 | 0.73 | -0.01 |
| Mid Game Probe (Fame 60–150) | -0.38% | €-1.354 | 1.16 | 0.02 |
| Late Game Probe (Fame 175+) | 0% | €-1.381 | -0.66 | 0.04 |

## Feature-Abdeckung in der Simulation

- ✅ daily_updates
- ✅ gig_financials
- ✅ travel_expenses
- ✅ fuel_cost
- ✅ travel_minigame
- ✅ roadie_minigame
- ✅ kabelsalat_minigame
- ✅ amp_calibration_minigame
- ✅ gig_modifiers
- ✅ gig_physics
- ✅ world_events
- ✅ gig_events
- ✅ events_db
- ✅ brand_deals
- ✅ social_trends
- ✅ social_platforms
- ✅ post_options
- ✅ contraband
- ✅ sponsorship
- ✅ maintenance
- ✅ upgrades
- ✅ clinic
- ✅ rest_stops
- ✅ songs
- ✅ trait_unlocks
- ✅ region_reputation
- ✅ quest_events
- ✅ asset_acquisition
- ✅ asset_modules
- ✅ crowdfunding

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 69.62% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €120.704 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.59 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
