# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T23:29:36.798Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.2
- Basis-Commit: 266d432b47e4f83bc0498f2da8bc6b90087dd6eb
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 94455ecba5c30479cdbaf593bec2f36b011da0a825493ae6ba7c416a13fa6377
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
| Baseline Touring | €500 | 0 | €49.357 | 63.25% | 0.11 | 1% | 21752 | 10 | 37 | 10.32 | 59.85 | 6.43 | 0% | €2.265 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.862 | 91.07% | 0.25 | 1% | 1472 | 2 | 54 | 0.86 | 7.66 | 4.58 | 61.15% | €1.855 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €23.352 | 58.26% | 0.12 | 1.7% | 9850 | 7 | 56 | 6.33 | 29.75 | 5.91 | 1.15% | €2.622 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €7.896 | 75.37% | 0.17 | 1.5% | 3751 | 4 | 51 | 1.95 | 15.23 | 4.9 | 15.77% | €2.056 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €10.274 | 72.32% | 0.14 | 2.5% | 4453 | 4 | 53 | 2.35 | 15.48 | 5.02 | 14.23% | €2.423 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €16.469 | 59.99% | 0.15 | 1% | 7475 | 6 | 42 | 4.08 | 26.8 | 5.83 | 2.31% | €2.179 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €24.850 | 60.23% | 0.11 | 2.3% | 9482 | 6 | 53 | 5.38 | 29.7 | 5.9 | 1.92% | €2.720 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €17.355 | 55.01% | 0.15 | 0.9% | 8997 | 6 | 51 | 0 | 28.78 | 5.63 | 1.92% | €2.056 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €17.613 | 56.21% | 0.15 | 0.7% | 6272 | 5 | 49 | 10.38 | 27.23 | 5.73 | 3.85% | €1.998 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €12.100 | 26.92% | 0.13 | 1.5% | 3186 | 3 | 42 | 5.61 | 9.12 | 2.36 | 0.38% | €2.059 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €15.337 | 45.12% | 0.15 | 1.3% | 4241 | 4 | 47 | 5.86 | 15.78 | 5.13 | 0.77% | €2.249 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €28.768 | 50.05% | 0.11 | 2.3% | 10621 | 7 | 40 | 11.17 | 26.01 | 5.1 | 0% | €2.537 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €53.495 | €499 | €2.265 | 6.8 | 2.19 | 21.17 | 8 | 11.74 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €7.605 | €151 | €1.855 | 0.24 | 0.25 | 5.75 | 0.68 | 3.61 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €32.097 | €445 | €2.622 | 2.78 | 1.18 | 17.11 | 4.22 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €12.892 | €342 | €2.056 | 0.95 | 0.55 | 10.33 | 2.02 | 5.48 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €15.853 | €356 | €2.423 | 0.93 | 0.52 | 11.48 | 2.05 | 5.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €22.862 | €440 | €2.179 | 2.67 | 1.18 | 14.28 | 3.59 | 7.3 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.674 | €448 | €2.720 | 2.63 | 1.15 | 16.81 | 4.14 | 7.29 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €23.026 | €445 | €2.056 | 0 | 0 | 15.58 | 4.02 | 7.79 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €22.008 | €409 | €1.998 | 2.85 | 1.17 | 14.48 | 3.78 | 7.5 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.738 | €452 | €2.059 | 0.18 | 0.13 | 3.81 | 1 | 1.94 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €19.491 | €1.394 | €2.249 | 0.9 | 0.44 | 7.95 | 2.13 | 4.04 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €38.856 | €4.924 | €2.537 | 1.41 | 0.55 | 9.01 | 3.57 | 4.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.414 | €27.439 | €38.060 | €49.357 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €5.172 | €2.599 | €2.217 | €1.862 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €13.876 | €17.430 | €21.943 | €23.352 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €7.284 | €6.550 | €6.404 | €7.896 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.425 | €8.080 | €8.506 | €10.274 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €10.728 | €12.108 | €15.947 | €16.469 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €15.211 | €18.066 | €23.525 | €24.850 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.923 | €12.597 | €16.293 | €17.355 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €8.536 | €11.505 | €15.014 | €17.613 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €10.848 | — | — | €12.100 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €12.736 | €14.584 | — | €15.337 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.371 | — | — | €28.768 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.265 | €97 | 23.3× | 11.04 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.855 | €60 | 32× | 13.48 | 0.81 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.622 | €90 | 29.4× | 9.53 | 0.57 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.056 | €72 | 29× | 12.16 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.423 | €77 | 32.1× | 10.32 | 0.62 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.179 | €85 | 25.8× | 11.47 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.720 | €90 | 30.4× | 9.19 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.056 | €86 | 23.9× | 12.16 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.998 | €83 | 24.4× | 12.51 | 0.75 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.059 | €73 | 28.1× | 12.14 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.249 | €84 | 26.7× | 11.12 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.537 | €96 | 26.6× | 9.85 | 0.59 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.6 | 49 | 53.6% | 41.5% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.8 | 48 | 57.1% | 37.8% | 5.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 54 | 38.2% | 52.1% | 9.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.4 | 50 | 49.7% | 44% | 6.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.4 | 56 | 28% | 59.6% | 12.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 62.1% | 34% | 3.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8.1 | 53 | 39.9% | 53.7% | 6.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.6 | 49 | 53.3% | 41.6% | 5.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.8 | 48 | 56.7% | 39.1% | 4.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 48.6% | 43.7% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 50 | 50.1% | 45.2% | 4.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 47% | 45.5% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 37 | 6.43 | 1.81 | 0.52 | 8.27 | 10.68 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 54 | 4.58 | 0.21 | 0.14 | 6.31 | 1.38 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 56 | 5.91 | 0.9 | 0.49 | 8.25 | 5.42 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 51 | 4.9 | 0.44 | 0.29 | 7.73 | 2.72 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 5.02 | 0.43 | 0.28 | 7.97 | 2.83 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 42 | 5.83 | 0.95 | 0.5 | 8.26 | 4.71 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.9 | 0.93 | 0.41 | 8.53 | 5.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 51 | 5.63 | 0 | 0 | 8.28 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 49 | 5.73 | 0.97 | 0.48 | 8.1 | 4.92 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.36 | 0.1 | 0.03 | 2.14 | 1.73 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 47 | 5.13 | 0.36 | 0.14 | 4.36 | 2.71 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 5.1 | 0.44 | 0.1 | 3.22 | 4.6 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.13 | 1.6 | 1.53 | 0.92 | 4.02 | 9.05 | 29.5 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.12 | 1.81 | 1.78 | 0.16 | 0.68 | 6.99 | 10.4 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.88 | 2.73 | 2.76 | 0.65 | 3.52 | 8.96 | 25.22 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.97 | 3.19 | 3.26 | 0.47 | 2.28 | 8.35 | 17.13 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.05 | 1.7 | 1.81 | 0.22 | 1.19 | 8.47 | 18.48 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.8 | 4.42 | 4.52 | 1.08 | 5.09 | 8.52 | 22 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.68 | 2.57 | 2.25 | 0.63 | 3.03 | 8.83 | 24.56 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.42 | 2.24 | 2.22 | 0.5 | 2.55 | 9.17 | 23.54 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.35 | 2.31 | 2.32 | 0.6 | 2.53 | 8.72 | 22.03 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.21 | 0.37 | 0.42 | 0.1 | 0.64 | 2.38 | 5.7 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.6 | 1.05 | 0.87 | 0.27 | 1.17 | 4.67 | 12.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.66 | 0.85 | 0.85 | 0.53 | 2.5 | 3.57 | 12.59 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59.85 | 19.88 | 20.05 | 19.93 | 119.71 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 7.66 | 2.63 | 2.5 | 2.52 | 15.31 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.75 | 10.14 | 9.87 | 9.73 | 59.49 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 15.23 | 4.97 | 5.1 | 5.16 | 30.46 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 15.48 | 5.35 | 5.09 | 5.05 | 30.97 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.8 | 8.79 | 9.01 | 9 | 53.6 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.7 | 9.93 | 9.92 | 9.85 | 59.4 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 28.78 | 9.4 | 9.78 | 9.6 | 57.56 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 27.23 | 9.11 | 9.04 | 9.08 | 54.46 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.12 | 3.03 | 3.05 | 3.05 | 18.25 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.78 | 5.3 | 5.3 | 5.19 | 31.57 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.01 | 8.64 | 8.67 | 8.7 | 52.02 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.9 | 0.32 | 6.9 | 1.01 | 3.62 | 4.77 | €3.244 | 6.37 | 100% |
| Bootstrap Struggle | 0.63 | 0.41 | 1.63 | 1.4 | 1.29 | 1.67 | €1.886 | 5.37 | 72.3% |
| Aggressive Marketing | 2.84 | 0.69 | 6.46 | 1.04 | 3.53 | 2.99 | €2.908 | 5.46 | 100% |
| Scandal Recovery | 1.58 | 0.75 | 4.16 | 1.51 | 2.45 | 2.68 | €2.074 | 7.28 | 93.8% |
| Festival Push | 1.9 | 0.91 | 4.87 | 1.35 | 2.7 | 1.58 | €2.166 | 7.18 | 100% |
| Chaos Tour | 2.52 | 0.85 | 5.91 | 1.15 | 3.23 | 3.08 | €2.765 | 7.31 | 97.7% |
| Cult Hypergrowth | 2.8 | 0.55 | 6.42 | 1.07 | 3.48 | 3.7 | €2.914 | 5.31 | 99.6% |
| No Social (Fame 0-50) | 2.44 | 0.84 | 5.89 | 1.3 | 3.26 | 2.78 | €2.629 | 6.46 | 99.2% |
| High Controversy | 2.35 | 0.9 | 5.4 | 1.26 | 3.18 | 3.35 | €2.681 | 7.75 | 96.5% |
| Early Game Probe (Fame 0–50) | 0.81 | 0.38 | 0.69 | 0.51 | 0.94 | 1.63 | €808 | 0.01 | 93.5% |
| Mid Game Probe (Fame 60–150) | 1.87 | 0.54 | 2.85 | 0.85 | 2.38 | 2.29 | €2.337 | 2.79 | 97.7% |
| Late Game Probe (Fame 175+) | 2.18 | 0.29 | 2.8 | 0.62 | 2.5 | 2.8 | €2.435 | 0.67 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €49.357 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 21752 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 61.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.720 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €53.495 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 59.85 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.92 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 47641 | 25843 | 0 | 25843 | 46 | 0 | 260/260 |
| Bootstrap Struggle | 6599 | 5110 | 0 | 5110 | 17 | 0 | 260/260 |
| Aggressive Marketing | 29756 | 19889 | 0 | 19889 | 17 | 0 | 260/260 |
| Scandal Recovery | 14356 | 10586 | 0 | 10586 | 19 | 0 | 260/260 |
| Festival Push | 16424 | 11959 | 0 | 11959 | 11 | 0 | 260/260 |
| Chaos Tour | 23750 | 16231 | 0 | 16231 | 45 | 0 | 260/260 |
| Cult Hypergrowth | 29126 | 19624 | 0 | 19624 | 19 | 0 | 260/260 |
| No Social (Fame 0-50) | 27169 | 18139 | 0 | 18139 | 32 | 0 | 260/260 |
| High Controversy | 22995 | 16692 | 0 | 16692 | 31 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7480 | 4286 | 0 | 4286 | 9 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13542 | 9345 | 0 | 9345 | 15 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 20892 | 10427 | 0 | 10427 | 19 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €49.357 | €49.064 | €17.212 | €28.660 | €70.498 |
| Bootstrap Struggle | €1.862 | €0 | €3.426 | €0 | €6.323 |
| Aggressive Marketing | €23.352 | €23.683 | €9.550 | €12.624 | €34.865 |
| Scandal Recovery | €7.896 | €6.482 | €6.806 | €0 | €17.324 |
| Festival Push | €10.274 | €9.094 | €8.349 | €0 | €22.339 |
| Chaos Tour | €16.469 | €16.083 | €8.162 | €5.961 | €27.640 |
| Cult Hypergrowth | €24.850 | €25.497 | €9.915 | €12.615 | €36.679 |
| No Social (Fame 0-50) | €17.355 | €16.617 | €8.636 | €7.154 | €29.607 |
| High Controversy | €17.613 | €16.193 | €9.191 | €6.084 | €31.058 |
| Early Game Probe (Fame 0–50) | €12.100 | €11.424 | €4.830 | €6.307 | €18.730 |
| Mid Game Probe (Fame 60–150) | €15.337 | €14.885 | €6.626 | €6.850 | €23.529 |
| Late Game Probe (Fame 175+) | €28.768 | €29.253 | €8.532 | €17.223 | €39.247 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 159 | 260 | 61.15% | 55.11% | 66.87% |
| Aggressive Marketing | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Scandal Recovery | 41 | 260 | 15.77% | 11.84% | 20.69% |
| Festival Push | 37 | 260 | 14.23% | 10.50% | 19.00% |
| Chaos Tour | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Cult Hypergrowth | 5 | 260 | 1.92% | 0.82% | 4.42% |
| No Social (Fame 0-50) | 5 | 260 | 1.92% | 0.82% | 4.42% |
| High Controversy | 10 | 260 | 3.85% | 2.10% | 6.93% |
| Early Game Probe (Fame 0–50) | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Mid Game Probe (Fame 60–150) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €49.357 | 260 / €49.357 | 0 / €0 |
| Bootstrap Struggle | 260 / €1.862 | 101 / €4.794 | 159 / €0 |
| Aggressive Marketing | 260 / €23.352 | 257 / €23.624 | 3 / €0 |
| Scandal Recovery | 260 / €7.896 | 219 / €9.375 | 41 / €0 |
| Festival Push | 260 / €10.274 | 223 / €11.979 | 37 / €0 |
| Chaos Tour | 260 / €16.469 | 254 / €16.858 | 6 / €0 |
| Cult Hypergrowth | 260 / €24.850 | 255 / €25.337 | 5 / €0 |
| No Social (Fame 0-50) | 260 / €17.355 | 255 / €17.695 | 5 / €0 |
| High Controversy | 260 / €17.613 | 250 / €18.318 | 10 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €12.100 | 259 / €12.147 | 1 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €15.337 | 258 / €15.456 | 2 / €0 |
| Late Game Probe (Fame 175+) | 260 / €28.768 | 260 / €28.768 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €17.212 | 0.3487 | 63.25% | 77.99% |
| Bootstrap Struggle | €3.426 | 1.84 | 91.07% | 99.76% |
| Aggressive Marketing | €9.550 | 0.409 | 58.26% | 81.33% |
| Scandal Recovery | €6.806 | 0.862 | 75.37% | 98.89% |
| Festival Push | €8.349 | 0.8126 | 72.32% | 98.87% |
| Chaos Tour | €8.162 | 0.4956 | 59.99% | 90.70% |
| Cult Hypergrowth | €9.915 | 0.399 | 60.23% | 85.29% |
| No Social (Fame 0-50) | €8.636 | 0.4976 | 55.01% | 83.70% |
| High Controversy | €9.191 | 0.5218 | 56.21% | 85.71% |
| Early Game Probe (Fame 0–50) | €4.830 | 0.3992 | 26.92% | 48.08% |
| Mid Game Probe (Fame 60–150) | €6.626 | 0.432 | 45.12% | 76.63% |
| Late Game Probe (Fame 175+) | €8.532 | 0.2966 | 50.05% | 69.15% |

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
| brandDeals | ✅ | 155954 | 2422 | 50 |
| postOptions | ✅ | 12226 | 12226 | 28 |
| socialTrends | ✅ | 191740 | 22798 | 5 |
| contraband | ✅ | 191740 | 21172 | 37 |
| minigamesTravel | ✅ | 75759 | 44583 | - |
| minigamesRoadie | ✅ | 25263 | 22985 | - |
| minigamesKabelsalat | ✅ | 25315 | 17664 | - |
| minigamesAmp | ✅ | 25181 | 18013 | - |
| sponsorship | ✅ | 172385 | 1958 | - |
| restStops | ✅ | 98737 | 16110 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €49.357 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 795.83 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 61.15% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €1.862 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 820.14 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €23.352 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 1005.91 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 15.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €7.896 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 926.66 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 14.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €8.500 – €50.000 | €10.274 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1051.91 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.469 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 880.12 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €24.850 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 982.84 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -1.15% | €-7.728 | 66.44 | -0.27 |
| Bootstrap Struggle | -24.62% | €999 | 118.91 | 2.93 |
| Aggressive Marketing | -1.16% | €-331 | 216.63 | 0.14 |
| Scandal Recovery | -23.08% | €1.722 | 164.26 | 2.33 |
| Festival Push | -7.69% | €-329 | 216.63 | 0.01 |
| Chaos Tour | -3.07% | €-1.034 | 211.27 | 0.03 |
| Cult Hypergrowth | 0.38% | €-1.483 | 190.18 | 0.19 |
| No Social (Fame 0-50) | -1.54% | €1.370 | 220.97 | 1.17 |
| High Controversy | -1.15% | €999 | 138.27 | 0.17 |
| Early Game Probe (Fame 0–50) | -1.16% | €1.489 | 89.49 | 0.05 |
| Mid Game Probe (Fame 60–150) | -0.38% | €552 | 128.43 | -0.1 |
| Late Game Probe (Fame 175+) | 0% | €-866 | 58.14 | -0.01 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 61.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €49.357 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.92 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
