# Game Balance Simulation – Analyse

Erstellt am: 2026-04-16T07:12:23.013Z

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
| Baseline Touring | €500 | 0 | €19 | 78.6% | 20.27 | 8.2% | 2911 | 29 | 56 | 0.55 | 14.95 | 3.73 | 99.62% | €3.033 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Bootstrap Struggle | €500 | 0 | €0 | 11.4% | 0.12 | 0.4% | 709 | 7 | 62 | 0.08 | 1.09 | 0.05 | 100% | €618 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €397 | 48% | 2.37 | 7.7% | 1890 | 18 | 59 | 0.76 | 7.94 | 2.05 | 97.31% | €2.880 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Scandal Recovery | €500 | 0 | €232 | 11% | 0.32 | 2.5% | 876 | 8 | 63 | 0.01 | 2.2 | 0.49 | 97.31% | €1.729 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €0 | 13.1% | 0.9 | 6% | 1222 | 12 | 64 | 0.13 | 1.98 | 0.22 | 100% | €2.157 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €554 | 43% | 1.41 | 6.7% | 1757 | 17 | 59 | 0.24 | 6.92 | 1.73 | 96.92% | €2.693 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Cult Hypergrowth | €500 | 0 | €2.250 | 57.8% | 1.28 | 8.2% | 1942 | 19 | 58 | 0.78 | 12.27 | 3.41 | 88.46% | €3.054 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €3.876 | 21.6% | 0.32 | 6.3% | 1091 | 10 | 61 | 0.2 | 4.44 | 0.89 | 60% | €2.501 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €6.775 | 56.7% | 0.77 | 7.6% | 1821 | 18 | 54 | 0.48 | 11.85 | 3.33 | 52.31% | €2.923 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €1.757 | 81.5% | 56.32 | 7.9% | 2810 | 28 | 55 | 0.27 | 12.25 | 2.76 | 88.85% | €3.066 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €13.895 | €428 | €3.033 | 3.4 | 1.04 | 0.77 | 2.34 | 2.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €712 | €137 | €618 | 0 | 0.02 | 0.01 | 0.01 | 0.07 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €8.791 | €297 | €2.880 | 1.91 | 0.89 | 0.54 | 1.19 | 1.86 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Scandal Recovery | €1.827 | €166 | €1.729 | 0.41 | 0.21 | 0.13 | 0.22 | 0.44 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €2.420 | €213 | €2.157 | 0.16 | 0.11 | 0.18 | 0.14 | 0.32 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €7.293 | €277 | €2.693 | 1.69 | 0.7 | 0.43 | 0.94 | 1.57 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Cult Hypergrowth | €14.333 | €312 | €3.054 | 3.75 | 1.51 | 0.79 | 1.98 | 2.84 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €5.500 | €297 | €2.501 | 0.71 | 0.38 | 0.45 | 0.53 | 0.92 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Mid Game Probe (Fame 60–150) | €14.697 | €893 | €2.923 | 3.06 | 1.36 | 0.96 | 1.91 | 3 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €15.165 | €1.206 | €3.066 | 2.33 | 0.8 | 0.83 | 1.83 | 1.99 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €5.105 | €1.166 | €255 | €19 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €8 | €35 | €14 | €0 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €3.444 | €2.194 | €1.345 | €397 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €527 | €573 | €312 | €232 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Festival Push | €484 | €251 | €0 | €0 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Chaos Tour | €2.756 | €2.067 | €881 | €554 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €5.937 | €5.621 | €3.563 | €2.250 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €3.335 | €0 | €0 | €3.876 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €7.776 | €6.827 | €0 | €6.775 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €4.546 | €0 | €0 | €1.757 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.033 | €61.448 | 0× | 8.24 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €618 | €65 | 9.5× | 40.48 | 2.43 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.880 | €6.781 | 0.4× | 8.68 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.729 | €511 | 3.4× | 14.46 | 0.87 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.157 | €1.909 | 1.1× | 11.59 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.693 | €3.742 | 0.7× | 9.28 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.054 | €3.863 | 0.8× | 8.18 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.501 | €767 | 3.3× | 10 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.923 | €2.189 | 1.3× | 8.55 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.066 | €172.664 | 0× | 8.15 | 0.49 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.2 | 57 | 21.1% | 69.6% | 9.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 5.7 | 67 | 4.9% | 59% | 36% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Aggressive Marketing | 152 | 6.8 | 60 | 14% | 70.3% | 15.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.4 | 62 | 14.9% | 60.8% | 24.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 4.9 | 71 | 3.3% | 39.8% | 56.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.9 | 60 | 16.8% | 67.9% | 15.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.3 | 57 | 22.8% | 69.4% | 7.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.1 | 58 | 24.1% | 60.6% | 15.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.3 | 57 | 21.8% | 71.7% | 6.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 7.1 | 58 | 19.9% | 68.7% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 56 | 3.73 | 0.82 | 0.22 | 2.06 | 3.33 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Bootstrap Struggle | 62 | 0.05 | 0.01 | 0 | 0.73 | 1.02 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 59 | 2.05 | 0.66 | 0.32 | 2.32 | 3.75 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 63 | 0.49 | 0.18 | 0.09 | 1.09 | 1.63 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 64 | 0.22 | 0.08 | 0.02 | 0.95 | 1.28 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 59 | 1.73 | 0.57 | 0.28 | 2.08 | 3.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Cult Hypergrowth | 58 | 3.41 | 1.22 | 0.69 | 3.45 | 5.85 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Early Game Probe (Fame 0–50) | 61 | 0.89 | 0.29 | 0.12 | 1.27 | 1.84 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 54 | 3.33 | 1 | 0.53 | 3.2 | 5.47 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 55 | 2.76 | 0.61 | 0.15 | 1.7 | 2.7 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.07 | 0.32 | 0.33 | 0.23 | 2.27 | 3.42 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.04 | 0.15 | 0.17 | 0.03 | 0.63 | 0.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.12 | 0.65 | 0.67 | 0.15 | 2.52 | 3.62 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.08 | 0.42 | 0.32 | 0.03 | 1.19 | 1.24 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.04 | 0.18 | 0.19 | 0.02 | 0.85 | 1.11 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.14 | 0.97 | 0.89 | 0.32 | 2.27 | 3.22 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.18 | 1 | 0.91 | 0.26 | 3.85 | 5.72 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.05 | 0.15 | 0.18 | 0.05 | 1.37 | 1.69 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.12 | 0.74 | 0.56 | 0.17 | 3.96 | 5.67 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.06 | 0.46 | 0.32 | 0.29 | 2 | 2.92 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 14.95 | 14.95 | 14.95 | 44.85 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Bootstrap Struggle | 1.09 | 1.09 | 1.09 | 3.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 7.94 | 7.94 | 7.94 | 23.82 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 2.2 | 2.2 | 2.2 | 6.6 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 1.98 | 1.98 | 1.98 | 5.94 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 6.92 | 6.92 | 6.92 | 20.76 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 12.27 | 12.27 | 12.27 | 36.81 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 4.44 | 4.44 | 4.44 | 13.32 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 11.85 | 11.85 | 11.85 | 35.55 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 12.25 | 12.25 | 12.25 | 36.75 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Mid Game Probe (Fame 60–150)** | €6.775 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 2911 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 100% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €3.066 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €15.165 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 14.95 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Cult Hypergrowth** | 2.35 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 99.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €19 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Endfame | 200 – 500 | 2911 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 100% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €0 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Endfame | 120 – 320 | 709 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 97.31% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €397 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Endfame | 200 – 430 | 1890 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 97.31% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €232 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Endfame | 150 – 360 | 876 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Festival Push | Insolvenzrate | ≤ 10% | 100% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €0 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Festival Push | Endfame | 200 – 460 | 1222 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 96.92% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €554 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Chaos Tour | Endfame | 200 – 430 | 1757 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 88.46% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €2.250 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Endfame | 200 – 380 | 1942 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 100% Insolvenzrate.
- Höchster Kapitalaufbau: **Mid Game Probe (Fame 60–150)** mit Ø €6.775 Endgeld.
- Höchste Volatilität: **Cult Hypergrowth** mit Ø 2.35 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Insolvenzrate) · Baseline Touring (Endgeld) · Baseline Touring (Endfame) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Bootstrap Struggle (Endfame) · Aggressive Marketing (Insolvenzrate) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Endfame) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Scandal Recovery (Endfame) · Festival Push (Insolvenzrate) · Festival Push (Endgeld) · Festival Push (Endfame) · Chaos Tour (Insolvenzrate) · Chaos Tour (Endgeld) · Chaos Tour (Endfame) · Cult Hypergrowth (Insolvenzrate) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Endfame)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
