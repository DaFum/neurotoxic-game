# Game Balance Simulation – Analyse

Erstellt am: 2026-07-11T14:49:37.781Z

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
| Baseline Touring | €500 | 0 | €138.155 | 52.1% | 0.04 | 7.3% | 15402 | 8 | 58 | 13.35 | 58.94 | 16.06 | 0% | €3.231 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €13.141 | 20.8% | 0.06 | 4.2% | 970 | 2 | 58 | 2.3 | 9.4 | 4.25 | 25.77% | €2.544 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €52.819 | 54.7% | 0.04 | 6.9% | 2770 | 3 | 62 | 6.1 | 28.7 | 8.16 | 0.38% | €3.205 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €26.104 | 29.9% | 0.05 | 4.1% | 1686 | 2 | 60 | 4.42 | 18.13 | 6.56 | 1.54% | €2.659 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €28.699 | 36.8% | 0.05 | 5.7% | 2120 | 3 | 62 | 3.72 | 18.5 | 6.23 | 1.15% | €2.962 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €39.628 | 56.1% | 0.05 | 5.6% | 2749 | 3 | 62 | 7.72 | 28.49 | 8.51 | 0% | €2.847 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €56.503 | 54.6% | 0.04 | 6.3% | 2619 | 3 | 61 | 6.4 | 28.57 | 8.29 | 0.38% | €3.280 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €34.956 | 58.1% | 0.05 | 5.1% | 2905 | 3 | 62 | 0 | 28.53 | 8.38 | 0.38% | €2.841 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €39.154 | 56.5% | 0.05 | 4.7% | 2595 | 3 | 62 | 13.44 | 28.06 | 8.68 | 0.77% | €2.804 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €17.963 | 3.9% | 0.04 | 4.4% | 1878 | 3 | 56 | 4.56 | 8.06 | 1.9 | 0.38% | €2.666 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €28.516 | 25.1% | 0.05 | 4.9% | 2376 | 3 | 61 | 5.66 | 15.39 | 4.54 | 0.38% | €2.920 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €50.076 | 51.9% | 0.04 | 6.7% | 7441 | 6 | 60 | 10.16 | 24.22 | 5.78 | 0% | €3.265 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €138.740 | €500 | €3.231 | 17.65 | 4.65 | 21.5 | 8.34 | 11.75 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.272 | €188 | €2.544 | 2.74 | 1.88 | 6.33 | 0.99 | 4 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €55.030 | €413 | €3.205 | 10.12 | 3.62 | 16.66 | 4.15 | 7.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €32.596 | €311 | €2.659 | 6.51 | 2.89 | 11.05 | 2.5 | 6.08 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.514 | €318 | €2.962 | 6.23 | 2.99 | 12.39 | 2.56 | 5.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €45.506 | €411 | €2.847 | 10.4 | 3.65 | 16.19 | 3.88 | 7.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €57.874 | €413 | €3.280 | 10.36 | 3.6 | 16.1 | 4.18 | 7.17 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.071 | €407 | €2.841 | 0 | 0 | 15.96 | 4.04 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.699 | €361 | €2.804 | 9.7 | 3.45 | 15.7 | 4.02 | 7.72 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.413 | €406 | €2.666 | 1.34 | 0.75 | 3.35 | 0.86 | 1.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.389 | €1.376 | €2.920 | 4.66 | 1.79 | 7.95 | 2.05 | 3.95 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €52.511 | €4.944 | €3.265 | 6.23 | 1.77 | 9.09 | 3.27 | 4.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.731 | €62.911 | €104.699 | €138.155 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.044 | €7.235 | €10.620 | €13.141 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.395 | €27.893 | €36.631 | €52.819 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.193 | €18.208 | €23.489 | €26.104 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.057 | €20.436 | €25.300 | €28.699 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.747 | €28.189 | €28.826 | €39.628 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.835 | €27.505 | €39.200 | €56.503 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.713 | €26.617 | €27.419 | €34.956 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.266 | €26.226 | €28.663 | €39.154 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €16.011 | €0 | €0 | €17.963 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.583 | €27.241 | €0 | €28.516 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.872 | €0 | €0 | €50.076 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.231 | €97 | 33.5× | 7.74 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.544 | €75 | 34.1× | 9.83 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.205 | €89 | 35.9× | 7.8 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.659 | €84 | 31.8× | 9.4 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.962 | €85 | 34.9× | 8.44 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.847 | €89 | 32.1× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.280 | €90 | 36.6× | 7.62 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.841 | €89 | 32.1× | 8.8 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.804 | €88 | 31.9× | 8.92 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.666 | €74 | 35.9× | 9.38 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.920 | €86 | 33.9× | 8.56 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.265 | €94 | 34.6× | 7.66 | 0.46 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.6% | 73.2% | 15.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 23.6% | 67.8% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.9% | 68.9% | 19.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.2% | 70.9% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.8% | 56.7% | 39.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.7% | 68.3% | 19% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 14.3% | 70.6% | 15.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.5% | 70.7% | 13.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7 | 59 | 18.2% | 69.8% | 11.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 22.1% | 66.8% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18.3% | 72.9% | 8.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.6 | 61 | 13.2% | 69.7% | 17.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 16.06 | 3.57 | 1.39 | 8.37 | 10.46 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 4.25 | 1.43 | 1.13 | 6.09 | 1.82 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 62 | 8.16 | 2.77 | 1.79 | 8.08 | 5.02 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 6.56 | 2.33 | 1.57 | 8.26 | 3.23 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 62 | 6.23 | 2.26 | 1.73 | 7.97 | 3.36 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 62 | 8.51 | 2.83 | 1.64 | 8.13 | 4.97 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.29 | 2.8 | 1.66 | 8.64 | 5.27 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.38 | 0 | 0 | 8.12 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 62 | 8.68 | 2.75 | 1.58 | 8.35 | 5.07 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 56 | 1.9 | 0.58 | 0.22 | 2.19 | 1.43 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 61 | 4.54 | 1.38 | 0.69 | 4.35 | 2.51 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 60 | 5.78 | 1.39 | 0.48 | 3.08 | 4.28 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.85 | 1.56 | 1.77 | 0.81 | 9.22 | 30.03 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.94 | 1.75 | 1.77 | 0.19 | 6.91 | 11.47 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.53 | 2.74 | 2.6 | 0.63 | 9.11 | 24.8 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.2 | 3.24 | 3.27 | 0.54 | 8.73 | 18.54 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.93 | 1.75 | 1.65 | 0.35 | 8.88 | 19.73 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.54 | 4.48 | 4.26 | 1.01 | 9.13 | 24.23 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.47 | 2.45 | 2.52 | 0.52 | 8.91 | 23.87 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.27 | 2.39 | 2.29 | 0.53 | 9.2 | 23.67 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.41 | 2.17 | 2.31 | 0.45 | 9.3 | 23.4 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.24 | 0.4 | 0.37 | 0.09 | 2.45 | 5.08 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.53 | 0.96 | 1 | 0.23 | 4.8 | 12.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.51 | 0.95 | 0.95 | 0.52 | 3.74 | 12.8 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.94 | 58.94 | 58.94 | 176.82 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.4 | 9.4 | 9.4 | 28.2 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.7 | 28.7 | 28.7 | 86.1 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.13 | 18.13 | 18.13 | 54.39 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.5 | 18.5 | 18.5 | 55.5 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.49 | 28.49 | 28.49 | 85.47 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.57 | 28.57 | 28.57 | 85.71 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.53 | 28.53 | 28.53 | 85.59 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.06 | 28.06 | 28.06 | 84.18 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.06 | 8.06 | 8.06 | 24.18 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.39 | 15.39 | 15.39 | 46.17 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.22 | 24.22 | 24.22 | 72.66 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €138.155 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15402 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 25.77% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.280 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €138.740 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.94 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.29 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €138.155 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 710.64 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 25.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €13.141 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 673.3 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €52.819 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 721.44 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €26.104 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 684.54 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €28.699 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 784.44 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €39.628 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 719.31 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €56.503 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 705.21 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €1.076 | 0.64 | 0.04 |
| Bootstrap Struggle | 0.39% | €-154 | 0.15 | -0.04 |
| Aggressive Marketing | 0% | €186 | 0.4 | 0 |
| Scandal Recovery | -0.38% | €-366 | 0.94 | 0.08 |
| Festival Push | -0.77% | €420 | 2.4 | 0.16 |
| Chaos Tour | 0% | €166 | 0.48 | 0.1 |
| Cult Hypergrowth | -0.39% | €622 | 0.54 | 0.09 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0.39% | €456 | 2.56 | -0.11 |
| Early Game Probe (Fame 0–50) | 0% | €175 | -0.49 | -0.02 |
| Mid Game Probe (Fame 60–150) | 0% | €-168 | 0.4 | -0.02 |
| Late Game Probe (Fame 175+) | 0% | €-953 | 3.13 | -0.04 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 25.77% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €138.155 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.29 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
