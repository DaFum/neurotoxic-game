# Game Balance Simulation – Analyse

Erstellt am: 2026-05-11T13:14:01.232Z

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

Shop-only kosten **14630 Fame**, mit Legacy-Upgrades **23730 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 70 | 800 | 7 | 19 | 29 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |
| 85 | 950 | 6 | 16 | 24 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |
| 100 | 1100 | 5 | 14 | 21 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 122 |
| Brand Deals | 54 |
| Post Options | 32 |
| Contraband-Items | 27 |
| Upgrade-Katalog | 62 |
| Social Platforms | 4 |
| Trends | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 23 | travel |
| band | 40 | random, post_gig, travel |
| gig | 19 | gig_mid, gig_intro |
| financial | 27 | random, post_gig |
| special | 13 | special_location, travel, post_gig, random |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €139.560 | 51% | 0.05 | 9.2% | 15399 | 8 | 62 | 0.77 | 59.37 | 15.63 | 0% | €3.211 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €12.141 | 25.2% | 0.07 | 5.3% | 926 | 2 | 59 | 0.55 | 9.16 | 4.09 | 28.46% | €2.494 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €51.760 | 56.1% | 0.05 | 8.6% | 2825 | 3 | 63 | 0.43 | 29 | 8 | 0% | €3.110 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €25.723 | 32.9% | 0.06 | 6.3% | 1792 | 2 | 60 | 0.29 | 17.82 | 6.27 | 4.23% | €2.687 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €28.073 | 41.3% | 0.06 | 8% | 2135 | 3 | 64 | 0.89 | 18.63 | 5.91 | 1.92% | €2.973 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €41.247 | 55.7% | 0.06 | 7.3% | 2680 | 3 | 62 | 0.4 | 28.47 | 8.43 | 0.38% | €2.850 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €54.621 | 54.2% | 0.05 | 8.6% | 2932 | 3 | 61 | 0.23 | 28.8 | 8.2 | 0% | €3.169 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €19.019 | 3.3% | 0.05 | 7.6% | 1986 | 3 | 57 | 0.83 | 8.07 | 1.9 | 0.38% | €2.778 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.178 | 26.8% | 0.06 | 8.1% | 2488 | 3 | 61 | 0.47 | 15.57 | 4.43 | 0% | €2.984 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €48.829 | 51.4% | 0.05 | 9% | 7254 | 6 | 61 | 1.05 | 24.27 | 5.73 | 0% | €3.226 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €140.387 | €500 | €3.211 | 18.16 | 4.6 | 22.04 | 10.12 | 11.83 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €14.367 | €179 | €2.494 | 2.73 | 1.77 | 6.33 | 1.2 | 3.84 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €54.147 | €412 | €3.110 | 10.45 | 3.53 | 16.71 | 5.01 | 7.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €31.743 | €297 | €2.687 | 6.08 | 2.81 | 10.95 | 2.99 | 5.91 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €36.362 | €317 | €2.973 | 6.8 | 2.95 | 12.65 | 3.13 | 5.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €47.102 | €407 | €2.850 | 10.27 | 3.39 | 16.35 | 4.57 | 7.61 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €56.661 | €412 | €3.169 | 10.48 | 3.6 | 16.17 | 4.98 | 7.28 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €19.281 | €406 | €2.778 | 1.56 | 0.81 | 3.24 | 1.03 | 1.89 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €36.380 | €1.370 | €2.984 | 4.14 | 1.72 | 8.08 | 2.5 | 3.94 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €51.543 | €4.980 | €3.226 | 6.2 | 1.82 | 9.32 | 4 | 4.35 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €32.465 | €62.205 | €104.421 | €139.560 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.549 | €6.728 | €9.836 | €12.141 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €17.779 | €28.118 | €35.140 | €51.760 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €9.625 | €18.073 | €21.464 | €25.723 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.076 | €21.188 | €25.009 | €28.073 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €16.057 | €26.798 | €31.083 | €41.247 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €17.965 | €28.330 | €38.037 | €54.621 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €16.921 | €0 | €0 | €19.019 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €18.411 | €27.713 | €0 | €29.178 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.485 | €0 | €0 | €48.829 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.211 | €123 | 26.1× | 7.79 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.494 | €97 | 25.7× | 10.03 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.110 | €116 | 26.8× | 8.04 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.687 | €111 | 24.3× | 9.31 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.973 | €112 | 26.6× | 8.41 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.850 | €116 | 24.7× | 8.77 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.169 | €116 | 27.2× | 7.89 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.778 | €103 | 27× | 9 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.984 | €114 | 26.1× | 8.38 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.226 | €122 | 26.4× | 7.75 | 0.47 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.6 | 61 | 11% | 71.6% | 17.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.2 | 57 | 21.2% | 68.9% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.2% | 69% | 19.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.1 | 58 | 19% | 71.2% | 9.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 3.9% | 56.8% | 39.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.4% | 70% | 17.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 60 | 15.3% | 71.3% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 22.2% | 67.5% | 10.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.1 | 58 | 19.1% | 71.1% | 9.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.6 | 61 | 12.3% | 69.8% | 17.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 62 | 15.63 | 3.6 | 1.42 | 8.54 | 13.9 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 4.09 | 1.33 | 1.08 | 6.32 | 10.19 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 8 | 2.75 | 1.54 | 8.13 | 13.55 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 6.27 | 2.16 | 1.59 | 7.9 | 12.9 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 64 | 5.91 | 2.32 | 1.62 | 7.9 | 13.13 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 62 | 8.43 | 2.68 | 1.49 | 8.17 | 13.21 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.2 | 2.81 | 1.68 | 8.1 | 13.83 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 57 | 1.9 | 0.67 | 0.23 | 2.2 | 3.48 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 61 | 4.43 | 1.27 | 0.68 | 4.23 | 7.16 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 61 | 5.73 | 1.39 | 0.47 | 3.33 | 5.38 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.26 | 1.49 | 1.33 | 0.78 | 8.85 | 30.16 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.32 | 1.47 | 1.49 | 0.18 | 6.68 | 10.84 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.52 | 2.45 | 2.31 | 0.6 | 9.05 | 24.13 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.62 | 2.92 | 2.5 | 0.58 | 8.95 | 17.59 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.32 | 1.58 | 1.45 | 0.28 | 8.82 | 19.63 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.83 | 3.87 | 3.44 | 1.12 | 9.01 | 23.6 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.42 | 2.28 | 1.88 | 0.63 | 8.92 | 23.77 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.06 | 0.3 | 0.28 | 0.1 | 2.47 | 4.98 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.18 | 0.86 | 0.79 | 0.19 | 5.02 | 12.17 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.13 | 0.82 | 0.76 | 0.48 | 3.85 | 12.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 59.37 | 59.37 | 59.37 | 178.11 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.16 | 9.16 | 9.16 | 27.48 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29 | 29 | 29 | 87 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 17.82 | 17.82 | 17.82 | 53.46 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.63 | 18.63 | 18.63 | 55.89 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.47 | 28.47 | 28.47 | 85.41 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.8 | 28.8 | 28.8 | 86.4 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.07 | 8.07 | 8.07 | 24.21 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.57 | 15.57 | 15.57 | 46.71 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.27 | 24.27 | 24.27 | 72.81 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €139.560 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15399 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 28.46% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €3.226 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €140.387 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 59.37 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.25 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €139.560 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 717.85 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 28.46% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €12.141 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 678.73 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €51.760 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 725.18 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €25.723 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 687.12 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €28.073 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 785.16 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €41.247 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 717.83 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €54.621 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 702.22 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €0 | 0 | 0 |
| Bootstrap Struggle | 0% | €0 | 0 | 0 |
| Aggressive Marketing | 0% | €0 | 0 | 0 |
| Scandal Recovery | 0% | €0 | 0 | 0 |
| Festival Push | 0% | €0 | 0 | 0 |
| Chaos Tour | 0% | €0 | 0 | 0 |
| Cult Hypergrowth | 0% | €0 | 0 | 0 |
| Early Game Probe (Fame 0–50) | 0% | €0 | 0 | 0 |
| Mid Game Probe (Fame 60–150) | 0% | €0 | 0 | 0 |
| Late Game Probe (Fame 175+) | 0% | €0 | 0 | 0 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 28.46% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €139.560 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.25 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
