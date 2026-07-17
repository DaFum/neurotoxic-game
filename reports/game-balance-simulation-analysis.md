# Game Balance Simulation – Analyse

Erstellt am: 2026-07-17T14:25:25.290Z

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
| Baseline Touring | €500 | 0 | €77.487 | 56.8% | 0.07 | 3.9% | 15395 | 8 | 59 | 16.01 | 58.91 | 16.09 | 0% | €2.047 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €13.122 | 21% | 0.07 | 2.5% | 1147 | 2 | 58 | 1.59 | 11.31 | 5.25 | 11.92% | €2.172 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €32.142 | 54.8% | 0.06 | 3.9% | 2761 | 3 | 65 | 6.58 | 28.65 | 8.19 | 0.77% | €2.304 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €23.566 | 22.4% | 0.07 | 3.2% | 1754 | 2 | 59 | 3.83 | 18.27 | 6.63 | 1.15% | €2.156 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €25.299 | 28.9% | 0.06 | 3.8% | 2191 | 3 | 62 | 4.33 | 18.5 | 6.15 | 1.92% | €2.375 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €27.887 | 45.2% | 0.07 | 3.5% | 2712 | 3 | 63 | 6.8 | 28.44 | 8.56 | 0% | €2.058 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €34.328 | 55.2% | 0.06 | 3.6% | 2774 | 3 | 63 | 5.65 | 28.68 | 8.32 | 0% | €2.364 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €26.693 | 34.7% | 0.07 | 2.9% | 2883 | 3 | 63 | 0 | 28.44 | 8.56 | 0% | €2.014 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €27.140 | 45% | 0.07 | 2.5% | 2662 | 3 | 63 | 12.8 | 28.02 | 8.7 | 1.15% | €1.997 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €13.061 | 5.2% | 0.06 | 2.8% | 2037 | 3 | 56 | 4.63 | 8.11 | 1.89 | 0% | €2.011 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €25.217 | 12.6% | 0.06 | 2.3% | 2379 | 3 | 58 | 6.11 | 15.47 | 4.48 | 0.38% | €2.214 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.332 | 46.9% | 0.06 | 3.5% | 7523 | 6 | 61 | 8.45 | 24.1 | 5.89 | 0.38% | €2.158 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €78.127 | €498 | €2.047 | 17.99 | 4.68 | 21.63 | 8.3 | 11.79 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €14.820 | €218 | €2.172 | 3.55 | 2.28 | 7.69 | 1.23 | 4.89 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €41.209 | €413 | €2.304 | 9.96 | 3.61 | 16.43 | 4.18 | 7.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €26.613 | €323 | €2.156 | 6.22 | 2.9 | 10.73 | 2.51 | 6.11 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €31.329 | €325 | €2.375 | 6.32 | 3.05 | 12.17 | 2.56 | 5.83 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €37.493 | €414 | €2.058 | 10.43 | 3.53 | 15.77 | 3.82 | 7.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €41.931 | €414 | €2.364 | 10.5 | 3.65 | 15.96 | 4.11 | 7.19 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €34.820 | €412 | €2.014 | 0 | 0 | 15.49 | 4.07 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €36.950 | €398 | €1.997 | 9.97 | 3.44 | 15.15 | 4 | 7.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.424 | €413 | €2.011 | 1.43 | 0.77 | 3.28 | 0.88 | 1.89 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €27.578 | €1.380 | €2.214 | 4.47 | 1.81 | 7.73 | 2.1 | 3.99 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.903 | €4.942 | €2.158 | 6.27 | 1.8 | 8.67 | 3.28 | 4.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €27.296 | €31.317 | €56.064 | €77.487 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.961 | €7.020 | €10.211 | €13.122 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €14.423 | €25.954 | €27.084 | €32.142 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.062 | €14.257 | €19.003 | €23.566 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.243 | €16.786 | €22.135 | €25.299 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €11.831 | €21.845 | €26.329 | €27.887 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.663 | €26.307 | €27.705 | €34.328 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.958 | €19.897 | €25.414 | €26.693 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €9.188 | €19.688 | €26.236 | €27.140 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €11.623 | N/A | N/A | €13.061 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €14.232 | €23.935 | N/A | €25.217 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €29.639 | N/A | N/A | €29.332 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.047 | €96 | 21.3× | 12.21 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.172 | €72 | 30.4× | 11.51 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.304 | €89 | 26× | 10.85 | 0.65 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.156 | €81 | 26.5× | 11.6 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.375 | €84 | 28.4× | 10.52 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.058 | €87 | 23.5× | 12.15 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.364 | €89 | 26.6× | 10.58 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.014 | €87 | 23.1× | 12.41 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.997 | €85 | 23.4× | 12.52 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.011 | €70 | 28.6× | 12.43 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.214 | €86 | 25.6× | 11.29 | 0.68 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.158 | €94 | 22.9× | 11.58 | 0.69 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.8% | 73.8% | 14.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 57 | 23.1% | 68.9% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.6% | 69.4% | 19% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 20% | 71% | 9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.6% | 56.5% | 39.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 61 | 13.9% | 69.3% | 16.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.1% | 70.6% | 14.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 16% | 71.7% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 19.3% | 69.2% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 21.2% | 67.6% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19.5% | 71.4% | 9.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 13.7% | 72.1% | 14.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59 | 16.09 | 3.58 | 1.34 | 8.33 | 10.81 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 5.25 | 1.76 | 1.33 | 7.43 | 1.88 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 65 | 8.19 | 2.78 | 1.82 | 8.05 | 5.02 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.63 | 2.25 | 1.62 | 8.4 | 3.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 62 | 6.15 | 2.33 | 1.73 | 8.21 | 3.37 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 63 | 8.56 | 2.74 | 1.62 | 8.07 | 5.1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 63 | 8.32 | 2.88 | 1.75 | 8.43 | 5.28 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 63 | 8.56 | 0 | 0 | 8.4 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 63 | 8.7 | 2.74 | 1.62 | 8.32 | 5 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 56 | 1.89 | 0.61 | 0.2 | 2.18 | 1.5 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 58 | 4.48 | 1.39 | 0.75 | 4.26 | 2.46 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 61 | 5.89 | 1.42 | 0.46 | 3.12 | 4.08 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.87 | 1.49 | 1.72 | 0.8 | 9.21 | 30.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.26 | 2.11 | 2.05 | 0.26 | 8.36 | 14.13 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Aggressive Marketing | 1.46 | 2.87 | 2.9 | 0.69 | 8.88 | 24.57 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.07 | 3.53 | 3.32 | 0.55 | 8.92 | 18.38 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.97 | 1.62 | 1.72 | 0.35 | 9.11 | 19.68 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.38 | 4.24 | 4.33 | 1.04 | 9.28 | 23.68 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.42 | 2.47 | 2.4 | 0.59 | 8.79 | 24.1 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.22 | 2.25 | 2.36 | 0.55 | 8.94 | 23.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.36 | 2.25 | 2.25 | 0.55 | 8.95 | 22.72 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.24 | 0.41 | 0.39 | 0.1 | 2.4 | 5.17 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.55 | 1.04 | 0.99 | 0.27 | 4.77 | 12.1 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.55 | 0.92 | 0.86 | 0.53 | 3.48 | 12.28 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.91 | 58.91 | 58.91 | 176.73 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 11.31 | 11.31 | 11.31 | 33.93 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.65 | 28.65 | 28.65 | 85.95 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.27 | 18.27 | 18.27 | 54.81 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.5 | 18.5 | 18.5 | 55.5 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.44 | 28.44 | 28.44 | 85.32 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.68 | 28.68 | 28.68 | 86.04 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.44 | 28.44 | 28.44 | 85.32 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.02 | 28.02 | 28.02 | 84.06 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.11 | 8.11 | 8.11 | 24.33 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.47 | 15.47 | 15.47 | 46.41 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.1 | 24.1 | 24.1 | 72.3 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €77.487 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15395 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 11.92% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €2.375 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €78.127 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.91 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.00 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €77.487 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 800 | 709.31 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 11.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €15.000 | €13.122 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 380 – 800 | 673.28 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €32.142 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 800 | 720.84 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €23.566 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 800 | 683.35 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €25.299 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 800 | 785.85 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €27.887 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 800 | 713.26 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €34.328 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 800 | 703.42 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| High Controversy | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Early Game Probe (Fame 0–50) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Mid Game Probe (Fame 60–150) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |
| Late Game Probe (Fame 175+) | KPI Check | N/A | N/A | ⚠️ | Unkonfiguriertes Probe-Szenario |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €1.038 | -1.5 | -0.02 |
| Bootstrap Struggle | -0.77% | €460 | -1.58 | 0.09 |
| Aggressive Marketing | 0.39% | €-541 | -1.84 | 0.15 |
| Scandal Recovery | 0.77% | €-538 | -1.04 | -0.03 |
| Festival Push | 0.38% | €-543 | 0.22 | 0 |
| Chaos Tour | -0.38% | €1.263 | -2.02 | 0.24 |
| Cult Hypergrowth | 0% | €-51 | -1.48 | 0.03 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -0.39% | €1.798 | 0.39 | 0.21 |
| Early Game Probe (Fame 0–50) | 0% | €216 | 2.29 | -0.01 |
| Mid Game Probe (Fame 60–150) | 0% | €-45 | -1.08 | 0 |
| Late Game Probe (Fame 175+) | 0.38% | €-646 | 0.21 | -0.01 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 11.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €77.487 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.00 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
