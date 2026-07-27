# Game Balance Simulation – Analyse

Erstellt am: 2026-07-27T06:14:30.611Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.2
- Basis-Commit: 5248929c912f965a40cae3c80053b47165737515
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: a71bba481fb344a6a15a5440195d55d698b42c929765d60c11dd255970da5f11
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
| Baseline Touring | €500 | 0 | €48.877 | 62.03% | 0.11 | 0.3% | 20311 | 10 | 37 | 13.99 | 59.59 | 6.49 | 0% | €2.249 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.994 | 91.42% | 0.24 | 0.7% | 1514 | 2 | 54 | 0.98 | 7.75 | 4.62 | 61.92% | €1.871 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €23.098 | 58.26% | 0.12 | 1.3% | 8509 | 6 | 53 | 5.26 | 29.33 | 5.95 | 2.31% | €2.602 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €8.082 | 76.1% | 0.17 | 1% | 3733 | 4 | 51 | 2.12 | 15.07 | 4.82 | 17.69% | €2.049 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €10.483 | 73.35% | 0.14 | 2.1% | 4921 | 4 | 53 | 2.18 | 15.56 | 5.07 | 18.46% | €2.428 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.627 | 57.06% | 0.15 | 0.8% | 5891 | 5 | 43 | 5.68 | 26.99 | 5.75 | 1.92% | €2.130 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €24.696 | 61.62% | 0.11 | 1.5% | 7946 | 6 | 53 | 5.69 | 30.05 | 5.85 | 0.38% | €2.676 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €17.048 | 56.38% | 0.15 | 0.7% | 9301 | 6 | 51 | 0 | 28.62 | 5.56 | 1.54% | €2.041 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.992 | 58.38% | 0.15 | 0.8% | 7214 | 6 | 49 | 10.75 | 27.1 | 5.75 | 3.46% | €1.978 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €11.509 | 26.98% | 0.13 | 0.8% | 3147 | 3 | 42 | 5.38 | 9.11 | 2.36 | 1.15% | €1.963 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €14.927 | 44.47% | 0.15 | 0.7% | 4208 | 4 | 49 | 3.6 | 15.82 | 5.02 | 0.38% | €2.195 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €27.825 | 47.45% | 0.12 | 0.7% | 10665 | 7 | 39 | 8.92 | 25.83 | 5.15 | 0% | €2.384 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €54.553 | €499 | €2.249 | 6.82 | 2.35 | 21.94 | 7.88 | 11.71 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €7.749 | €149 | €1.871 | 0.32 | 0.28 | 5.85 | 0.66 | 3.65 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €31.402 | €447 | €2.602 | 2.6 | 1.18 | 16.62 | 4.16 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €12.735 | €334 | €2.049 | 0.97 | 0.56 | 10.05 | 1.99 | 5.43 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €16.127 | €349 | €2.428 | 1.05 | 0.56 | 11.32 | 2.03 | 5.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €22.508 | €445 | €2.130 | 2.58 | 1.1 | 14.53 | 3.67 | 7.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.463 | €452 | €2.676 | 2.83 | 1.17 | 17.04 | 4.21 | 7.38 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €22.618 | €443 | €2.041 | 0 | 0 | 15.54 | 3.99 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €21.934 | €411 | €1.978 | 2.86 | 1.2 | 14.55 | 3.83 | 7.47 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.955 | €450 | €1.963 | 0.19 | 0.12 | 3.83 | 1.01 | 1.92 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.820 | €1.390 | €2.195 | 0.75 | 0.35 | 8.09 | 2.11 | 4.06 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €37.695 | €4.957 | €2.384 | 1.5 | 0.55 | 8.49 | 3.53 | 4.6 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €24.058 | €27.431 | €37.458 | €48.877 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €5.145 | €2.691 | €2.208 | €1.994 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €13.401 | €16.724 | €21.353 | €23.098 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €7.039 | €6.593 | €6.380 | €8.082 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.116 | €8.303 | €8.449 | €10.483 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €10.165 | €12.148 | €15.637 | €16.627 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.564 | €18.095 | €22.716 | €24.696 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.282 | €12.235 | €15.622 | €17.048 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.633 | €11.038 | €15.052 | €16.992 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €10.226 | — | — | €11.509 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €12.201 | €14.262 | — | €14.927 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €26.555 | — | — | €27.825 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.249 | €97 | 23.1× | 11.12 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.871 | €61 | 32.3× | 13.36 | 0.8 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.602 | €89 | 29.3× | 9.61 | 0.58 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.049 | €72 | 29.2× | 12.2 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.428 | €77 | 32.2× | 10.3 | 0.62 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.130 | €85 | 25.3× | 11.74 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.676 | €89 | 30.2× | 9.34 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.041 | €86 | 24× | 12.25 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.978 | €82 | 24.5× | 12.64 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.963 | €73 | 26.9× | 12.74 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.195 | €84 | 26.1× | 11.39 | 0.68 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.384 | €96 | 24.9× | 10.49 | 0.63 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.6 | 49 | 54.1% | 41.2% | 4.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.8 | 48 | 55.7% | 39.2% | 5.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 53 | 38.9% | 52.1% | 9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.5 | 50 | 49.8% | 44.4% | 5.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.3 | 56 | 27.7% | 59.1% | 13.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.3% | 33.3% | 3.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8.1 | 53 | 40.3% | 53% | 6.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.6 | 49 | 53.6% | 41.2% | 5.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.8 | 48 | 55.5% | 40% | 4.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 48.6% | 43.8% | 7.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 50 | 50.1% | 45.3% | 4.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.4 | 51 | 48.8% | 43.6% | 7.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 37 | 6.49 | 1.77 | 0.63 | 7.94 | 11.17 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 54 | 4.62 | 0.23 | 0.15 | 6.52 | 1.47 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 53 | 5.95 | 0.93 | 0.5 | 8.3 | 5.35 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 4.82 | 0.46 | 0.3 | 7.69 | 2.7 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 5.07 | 0.47 | 0.27 | 7.72 | 2.71 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 43 | 5.75 | 0.89 | 0.41 | 8.35 | 4.89 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.85 | 0.93 | 0.36 | 8.24 | 5.27 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 51 | 5.56 | 0 | 0 | 8.33 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 49 | 5.75 | 0.93 | 0.44 | 7.97 | 4.83 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.36 | 0.1 | 0.02 | 2.12 | 1.7 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 49 | 5.02 | 0.3 | 0.11 | 4.22 | 2.73 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 39 | 5.15 | 0.47 | 0.08 | 3.2 | 4.38 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.08 | 1.49 | 1.55 | 0.88 | 4.16 | 8.91 | 30.39 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.14 | 1.85 | 1.67 | 0.15 | 0.7 | 7.03 | 10.45 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.92 | 2.81 | 2.7 | 0.71 | 3.47 | 9.01 | 24.59 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.84 | 3.35 | 3.17 | 0.5 | 2.07 | 8.54 | 16.92 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.06 | 1.7 | 1.65 | 0.27 | 1.15 | 8.62 | 18.23 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.72 | 4.13 | 4.45 | 1.03 | 5.04 | 8.83 | 22.24 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.68 | 2.52 | 2.47 | 0.6 | 3.07 | 9.13 | 24.98 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.42 | 2.27 | 2.23 | 0.52 | 2.49 | 9.1 | 23.4 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.45 | 2.29 | 2.3 | 0.53 | 2.54 | 8.88 | 22.1 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.21 | 0.38 | 0.38 | 0.11 | 0.61 | 2.39 | 5.76 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.6 | 1.02 | 0.93 | 0.25 | 1.16 | 4.83 | 12.44 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.65 | 0.93 | 0.85 | 0.5 | 2.59 | 3.59 | 12.06 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59.59 | 19.92 | 19.83 | 19.84 | 119.18 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 7.75 | 2.58 | 2.55 | 2.62 | 15.5 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.33 | 9.78 | 9.62 | 9.93 | 58.66 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 15.07 | 5 | 5.02 | 5.04 | 30.13 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 15.56 | 5.3 | 5.13 | 5.13 | 31.12 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.99 | 8.92 | 8.99 | 9.08 | 53.98 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 30.05 | 9.9 | 10.04 | 10.11 | 60.1 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 28.62 | 9.45 | 9.62 | 9.55 | 57.24 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 27.1 | 9.1 | 9.09 | 8.91 | 54.2 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.11 | 3.07 | 2.98 | 3.05 | 18.21 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.82 | 5.26 | 5.37 | 5.18 | 31.63 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 25.83 | 8.59 | 8.67 | 8.58 | 51.67 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.87 | 0.37 | 6.79 | 1 | 3.63 | 4.73 | €3.295 | 6.69 | 100% |
| Bootstrap Struggle | 0.63 | 0.4 | 1.67 | 1.41 | 1.33 | 1.63 | €1.904 | 5.43 | 71.9% |
| Aggressive Marketing | 2.9 | 0.78 | 6.42 | 1 | 3.53 | 2.97 | €2.906 | 5.69 | 100% |
| Scandal Recovery | 1.44 | 0.71 | 4.1 | 1.57 | 2.31 | 2.72 | €2.025 | 7.29 | 93.8% |
| Festival Push | 1.91 | 0.93 | 4.83 | 1.33 | 2.72 | 1.53 | €2.196 | 6.9 | 99.2% |
| Chaos Tour | 2.59 | 0.89 | 5.95 | 1.21 | 3.37 | 3.02 | €2.710 | 7.13 | 96.9% |
| Cult Hypergrowth | 2.78 | 0.48 | 6.38 | 1.13 | 3.5 | 3.79 | €2.885 | 5.26 | 99.2% |
| No Social (Fame 0-50) | 2.41 | 0.88 | 5.75 | 1.28 | 3.21 | 2.81 | €2.582 | 6.68 | 98.5% |
| High Controversy | 2.28 | 0.92 | 5.3 | 1.27 | 3.09 | 3.36 | €2.693 | 7.85 | 96.5% |
| Early Game Probe (Fame 0–50) | 0.78 | 0.37 | 0.64 | 0.52 | 0.9 | 1.61 | €806 | 0.02 | 94.2% |
| Mid Game Probe (Fame 60–150) | 1.9 | 0.58 | 2.77 | 0.85 | 2.37 | 2.28 | €2.264 | 2.78 | 96.9% |
| Late Game Probe (Fame 175+) | 2.12 | 0.26 | 2.68 | 0.59 | 2.42 | 2.79 | €2.488 | 0.77 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €48.877 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 20311 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 61.92% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.676 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €54.553 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 59.59 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.37 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 47147 | 26789 | 0 | 26789 | 47 | 0 | 260/260 |
| Bootstrap Struggle | 6597 | 5066 | 0 | 5066 | 18 | 0 | 260/260 |
| Aggressive Marketing | 28201 | 19674 | 0 | 19674 | 18 | 0 | 260/260 |
| Scandal Recovery | 13920 | 10167 | 0 | 10167 | 20 | 0 | 260/260 |
| Festival Push | 16846 | 11914 | 0 | 11914 | 11 | 0 | 260/260 |
| Chaos Tour | 22257 | 16321 | 0 | 16321 | 45 | 0 | 260/260 |
| Cult Hypergrowth | 27972 | 20007 | 0 | 20007 | 19 | 0 | 260/260 |
| No Social (Fame 0-50) | 27289 | 17956 | 0 | 17956 | 32 | 0 | 260/260 |
| High Controversy | 23784 | 16536 | 0 | 16536 | 33 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7448 | 4293 | 0 | 4293 | 9 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13597 | 9434 | 0 | 9434 | 15 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 20654 | 10143 | 0 | 10143 | 21 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €48.877 | €48.584 | €19.507 | €23.785 | €74.736 |
| Bootstrap Struggle | €1.994 | €0 | €3.818 | €0 | €7.098 |
| Aggressive Marketing | €23.098 | €23.036 | €9.691 | €9.958 | €35.210 |
| Scandal Recovery | €8.082 | €6.324 | €7.197 | €0 | €18.075 |
| Festival Push | €10.483 | €9.577 | €9.045 | €0 | €23.743 |
| Chaos Tour | €16.627 | €16.108 | €8.032 | €6.647 | €27.221 |
| Cult Hypergrowth | €24.696 | €23.665 | €10.355 | €12.462 | €36.860 |
| No Social (Fame 0-50) | €17.048 | €15.986 | €8.746 | €6.488 | €29.153 |
| High Controversy | €16.992 | €15.648 | €8.713 | €5.983 | €28.679 |
| Early Game Probe (Fame 0–50) | €11.509 | €11.077 | €4.588 | €6.368 | €18.038 |
| Mid Game Probe (Fame 60–150) | €14.927 | €14.303 | €6.413 | €7.139 | €23.074 |
| Late Game Probe (Fame 175+) | €27.825 | €27.873 | €8.669 | €16.923 | €39.145 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 161 | 260 | 61.92% | 55.89% | 67.61% |
| Aggressive Marketing | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Scandal Recovery | 46 | 260 | 17.69% | 13.53% | 22.79% |
| Festival Push | 48 | 260 | 18.46% | 14.22% | 23.62% |
| Chaos Tour | 5 | 260 | 1.92% | 0.82% | 4.42% |
| Cult Hypergrowth | 1 | 260 | 0.38% | 0.07% | 2.15% |
| No Social (Fame 0-50) | 4 | 260 | 1.54% | 0.60% | 3.89% |
| High Controversy | 9 | 260 | 3.46% | 1.83% | 6.45% |
| Early Game Probe (Fame 0–50) | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Mid Game Probe (Fame 60–150) | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €48.877 | 260 / €48.877 | 0 / €0 |
| Bootstrap Struggle | 260 / €1.994 | 99 / €5.238 | 161 / €0 |
| Aggressive Marketing | 260 / €23.098 | 254 / €23.644 | 6 / €0 |
| Scandal Recovery | 260 / €8.082 | 214 / €9.820 | 46 / €0 |
| Festival Push | 260 / €10.483 | 212 / €12.856 | 48 / €0 |
| Chaos Tour | 260 / €16.627 | 255 / €16.953 | 5 / €0 |
| Cult Hypergrowth | 260 / €24.696 | 259 / €24.792 | 1 / €0 |
| No Social (Fame 0-50) | 260 / €17.048 | 256 / €17.315 | 4 / €0 |
| High Controversy | 260 / €16.992 | 251 / €17.602 | 9 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €11.509 | 257 / €11.643 | 3 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €14.927 | 259 / €14.984 | 1 / €0 |
| Late Game Probe (Fame 175+) | 260 / €27.825 | 260 / €27.825 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €19.507 | 0.3991 | 62.03% | 75.26% |
| Bootstrap Struggle | €3.818 | 1.9147 | 91.42% | 99.82% |
| Aggressive Marketing | €9.691 | 0.4196 | 58.26% | 87.27% |
| Scandal Recovery | €7.197 | 0.8905 | 76.10% | 99.34% |
| Festival Push | €9.045 | 0.8628 | 73.35% | 99.07% |
| Chaos Tour | €8.032 | 0.4831 | 57.06% | 84.88% |
| Cult Hypergrowth | €10.355 | 0.4193 | 61.62% | 90.72% |
| No Social (Fame 0-50) | €8.746 | 0.513 | 56.38% | 87.64% |
| High Controversy | €8.713 | 0.5128 | 58.38% | 87.89% |
| Early Game Probe (Fame 0–50) | €4.588 | 0.3986 | 26.98% | 49.16% |
| Mid Game Probe (Fame 60–150) | €6.413 | 0.4296 | 44.47% | 77.57% |
| Late Game Probe (Fame 175+) | €8.669 | 0.3116 | 47.45% | 68.88% |

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
| brandDeals | ✅ | 155470 | 2448 | 53 |
| postOptions | ✅ | 12273 | 12273 | 27 |
| socialTrends | ✅ | 191633 | 23106 | 5 |
| contraband | ✅ | 191633 | 20952 | 37 |
| minigamesTravel | ✅ | 75614 | 44499 | - |
| minigamesRoadie | ✅ | 25186 | 22842 | - |
| minigamesKabelsalat | ✅ | 25200 | 17470 | - |
| minigamesAmp | ✅ | 25228 | 18142 | - |
| sponsorship | ✅ | 172278 | 1944 | - |
| restStops | ✅ | 98684 | 16248 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €48.877 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 792.18 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 61.92% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €1.994 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 819.39 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €23.098 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 965.24 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 17.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €8.082 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 905.28 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 18.46% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €10.483 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1056.77 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.627 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 824.29 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €24.696 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 934.55 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -1.15% | €-8.208 | 62.79 | -0.53 |
| Bootstrap Struggle | -23.85% | €1.131 | 118.16 | 3.02 |
| Aggressive Marketing | 0% | €-585 | 175.96 | -0.28 |
| Scandal Recovery | -21.16% | €1.908 | 142.88 | 2.17 |
| Festival Push | -3.46% | €-120 | 221.49 | 0.09 |
| Chaos Tour | -3.46% | €-876 | 155.44 | 0.22 |
| Cult Hypergrowth | -1.16% | €-1.637 | 141.89 | 0.54 |
| No Social (Fame 0-50) | -1.92% | €1.063 | 234.68 | 1.01 |
| High Controversy | -1.54% | €378 | 170.03 | 0.04 |
| Early Game Probe (Fame 0–50) | -0.39% | €898 | 86.08 | 0.04 |
| Mid Game Probe (Fame 60–150) | -0.77% | €142 | 129.84 | -0.06 |
| Late Game Probe (Fame 175+) | 0% | €-1.809 | 52.7 | -0.19 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 61.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €48.877 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.37 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
