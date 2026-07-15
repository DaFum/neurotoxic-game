# Game Balance Simulation – Analyse

Erstellt am: 2026-07-15T07:19:01.957Z

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
| 70 | 305 | 17 | 50 | 77 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 365 | 14 | 42 | 64 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 425 | 12 | 36 | 55 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

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
| Baseline Touring | €500 | 0 | €63.551 | 58.5% | 0.08 | 2.3% | 1904 | 3 | 58 | 14.99 | 58.83 | 15.88 | 0.38% | €1.645 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.831 | 36.3% | 0.1 | 0.5% | 518 | 1 | 58 | 0.38 | 4.24 | 1.86 | 78.46% | €1.157 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €26.411 | 42% | 0.08 | 2.5% | 1052 | 2 | 61 | 5.19 | 28.22 | 8.65 | 0.38% | €1.706 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €13.624 | 28.4% | 0.1 | 1.3% | 934 | 2 | 60 | 3.05 | 15.79 | 5.99 | 14.62% | €1.407 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €19.549 | 23.2% | 0.08 | 2.5% | 1034 | 2 | 60 | 3.02 | 17.57 | 6.28 | 5% | €1.632 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €24.057 | 32.9% | 0.09 | 2.1% | 1111 | 2 | 61 | 6.42 | 27.72 | 9 | 1.15% | €1.490 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.722 | 41.9% | 0.08 | 3% | 1071 | 2 | 62 | 5.68 | 27.97 | 8.49 | 1.54% | €1.736 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €20.764 | 27.3% | 0.09 | 0.8% | 1113 | 2 | 62 | 0 | 27.64 | 8.51 | 2.69% | €1.416 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €24.438 | 32.9% | 0.09 | 1% | 1126 | 2 | 58 | 16.22 | 26.73 | 8.78 | 5% | €1.412 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €7.611 | 13.4% | 0.08 | 0.5% | 981 | 2 | 55 | 5.52 | 8.03 | 1.92 | 0.77% | €1.298 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €17.353 | 14.3% | 0.09 | 1.4% | 1130 | 2 | 56 | 5.22 | 15.32 | 4.68 | 0% | €1.468 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.318 | 31.8% | 0.07 | 2.6% | 1690 | 2 | 59 | 10.79 | 24.08 | 5.92 | 0% | €1.719 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €64.236 | €494 | €1.645 | 18.78 | 4.65 | 14.16 | 8.73 | 11.72 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €2.899 | €85 | €1.157 | 0.93 | 0.65 | 1.42 | 0.41 | 1.57 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €35.926 | €403 | €1.706 | 10.27 | 3.51 | 8.72 | 4.38 | 7.68 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €14.737 | €247 | €1.407 | 5.45 | 2.52 | 5.35 | 2.43 | 5.34 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €21.165 | €289 | €1.632 | 6.27 | 2.8 | 6.36 | 2.62 | 5.62 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €29.276 | €389 | €1.490 | 9.4 | 3.43 | 8.16 | 3.95 | 7.47 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €35.575 | €402 | €1.736 | 9.72 | 3.4 | 8.56 | 4.25 | 7.13 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €24.076 | €379 | €1.416 | 0 | 0 | 8.09 | 4.21 | 7.55 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €27.895 | €306 | €1.412 | 9.31 | 3.26 | 7.55 | 4.1 | 7.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €7.904 | €380 | €1.298 | 1.25 | 0.72 | 1.72 | 1 | 1.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.119 | €1.348 | €1.468 | 4.45 | 1.88 | 3.98 | 2.28 | 3.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €37.588 | €4.895 | €1.719 | 6.4 | 1.85 | 5.36 | 3.4 | 4.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €21.109 | €29.280 | €44.597 | €63.551 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €588 | €1.129 | €1.451 | €1.831 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €9.142 | €19.943 | €25.721 | €26.411 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €3.488 | €7.105 | €10.292 | €13.624 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €5.292 | €10.085 | €14.951 | €19.549 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €6.913 | €14.590 | €21.470 | €24.057 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €9.342 | €19.185 | €25.194 | €26.722 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €6.018 | €11.904 | €17.929 | €20.764 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €5.462 | €12.817 | €20.518 | €24.438 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €6.724 | €0 | €0 | €7.611 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €8.440 | €16.278 | €0 | €17.353 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €26.567 | €0 | €0 | €29.318 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.645 | €90 | 18.3× | 15.2 | 0.91 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.157 | €56 | 20.6× | 21.61 | 1.3 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.706 | €84 | 20.3× | 14.65 | 0.88 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.407 | €71 | 19.8× | 17.77 | 1.07 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.632 | €76 | 21.4× | 15.32 | 0.92 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.490 | €82 | 18.3× | 16.78 | 1.01 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.736 | €84 | 20.6× | 14.4 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.416 | €80 | 17.6× | 17.66 | 1.06 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.412 | €80 | 17.6× | 17.7 | 1.06 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.298 | €60 | 21.5× | 19.26 | 1.16 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.468 | €78 | 18.9× | 17.03 | 1.02 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.719 | €91 | 19× | 14.54 | 0.87 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 60 | 11.9% | 73.4% | 14.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.1 | 58 | 20.7% | 68% | 11.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.7 | 60 | 12.1% | 73.9% | 14% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.8% | 71.9% | 8.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 67 | 4.1% | 58% | 37.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 60 | 12.6% | 72.8% | 14.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.9 | 59 | 15.8% | 72.9% | 11.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7 | 59 | 17.1% | 71.7% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 57 | 19.7% | 73% | 7.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 23.1% | 66.1% | 10.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18.4% | 73.7% | 7.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 14.1% | 72.8% | 13.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 15.88 | 3.7 | 1.42 | 8.38 | 10.47 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 1.86 | 0.49 | 0.42 | 2.82 | 0.68 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 61 | 8.65 | 2.67 | 1.63 | 8.32 | 5.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 5.99 | 1.98 | 1.45 | 7.2 | 2.67 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 60 | 6.28 | 2.1 | 1.5 | 7.76 | 3.09 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 61 | 9 | 2.62 | 1.67 | 8.13 | 4.96 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 62 | 8.49 | 2.64 | 1.54 | 8.33 | 4.93 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.51 | 0 | 0 | 7.92 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 58 | 8.78 | 2.58 | 1.55 | 7.68 | 4.77 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.92 | 0.57 | 0.22 | 2.07 | 1.36 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 56 | 4.68 | 1.45 | 0.76 | 4.17 | 2.7 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 59 | 5.92 | 1.45 | 0.53 | 3.18 | 4.37 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.96 | 1.58 | 1.65 | 0.73 | 8.88 | 21.88 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.45 | 0.8 | 0.82 | 0.09 | 3.13 | 2.99 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.55 | 2.71 | 2.73 | 0.72 | 9.25 | 16.02 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.62 | 2.97 | 2.89 | 0.46 | 7.71 | 11.12 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 1.01 | 1.68 | 1.6 | 0.26 | 8.52 | 12.81 | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | 2.5 | 4.18 | 4.16 | 1 | 9.16 | 15.17 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.4 | 2.4 | 2.35 | 0.6 | 8.95 | 15.77 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.09 | 2.32 | 2.07 | 0.48 | 8.83 | 15.27 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.31 | 2.15 | 2.22 | 0.53 | 8.54 | 14.3 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.22 | 0.34 | 0.37 | 0.11 | 2.33 | 3.31 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.57 | 0.99 | 0.97 | 0.28 | 4.64 | 8.38 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.5 | 0.99 | 0.85 | 0.47 | 3.59 | 8.72 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.83 | 58.83 | 58.83 | 176.49 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 4.24 | 4.24 | 4.24 | 12.72 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.22 | 28.22 | 28.22 | 84.66 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 15.79 | 15.79 | 15.79 | 47.37 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.57 | 17.57 | 17.57 | 52.71 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 27.72 | 27.72 | 27.72 | 83.16 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 27.97 | 27.97 | 27.97 | 83.91 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 27.64 | 27.64 | 27.64 | 82.92 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 26.73 | 26.73 | 26.73 | 80.19 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.03 | 8.03 | 8.03 | 24.09 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.32 | 15.32 | 15.32 | 45.96 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.08 | 24.08 | 24.08 | 72.24 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €63.551 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 1904 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 78.46% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €1.736 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €64.236 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.83 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.85 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €63.551 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 268.66 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 78.46% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €1.831 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 250 – 500 | 259.64 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €26.411 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 250 – 500 | 268.02 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 14.62% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €13.624 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 258.66 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 5% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €19.549 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 297.26 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €24.057 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 268.73 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.722 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 500 | 263.53 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.38% | €-13.659 | 1.02 | -0.05 |
| Bootstrap Struggle | 21.54% | €-2.528 | 0.02 | -2.11 |
| Aggressive Marketing | -1.54% | €-990 | -0.8 | 0.22 |
| Scandal Recovery | 4.62% | €-2.745 | -0.04 | -1.06 |
| Festival Push | -0.38% | €-2.633 | -0.33 | -0.13 |
| Chaos Tour | 0.77% | €-2.127 | -0.67 | -0.19 |
| Cult Hypergrowth | 1.16% | €-2.091 | 1.63 | -0.32 |
| No Social (Fame 0-50) | 2.31% | €-3.449 | 0.15 | -0.51 |
| High Controversy | 2.69% | €-1.486 | -2.04 | -0.67 |
| Early Game Probe (Fame 0–50) | 0% | €-2.131 | 0.46 | 0.01 |
| Mid Game Probe (Fame 60–150) | -0.38% | €-3.100 | 0.69 | 0.03 |
| Late Game Probe (Fame 175+) | 0% | €-761 | -1.04 | -0.03 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 78.46% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €63.551 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.85 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
