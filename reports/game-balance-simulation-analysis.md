# Game Balance Simulation – Analyse

Erstellt am: 2026-07-15T21:26:15.051Z

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
| Baseline Touring | €500 | 0 | €65.196 | 58.3% | 0.08 | 3.3% | 15868 | 8 | 60 | 15.09 | 58.83 | 15.89 | 0.38% | €1.799 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €2.291 | 33.6% | 0.09 | 1% | 1012 | 2 | 60 | 0.87 | 4.05 | 1.42 | 79.23% | €1.302 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €26.233 | 40.7% | 0.08 | 3% | 2768 | 3 | 64 | 5.25 | 28.38 | 8.48 | 0.38% | €1.761 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €13.783 | 29% | 0.09 | 1.6% | 1782 | 2 | 58 | 3.65 | 15.76 | 5.83 | 15.77% | €1.484 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €18.176 | 23.8% | 0.08 | 2.7% | 2007 | 3 | 61 | 2.99 | 17.14 | 5.72 | 10% | €1.651 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €25.453 | 31.6% | 0.08 | 2.9% | 2556 | 3 | 65 | 5.75 | 28.15 | 8.72 | 0.38% | €1.605 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.746 | 43.5% | 0.07 | 3% | 2659 | 3 | 64 | 7.49 | 28.14 | 8.49 | 1.15% | €1.829 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €23.724 | 25.3% | 0.09 | 2% | 2696 | 3 | 64 | 0 | 27.98 | 8.53 | 1.92% | €1.588 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €25.747 | 35.6% | 0.09 | 1.9% | 2596 | 3 | 64 | 14.02 | 27.41 | 8.59 | 3.08% | €1.563 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €9.555 | 12.1% | 0.07 | 1.7% | 2348 | 3 | 55 | 4.92 | 8.09 | 1.88 | 0.38% | €1.543 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €18.602 | 14.9% | 0.08 | 1.5% | 2340 | 3 | 58 | 6 | 15.32 | 4.61 | 0.38% | €1.604 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €28.942 | 34.3% | 0.07 | 3.1% | 6961 | 5 | 61 | 11.16 | 24.07 | 5.93 | 0% | €1.827 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €65.988 | €496 | €1.799 | 19.11 | 4.73 | 21.34 | 8.38 | 11.65 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €3.350 | €86 | €1.302 | 0.95 | 0.65 | 2.18 | 0.35 | 1.41 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €35.661 | €398 | €1.761 | 10.71 | 3.5 | 15.89 | 4.2 | 7.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €15.227 | €243 | €1.484 | 5.12 | 2.52 | 9.05 | 2.18 | 5.28 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €20.290 | €277 | €1.651 | 6.07 | 2.7 | 10.98 | 2.38 | 5.39 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €31.066 | €390 | €1.605 | 10.24 | 3.46 | 15.49 | 3.86 | 7.59 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €36.825 | €396 | €1.829 | 10.13 | 3.48 | 15.38 | 4.07 | 7.16 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €26.971 | €375 | €1.588 | 0 | 0 | 14.96 | 4.02 | 7.69 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €30.493 | €301 | €1.563 | 9.97 | 3.43 | 14.51 | 3.95 | 7.53 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €9.820 | €373 | €1.543 | 1.62 | 0.85 | 3.09 | 0.93 | 1.89 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €19.564 | €1.345 | €1.604 | 4.3 | 1.8 | 7.5 | 2.02 | 3.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €37.963 | €4.910 | €1.827 | 6.55 | 1.79 | 8.8 | 3.34 | 4.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €22.743 | €28.785 | €45.843 | €65.196 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €740 | €1.239 | €1.951 | €2.291 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €9.942 | €20.526 | €25.866 | €26.233 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €4.324 | €7.661 | €10.723 | €13.783 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €5.295 | €10.056 | €14.601 | €18.176 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €8.126 | €16.386 | €22.281 | €25.453 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €10.574 | €20.888 | €26.005 | €26.746 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €7.183 | €13.673 | €19.825 | €23.724 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €6.085 | €14.165 | €22.405 | €25.747 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €8.396 | €0 | €0 | €9.555 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €9.329 | €17.528 | €0 | €18.602 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.262 | €0 | €0 | €28.942 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.799 | €95 | 18.9× | 13.9 | 0.83 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.302 | €60 | 21.6× | 19.21 | 1.15 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.761 | €86 | 20.5× | 14.2 | 0.85 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.484 | €74 | 20.1× | 16.84 | 1.01 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.651 | €77 | 21.3× | 15.14 | 0.91 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.605 | €84 | 19.1× | 15.57 | 0.93 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.829 | €86 | 21.2× | 13.67 | 0.82 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.588 | €83 | 19.1× | 15.74 | 0.94 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.563 | €82 | 19× | 15.99 | 0.96 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.543 | €64 | 24.1× | 16.2 | 0.97 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.604 | €79 | 20.2× | 15.58 | 0.93 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.827 | €93 | 19.6× | 13.69 | 0.82 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.6 | 61 | 11.6% | 71% | 17.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.9 | 59 | 20.4% | 63% | 16.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 11.8% | 71.5% | 16.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.2% | 72.3% | 8.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 67 | 4.4% | 59% | 36.7% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.5 | 62 | 11.3% | 69.4% | 19.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 59 | 15.2% | 72.5% | 12.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.9% | 71.1% | 13% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 19.9% | 69.4% | 10.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 22.7% | 66% | 11.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19% | 72.8% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 14.9% | 71.9% | 13.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 15.89 | 3.76 | 1.32 | 8.01 | 10.68 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 60 | 1.42 | 0.5 | 0.41 | 2.52 | 0.72 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 64 | 8.48 | 2.8 | 1.72 | 8.56 | 4.85 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 58 | 5.83 | 1.92 | 1.47 | 7.03 | 2.71 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 61 | 5.72 | 2.08 | 1.48 | 7.76 | 3.13 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 65 | 8.72 | 2.81 | 1.6 | 8.31 | 4.94 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 64 | 8.49 | 2.74 | 1.66 | 8.15 | 4.59 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 64 | 8.53 | 0 | 0 | 8.03 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 64 | 8.59 | 2.71 | 1.56 | 8.11 | 4.9 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.88 | 0.66 | 0.27 | 2.07 | 1.52 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 58 | 4.61 | 1.39 | 0.81 | 4.22 | 2.75 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 61 | 5.93 | 1.45 | 0.46 | 3.19 | 4.35 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.83 | 1.55 | 1.72 | 0.81 | 9.25 | 29.53 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.4 | 0.7 | 0.83 | 0.12 | 3 | 3.77 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.6 | 2.74 | 2.68 | 0.66 | 9.25 | 23.75 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.63 | 2.97 | 2.96 | 0.53 | 7.76 | 15.32 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.92 | 1.61 | 1.72 | 0.27 | 8.19 | 17.64 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.33 | 4.29 | 4.24 | 1 | 9.09 | 23.21 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.45 | 2.41 | 2.41 | 0.62 | 8.77 | 23.31 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.28 | 2.22 | 2.18 | 0.48 | 8.85 | 22.51 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.27 | 2.22 | 2.13 | 0.5 | 8.69 | 21.81 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.4 | 0.43 | 0.12 | 2.36 | 4.68 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.45 | 0.99 | 0.97 | 0.24 | 4.79 | 11.89 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.5 | 0.9 | 0.89 | 0.53 | 3.69 | 12.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.83 | 58.83 | 58.83 | 176.49 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.05 | 4.05 | 4.05 | 12.15 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.38 | 28.38 | 28.38 | 85.14 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 15.76 | 15.76 | 15.76 | 47.28 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.14 | 17.14 | 17.14 | 51.42 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.15 | 28.15 | 28.15 | 84.45 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.14 | 28.14 | 28.14 | 84.42 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 27.98 | 27.98 | 27.98 | 83.94 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 27.41 | 27.41 | 27.41 | 82.23 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.09 | 8.09 | 8.09 | 24.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.32 | 15.32 | 15.32 | 45.96 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.07 | 24.07 | 24.07 | 72.21 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €65.196 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15868 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 79.23% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €1.829 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €65.988 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.83 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.85 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €65.196 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 800 | 714.46 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 79.23% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €2.291 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 250 – 800 | 695.5 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €26.233 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 250 – 800 | 715.12 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 15.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €13.783 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 800 | 684.6 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 10% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €18.176 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 800 | 780.07 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €25.453 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 800 | 722.39 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.746 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 800 | 698.8 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €982 | 0.65 | -0.01 |
| Bootstrap Struggle | -0.39% | €283 | -1.61 | 0.11 |
| Aggressive Marketing | -0.39% | €-451 | -1.46 | 0.01 |
| Scandal Recovery | 0% | €36 | -1.01 | 0.03 |
| Festival Push | 0% | €-685 | -1.49 | 0.06 |
| Chaos Tour | -1.54% | €623 | 0.36 | 0.24 |
| Cult Hypergrowth | 0% | €-688 | -1.67 | -0.09 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -1.92% | €1.408 | -2.22 | 0.47 |
| Early Game Probe (Fame 0–50) | -0.77% | €299 | 0.36 | 0.07 |
| Mid Game Probe (Fame 60–150) | 0% | €161 | -1.15 | 0.01 |
| Late Game Probe (Fame 175+) | 0% | €-182 | -0.93 | -0.03 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 79.23% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €65.196 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.85 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
