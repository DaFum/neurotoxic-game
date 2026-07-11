# Game Balance Simulation – Analyse

Erstellt am: 2026-07-11T15:54:57.838Z

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
| Baseline Touring | €500 | 0 | €137.978 | 52% | 0.04 | 7.2% | 15125 | 8 | 60 | 14.63 | 58.92 | 16.08 | 0% | €3.216 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €13.308 | 19.9% | 0.06 | 3.6% | 1023 | 2 | 58 | 1.53 | 9.4 | 4.19 | 26.15% | €2.527 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €52.890 | 54.9% | 0.04 | 7.2% | 2944 | 3 | 62 | 6.79 | 28.62 | 8.24 | 0.38% | €3.212 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €26.671 | 28.9% | 0.05 | 4.6% | 1714 | 2 | 61 | 4.92 | 18.17 | 6.44 | 1.92% | €2.698 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €28.098 | 40.5% | 0.05 | 6.4% | 1944 | 3 | 64 | 3.63 | 18.38 | 6.18 | 1.92% | €3.005 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €39.055 | 56% | 0.05 | 5.6% | 2910 | 3 | 63 | 7.41 | 28.37 | 8.63 | 0% | €2.828 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €56.220 | 54.5% | 0.04 | 6.4% | 2796 | 3 | 61 | 4.91 | 28.6 | 8.12 | 0.77% | €3.275 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €34.956 | 58.1% | 0.05 | 5.1% | 2905 | 3 | 62 | 0 | 28.53 | 8.38 | 0.38% | €2.841 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €39.108 | 55% | 0.05 | 5% | 2678 | 3 | 63 | 13.22 | 28.17 | 8.7 | 0.38% | €2.806 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €17.934 | 4.7% | 0.04 | 4.2% | 1969 | 3 | 55 | 4.21 | 8.06 | 1.87 | 0.77% | €2.670 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.145 | 23.7% | 0.05 | 5% | 2372 | 3 | 60 | 5.08 | 15.45 | 4.48 | 0.38% | €2.906 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €51.165 | 51.3% | 0.04 | 6.9% | 7440 | 6 | 57 | 11.18 | 24.26 | 5.74 | 0% | €3.275 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €138.628 | €500 | €3.216 | 17.87 | 4.51 | 21.74 | 8.45 | 11.71 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.235 | €188 | €2.527 | 2.79 | 1.86 | 6.27 | 0.99 | 3.97 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €54.652 | €412 | €3.212 | 10.08 | 3.56 | 16.5 | 4.17 | 7.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €33.078 | €310 | €2.698 | 6.46 | 2.88 | 11.03 | 2.46 | 6.08 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.733 | €315 | €3.005 | 6.1 | 2.98 | 12.69 | 2.58 | 5.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €44.884 | €409 | €2.828 | 10.49 | 3.64 | 16.13 | 3.8 | 7.59 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €57.569 | €411 | €3.275 | 10.05 | 3.54 | 16.03 | 4.18 | 7.2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.071 | €407 | €2.841 | 0 | 0 | 15.96 | 4.04 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.710 | €363 | €2.806 | 9.93 | 3.4 | 15.8 | 4.01 | 7.79 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.393 | €402 | €2.670 | 1.33 | 0.75 | 3.33 | 0.86 | 1.85 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.168 | €1.379 | €2.906 | 4.7 | 1.77 | 7.97 | 2.05 | 3.95 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €53.184 | €4.925 | €3.275 | 6.28 | 1.75 | 9.09 | 3.34 | 4.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.453 | €62.211 | €104.895 | €137.978 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.093 | €7.155 | €10.833 | €13.308 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.467 | €28.672 | €36.557 | €52.890 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.087 | €18.562 | €23.196 | €26.671 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.253 | €21.474 | €25.212 | €28.098 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.432 | €27.613 | €28.362 | €39.055 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.615 | €27.625 | €39.045 | €56.220 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.713 | €26.617 | €27.419 | €34.956 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.359 | €26.321 | €28.564 | €39.108 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.888 | €0 | €0 | €17.934 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.810 | €27.994 | €0 | €29.145 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €32.034 | €0 | €0 | €51.165 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.216 | €96 | 33.4× | 7.77 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.527 | €75 | 33.8× | 9.89 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.212 | €89 | 35.9× | 7.78 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.698 | €84 | 32.2× | 9.27 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.005 | €85 | 35.4× | 8.32 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.828 | €89 | 31.9× | 8.84 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.275 | €90 | 36.5× | 7.63 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.841 | €89 | 32.1× | 8.8 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.806 | €88 | 31.9× | 8.91 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.670 | €74 | 36× | 9.36 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.906 | €86 | 33.7× | 8.6 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.275 | €94 | 34.7× | 7.63 | 0.46 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.9% | 72.3% | 15.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 57 | 23.4% | 68.1% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.5% | 69.8% | 18.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.2% | 70.9% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 4% | 56.8% | 39.2% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.4% | 68.3% | 19.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.6% | 68.9% | 15.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.5% | 70.7% | 13.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 59 | 18.5% | 69.2% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 21.8% | 67.3% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.1 | 58 | 18.9% | 72% | 9.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 61 | 13.3% | 70.6% | 16.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 16.08 | 3.53 | 1.3 | 8.32 | 10.65 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 4.19 | 1.4 | 1.16 | 6.09 | 1.75 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 62 | 8.24 | 2.75 | 1.76 | 8.07 | 5 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 61 | 6.44 | 2.28 | 1.61 | 8.07 | 3.13 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 64 | 6.18 | 2.23 | 1.7 | 8.01 | 3.31 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 63 | 8.63 | 2.87 | 1.75 | 8.03 | 4.93 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.12 | 2.74 | 1.68 | 8.34 | 5.17 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.38 | 0 | 0 | 8.12 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 63 | 8.7 | 2.75 | 1.58 | 8.32 | 5.03 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.87 | 0.58 | 0.21 | 2.17 | 1.42 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 60 | 4.48 | 1.32 | 0.65 | 4.21 | 2.56 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 57 | 5.74 | 1.37 | 0.45 | 3.2 | 4.47 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.82 | 1.48 | 1.7 | 0.78 | 9.55 | 30.32 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1 | 1.67 | 1.78 | 0.2 | 6.79 | 11.25 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.57 | 2.69 | 2.62 | 0.65 | 8.77 | 24.45 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.12 | 3.15 | 3.32 | 0.51 | 8.79 | 18.53 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.92 | 1.71 | 1.75 | 0.28 | 8.91 | 19.98 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.43 | 4.37 | 4.27 | 1.04 | 9.21 | 24.2 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.57 | 2.53 | 2.41 | 0.49 | 8.97 | 24.07 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.27 | 2.39 | 2.29 | 0.53 | 9.2 | 23.67 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.44 | 2.2 | 2.33 | 0.5 | 8.96 | 23.37 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.39 | 0.39 | 0.08 | 2.29 | 5.04 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.52 | 0.97 | 0.95 | 0.26 | 4.79 | 12.49 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.52 | 0.89 | 0.86 | 0.52 | 3.75 | 12.62 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.92 | 58.92 | 58.92 | 176.76 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.4 | 9.4 | 9.4 | 28.2 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.62 | 28.62 | 28.62 | 85.86 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.17 | 18.17 | 18.17 | 54.51 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.38 | 18.38 | 18.38 | 55.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.37 | 28.37 | 28.37 | 85.11 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.6 | 28.6 | 28.6 | 85.8 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.53 | 28.53 | 28.53 | 85.59 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.17 | 28.17 | 28.17 | 84.51 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.06 | 8.06 | 8.06 | 24.18 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.45 | 15.45 | 15.45 | 46.35 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.26 | 24.26 | 24.26 | 72.78 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €137.978 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15125 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 26.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.275 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €138.628 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.92 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.11 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €137.978 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 712.71 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 26.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €13.308 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 672.94 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €52.890 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 719.99 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €26.671 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 684.3 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €28.098 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 784.39 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €39.055 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 720.32 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €56.220 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 705.48 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-177 | 2.07 | -0.02 |
| Bootstrap Struggle | 0.38% | €167 | -0.36 | 0 |
| Aggressive Marketing | 0% | €71 | -1.45 | -0.08 |
| Scandal Recovery | 0.38% | €567 | -0.24 | 0.04 |
| Festival Push | 0.77% | €-601 | -0.05 | -0.12 |
| Chaos Tour | 0% | €-573 | 1.01 | -0.12 |
| Cult Hypergrowth | 0.39% | €-283 | 0.27 | 0.03 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -0.39% | €-46 | -0.96 | 0.11 |
| Early Game Probe (Fame 0–50) | 0.39% | €-29 | -0.23 | 0 |
| Mid Game Probe (Fame 60–150) | 0% | €629 | -2.17 | 0.06 |
| Late Game Probe (Fame 175+) | 0% | €1.089 | -2.47 | 0.04 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 26.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €137.978 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.11 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
