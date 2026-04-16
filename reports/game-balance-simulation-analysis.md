# Game Balance Simulation – Analyse

Erstellt am: 2026-04-16T09:33:34.741Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €70 |
| Modifier-Kosten | Catering €20, Promo €30, Merch €30, Soundcheck €50, Guestlist €60 |
| Venue-Fame-Gates | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |
| Fame-Level-Skala | Level = floor(fame / 100) |

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
| Upgrade-Katalog | 60 |
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
| Baseline Touring | €500 | 0 | €62.179 | 62% | 0.06 | 7.9% | 2893 | 28 | 56 | 1.17 | 54.72 | 15.17 | 17.31% | €2.934 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Bootstrap Struggle | €500 | 0 | €52 | 12.3% | 0.11 | 0% | 751 | 7 | 62 | 0.09 | 1.17 | 0.07 | 99.62% | €702 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €15.913 | 34.3% | 0.06 | 6.7% | 1433 | 14 | 63 | 0.6 | 19.12 | 5.74 | 39.23% | €2.736 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Scandal Recovery | €500 | 0 | €1.821 | 9.8% | 0.08 | 4.3% | 872 | 8 | 63 | 0.27 | 3.15 | 0.85 | 90% | €1.947 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €2.196 | 12.4% | 0.06 | 5.9% | 1165 | 11 | 65 | 0.05 | 4.19 | 1.12 | 88.08% | €2.438 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €11.706 | 34.1% | 0.07 | 6.2% | 1488 | 14 | 61 | 0.34 | 16.99 | 5.33 | 50% | €2.502 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Cult Hypergrowth | €500 | 0 | €22.872 | 38.8% | 0.06 | 7.1% | 1172 | 11 | 60 | -0.01 | 23.85 | 7.06 | 20% | €2.737 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €6.306 | 9.8% | 0.06 | 5.5% | 864 | 8 | 60 | 0.47 | 4.93 | 1.05 | 45.77% | €2.218 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €19.746 | 22.6% | 0.07 | 5.6% | 1131 | 11 | 56 | 1.02 | 15.26 | 4.56 | 1.92% | €2.531 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €28.071 | 48.1% | 0.06 | 7.1% | 2283 | 22 | 55 | 1.2 | 23.98 | 5.93 | 1.92% | €2.914 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €71.577 | €497 | €2.934 | 16.73 | 4.25 | 13.17 | 9.48 | 10.91 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €775 | €153 | €702 | 0 | 0.02 | 0.11 | 0.02 | 0.08 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €23.527 | €360 | €2.736 | 6.51 | 2.24 | 6.37 | 3.32 | 5.06 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €3.164 | €184 | €1.947 | 0.73 | 0.38 | 0.82 | 0.41 | 0.78 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €4.567 | €236 | €2.438 | 1.15 | 0.57 | 1.73 | 0.59 | 1.07 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €17.528 | €332 | €2.502 | 5.45 | 1.98 | 5.38 | 2.74 | 4.43 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €31.153 | €375 | €2.737 | 8.23 | 2.88 | 7.14 | 4.21 | 5.96 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €7.043 | €316 | €2.218 | 0.83 | 0.46 | 0.9 | 0.65 | 1.03 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €22.504 | €1.328 | €2.531 | 4.08 | 1.71 | 3.93 | 2.72 | 3.94 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.957 | €4.894 | €2.914 | 6.13 | 1.82 | 5.83 | 4.05 | 4.28 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €26.578 | €29.626 | €46.433 | €62.179 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €46 | €66 | €60 | €52 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €7.406 | €12.532 | €15.710 | €15.913 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €986 | €1.351 | €1.665 | €1.821 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €1.554 | €2.019 | €2.049 | €2.196 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €5.627 | €9.026 | €10.719 | €11.706 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €10.386 | €17.811 | €20.261 | €22.872 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €5.519 | €0 | €0 | €6.306 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.738 | €18.458 | €0 | €19.746 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €29.234 | €0 | €0 | €28.071 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.934 | €138 | 21.3× | 8.52 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €702 | €68 | 10.3× | 35.61 | 2.14 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.736 | €122 | 22.4× | 9.14 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.947 | €100 | 19.5× | 12.84 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.438 | €105 | 23.2× | 10.26 | 0.62 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.502 | €119 | 21.1× | 9.99 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.737 | €122 | 22.3× | 9.14 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.218 | €102 | 21.7× | 11.27 | 0.68 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.531 | €119 | 21.2× | 9.88 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.914 | €136 | 21.4× | 8.58 | 0.51 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7 | 59 | 13.8% | 76.8% | 9.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 5.7 | 67 | 4.6% | 58.7% | 36.6% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Aggressive Marketing | 152 | 6.7 | 60 | 12.3% | 72.9% | 14.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.6 | 61 | 13.9% | 66.7% | 19.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 69 | 3.6% | 53.5% | 42.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 60 | 13% | 72.6% | 14.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.1 | 58 | 17.2% | 72.8% | 10% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 23.7% | 61.9% | 14.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.3 | 57 | 20.3% | 72.4% | 7.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.9 | 59 | 15.1% | 73.6% | 11.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 56 | 15.17 | 3.36 | 1.21 | 7.52 | 12.71 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 62 | 0.07 | 0.01 | 0 | 0.77 | 1.06 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 5.74 | 1.67 | 1.05 | 5.48 | 9.01 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 63 | 0.85 | 0.29 | 0.23 | 1.52 | 2.38 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 65 | 1.12 | 0.45 | 0.31 | 1.92 | 2.83 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 61 | 5.33 | 1.55 | 0.91 | 5.15 | 8.27 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Cult Hypergrowth | 60 | 7.06 | 2.23 | 1.34 | 7.17 | 11.43 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 60 | 1.05 | 0.37 | 0.14 | 1.43 | 2.18 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 56 | 4.56 | 1.27 | 0.68 | 4.12 | 7.16 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 55 | 5.93 | 1.38 | 0.42 | 3.32 | 5.35 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.24 | 1.28 | 1.23 | 0.81 | 8.57 | 19.96 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.05 | 0.17 | 0.17 | 0.04 | 0.65 | 0.15 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.32 | 1.6 | 1.53 | 0.38 | 6.01 | 10.9 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.12 | 0.54 | 0.42 | 0.1 | 1.73 | 1.48 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.1 | 0.38 | 0.35 | 0.07 | 1.99 | 2.78 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.42 | 2.4 | 2.13 | 0.76 | 5.36 | 9.27 | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | 0.33 | 1.84 | 1.6 | 0.56 | 7.65 | 12.6 | ✅ Gesunde Event-Verteilung. |
| Early Game Probe (Fame 0–50) | 0.03 | 0.2 | 0.17 | 0.05 | 1.5 | 1.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.18 | 0.92 | 0.75 | 0.18 | 4.93 | 7.6 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.13 | 0.9 | 0.68 | 0.56 | 3.86 | 8.89 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 54.72 | 54.72 | 54.72 | 164.16 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 1.17 | 1.17 | 1.17 | 3.51 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 19.12 | 19.12 | 19.12 | 57.36 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 3.15 | 3.15 | 3.15 | 9.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 4.19 | 4.19 | 4.19 | 12.57 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 16.99 | 16.99 | 16.99 | 50.97 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 23.85 | 23.85 | 23.85 | 71.55 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 4.93 | 4.93 | 4.93 | 14.79 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.26 | 15.26 | 15.26 | 45.78 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 23.98 | 23.98 | 23.98 | 71.94 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €62.179 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 2893 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 99.62% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Baseline Touring** | €2.934 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €71.577 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 54.72 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 5.71 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 17.31% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €62.179 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 790 – 1200 | 287.9 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 99.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €52 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 650 – 1050 | 676.7 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 39.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €15.913 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 790 – 1200 | 346.58 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 90% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €1.821 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Fame-Fortschritt/Gig | 720 – 1120 | 392.98 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 10% | 88.08% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €2.196 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Festival Push | Fame-Fortschritt/Gig | 790 – 1250 | 615.04 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 50% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €11.706 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 760 – 1200 | 350.67 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 20% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €22.872 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 820 – 1300 | 271.55 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 99.62% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €62.179 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 5.71 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Insolvenzrate) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Insolvenzrate) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Insolvenzrate) · Festival Push (Endgeld) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Insolvenzrate) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Insolvenzrate) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
