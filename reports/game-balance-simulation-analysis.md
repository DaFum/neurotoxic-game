# Game Balance Simulation – Analyse

Erstellt am: 2026-07-17T23:47:22.753Z

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
| 70 | 340 | 15 | 45 | 69 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 400 | 13 | 38 | 59 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 460 | 11 | 34 | 51 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

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
| Baseline Touring | €500 | 0 | €76.972 | 57% | 0.07 | 2.9% | 2323 | 3 | 58 | 16.25 | 58.56 | 16.16 | 0.38% | €1.940 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €3.927 | 34.4% | 0.09 | 1.7% | 657 | 1 | 59 | 1.22 | 6.2 | 2.87 | 58.46% | €1.493 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €27.934 | 47.6% | 0.07 | 2.6% | 1188 | 2 | 62 | 5.91 | 28.13 | 8.6 | 0.77% | €1.948 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €17.093 | 26% | 0.08 | 2.6% | 1013 | 2 | 59 | 3.66 | 16.63 | 6.17 | 10% | €1.689 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €22.002 | 24.5% | 0.07 | 2.7% | 1193 | 2 | 61 | 4 | 17.96 | 6.25 | 3.46% | €1.864 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €26.888 | 36.9% | 0.08 | 2.8% | 1154 | 2 | 61 | 7.52 | 28.05 | 8.95 | 0% | €1.750 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.976 | 51.4% | 0.07 | 2.7% | 1141 | 2 | 62 | 5.83 | 28.28 | 8.54 | 0.77% | €1.993 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €25.303 | 28.3% | 0.08 | 2.3% | 1203 | 2 | 64 | 0 | 28.3 | 8.57 | 0.38% | €1.695 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €25.832 | 39.6% | 0.08 | 1.9% | 1214 | 2 | 60 | 15.49 | 27.52 | 8.82 | 1.92% | €1.689 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €9.804 | 8.8% | 0.07 | 1.7% | 1088 | 2 | 54 | 4.57 | 8.07 | 1.93 | 0% | €1.572 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €21.796 | 10.5% | 0.07 | 2% | 1251 | 2 | 57 | 4.88 | 15.38 | 4.62 | 0% | €1.780 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.359 | 44.8% | 0.06 | 3.1% | 1941 | 3 | 61 | 10.19 | 24.1 | 5.9 | 0% | €2.026 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €77.511 | €496 | €1.940 | 17.1 | 4.47 | 15.03 | 8.58 | 11.7 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €5.166 | €118 | €1.493 | 1.44 | 1.12 | 2.44 | 0.72 | 2.53 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €38.014 | €406 | €1.948 | 9.73 | 3.31 | 9.23 | 4.33 | 7.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €18.799 | €272 | €1.689 | 5.6 | 2.55 | 5.87 | 2.5 | 5.59 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €24.431 | €301 | €1.864 | 6.37 | 2.94 | 7.1 | 2.62 | 5.7 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €33.905 | €401 | €1.750 | 9.4 | 3.41 | 8.96 | 3.98 | 7.61 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €38.644 | €406 | €1.993 | 9.98 | 3.35 | 9.27 | 4.21 | 7.17 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €30.409 | €395 | €1.695 | 0 | 0 | 8.94 | 4.22 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €32.957 | €327 | €1.689 | 9.97 | 3.42 | 8.53 | 4.15 | 7.55 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €9.984 | €392 | €1.572 | 1.26 | 0.73 | 1.89 | 0.97 | 1.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €22.644 | €1.370 | €1.780 | 4.47 | 1.81 | 4.3 | 2.22 | 3.94 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.580 | €4.922 | €2.026 | 6.35 | 1.76 | 6.05 | 3.42 | 4.33 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €24.628 | €31.386 | €54.688 | €76.972 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.863 | €4.490 | €7.190 | €3.927 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €10.525 | €22.298 | €26.910 | €27.934 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.344 | €10.391 | €14.582 | €17.093 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €6.693 | €12.761 | €17.865 | €22.002 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €8.279 | €17.596 | €24.486 | €26.888 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €11.217 | €23.276 | €26.825 | €26.976 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €7.672 | €16.029 | €23.460 | €25.303 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €6.988 | €16.490 | €24.137 | €25.832 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €8.311 | — | — | €9.804 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €10.584 | €20.670 | — | €21.796 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €29.025 | — | — | €29.359 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.940 | €91 | 21.4× | 12.89 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.493 | €60 | 24.9× | 16.75 | 1 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.948 | €85 | 22.8× | 12.83 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.689 | €75 | 22.5× | 14.8 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.864 | €79 | 23.7× | 13.41 | 0.8 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.750 | €83 | 21× | 14.29 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.993 | €86 | 23.3× | 12.54 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.695 | €83 | 20.4× | 14.75 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.689 | €82 | 20.6× | 14.8 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.572 | €63 | 24.9× | 15.9 | 0.95 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.780 | €81 | 21.9× | 14.04 | 0.84 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.026 | €91 | 22.2× | 12.34 | 0.74 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.8 | 60 | 11.8% | 74.6% | 13.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 21.4% | 68.4% | 10.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.7 | 61 | 11.6% | 73% | 15.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.7% | 72.2% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 4.1% | 57.8% | 38.1% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 12.4% | 72.9% | 14.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 59 | 15.5% | 72.3% | 12.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7 | 59 | 17% | 71.1% | 11.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 58 | 19.8% | 71% | 9.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 23.1% | 66.1% | 10.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19% | 72.5% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 13.7% | 72.3% | 14% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 16.16 | 3.48 | 1.45 | 8.17 | 10.3 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 2.87 | 0.86 | 0.72 | 4.19 | 1.08 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 62 | 8.6 | 2.55 | 1.52 | 8.16 | 4.97 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.17 | 1.97 | 1.48 | 7.46 | 2.84 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 61 | 6.25 | 2.23 | 1.74 | 7.79 | 3.34 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 61 | 8.95 | 2.65 | 1.63 | 8.42 | 5.13 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 62 | 8.54 | 2.58 | 1.46 | 8.66 | 5.1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 64 | 8.57 | 0 | 0 | 8.3 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 60 | 8.82 | 2.7 | 1.52 | 8.03 | 4.86 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 54 | 1.93 | 0.58 | 0.22 | 2.07 | 1.44 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 57 | 4.62 | 1.4 | 0.77 | 4.22 | 2.73 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 61 | 5.9 | 1.39 | 0.44 | 3.23 | 4.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.74 | 1.43 | 1.52 | 0.77 | 8.97 | 22.82 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.67 | 1.31 | 1.25 | 0.15 | 4.54 | 5.32 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.5 | 2.59 | 2.55 | 0.65 | 9.04 | 16.64 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.76 | 3.21 | 3.05 | 0.5 | 8.01 | 12.15 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 1.04 | 1.84 | 1.58 | 0.27 | 8.48 | 14.01 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.43 | 4.23 | 4.28 | 1.07 | 9.17 | 16.69 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.57 | 2.39 | 2.37 | 0.7 | 8.98 | 16.69 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.27 | 2.38 | 2.22 | 0.53 | 8.82 | 16.29 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.31 | 2.12 | 2.23 | 0.54 | 9.13 | 15.73 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.21 | 0.32 | 0.42 | 0.09 | 2.28 | 3.48 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.51 | 0.92 | 0.93 | 0.27 | 4.8 | 8.48 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.43 | 0.91 | 0.9 | 0.47 | 3.68 | 9.52 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.56 | 58.56 | 58.56 | 175.68 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 6.2 | 6.2 | 6.2 | 18.6 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.13 | 28.13 | 28.13 | 84.39 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 16.63 | 16.63 | 16.63 | 49.89 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.96 | 17.96 | 17.96 | 53.88 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.05 | 28.05 | 28.05 | 84.15 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.28 | 28.28 | 28.28 | 84.84 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.3 | 28.3 | 28.3 | 84.9 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 27.52 | 27.52 | 27.52 | 82.56 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.07 | 8.07 | 8.07 | 24.21 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.38 | 15.38 | 15.38 | 46.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.1 | 24.1 | 24.1 | 72.3 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €76.972 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 2323 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 58.46% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €2.026 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €77.511 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.56 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.01 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €76.972 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 303.22 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 58.46% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €3.927 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 250 – 500 | 292.88 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €27.934 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 304.92 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 10% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €17.093 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 292.68 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 3.46% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €22.002 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 333.24 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €26.888 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 303.58 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.976 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 298.89 | ✅ | Im Zielband – leicht außermittig. |
| Early Game Probe (Fame 0–50) | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Early Game Probe (Fame 0–50) | Gig-Netto | 200 – 2500 | 1572 | ✅ | Im Zielband |
| Early Game Probe (Fame 0–50) | Fame-Fortschritt/Gig | 0 – 1000 | 291.07 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.38% | €-735 | -1.6 | -0.32 |
| Bootstrap Struggle | -1.54% | €235 | -0.65 | 0.03 |
| Aggressive Marketing | 0% | €70 | -0.38 | 0.07 |
| Scandal Recovery | -1.15% | €1.121 | -1.44 | 0.29 |
| Festival Push | -0.77% | €-142 | -0.29 | 0.08 |
| Chaos Tour | -0.77% | €422 | -0.15 | 0.18 |
| Cult Hypergrowth | 0.39% | €-534 | 0.32 | -0.02 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -0.39% | €764 | 0.56 | 0.15 |
| Early Game Probe (Fame 0–50) | -0.38% | €-52 | -0.71 | 0.04 |
| Mid Game Probe (Fame 60–150) | 0% | €814 | 0.09 | 0.03 |
| Late Game Probe (Fame 175+) | 0% | €-1.316 | -0.04 | -0.02 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 58.46% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €76.972 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.01 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
