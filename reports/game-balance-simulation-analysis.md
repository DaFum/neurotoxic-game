# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T21:50:11.209Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.2
- Basis-Commit: a2ec2734aff212b8833c34d8c2d1ccc6197be6bc
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: ee294262056883e92e942cc8bdc36d42dd2080892fe0525a1b1993a78e1d9247
- Szenariokonfiguration SHA-256: e2f97ba93da6a842fa33908edf7acf33b2404c753b18903421f900c04aa7c6c0
- KPI-Zielkonfiguration SHA-256: 7e243b1d2ee21d2c19e764cba96afa604f633f210757fa6e9eb8843aa226cfa7
- Seed-Strategie: scenario-id-plus-run-index

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |
| Klinik-Heilung | €280 × 1.2^Besuche · +30 Stamina / +10 Mood |

## Fame-Shop-Audit

Shop-only kosten **15290 Fame**, mit Legacy-Upgrades **24390 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 45 | 690 | 8 | 23 | 34 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 50 | 750 | 7 | 21 | 32 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 55 | 810 | 7 | 19 | 29 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 60 | 870 | 6 | 18 | 27 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 70 | 990 | 6 | 16 | 24 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 1170 | 5 | 13 | 20 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 1350 | 4 | 12 | 18 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 164 |
| Brand Deals | 54 |
| Post Options | 36 |
| Contraband-Items | 37 |
| Upgrade-Katalog | 67 |
| Social Platforms | 4 |
| Trends | 5 |
| Songs | 7 |
| Quests (Registry) | 32 |
| Asset-Chassis-Arten | 4 |
| Asset-Module | 63 |
| Kredit-Profile | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 26 | travel, random |
| band | 59 | random, post_gig, travel |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 26 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €56.139 | 61.3% | 0.1 | 2.9% | 22724 | 10 | 39 | 13.18 | 59.99 | 6.48 | 0.38% | €2.516 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €631 | 91.62% | 0.25 | 1.3% | 1112 | 2 | 55 | 1 | 4.25 | 2.52 | 88.46% | €1.159 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €23.803 | 59.02% | 0.11 | 3.6% | 9040 | 6 | 55 | 5.27 | 29.23 | 5.82 | 1.54% | €2.742 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €6.229 | 82.03% | 0.17 | 2.1% | 3147 | 3 | 54 | 2.96 | 13.38 | 4.45 | 37.69% | €1.932 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.952 | 76.59% | 0.14 | 4% | 4149 | 4 | 55 | 1.95 | 14.64 | 4.77 | 24.62% | €2.400 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.526 | 61.68% | 0.14 | 1.9% | 6537 | 5 | 42 | 5.07 | 26.52 | 5.68 | 5.77% | €2.269 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €24.581 | 60.58% | 0.1 | 4.1% | 7975 | 6 | 53 | 4.91 | 29.51 | 5.84 | 1.92% | €2.831 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €16.129 | 61.49% | 0.14 | 1.5% | 8843 | 6 | 50 | 0 | 27.87 | 5.51 | 5% | €2.138 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.358 | 62.66% | 0.14 | 1.8% | 6459 | 5 | 51 | 13.8 | 25.99 | 5.35 | 8.46% | €1.984 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €11.105 | 32.12% | 0.13 | 1.6% | 3145 | 3 | 42 | 5.08 | 9.08 | 2.48 | 0.38% | €2.062 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €13.828 | 48.3% | 0.15 | 1.8% | 4348 | 4 | 48 | 4.47 | 15.61 | 4.92 | 3.85% | €2.275 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.598 | 47.76% | 0.1 | 3% | 10371 | 7 | 41 | 9.5 | 26.17 | 5.12 | 0% | €2.651 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €59.370 | €497 | €2.516 | 7.63 | 2.38 | 21.07 | 7.92 | 11.82 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €4.039 | €84 | €1.159 | 0.16 | 0.15 | 2.65 | 0.3 | 1.67 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €31.402 | €404 | €2.742 | 2.58 | 1.17 | 17.05 | 4.19 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €10.956 | €227 | €1.932 | 1.03 | 0.56 | 9.02 | 1.74 | 4.76 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €14.893 | €261 | €2.400 | 0.91 | 0.47 | 10.53 | 1.91 | 4.91 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €22.403 | €385 | €2.269 | 2.77 | 1.18 | 14.34 | 3.52 | 7.25 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.162 | €404 | €2.831 | 3.13 | 1.25 | 16.92 | 4.08 | 7.29 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €21.811 | €379 | €2.138 | 0 | 0 | 15.13 | 3.89 | 7.56 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.476 | €316 | €1.984 | 2.48 | 1.1 | 13.88 | 3.7 | 7.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.815 | €397 | €2.062 | 0.26 | 0.17 | 3.82 | 1 | 1.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.081 | €1.307 | €2.275 | 0.82 | 0.35 | 8.04 | 2.1 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.459 | €4.957 | €2.651 | 1.38 | 0.49 | 8.72 | 3.62 | 4.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €24.906 | €28.525 | €40.790 | €56.139 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.517 | €903 | €632 | €631 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €13.001 | €16.096 | €20.479 | €23.803 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.851 | €4.909 | €4.501 | €6.229 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.416 | €6.883 | €7.010 | €9.952 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €9.756 | €11.729 | €14.608 | €16.526 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.476 | €17.615 | €21.735 | €24.581 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.233 | €11.236 | €13.816 | €16.129 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.126 | €9.829 | €12.964 | €16.358 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.856 | — | — | €11.105 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.497 | €12.962 | — | €13.828 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €28.150 | — | — | €29.598 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.516 | €98 | 25.8× | 9.94 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.159 | €56 | 31.9× | 21.57 | 1.29 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.742 | €89 | 31.1× | 9.12 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.932 | €69 | 30.5× | 12.94 | 0.78 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.400 | €75 | 34.2× | 10.42 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.269 | €84 | 27.4× | 11.02 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.831 | €89 | 32.1× | 8.83 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.138 | €84 | 25.5× | 11.69 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.984 | €81 | 26× | 12.6 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.062 | €72 | 28.8× | 12.12 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.275 | €83 | 27.6× | 10.99 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.651 | €96 | 27.8× | 9.43 | 0.57 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 50.5% | 43.4% | 6.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.5 | 54 | 50.1% | 43% | 6.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 53 | 39% | 51.7% | 9.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.2 | 52 | 45.8% | 45.6% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.2 | 58 | 26.8% | 57.6% | 15.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 64.1% | 32.9% | 3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8 | 53 | 40.3% | 52.7% | 7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.3% | 40.8% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 49 | 55.4% | 39.4% | 5.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 48.3% | 44% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 50 | 49.4% | 46.3% | 4.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 47.6% | 45% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.48 | 1.93 | 0.53 | 8.37 | 11.16 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 55 | 2.52 | 0.12 | 0.08 | 3.2 | 0.84 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 55 | 5.82 | 0.93 | 0.49 | 8.02 | 5.33 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 54 | 4.45 | 0.48 | 0.28 | 6.98 | 2.63 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 4.77 | 0.38 | 0.23 | 7.25 | 2.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 42 | 5.68 | 0.97 | 0.48 | 8.25 | 4.79 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.84 | 1.02 | 0.44 | 8.13 | 5.06 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.51 | 0 | 0 | 8.23 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 5.35 | 0.83 | 0.43 | 7.51 | 4.53 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.48 | 0.13 | 0.04 | 2.12 | 1.67 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 4.92 | 0.29 | 0.12 | 4.34 | 2.8 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 41 | 5.12 | 0.42 | 0.1 | 3.2 | 4.57 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.98 | 1.63 | 1.6 | 0.83 | 4.16 | 9.1 | 29.34 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.59 | 0.96 | 0.8 | 0.09 | 0.39 | 3.53 | 4.75 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.69 | 2.76 | 2.76 | 0.72 | 3.28 | 8.99 | 25.06 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.73 | 3 | 2.86 | 0.41 | 1.96 | 7.38 | 14.65 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.9 | 1.64 | 1.58 | 0.17 | 1.01 | 8.05 | 16.81 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.65 | 4.27 | 4.32 | 1 | 4.95 | 8.73 | 21.76 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.52 | 2.46 | 2.3 | 0.71 | 3.05 | 8.67 | 24.78 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.37 | 2.1 | 2.25 | 0.53 | 2.49 | 9.03 | 22.97 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.32 | 2.18 | 2.24 | 0.49 | 2.37 | 8.21 | 21.1 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.37 | 0.42 | 0.08 | 0.57 | 2.3 | 5.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.6 | 0.96 | 0.94 | 0.25 | 1.19 | 4.61 | 12.25 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.63 | 0.89 | 0.95 | 0.61 | 2.54 | 3.45 | 12.46 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59.99 | 19.98 | 20.22 | 19.8 | 119.99 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 4.25 | 1.43 | 1.46 | 1.37 | 8.51 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.23 | 9.71 | 9.78 | 9.74 | 58.46 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 13.38 | 4.46 | 4.45 | 4.47 | 26.76 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.64 | 5.04 | 4.87 | 4.73 | 29.28 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.52 | 8.78 | 8.99 | 8.75 | 53.04 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.51 | 9.69 | 10.04 | 9.78 | 59.02 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 27.87 | 9.07 | 9.45 | 9.36 | 55.75 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 25.99 | 8.77 | 8.64 | 8.58 | 51.98 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.08 | 3.03 | 2.97 | 3.08 | 18.16 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.61 | 5.13 | 5.34 | 5.14 | 31.22 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.17 | 8.66 | 8.7 | 8.82 | 52.35 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.93 | 0.32 | 6.8 | 0.96 | 3.62 | 4.74 | €3.282 | 6.3 | 100% |
| Bootstrap Struggle | 0.27 | 0.18 | 0.63 | 0.8 | 0.56 | 0.94 | €1.028 | 2 | 65.8% |
| Aggressive Marketing | 2.77 | 0.74 | 6.27 | 1 | 3.43 | 3.06 | €2.838 | 5.83 | 100% |
| Scandal Recovery | 1.07 | 0.55 | 2.95 | 1.43 | 1.86 | 2.42 | €1.854 | 6.16 | 93.1% |
| Festival Push | 1.58 | 0.7 | 4.18 | 1.28 | 2.37 | 1.47 | €2.058 | 6.07 | 98.5% |
| Chaos Tour | 2.42 | 0.92 | 5.64 | 1.22 | 3.15 | 3.1 | €2.668 | 7.17 | 95.8% |
| Cult Hypergrowth | 2.73 | 0.58 | 6.43 | 1.13 | 3.43 | 3.65 | €2.875 | 5.55 | 100% |
| No Social (Fame 0-50) | 2.31 | 0.9 | 5.44 | 1.31 | 3.11 | 2.68 | €2.548 | 6.97 | 98.1% |
| High Controversy | 2.05 | 0.82 | 4.87 | 1.26 | 2.92 | 3.32 | €2.465 | 7.08 | 95% |
| Early Game Probe (Fame 0–50) | 0.7 | 0.33 | 0.57 | 0.53 | 0.83 | 1.62 | €844 | 0.01 | 93.8% |
| Mid Game Probe (Fame 60–150) | 1.73 | 0.57 | 2.7 | 0.87 | 2.22 | 2.33 | €2.204 | 2.82 | 96.5% |
| Late Game Probe (Fame 175+) | 2.16 | 0.27 | 2.67 | 0.55 | 2.48 | 2.75 | €2.459 | 0.65 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €56.139 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 22724 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 88.46% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.831 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €59.370 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 59.99 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.19 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 48417 | 25959 | 0 | 25959 | 45 | 311.21 | 260/260 |
| Bootstrap Struggle | 3326 | 2221 | 0 | 2221 | 8 | 15.49 | 260/260 |
| Aggressive Marketing | 28740 | 19908 | 0 | 19908 | 16 | 223.51 | 260/260 |
| Scandal Recovery | 12071 | 8971 | 0 | 8971 | 17 | 63.16 | 260/260 |
| Festival Push | 15127 | 11087 | 0 | 11087 | 9 | 118.36 | 260/260 |
| Chaos Tour | 22516 | 16085 | 0 | 16085 | 43 | 148.92 | 260/260 |
| Cult Hypergrowth | 27356 | 19513 | 0 | 19513 | 18 | 149.99 | 260/260 |
| No Social (Fame 0-50) | 26295 | 17572 | 0 | 17572 | 32 | 151.98 | 260/260 |
| High Controversy | 22431 | 16086 | 0 | 16086 | 29 | 143.55 | 260/260 |
| Early Game Probe (Fame 0–50) | 7480 | 4371 | 0 | 4371 | 9 | 44.56 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13498 | 9298 | 0 | 9298 | 15 | 102.98 | 260/260 |
| Late Game Probe (Fame 175+) | 20410 | 10334 | 0 | 10334 | 20 | 139.92 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €56.139 | €53.616 | €19.708 | €32.323 | €82.566 |
| Bootstrap Struggle | €631 | €0 | €2.630 | €0 | €1.328 |
| Aggressive Marketing | €23.803 | €23.743 | €10.124 | €11.087 | €35.291 |
| Scandal Recovery | €6.229 | €3.124 | €7.510 | €0 | €16.894 |
| Festival Push | €9.952 | €8.492 | €9.057 | €0 | €22.101 |
| Chaos Tour | €16.526 | €16.895 | €8.698 | €5.155 | €28.024 |
| Cult Hypergrowth | €24.581 | €24.681 | €10.146 | €11.798 | €36.803 |
| No Social (Fame 0-50) | €16.129 | €15.021 | €8.569 | €5.131 | €27.560 |
| High Controversy | €16.358 | €15.851 | €9.421 | €2.587 | €29.082 |
| Early Game Probe (Fame 0–50) | €11.105 | €10.695 | €4.698 | €5.716 | €17.180 |
| Mid Game Probe (Fame 60–150) | €13.828 | €13.381 | €7.365 | €4.994 | €23.029 |
| Late Game Probe (Fame 175+) | €29.598 | €29.618 | €9.387 | €18.101 | €41.219 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 230 | 260 | 88.46% | 84.01% | 91.80% |
| Aggressive Marketing | 4 | 260 | 1.54% | 0.60% | 3.89% |
| Scandal Recovery | 98 | 260 | 37.69% | 32.02% | 43.72% |
| Festival Push | 64 | 260 | 24.62% | 19.77% | 30.20% |
| Chaos Tour | 15 | 260 | 5.77% | 3.53% | 9.30% |
| Cult Hypergrowth | 5 | 260 | 1.92% | 0.82% | 4.42% |
| No Social (Fame 0-50) | 13 | 260 | 5.00% | 2.94% | 8.37% |
| High Controversy | 22 | 260 | 8.46% | 5.65% | 12.48% |
| Early Game Probe (Fame 0–50) | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Mid Game Probe (Fame 60–150) | 10 | 260 | 3.85% | 2.10% | 6.93% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €56.139 | 259 / €56.355 | 1 / €0 |
| Bootstrap Struggle | 260 / €631 | 30 / €5.472 | 230 / €0 |
| Aggressive Marketing | 260 / €23.803 | 256 / €24.175 | 4 / €0 |
| Scandal Recovery | 260 / €6.229 | 162 / €9.997 | 98 / €0 |
| Festival Push | 260 / €9.952 | 196 / €13.202 | 64 / €0 |
| Chaos Tour | 260 / €16.526 | 245 / €17.538 | 15 / €0 |
| Cult Hypergrowth | 260 / €24.581 | 255 / €25.062 | 5 / €0 |
| No Social (Fame 0-50) | 260 / €16.129 | 247 / €16.978 | 13 / €0 |
| High Controversy | 260 / €16.358 | 238 / €17.870 | 22 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €11.105 | 259 / €11.148 | 1 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €13.828 | 250 / €14.381 | 10 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.598 | 260 / €29.598 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €19.708 | 0.3511 | 61.30% | 74.03% |
| Bootstrap Struggle | €2.630 | 4.168 | 91.62% | 99.41% |
| Aggressive Marketing | €10.124 | 0.4253 | 59.02% | 83.15% |
| Scandal Recovery | €7.510 | 1.2057 | 82.03% | 99.28% |
| Festival Push | €9.057 | 0.9101 | 76.59% | 98.95% |
| Chaos Tour | €8.698 | 0.5263 | 61.68% | 92.53% |
| Cult Hypergrowth | €10.146 | 0.4128 | 60.58% | 85.39% |
| No Social (Fame 0-50) | €8.569 | 0.5313 | 61.49% | 88.95% |
| High Controversy | €9.421 | 0.5759 | 62.66% | 88.93% |
| Early Game Probe (Fame 0–50) | €4.698 | 0.4231 | 32.12% | 52.84% |
| Mid Game Probe (Fame 60–150) | €7.365 | 0.5326 | 48.30% | 78.45% |
| Late Game Probe (Fame 175+) | €9.387 | 0.3171 | 47.76% | 67.42% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 164 |
| brandDealsAvailable | 54 |
| postOptionsAvailable | 36 |
| contrabandItemsAvailable | 37 |
| upgradesAvailable | 67 |
| socialPlatformsAvailable | 4 |
| trendsAvailable | 5 |
| songsAvailable | 7 |
| questsAvailable | 32 |
| assetChassisAvailable | 24 |
| assetModulesAvailable | 63 |
| loanProfilesAvailable | 5 |

## Ausführungsabdeckung (Coverage)

| Feature | Covered | Evaluations / Attempts | Activations / Completions | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 143175 | 2407 | 53 |
| postOptions | ✅ | 11939 | 11939 | 28 |
| socialTrends | ✅ | 178553 | 21335 | 5 |
| contraband | ✅ | 178553 | 19658 | 37 |
| minigamesTravel | ✅ | 73386 | 73386 | - |
| minigamesRoadie | ✅ | 24371 | 24371 | - |
| minigamesKabelsalat | ✅ | 24674 | 24674 | - |
| minigamesAmp | ✅ | 24341 | 24341 | - |
| sponsorship | ✅ | 159489 | 1951 | - |
| restStops | ✅ | 94597 | 14719 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €56.139 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 803 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 88.46% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €631 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 812.2 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €23.803 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 988.18 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 37.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €6.229 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 897.7 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 24.62% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.952 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1018.25 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 5.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.526 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 847.18 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €24.581 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 932.56 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -0.77% | €-946 | 73.61 | -0.13 |
| Bootstrap Struggle | 2.69% | €-232 | 110.97 | -0.48 |
| Aggressive Marketing | -0.77% | €120 | 198.9 | -0.38 |
| Scandal Recovery | -1.16% | €55 | 135.3 | 0.48 |
| Festival Push | 2.7% | €-651 | 182.97 | -0.83 |
| Chaos Tour | 0.39% | €-977 | 178.33 | -0.25 |
| Cult Hypergrowth | 0.38% | €-1.752 | 139.9 | 0 |
| No Social (Fame 0-50) | 1.54% | €144 | 235.4 | 0.26 |
| High Controversy | 3.46% | €-256 | 153.62 | -1.07 |
| Early Game Probe (Fame 0–50) | -1.16% | €494 | 92.04 | 0.01 |
| Mid Game Probe (Fame 60–150) | 2.7% | €-957 | 136.97 | -0.27 |
| Late Game Probe (Fame 175+) | 0% | €-36 | 33.59 | 0.15 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 88.46% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €56.139 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.19 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
