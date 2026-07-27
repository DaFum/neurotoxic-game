# Game Balance Simulation – Analyse

Erstellt am: 2026-07-27T07:05:19.320Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.1
- Basis-Commit: 17cd959c5b0b7046149be3af3d8e01aba472007e
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 9fe00b42a75a62090c23cdf62086b266cd964330d4d1b7d6d1ca6e58d0d6889e
- Szenariokonfiguration SHA-256: e2f97ba93da6a842fa33908edf7acf33b2404c753b18903421f900c04aa7c6c0
- KPI-Zielkonfiguration SHA-256: 7e243b1d2ee21d2c19e764cba96afa604f633f210757fa6e9eb8843aa226cfa7
- Seed-Strategie: scenario-id-plus-run-index

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €5 |
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
| Baseline Touring | €500 | 0 | €59.400 | 61.4% | 0.1 | 2.7% | 21552 | 10 | 39 | 11.31 | 59.95 | 6.43 | 0.38% | €2.500 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.944 | 92.81% | 0.25 | 1.3% | 1551 | 2 | 53 | 1.11 | 7.72 | 4.58 | 58.08% | €1.869 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €25.113 | 58.78% | 0.11 | 3.8% | 9675 | 6 | 57 | 5.29 | 29.86 | 5.82 | 1.15% | €2.749 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €7.620 | 78.77% | 0.17 | 1.7% | 4469 | 4 | 52 | 2.28 | 14.7 | 4.86 | 22.69% | €2.083 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €11.596 | 73.67% | 0.14 | 3.7% | 5186 | 5 | 53 | 2.2 | 16.01 | 5.02 | 13.85% | €2.517 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €19.230 | 57.61% | 0.14 | 2.3% | 6494 | 5 | 43 | 4.42 | 27.05 | 5.92 | 2.31% | €2.280 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.780 | 60.87% | 0.1 | 4.2% | 8341 | 6 | 55 | 5.03 | 29.7 | 5.87 | 1.15% | €2.830 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €18.510 | 57.55% | 0.14 | 1.9% | 8407 | 6 | 52 | 0 | 28.66 | 5.68 | 2.31% | €2.144 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.924 | 62.23% | 0.15 | 1.6% | 6482 | 5 | 51 | 11.23 | 26.63 | 5.7 | 4.23% | €2.052 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €11.406 | 30.49% | 0.13 | 1.9% | 3121 | 3 | 41 | 6.45 | 9.12 | 2.42 | 0.77% | €2.053 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €15.190 | 46.11% | 0.15 | 1.8% | 4176 | 4 | 49 | 4.17 | 15.76 | 5.12 | 0.38% | €2.303 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €28.877 | 51.85% | 0.1 | 3.2% | 10957 | 7 | 42 | 10.34 | 26.03 | 5.11 | 0% | €2.658 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €62.187 | €497 | €2.500 | 6.71 | 2.22 | 21.24 | 7.91 | 11.77 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €7.572 | €169 | €1.869 | 0.37 | 0.31 | 5.52 | 0.68 | 3.58 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €33.931 | €462 | €2.749 | 2.68 | 1.17 | 17.19 | 4.22 | 7.81 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €12.687 | €339 | €2.083 | 0.95 | 0.53 | 10.16 | 1.96 | 5.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €16.925 | €386 | €2.517 | 1.05 | 0.57 | 11.66 | 2.1 | 5.39 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €24.732 | €454 | €2.280 | 2.69 | 1.17 | 14.61 | 3.57 | 7.33 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €35.060 | €462 | €2.830 | 2.59 | 1.08 | 16.79 | 4.15 | 7.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €23.693 | €457 | €2.144 | 0 | 0 | 15.5 | 3.96 | 7.71 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €21.688 | €421 | €2.052 | 2.42 | 1.1 | 14.45 | 3.72 | 7.26 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.194 | €463 | €2.053 | 0.23 | 0.14 | 3.87 | 0.98 | 1.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €19.400 | €1.412 | €2.303 | 0.83 | 0.38 | 8.08 | 2.12 | 4.02 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.006 | €4.857 | €2.658 | 1.53 | 0.56 | 8.85 | 3.54 | 4.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.425 | €28.968 | €42.801 | €59.400 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €5.045 | €2.347 | €1.878 | €1.944 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €13.624 | €18.112 | €22.232 | €25.113 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €6.823 | €6.208 | €5.973 | €7.620 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.107 | €8.456 | €8.431 | €11.596 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €10.322 | €12.484 | €16.687 | €19.230 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.856 | €18.757 | €23.143 | €26.780 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.448 | €12.364 | €15.807 | €18.510 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.806 | €10.294 | €13.703 | €16.924 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €10.168 | — | — | €11.406 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €12.405 | €14.482 | — | €15.190 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €28.368 | — | — | €28.877 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.500 | €98 | 25.7× | 10 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.869 | €60 | 32.7× | 13.38 | 0.8 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.749 | €90 | 30.9× | 9.09 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.083 | €72 | 30× | 12 | 0.72 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.517 | €77 | 33.3× | 9.93 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.280 | €85 | 27.1× | 10.96 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.830 | €89 | 31.9× | 8.83 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.144 | €86 | 25.3× | 11.66 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.052 | €81 | 25.6× | 12.18 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.053 | €73 | 28.3× | 12.18 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.303 | €84 | 27.5× | 10.86 | 0.65 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.658 | €96 | 27.9× | 9.41 | 0.56 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 51.8% | 42.4% | 5.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.8 | 48 | 56.7% | 38.9% | 4.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.8 | 54 | 37.7% | 51.5% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.3 | 51 | 48.3% | 44.7% | 7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.3 | 57 | 27.1% | 60.2% | 12.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.4% | 32.7% | 3.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 7.9 | 53 | 38.9% | 52.3% | 8.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.1% | 41% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 48 | 55.6% | 39.7% | 4.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 47.9% | 44.3% | 7.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 50 | 49.9% | 45.7% | 4.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.2 | 51 | 46.7% | 45.1% | 8.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.43 | 1.71 | 0.54 | 8.26 | 10.83 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 53 | 4.58 | 0.24 | 0.14 | 6.15 | 1.43 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 57 | 5.82 | 0.93 | 0.46 | 8.19 | 5.41 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 52 | 4.86 | 0.42 | 0.27 | 7.55 | 2.74 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 5.02 | 0.45 | 0.29 | 7.92 | 2.84 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 43 | 5.92 | 0.93 | 0.42 | 8.25 | 4.93 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 55 | 5.87 | 0.85 | 0.35 | 8.06 | 4.98 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 52 | 5.68 | 0 | 0 | 8.08 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 5.7 | 0.88 | 0.47 | 8.11 | 4.64 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 41 | 2.42 | 0.12 | 0.03 | 2.11 | 1.74 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 49 | 5.12 | 0.32 | 0.13 | 4.19 | 2.68 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 42 | 5.11 | 0.45 | 0.09 | 3.29 | 4.72 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.02 | 1.65 | 1.55 | 0.82 | 4.1 | 8.8 | 29.38 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.03 | 1.86 | 1.67 | 0.17 | 0.72 | 7 | 10.1 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.87 | 2.7 | 2.83 | 0.72 | 3.64 | 8.89 | 25.37 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.69 | 3.28 | 3.26 | 0.46 | 2.1 | 8.09 | 16.72 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.07 | 1.74 | 1.8 | 0.21 | 1.19 | 8.55 | 18.6 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.71 | 4.37 | 4.32 | 1.11 | 5.12 | 9.25 | 22.25 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.6 | 2.58 | 2.38 | 0.6 | 3.04 | 8.82 | 24.67 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.44 | 2.17 | 2.28 | 0.52 | 2.59 | 9.06 | 23.45 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.45 | 2.31 | 2.14 | 0.5 | 2.6 | 8.68 | 21.95 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.37 | 0.4 | 0.1 | 0.68 | 2.34 | 5.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.55 | 1.07 | 0.95 | 0.26 | 1.17 | 4.88 | 12.51 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.64 | 0.88 | 0.95 | 0.56 | 2.61 | 3.37 | 12.41 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59.95 | 19.85 | 20.15 | 19.95 | 119.9 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 7.72 | 2.65 | 2.55 | 2.52 | 15.44 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.86 | 10.03 | 9.83 | 9.99 | 59.71 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 14.7 | 4.84 | 4.93 | 4.93 | 29.4 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 16.01 | 5.48 | 5.35 | 5.18 | 32.02 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 27.05 | 8.95 | 9.05 | 9.05 | 54.1 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.7 | 9.92 | 10.02 | 9.77 | 59.41 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 28.66 | 9.46 | 9.57 | 9.63 | 57.32 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 26.63 | 8.87 | 8.87 | 8.89 | 53.26 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.12 | 3.05 | 3.04 | 3.02 | 18.23 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.76 | 5.24 | 5.33 | 5.18 | 31.51 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.03 | 8.65 | 8.66 | 8.72 | 52.06 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.96 | 0.28 | 6.87 | 1.01 | 3.71 | 4.78 | €3.260 | 6.67 | 100% |
| Bootstrap Struggle | 0.85 | 0.53 | 1.79 | 1.4 | 1.51 | 1.62 | €1.885 | 5.27 | 71.9% |
| Aggressive Marketing | 2.83 | 0.67 | 6.45 | 1.07 | 3.52 | 3.11 | €2.834 | 5.34 | 99.6% |
| Scandal Recovery | 1.63 | 0.87 | 4.13 | 1.46 | 2.47 | 2.69 | €2.044 | 7.13 | 95.4% |
| Festival Push | 2.05 | 0.95 | 5.15 | 1.32 | 2.85 | 1.59 | €2.173 | 6.63 | 100% |
| Chaos Tour | 2.63 | 0.83 | 6.07 | 1.2 | 3.35 | 3.14 | €2.830 | 6.87 | 95.8% |
| Cult Hypergrowth | 2.86 | 0.48 | 6.45 | 1.1 | 3.59 | 3.84 | €2.904 | 5.47 | 99.6% |
| No Social (Fame 0-50) | 2.5 | 0.87 | 5.88 | 1.22 | 3.3 | 2.77 | €2.654 | 6.55 | 99.6% |
| High Controversy | 2.37 | 0.9 | 5.53 | 1.22 | 3.14 | 3.31 | €2.649 | 7.96 | 97.3% |
| Early Game Probe (Fame 0–50) | 0.85 | 0.39 | 0.74 | 0.52 | 0.98 | 1.68 | €833 | 0.03 | 93.5% |
| Mid Game Probe (Fame 60–150) | 1.93 | 0.55 | 2.95 | 0.82 | 2.39 | 2.28 | €2.306 | 2.83 | 97.3% |
| Late Game Probe (Fame 175+) | 2.2 | 0.27 | 2.89 | 0.58 | 2.53 | 2.84 | €2.449 | 0.62 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €59.400 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 21552 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 58.08% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.830 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €62.187 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 59.95 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.62 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 47589 | 25992 | 0 | 25992 | 45 | 0 | 260/260 |
| Bootstrap Struggle | 6375 | 4806 | 0 | 4806 | 18 | 0 | 260/260 |
| Aggressive Marketing | 29861 | 20169 | 0 | 20169 | 17 | 0 | 260/260 |
| Scandal Recovery | 14826 | 10342 | 0 | 10342 | 16 | 0 | 260/260 |
| Festival Push | 17573 | 12376 | 0 | 12376 | 10 | 0 | 260/260 |
| Chaos Tour | 22937 | 16401 | 0 | 16401 | 43 | 0 | 260/260 |
| Cult Hypergrowth | 27949 | 19591 | 0 | 19591 | 18 | 0 | 260/260 |
| No Social (Fame 0-50) | 26512 | 18073 | 0 | 18073 | 32 | 0 | 260/260 |
| High Controversy | 23207 | 16694 | 0 | 16694 | 31 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7470 | 4342 | 0 | 4342 | 8 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13507 | 9376 | 0 | 9376 | 15 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 20962 | 10162 | 0 | 10162 | 18 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €59.400 | €58.478 | €21.014 | €33.669 | €85.114 |
| Bootstrap Struggle | €1.944 | €0 | €3.456 | €0 | €6.703 |
| Aggressive Marketing | €25.113 | €24.342 | €10.286 | €13.227 | €36.045 |
| Scandal Recovery | €7.620 | €5.727 | €7.661 | €0 | €17.151 |
| Festival Push | €11.596 | €10.445 | €9.167 | €0 | €25.078 |
| Chaos Tour | €19.230 | €18.612 | €9.253 | €7.591 | €31.673 |
| Cult Hypergrowth | €26.780 | €25.453 | €11.056 | €14.569 | €38.794 |
| No Social (Fame 0-50) | €18.510 | €17.333 | €9.234 | €7.189 | €31.113 |
| High Controversy | €16.924 | €16.299 | €9.076 | €4.736 | €30.111 |
| Early Game Probe (Fame 0–50) | €11.406 | €10.838 | €5.106 | €5.490 | €18.279 |
| Mid Game Probe (Fame 60–150) | €15.190 | €13.976 | €6.860 | €6.884 | €24.275 |
| Late Game Probe (Fame 175+) | €28.877 | €28.380 | €9.689 | €17.864 | €41.092 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 151 | 260 | 58.08% | 52.00% | 63.91% |
| Aggressive Marketing | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Scandal Recovery | 59 | 260 | 22.69% | 18.02% | 28.16% |
| Festival Push | 36 | 260 | 13.85% | 10.17% | 18.57% |
| Chaos Tour | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Cult Hypergrowth | 3 | 260 | 1.15% | 0.39% | 3.34% |
| No Social (Fame 0-50) | 6 | 260 | 2.31% | 1.06% | 4.94% |
| High Controversy | 11 | 260 | 4.23% | 2.38% | 7.42% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €59.400 | 259 / €59.630 | 1 / €0 |
| Bootstrap Struggle | 260 / €1.944 | 109 / €4.636 | 151 / €0 |
| Aggressive Marketing | 260 / €25.113 | 257 / €25.406 | 3 / €0 |
| Scandal Recovery | 260 / €7.620 | 201 / €9.856 | 59 / €0 |
| Festival Push | 260 / €11.596 | 224 / €13.460 | 36 / €0 |
| Chaos Tour | 260 / €19.230 | 254 / €19.684 | 6 / €0 |
| Cult Hypergrowth | 260 / €26.780 | 257 / €27.093 | 3 / €0 |
| No Social (Fame 0-50) | 260 / €18.510 | 254 / €18.947 | 6 / €0 |
| High Controversy | 260 / €16.924 | 249 / €17.671 | 11 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €11.406 | 258 / €11.494 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €15.190 | 259 / €15.249 | 1 / €0 |
| Late Game Probe (Fame 175+) | 260 / €28.877 | 260 / €28.877 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €21.014 | 0.3538 | 61.40% | 74.98% |
| Bootstrap Struggle | €3.456 | 1.7778 | 92.81% | 99.84% |
| Aggressive Marketing | €10.286 | 0.4096 | 58.78% | 81.27% |
| Scandal Recovery | €7.661 | 1.0054 | 78.77% | 99.36% |
| Festival Push | €9.167 | 0.7905 | 73.67% | 98.46% |
| Chaos Tour | €9.253 | 0.4812 | 57.61% | 87.27% |
| Cult Hypergrowth | €11.056 | 0.4128 | 60.87% | 84.79% |
| No Social (Fame 0-50) | €9.234 | 0.4989 | 57.55% | 86.07% |
| High Controversy | €9.076 | 0.5363 | 62.23% | 91.55% |
| Early Game Probe (Fame 0–50) | €5.106 | 0.4477 | 30.49% | 57.93% |
| Mid Game Probe (Fame 60–150) | €6.860 | 0.4516 | 46.11% | 73.09% |
| Late Game Probe (Fame 175+) | €9.689 | 0.3355 | 51.85% | 69.59% |

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
| brandDeals | ✅ | 154651 | 2404 | 53 |
| postOptions | ✅ | 12203 | 12203 | 27 |
| socialTrends | ✅ | 190808 | 22807 | 5 |
| contraband | ✅ | 190808 | 20844 | 37 |
| minigamesTravel | ✅ | 75713 | 44561 | - |
| minigamesRoadie | ✅ | 25221 | 22919 | - |
| minigamesKabelsalat | ✅ | 25315 | 17727 | - |
| minigamesAmp | ✅ | 25177 | 18178 | - |
| sponsorship | ✅ | 171492 | 1896 | - |
| restStops | ✅ | 98328 | 15958 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €59.400 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 793.03 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 58.08% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €1.944 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 798.88 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €25.113 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 1000.52 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 22.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €7.620 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 969.25 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 13.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €8.500 – €50.000 | €11.596 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1081.28 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €19.230 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 840.07 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.780 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 942.91 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.38% | €-154 | 7.88 | -0.89 |
| Bootstrap Struggle | -6.15% | €257 | 25.74 | 0.3 |
| Aggressive Marketing | -0.39% | €-680 | 29.41 | 0.25 |
| Scandal Recovery | -4.23% | €799 | 34.55 | 0.67 |
| Festival Push | -3.07% | €-242 | 28.11 | 0.13 |
| Chaos Tour | -2.31% | €1.578 | -14.55 | 0.56 |
| Cult Hypergrowth | 0.38% | €-24 | -28.34 | 0 |
| No Social (Fame 0-50) | 1.93% | €304 | 6.99 | -0.11 |
| High Controversy | 0.38% | €-654 | 7.53 | -0.3 |
| Early Game Probe (Fame 0–50) | -0.38% | €285 | -11.21 | 0.04 |
| Mid Game Probe (Fame 60–150) | -0.39% | €201 | -0.74 | 0.04 |
| Late Game Probe (Fame 175+) | 0% | €-873 | 4.64 | -0.11 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 58.08% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €59.400 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.62 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
