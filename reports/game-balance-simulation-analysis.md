# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T15:58:58.042Z

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
| Baseline Touring | €500 | 0 | €129.401 | 53.1% | 0.04 | 6.3% | 15623 | 8 | 59 | -1.55 | 58.99 | 16.01 | 0% | €3.075 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €11.604 | 23.6% | 0.06 | 3.5% | 957 | 2 | 58 | -0.57 | 8.69 | 3.91 | 32.69% | €2.440 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €42.119 | 57% | 0.05 | 4.9% | 2820 | 3 | 61 | -2.27 | 28.63 | 8.27 | 0.38% | €2.842 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €25.344 | 26.1% | 0.06 | 3.9% | 1728 | 2 | 62 | -1.2 | 17.64 | 6.45 | 3.85% | €2.539 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €25.786 | 33.8% | 0.05 | 6% | 2009 | 3 | 65 | -1.75 | 17.85 | 6.12 | 4.62% | €2.726 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €35.854 | 56% | 0.05 | 4.9% | 2862 | 3 | 63 | -2.38 | 28.52 | 8.48 | 0% | €2.700 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €42.549 | 56.4% | 0.05 | 5% | 2674 | 3 | 61 | -2.38 | 28.58 | 8.33 | 0.38% | €2.846 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €55.128 | 54.8% | 0.04 | 6.2% | 2568 | 3 | 60 | -2.29 | 28.55 | 8.45 | 0% | €3.323 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €57.761 | 54.8% | 0.04 | 6.2% | 2553 | 3 | 60 | 2.24 | 28.57 | 8.43 | 0% | €3.402 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €17.096 | 3.5% | 0.05 | 4.1% | 2044 | 3 | 55 | 0.11 | 8.09 | 1.91 | 0% | €2.564 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.140 | 18% | 0.05 | 4.1% | 2418 | 3 | 61 | -0.45 | 15.4 | 4.52 | 0.77% | €2.773 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €44.146 | 50.6% | 0.04 | 5.9% | 7207 | 6 | 60 | -0.23 | 24.23 | 5.77 | 0% | €2.985 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €130.045 | €500 | €3.075 | 18.84 | 4.73 | 21.53 | 8.43 | 11.69 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €13.230 | €170 | €2.440 | 2.5 | 1.57 | 5.62 | 0.92 | 3.63 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €46.949 | €409 | €2.842 | 10.07 | 3.55 | 16.24 | 4.21 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €30.028 | €298 | €2.539 | 5.53 | 2.8 | 10.54 | 2.41 | 5.92 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €32.800 | €310 | €2.726 | 5.92 | 2.76 | 11.76 | 2.43 | 5.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €43.321 | €403 | €2.700 | 9.87 | 3.46 | 16.29 | 3.88 | 7.6 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €47.230 | €408 | €2.846 | 10.07 | 3.59 | 16.11 | 4.14 | 7.2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €56.723 | €414 | €3.323 | 10.17 | 3.58 | 16.26 | 4.04 | 7.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €59.230 | €409 | €3.402 | 10.2 | 3.55 | 16.1 | 4.05 | 7.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €17.365 | €407 | €2.564 | 1.3 | 0.77 | 3.33 | 0.89 | 1.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €34.367 | €1.376 | €2.773 | 4.42 | 1.77 | 7.71 | 2.02 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €48.674 | €4.968 | €2.985 | 5.94 | 1.72 | 9.08 | 3.37 | 4.41 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €30.910 | €56.917 | €98.482 | €129.401 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.363 | €5.975 | €9.010 | €11.604 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €15.686 | €27.472 | €29.669 | €42.119 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.569 | €15.562 | €21.044 | €25.344 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.399 | €18.213 | €22.271 | €25.786 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €14.302 | €25.849 | €27.865 | €35.854 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €16.049 | €27.657 | €30.637 | €42.549 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €18.896 | €27.202 | €38.188 | €55.128 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €18.512 | €28.221 | €39.093 | €57.761 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €14.847 | €0 | €0 | €17.096 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.030 | €27.494 | €0 | €29.140 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.907 | €0 | €0 | €44.146 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.075 | €96 | 31.9× | 8.13 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.440 | €73 | 33.5× | 10.25 | 0.61 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.842 | €89 | 32× | 8.8 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.539 | €82 | 30.9× | 9.85 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.726 | €84 | 32.6× | 9.17 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.700 | €88 | 30.6× | 9.26 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.846 | €88 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €3.323 | €89 | 37.2× | 7.52 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €3.402 | €89 | 38.1× | 7.35 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.564 | €74 | 34.8× | 9.75 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.773 | €86 | 32.2× | 9.02 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.985 | €94 | 31.7× | 8.37 | 0.5 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 10.7% | 75% | 14.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.5 | 56 | 25.2% | 66.8% | 8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 12.1% | 71% | 16.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.1 | 58 | 18.6% | 71.7% | 9.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 4.1% | 57.6% | 38.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 11.8% | 69.3% | 18.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 59 | 15.9% | 71.2% | 12.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7 | 59 | 16.1% | 71.7% | 12.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7 | 58 | 19.3% | 68.9% | 11.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 23.1% | 65.6% | 11.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19% | 71.4% | 9.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 61 | 11.9% | 72.4% | 15.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59 | 16.01 | 3.75 | 1.4 | 8.17 | 0 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 3.91 | 1.17 | 0.95 | 5.77 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 61 | 8.27 | 2.75 | 1.64 | 8.52 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 62 | 6.45 | 2.16 | 1.66 | 7.85 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 65 | 6.12 | 2.03 | 1.45 | 8.13 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 63 | 8.48 | 2.61 | 1.55 | 8.14 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.33 | 2.77 | 1.75 | 8.29 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 60 | 8.45 | 2.76 | 1.8 | 8 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 60 | 8.43 | 2.74 | 1.68 | 8.22 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.91 | 0.61 | 0.22 | 2.16 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 61 | 4.52 | 1.36 | 0.63 | 4.5 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 60 | 5.77 | 1.33 | 0.44 | 3.23 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.85 | 1.53 | 1.37 | 0.78 | 8.98 | 29.84 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.81 | 1.6 | 1.53 | 0.17 | 6.42 | 10.35 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.47 | 2.84 | 2.73 | 0.72 | 9.09 | 24.18 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.87 | 3.1 | 3.32 | 0.59 | 8.6 | 17.79 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.95 | 1.66 | 1.7 | 0.25 | 8.42 | 19.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.37 | 4.45 | 4.25 | 1.12 | 9.07 | 24.17 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.54 | 2.57 | 2.5 | 0.56 | 9.24 | 24 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.38 | 2.13 | 2.28 | 0.57 | 9.1 | 23.89 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.33 | 2.33 | 2.31 | 0.49 | 9.11 | 23.84 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.22 | 0.35 | 0.39 | 0.11 | 2.38 | 5.13 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.63 | 0.93 | 0.93 | 0.3 | 4.63 | 12.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.53 | 0.95 | 0.96 | 0.52 | 3.59 | 12.7 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.99 | 58.99 | 58.99 | 176.97 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 8.69 | 8.69 | 8.69 | 26.07 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.63 | 28.63 | 28.63 | 85.89 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 17.64 | 17.64 | 17.64 | 52.92 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.85 | 17.85 | 17.85 | 53.55 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.52 | 28.52 | 28.52 | 85.56 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.58 | 28.58 | 28.58 | 85.74 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.55 | 28.55 | 28.55 | 85.65 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.57 | 28.57 | 28.57 | 85.71 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.09 | 8.09 | 8.09 | 24.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.4 | 15.4 | 15.4 | 46.2 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.23 | 24.23 | 24.23 | 72.69 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €129.401 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15623 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 32.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **High Controversy** | €3.402 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €130.045 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.99 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.19 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €129.401 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 710.93 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 32.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €11.604 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 669.01 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €42.119 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 715.95 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 3.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €25.344 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 686.74 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 4.62% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €25.786 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 782.24 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €35.854 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 719.63 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €42.549 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 697.25 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 32.69% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €129.401 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.19 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
