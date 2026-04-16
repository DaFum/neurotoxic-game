# Game Balance Simulation – Analyse

Erstellt am: 2026-04-16T07:28:35.424Z

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
| Baseline Touring | €500 | 0 | €4.025 | 78.8% | 0.06 | 9.2% | 6394 | 63 | 58 | 0.43 | 34.79 | 9.64 | 89.62% | €3.189 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Bootstrap Struggle | €500 | 0 | €106 | 12.2% | 0.1 | 1.3% | 760 | 7 | 62 | 0.13 | 1.18 | 0.07 | 99.23% | €815 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €1.937 | 42.9% | 0.06 | 8% | 2834 | 28 | 63 | 0.69 | 12.55 | 3.51 | 88.85% | €3.034 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Scandal Recovery | €500 | 0 | €774 | 10.5% | 0.07 | 2.9% | 917 | 9 | 62 | -0.06 | 2.55 | 0.6 | 94.23% | €1.908 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €133 | 10.9% | 0.06 | 5.9% | 1297 | 12 | 64 | 0.17 | 2.34 | 0.38 | 99.23% | €2.241 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €1.843 | 41.4% | 0.06 | 6.6% | 2556 | 25 | 62 | 0.38 | 11.47 | 3.27 | 89.23% | €2.792 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Cult Hypergrowth | €500 | 0 | €9.018 | 49.3% | 0.06 | 8.8% | 2883 | 28 | 60 | 0.52 | 19.38 | 5.62 | 59.62% | €3.141 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €5.812 | 13.9% | 0.06 | 6.9% | 1147 | 11 | 61 | 0.31 | 4.86 | 1.02 | 48.85% | €2.582 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €15.345 | 32.7% | 0.06 | 7.9% | 2267 | 22 | 59 | 0.45 | 14.17 | 4.13 | 24.23% | €2.990 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €17.425 | 51.2% | 0.06 | 8.3% | 4705 | 47 | 53 | 1.02 | 22.67 | 5.66 | 22.31% | €3.183 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €33.740 | €488 | €3.189 | 10.15 | 2.66 | 5.29 | 5.83 | 6.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €847 | €152 | €815 | 0.04 | 0.03 | 0.14 | 0.02 | 0.09 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €13.654 | €338 | €3.034 | 3.77 | 1.48 | 3.3 | 2.03 | 3.15 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €2.321 | €178 | €1.908 | 0.53 | 0.28 | 0.64 | 0.26 | 0.56 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €2.837 | €233 | €2.241 | 0.32 | 0.22 | 0.73 | 0.21 | 0.43 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €11.416 | €309 | €2.792 | 3.62 | 1.33 | 3.06 | 1.69 | 2.78 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €22.410 | €370 | €3.141 | 6.98 | 2.42 | 5.03 | 3.27 | 4.75 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €6.890 | €315 | €2.582 | 0.84 | 0.45 | 1.22 | 0.59 | 1.03 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €20.636 | €1.223 | €2.990 | 4.27 | 1.68 | 3.87 | 2.28 | 3.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €32.069 | €4.338 | €3.183 | 5.72 | 1.63 | 3.91 | 3.64 | 4.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €21.946 | €13.796 | €6.688 | €4.025 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €35 | €78 | €125 | €106 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €5.669 | €7.157 | €4.105 | €1.937 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €649 | €898 | €760 | €774 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Festival Push | €703 | €429 | €228 | €133 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Chaos Tour | €4.755 | €5.546 | €3.767 | €1.843 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €9.207 | €13.030 | €11.291 | €9.018 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €4.961 | €0 | €0 | €5.812 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €10.979 | €14.474 | €0 | €15.345 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €23.674 | €0 | €0 | €17.425 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.189 | €155 | 20.6× | 7.84 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €815 | €69 | 11.8× | 30.69 | 1.84 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.034 | €125 | 24.2× | 8.24 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.908 | €95 | 20.2× | 13.1 | 0.79 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.241 | €92 | 24.4× | 11.15 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.792 | €122 | 22.9× | 8.96 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.141 | €128 | 24.5× | 7.96 | 0.48 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.582 | €102 | 25.2× | 9.68 | 0.58 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.990 | €122 | 24.6× | 8.36 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.183 | €151 | 21.1× | 7.85 | 0.47 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 16% | 75.9% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 5.7 | 67 | 4.5% | 59.4% | 36% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Aggressive Marketing | 152 | 6.8 | 60 | 13.9% | 70.6% | 15.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.6 | 61 | 17.5% | 60.7% | 21.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.1 | 70 | 3.9% | 43.8% | 52.2% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 15.9% | 69.9% | 14.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.2 | 58 | 19.4% | 72.5% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 23.7% | 62.1% | 14.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 57 | 20.5% | 71.2% | 8.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 7.1 | 58 | 17.5% | 73.2% | 9.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 9.64 | 2.04 | 0.67 | 4.98 | 8 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 62 | 0.07 | 0.03 | 0.01 | 0.76 | 1.07 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 3.51 | 1.1 | 0.69 | 3.52 | 5.94 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 62 | 0.6 | 0.22 | 0.16 | 1.21 | 1.98 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 64 | 0.38 | 0.17 | 0.1 | 1.05 | 1.62 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 62 | 3.27 | 1.03 | 0.6 | 3.33 | 5.5 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Cult Hypergrowth | 60 | 5.62 | 1.94 | 1.1 | 5.47 | 9.43 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Early Game Probe (Fame 0–50) | 61 | 1.02 | 0.35 | 0.14 | 1.37 | 2.1 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 59 | 4.13 | 1.29 | 0.62 | 3.86 | 6.7 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 53 | 5.66 | 1.27 | 0.37 | 3.23 | 5.16 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.17 | 0.85 | 0.8 | 0.59 | 5.47 | 8.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.05 | 0.18 | 0.17 | 0.03 | 0.67 | 0.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.2 | 0.99 | 0.97 | 0.23 | 4.12 | 5.3 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.1 | 0.45 | 0.38 | 0.06 | 1.37 | 0.97 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.05 | 0.24 | 0.21 | 0.04 | 1.08 | 0.93 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.27 | 1.57 | 1.43 | 0.48 | 3.71 | 4.92 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.34 | 1.57 | 1.38 | 0.44 | 6.22 | 8.63 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.04 | 0.18 | 0.19 | 0.05 | 1.54 | 1.52 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.16 | 0.84 | 0.7 | 0.2 | 4.66 | 6.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.09 | 0.74 | 0.7 | 0.48 | 3.54 | 5.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 34.79 | 34.79 | 34.79 | 104.37 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 1.18 | 1.18 | 1.18 | 3.54 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 12.55 | 12.55 | 12.55 | 37.65 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 2.55 | 2.55 | 2.55 | 7.65 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 2.34 | 2.34 | 2.34 | 7.02 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 11.47 | 11.47 | 11.47 | 34.41 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 19.38 | 19.38 | 19.38 | 58.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 4.86 | 4.86 | 4.86 | 14.58 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 14.17 | 14.17 | 14.17 | 42.51 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 22.67 | 22.67 | 22.67 | 68.01 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €17.425 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 6394 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 99.23% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Baseline Touring** | €3.189 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €33.740 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 34.79 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 3.75 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 89.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €4.025 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 790 – 1200 | 261.82 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 75% | 99.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €106 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 650 – 1050 | 669.78 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 88.85% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €1.937 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 790 – 1200 | 334.29 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 94.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €774 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Fame-Fortschritt/Gig | 720 – 1120 | 430.21 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 10% | 99.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €10.000 – €50.000 | €133 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Festival Push | Fame-Fortschritt/Gig | 790 – 1250 | 659.07 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 89.23% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €1.843 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Chaos Tour | Fame-Fortschritt/Gig | 760 – 1200 | 330.84 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 59.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €9.018 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 820 – 1300 | 251.13 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 99.23% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €17.425 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 3.75 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Insolvenzrate) · Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Insolvenzrate) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Insolvenzrate) · Festival Push (Endgeld) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Insolvenzrate) · Chaos Tour (Endgeld) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Insolvenzrate) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
