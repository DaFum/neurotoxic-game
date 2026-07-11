# Game Balance Simulation – Analyse

Erstellt am: 2026-07-11T12:46:04.096Z

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
| Baseline Touring | €500 | 0 | €137.600 | 50.8% | 0.04 | 7.1% | 15510 | 8 | 61 | 13.03 | 58.97 | 16.03 | 0% | €3.197 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €13.214 | 20.5% | 0.06 | 3.7% | 1025 | 2 | 58 | 1.45 | 9.38 | 4.31 | 25.77% | €2.534 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €53.909 | 54% | 0.04 | 7.1% | 2759 | 3 | 61 | 6.59 | 28.72 | 8.14 | 0.38% | €3.212 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €26.978 | 30.3% | 0.05 | 4.6% | 1759 | 2 | 60 | 3.94 | 18.19 | 6.5 | 1.54% | €2.680 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €28.035 | 40.9% | 0.05 | 6% | 2077 | 3 | 64 | 4.03 | 18.52 | 6.18 | 1.54% | €2.988 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €39.030 | 55.8% | 0.05 | 5.7% | 2855 | 3 | 63 | 6.47 | 28.42 | 8.58 | 0% | €2.824 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €55.630 | 55% | 0.04 | 6.1% | 2727 | 3 | 62 | 5.87 | 28.59 | 8.27 | 0.38% | €3.255 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €34.956 | 58.1% | 0.05 | 5.1% | 2905 | 3 | 62 | 0 | 28.53 | 8.38 | 0.38% | €2.841 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €38.806 | 57.1% | 0.05 | 4.8% | 2563 | 3 | 63 | 15.03 | 28.21 | 8.79 | 0% | €2.797 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €18.079 | 4.2% | 0.04 | 4.3% | 2031 | 3 | 55 | 4.95 | 8.09 | 1.87 | 0.38% | €2.683 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.102 | 24.4% | 0.05 | 5.1% | 2363 | 3 | 61 | 5.26 | 15.43 | 4.57 | 0% | €2.937 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €50.830 | 52.1% | 0.04 | 6.8% | 7555 | 6 | 59 | 8.91 | 24.25 | 5.75 | 0% | €3.284 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €138.179 | €499 | €3.197 | 17.82 | 4.65 | 21.79 | 8.37 | 11.74 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.210 | €188 | €2.534 | 2.7 | 1.83 | 6.24 | 0.97 | 3.97 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €55.540 | €412 | €3.212 | 10.26 | 3.62 | 16.75 | 4.23 | 7.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €33.195 | €311 | €2.680 | 6.21 | 2.85 | 11.04 | 2.45 | 6.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.346 | €316 | €2.988 | 6.04 | 2.92 | 12.56 | 2.59 | 5.85 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €45.117 | €411 | €2.824 | 10.19 | 3.57 | 16.18 | 3.83 | 7.67 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €57.012 | €410 | €3.255 | 10.43 | 3.62 | 16.03 | 4.15 | 7.16 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.071 | €407 | €2.841 | 0 | 0 | 15.96 | 4.04 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.063 | €364 | €2.797 | 9.59 | 3.47 | 15.7 | 4.03 | 7.79 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.520 | €405 | €2.683 | 1.44 | 0.8 | 3.28 | 0.86 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.907 | €1.384 | €2.937 | 4.67 | 1.85 | 8.07 | 2.06 | 3.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €53.050 | €4.949 | €3.284 | 6.46 | 1.81 | 9.17 | 3.33 | 4.33 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €32.053 | €62.314 | €104.262 | €137.600 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.111 | €7.303 | €10.776 | €13.214 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.630 | €28.180 | €36.884 | €53.909 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.167 | €18.542 | €23.679 | €26.978 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.157 | €20.987 | €25.294 | €28.035 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.668 | €27.103 | €28.782 | €39.030 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.679 | €27.800 | €38.064 | €55.630 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.713 | €26.617 | €27.419 | €34.956 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.552 | €26.289 | €27.314 | €38.806 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.956 | €0 | €0 | €18.079 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.954 | €28.180 | €0 | €29.102 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.730 | €0 | €0 | €50.830 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.197 | €96 | 33.1× | 7.82 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.534 | €75 | 34× | 9.86 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.212 | €89 | 35.9× | 7.78 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.680 | €84 | 32.1× | 9.33 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.988 | €85 | 35.2× | 8.37 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.824 | €89 | 31.8× | 8.85 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.255 | €90 | 36.3× | 7.68 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.841 | €89 | 32.1× | 8.8 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.797 | €88 | 31.9× | 8.94 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.683 | €74 | 36.1× | 9.32 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.937 | €86 | 34× | 8.51 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.284 | €94 | 34.8× | 7.61 | 0.46 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.6 | 61 | 11.2% | 72% | 16.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 22.9% | 68.6% | 8.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.7% | 69.2% | 19.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 18.7% | 71.5% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.8% | 56.7% | 39.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.2% | 68.6% | 19.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.4% | 69.8% | 14.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.5% | 70.7% | 13.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7 | 59 | 18.4% | 69.7% | 11.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 22.1% | 67.2% | 10.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.1 | 58 | 18.6% | 72.3% | 9.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.6 | 61 | 12.7% | 70.5% | 16.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 61 | 16.03 | 3.53 | 1.27 | 8.12 | 10.31 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 4.31 | 1.38 | 1.13 | 5.97 | 1.75 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 61 | 8.14 | 2.84 | 1.76 | 7.93 | 4.98 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 6.5 | 2.2 | 1.53 | 8.3 | 3.23 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 64 | 6.18 | 2.21 | 1.69 | 8.08 | 3.43 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 63 | 8.58 | 2.83 | 1.62 | 7.96 | 4.96 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 62 | 8.27 | 2.79 | 1.63 | 8.47 | 5.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.38 | 0 | 0 | 8.12 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 63 | 8.79 | 2.71 | 1.61 | 8.39 | 5.21 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.87 | 0.62 | 0.23 | 2.21 | 1.43 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 61 | 4.57 | 1.41 | 0.76 | 4.25 | 2.56 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 59 | 5.75 | 1.43 | 0.5 | 3.18 | 4.2 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.83 | 1.53 | 1.78 | 0.79 | 9.15 | 30.15 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1 | 1.82 | 1.73 | 0.18 | 7 | 11.29 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.55 | 2.78 | 2.74 | 0.59 | 8.8 | 24.71 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.1 | 3.27 | 3.33 | 0.53 | 8.78 | 18.39 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.87 | 1.79 | 1.75 | 0.26 | 8.95 | 19.86 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.5 | 4.39 | 4.17 | 1.04 | 9.09 | 24.13 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.6 | 2.48 | 2.41 | 0.57 | 9.07 | 23.88 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.27 | 2.39 | 2.29 | 0.53 | 9.2 | 23.67 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.38 | 2.18 | 2.36 | 0.5 | 9.19 | 23.53 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.39 | 0.34 | 0.1 | 2.35 | 4.99 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.5 | 1.03 | 1.02 | 0.26 | 4.72 | 12.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.53 | 0.93 | 0.81 | 0.48 | 3.59 | 12.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.97 | 58.97 | 58.97 | 176.91 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.38 | 9.38 | 9.38 | 28.14 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.72 | 28.72 | 28.72 | 86.16 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.19 | 18.19 | 18.19 | 54.57 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.52 | 18.52 | 18.52 | 55.56 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.42 | 28.42 | 28.42 | 85.26 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.59 | 28.59 | 28.59 | 85.77 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.53 | 28.53 | 28.53 | 85.59 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.21 | 28.21 | 28.21 | 84.63 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.09 | 8.09 | 8.09 | 24.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.43 | 15.43 | 15.43 | 46.29 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.25 | 24.25 | 24.25 | 72.75 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €137.600 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15510 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 25.77% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €3.284 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €138.179 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.97 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.10 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €137.600 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 714.96 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 25.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €13.214 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 674.97 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €53.909 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 719.46 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €26.978 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 684.67 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €28.035 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 786.11 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €39.030 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 720.02 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €55.630 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 704.35 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-153 | 2.65 | 0.06 |
| Bootstrap Struggle | -2.31% | €623 | 4.95 | 0.17 |
| Aggressive Marketing | 0% | €1.142 | 1.99 | 0.02 |
| Scandal Recovery | -0.38% | €987 | 4.89 | 0.17 |
| Festival Push | 0% | €-95 | 4.4 | 0.1 |
| Chaos Tour | 0% | €-1.565 | 5.45 | 0.02 |
| Cult Hypergrowth | -0.39% | €135 | 1.56 | 0.09 |
| No Social (Fame 0-50) | 0% | €-296 | 1.8 | -0.02 |
| High Controversy | -0.38% | €907 | 2.36 | 0.13 |
| Early Game Probe (Fame 0–50) | 0% | €37 | 1.59 | 0 |
| Mid Game Probe (Fame 60–150) | -0.38% | €-319 | 2.38 | 0.01 |
| Late Game Probe (Fame 175+) | 0% | €1 | 0.06 | 0 |

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
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €137.600 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.10 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
