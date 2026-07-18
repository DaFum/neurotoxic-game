# Game Balance Simulation – Analyse

Erstellt am: 2026-07-18T14:15:47.178Z

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
| Baseline Touring | €500 | 0 | €107.696 | 56% | 0.07 | 4.8% | 10443 | 7 | 38 | 12.02 | 60.64 | 6.15 | 0.38% | €3.351 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €1.576 | 40.7% | 0.21 | 2.2% | 718 | 1 | 53 | 0.82 | 5.48 | 3.42 | 79.23% | €2.348 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €33.855 | 53.3% | 0.09 | 5.2% | 2771 | 3 | 52 | 6.13 | 30.3 | 6.12 | 0.38% | €3.347 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €12.623 | 51.5% | 0.13 | 3.7% | 1475 | 2 | 51 | 2.92 | 15.7 | 4.88 | 17.31% | €2.745 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €14.856 | 50.2% | 0.11 | 5.3% | 1724 | 2 | 53 | 1.73 | 15.83 | 4.96 | 16.92% | €3.152 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €23.715 | 52.6% | 0.12 | 3% | 1937 | 3 | 43 | 5.36 | 27.23 | 6.27 | 1.54% | €2.912 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €35.826 | 53.4% | 0.09 | 5.6% | 2922 | 3 | 57 | 4.65 | 30.14 | 5.92 | 1.15% | €3.415 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €26.294 | 50.9% | 0.11 | 3.5% | 2430 | 3 | 52 | 0 | 29.57 | 6 | 1.54% | €2.906 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €25.918 | 49.4% | 0.11 | 3.8% | 2283 | 3 | 50 | 9.9 | 28.22 | 6.18 | 1.92% | €2.894 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €15.454 | 15% | 0.1 | 3.3% | 1749 | 2 | 43 | 3.88 | 9.12 | 2.49 | 0% | €2.711 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €21.237 | 30.2% | 0.12 | 3.2% | 1947 | 3 | 47 | 5.59 | 16.03 | 5.6 | 0.77% | €2.955 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €40.704 | 53.2% | 0.08 | 5.2% | 6500 | 5 | 40 | 10.41 | 26.32 | 5.41 | 0% | €3.367 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €109.016 | €497 | €3.351 | 7.38 | 2.37 | 20.81 | 8 | 11.85 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €6.824 | €96 | €2.348 | 0.16 | 0.16 | 3.24 | 0.46 | 2.48 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €41.953 | €409 | €3.347 | 3.19 | 1.22 | 15.13 | 4.33 | 7.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €17.611 | €256 | €2.745 | 1.08 | 0.57 | 8.43 | 2.06 | 5.49 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €21.207 | €281 | €3.152 | 0.88 | 0.48 | 9.32 | 2.03 | 5.27 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €31.538 | €394 | €2.912 | 2.55 | 1.17 | 12.28 | 3.64 | 7.43 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €43.098 | €407 | €3.415 | 2.91 | 1.19 | 15.15 | 4.27 | 7.4 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €34.350 | €397 | €2.906 | 0 | 0 | 13.6 | 4.13 | 7.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €33.280 | €327 | €2.894 | 2.61 | 1.13 | 13.12 | 3.92 | 7.65 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €17.337 | €401 | €2.711 | 0.27 | 0.15 | 3.35 | 0.98 | 1.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €25.278 | €1.351 | €2.955 | 0.91 | 0.41 | 7.07 | 2.11 | 4.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €46.885 | €4.980 | €3.367 | 1.66 | 0.58 | 8.7 | 3.6 | 4.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €29.641 | €45.790 | €78.499 | €107.696 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €6.376 | €3.498 | €4.659 | €1.576 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €17.164 | €21.947 | €27.313 | €33.855 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.574 | €8.884 | €10.737 | €12.623 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €10.518 | €10.979 | €12.403 | €14.856 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €13.324 | €16.082 | €20.591 | €23.715 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €17.150 | €21.183 | €27.543 | €35.826 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €13.446 | €17.577 | €22.516 | €26.294 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €11.863 | €16.770 | €21.559 | €25.918 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €14.072 | — | — | €15.454 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €15.433 | €19.975 | — | €21.237 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €30.856 | — | — | €40.704 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.351 | €95 | 35.2× | 7.46 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.348 | €61 | 38.5× | 10.65 | 0.64 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.347 | €89 | 37.6× | 7.47 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.745 | €76 | 36.2× | 9.11 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.152 | €79 | 39.9× | 7.93 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.912 | €86 | 33.8× | 8.58 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.415 | €89 | 38.3× | 7.32 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.906 | €87 | 33.3× | 8.6 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.894 | €86 | 33.7× | 8.64 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.711 | €76 | 35.8× | 9.22 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.955 | €86 | 34.5× | 8.46 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.367 | €95 | 35.6× | 7.42 | 0.45 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 50.8% | 44.1% | 5.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.8 | 48 | 56.3% | 37.8% | 6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 8 | 53 | 40.4% | 52.4% | 7.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.4 | 51 | 48.9% | 45.3% | 5.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.3 | 57 | 26.4% | 59.5% | 14.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.2 | 46 | 64.3% | 32.9% | 2.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 7.8 | 54 | 36.9% | 52.8% | 10.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.6 | 49 | 54% | 39.9% | 6.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 49 | 53.6% | 42.3% | 4.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 47.5% | 45.8% | 6.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.5 | 50 | 50.1% | 45.7% | 4.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 46.2% | 47.3% | 6.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 38 | 6.15 | 1.85 | 0.6 | 8.03 | 10.89 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 53 | 3.42 | 0.14 | 0.11 | 4.41 | 0.96 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 52 | 6.12 | 1.03 | 0.38 | 8.01 | 5.4 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 4.88 | 0.46 | 0.29 | 7.66 | 2.9 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 4.96 | 0.38 | 0.25 | 7.71 | 2.88 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 43 | 6.27 | 0.91 | 0.45 | 7.98 | 4.96 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 57 | 5.92 | 0.94 | 0.4 | 8.18 | 5.29 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 52 | 6 | 0 | 0 | 8.27 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | 6.18 | 0.87 | 0.4 | 8.21 | 4.94 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 43 | 2.49 | 0.12 | 0.03 | 2.35 | 1.6 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 47 | 5.6 | 0.34 | 0.12 | 4.18 | 2.97 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 5.41 | 0.46 | 0.09 | 3.2 | 4.97 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.1 | 1.66 | 1.53 | 0.92 | 3.9 | 9.1 | 29.14 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.68 | 1.26 | 1.41 | 0.11 | 0.55 | 5.05 | 6.22 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.92 | 2.91 | 2.84 | 0.74 | 3.52 | 9 | 23 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.9 | 3.09 | 3.35 | 0.49 | 2.25 | 8.25 | 15.12 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.02 | 1.56 | 1.62 | 0.29 | 1.32 | 8.37 | 16.22 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.66 | 4.17 | 4.14 | 1.08 | 4.87 | 8.83 | 19.87 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.55 | 2.46 | 2.49 | 0.61 | 3.17 | 8.9 | 22.84 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.51 | 2.34 | 2.2 | 0.57 | 2.84 | 8.8 | 21.22 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.5 | 2.31 | 2.28 | 0.59 | 2.8 | 8.84 | 20.79 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.18 | 0.4 | 0.41 | 0.13 | 0.46 | 2.49 | 5.15 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.56 | 0.95 | 1.01 | 0.23 | 1.16 | 4.85 | 11.32 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.56 | 1 | 0.78 | 0.58 | 2.53 | 3.69 | 12.29 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.64 | 20.29 | 20.14 | 20.22 | 121.29 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 5.48 | 1.87 | 1.85 | 1.77 | 10.97 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.3 | 10.2 | 10.08 | 10.01 | 60.59 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 15.7 | 5.24 | 5.25 | 5.21 | 31.4 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 15.83 | 5.26 | 5.32 | 5.25 | 31.66 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 27.23 | 8.98 | 9.09 | 9.17 | 54.47 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 30.14 | 10.11 | 9.92 | 10.1 | 60.27 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 29.57 | 9.8 | 9.89 | 9.88 | 59.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 28.22 | 9.34 | 9.27 | 9.61 | 56.44 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.12 | 3.15 | 2.98 | 2.98 | 18.23 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 16.03 | 5.36 | 5.24 | 5.44 | 32.07 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.32 | 8.63 | 8.85 | 8.83 | 52.63 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.96 | 0.19 | 6.96 | 0.92 | 3.61 | 4.81 | €3.098 | 5.5 | 100% |
| Bootstrap Struggle | 0.58 | 0.33 | 1.28 | 0.95 | 1.08 | 1.13 | €1.422 | 3.71 | 100% |
| Aggressive Marketing | 2.88 | 0.54 | 6.62 | 1.05 | 3.5 | 2.88 | €3.078 | 4.87 | 100% |
| Scandal Recovery | 1.9 | 0.84 | 4.47 | 1.31 | 2.67 | 2.56 | €2.120 | 6.24 | 100% |
| Festival Push | 2.2 | 0.81 | 5.03 | 1.15 | 2.88 | 1.61 | €2.180 | 6.13 | 100% |
| Chaos Tour | 2.76 | 0.75 | 6.26 | 1.08 | 3.44 | 3.09 | €3.094 | 6.48 | 100% |
| Cult Hypergrowth | 2.88 | 0.38 | 6.5 | 1.02 | 3.48 | 3.96 | €2.956 | 4.79 | 100% |
| No Social (Fame 0-50) | 2.85 | 0.7 | 6.33 | 1.03 | 3.48 | 2.7 | €2.954 | 5.54 | 100% |
| High Controversy | 2.73 | 0.74 | 6.15 | 1.09 | 3.45 | 3.49 | €3.050 | 6.48 | 100% |
| Early Game Probe (Fame 0–50) | 0.98 | 0.31 | 0.78 | 0.53 | 1.13 | 1.62 | €851 | 0.01 | 100% |
| Mid Game Probe (Fame 60–150) | 2.1 | 0.56 | 3.06 | 0.88 | 2.53 | 2.41 | €2.698 | 2.38 | 100% |
| Late Game Probe (Fame 175+) | 2.12 | 0.22 | 2.61 | 0.65 | 2.42 | 2.83 | €2.618 | 0.59 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €107.696 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 10443 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 79.23% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.415 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €109.016 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.64 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.06 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €107.696 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 588.09 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 79.23% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €1.576 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 548.16 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €33.855 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 620.38 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 17.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €12.623 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 592.04 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 16.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €14.856 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 673 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €23.715 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 529.95 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €35.826 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 638.88 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.38% | €-13.008 | -34.46 | -5.09 |
| Bootstrap Struggle | 9.61% | €-655 | -39.88 | -0.73 |
| Aggressive Marketing | 0.38% | €381 | -28.2 | 0.19 |
| Scandal Recovery | -6.15% | €1.175 | -22.52 | 0.08 |
| Festival Push | 6.54% | €-1.047 | -12.48 | -0.7 |
| Chaos Tour | 0% | €-1.243 | -53.6 | -1.32 |
| Cult Hypergrowth | 0.77% | €-882 | -16.85 | -0.3 |
| No Social (Fame 0-50) | 0.39% | €-867 | -21.58 | -0.24 |
| High Controversy | -0.77% | €-735 | -35.9 | -0.81 |
| Early Game Probe (Fame 0–50) | -0.38% | €-169 | -27.1 | -0.05 |
| Mid Game Probe (Fame 60–150) | 0.77% | €175 | -19.56 | -0.14 |
| Late Game Probe (Fame 175+) | 0% | €-3.929 | -33.03 | -1.22 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 79.23% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €107.696 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.06 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
