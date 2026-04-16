# Game Balance Simulation – Analyse

Erstellt am: 2026-04-16T08:07:39.027Z

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
| Baseline Touring | €500 | 0 | €1.663 | 80.8% | 0.07 | 8.8% | 6540 | 65 | 58 | 0.43 | 32.7 | 8.86 | 94.23% | €3.150 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Bootstrap Struggle | €500 | 0 | €48 | 12.2% | 0.11 | 0% | 752 | 7 | 62 | 0.09 | 1.15 | 0.06 | 99.62% | €689 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €3.308 | 43.3% | 0.06 | 7.8% | 2845 | 28 | 63 | -0.22 | 13.65 | 3.92 | 83.85% | €3.055 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Scandal Recovery | €500 | 0 | €930 | 10.3% | 0.07 | 4.8% | 951 | 9 | 63 | 0.1 | 2.86 | 0.72 | 94.23% | €2.092 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €0 | 12.4% | 0.06 | 6.2% | 1340 | 13 | 64 | 0.29 | 2.41 | 0.42 | 100% | €2.323 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €2.348 | 43.1% | 0.06 | 7.4% | 2554 | 25 | 61 | 0.47 | 11.73 | 3.38 | 86.92% | €2.825 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Cult Hypergrowth | €500 | 0 | €7.436 | 51.8% | 0.06 | 8.9% | 3047 | 30 | 61 | 0.08 | 19.33 | 5.68 | 64.23% | €3.162 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €6.655 | 9.4% | 0.06 | 7% | 1172 | 11 | 60 | 0.38 | 4.9 | 1.03 | 46.92% | €2.608 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €15.014 | 32.4% | 0.06 | 7.7% | 2303 | 23 | 58 | 0.95 | 14.45 | 4.21 | 25% | €2.955 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €16.062 | 52.3% | 0.06 | 8.3% | 5076 | 50 | 54 | 0.9 | 22.64 | 5.61 | 27.69% | €3.189 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €32.020 | €491 | €3.150 | 8.86 | 2.42 | 4.05 | 6.36 | 6.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €772 | €153 | €689 | 0 | 0.02 | 0.11 | 0.02 | 0.07 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €14.720 | €352 | €3.055 | 4.21 | 1.57 | 2.93 | 2.62 | 3.48 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €2.938 | €183 | €2.092 | 0.64 | 0.33 | 0.66 | 0.38 | 0.67 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €2.842 | €229 | €2.323 | 0.28 | 0.21 | 0.55 | 0.28 | 0.43 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €11.943 | €324 | €2.825 | 3.65 | 1.37 | 2.4 | 2.05 | 2.91 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €23.155 | €363 | €3.162 | 6.82 | 2.37 | 4.25 | 3.88 | 4.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €7.550 | €315 | €2.608 | 0.87 | 0.49 | 0.72 | 0.68 | 1.03 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €21.102 | €1.247 | €2.955 | 4.18 | 1.7 | 3.08 | 2.8 | 3.71 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €32.820 | €4.334 | €3.189 | 5.8 | 1.6 | 2.95 | 4.24 | 4.08 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €22.695 | €10.869 | €2.961 | €1.663 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €46 | €49 | €58 | €48 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €6.571 | €7.629 | €4.762 | €3.308 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €947 | €1.277 | €1.260 | €930 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €915 | €335 | €16 | €0 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €5.302 | €5.407 | €3.538 | €2.348 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €10.512 | €13.771 | €9.928 | €7.436 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €5.749 | €0 | €0 | €6.655 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.919 | €14.317 | €0 | €15.014 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €23.791 | €0 | €0 | €16.062 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.150 | €160 | 19.6× | 7.94 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €689 | €68 | 10.1× | 36.27 | 2.18 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.055 | €132 | 23.2× | 8.18 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.092 | €102 | 20.6× | 11.95 | 0.72 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.323 | €95 | 24.4× | 10.76 | 0.65 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.825 | €127 | 22.3× | 8.85 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.162 | €135 | 23.4× | 7.91 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.608 | €108 | 24.2× | 9.58 | 0.58 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.955 | €128 | 23.1× | 8.46 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.189 | €158 | 20.2× | 7.84 | 0.47 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 16.6% | 74% | 9.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 5.6 | 67 | 4.3% | 58.7% | 37% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Aggressive Marketing | 152 | 6.8 | 60 | 14% | 71.5% | 14.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.6 | 61 | 16.3% | 63.4% | 20.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.1 | 70 | 3% | 45.3% | 51.7% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.9 | 60 | 15.6% | 71.3% | 13.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.1 | 58 | 18.5% | 72.6% | 8.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 23.5% | 62.2% | 14.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 57 | 20.3% | 71.8% | 8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 7 | 59 | 16.1% | 73% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 8.86 | 1.89 | 0.66 | 4.55 | 7.06 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 62 | 0.06 | 0.01 | 0 | 0.76 | 1.05 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 3.92 | 1.14 | 0.67 | 3.95 | 6.6 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 63 | 0.72 | 0.25 | 0.18 | 1.4 | 2.18 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 64 | 0.42 | 0.16 | 0.08 | 1.09 | 1.74 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 61 | 3.38 | 1.06 | 0.58 | 3.47 | 5.81 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Cult Hypergrowth | 61 | 5.68 | 1.84 | 1.04 | 5.58 | 9.52 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Early Game Probe (Fame 0–50) | 60 | 1.03 | 0.4 | 0.15 | 1.37 | 2.19 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 58 | 4.21 | 1.3 | 0.69 | 3.9 | 6.67 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 54 | 5.61 | 1.26 | 0.4 | 3.17 | 5.2 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.13 | 0.74 | 0.83 | 0.41 | 5.28 | 8.22 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.05 | 0.17 | 0.17 | 0.04 | 0.63 | 0.14 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.26 | 1.23 | 1.08 | 0.32 | 4.16 | 6.13 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.1 | 0.51 | 0.42 | 0.1 | 1.58 | 1.28 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.05 | 0.22 | 0.2 | 0.04 | 1.12 | 1.01 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.28 | 1.58 | 1.48 | 0.47 | 3.8 | 5.11 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.26 | 1.54 | 1.26 | 0.45 | 6.31 | 9.16 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.03 | 0.21 | 0.17 | 0.06 | 1.53 | 1.51 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.18 | 0.84 | 0.73 | 0.18 | 4.7 | 6.75 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.1 | 0.81 | 0.73 | 0.47 | 3.53 | 6.11 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 32.7 | 32.7 | 32.7 | 98.1 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 1.15 | 1.15 | 1.15 | 3.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 13.65 | 13.65 | 13.65 | 40.95 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 2.86 | 2.86 | 2.86 | 8.58 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 2.41 | 2.41 | 2.41 | 7.23 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 11.73 | 11.73 | 11.73 | 35.19 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 19.33 | 19.33 | 19.33 | 57.99 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 4.9 | 4.9 | 4.9 | 14.7 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 14.45 | 14.45 | 14.45 | 43.35 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 22.64 | 22.64 | 22.64 | 67.92 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €16.062 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 6540 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Festival Push** | 100% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €3.189 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €32.820 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 32.7 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 3.81 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 94.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €1.663 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 790 – 1200 | 273.39 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 99.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €48 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 650 – 1050 | 681.12 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 83.85% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €3.308 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 790 – 1200 | 334.86 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 94.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €930 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Fame-Fortschritt/Gig | 720 – 1120 | 406.5 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 10% | 100% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €0 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Festival Push | Fame-Fortschritt/Gig | 790 – 1250 | 671.43 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 86.92% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €2.348 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Chaos Tour | Fame-Fortschritt/Gig | 760 – 1200 | 330.43 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 64.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €7.436 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 820 – 1300 | 266.67 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

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

- Höchstes Risiko: **Festival Push** mit 100% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €16.062 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 3.81 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Insolvenzrate) · Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Insolvenzrate) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Insolvenzrate) · Festival Push (Endgeld) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Insolvenzrate) · Chaos Tour (Endgeld) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Insolvenzrate) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
