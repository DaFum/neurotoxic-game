# Game Balance Simulation – Analyse

Erstellt am: 2026-07-27T14:19:11.492Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.1
- Basis-Commit: 9a7e5e37f6c3782e0d846034cc5f304bcc3a28a1
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: a3a4ef80bda270abb0e7318d4bac57f9c468668d4d2e10a554d60d5b5610ddbc
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
| Baseline Touring | €500 | 0 | €52.361 | 62.15% | 0.11 | 1.2% | 21300 | 10 | 39 | 11.16 | 60.43 | 6.38 | 0% | €2.281 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.990 | 90.57% | 0.25 | 0.9% | 1519 | 2 | 54 | 0.97 | 7.85 | 4.67 | 59.62% | €1.867 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €23.775 | 58.96% | 0.12 | 2.1% | 9186 | 6 | 56 | 4.63 | 29.74 | 5.95 | 1.15% | €2.636 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €7.688 | 76.74% | 0.17 | 1.5% | 3723 | 4 | 51 | 2.64 | 14.75 | 4.93 | 20.38% | €2.041 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €11.013 | 70.96% | 0.14 | 2.6% | 4819 | 4 | 53 | 1.96 | 15.82 | 5.11 | 15.77% | €2.461 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €17.662 | 56.32% | 0.15 | 1.1% | 6747 | 5 | 42 | 5.02 | 26.98 | 5.91 | 1.54% | €2.187 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €25.167 | 59.25% | 0.11 | 2.4% | 8813 | 6 | 53 | 5.63 | 29.66 | 5.89 | 1.92% | €2.718 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €17.335 | 55.11% | 0.15 | 1% | 8959 | 6 | 51 | 0 | 28.84 | 5.64 | 0.77% | €2.060 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €17.324 | 59.68% | 0.15 | 0.9% | 6555 | 5 | 50 | 12.16 | 27.23 | 5.79 | 1.92% | €2.027 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €11.849 | 27% | 0.13 | 1.9% | 3106 | 3 | 42 | 6.31 | 9.1 | 2.45 | 0% | €2.035 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €15.436 | 45.38% | 0.15 | 1.5% | 4205 | 4 | 49 | 4.1 | 15.82 | 5.06 | 1.15% | €2.253 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.978 | 51.18% | 0.1 | 2.8% | 11136 | 7 | 41 | 9.68 | 26.1 | 5.1 | 0% | €2.616 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €55.481 | €500 | €2.281 | 7.19 | 2.22 | 21.45 | 8.01 | 11.87 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €7.797 | €158 | €1.867 | 0.36 | 0.28 | 6.01 | 0.68 | 3.73 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €32.450 | €448 | €2.636 | 2.63 | 1.17 | 17.37 | 4.14 | 7.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €12.597 | €333 | €2.041 | 0.84 | 0.48 | 10.08 | 1.95 | 5.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €16.656 | €354 | €2.461 | 1.03 | 0.54 | 11.66 | 2.07 | 5.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €23.516 | €442 | €2.187 | 2.75 | 1.18 | 14.55 | 3.63 | 7.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.774 | €447 | €2.718 | 2.68 | 1.17 | 16.91 | 4.2 | 7.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €23.013 | €448 | €2.060 | 0 | 0 | 15.59 | 4.03 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €22.324 | €414 | €2.027 | 2.78 | 1.18 | 14.75 | 3.77 | 7.47 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €13.530 | €452 | €2.035 | 0.23 | 0.16 | 3.83 | 1 | 1.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €19.693 | €1.397 | €2.253 | 0.8 | 0.41 | 8.08 | 2.13 | 4.04 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.478 | €4.956 | €2.616 | 1.38 | 0.55 | 8.97 | 3.58 | 4.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €26.004 | €28.885 | €40.373 | €52.361 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €5.303 | €2.664 | €2.275 | €1.990 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €14.283 | €18.034 | €21.667 | €23.775 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €7.149 | €6.487 | €6.070 | €7.688 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.318 | €8.684 | €8.988 | €11.013 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €10.674 | €12.433 | €16.285 | €17.662 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €15.638 | €18.576 | €22.943 | €25.167 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.926 | €12.744 | €16.310 | €17.335 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €8.471 | €11.027 | €15.238 | €17.324 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €10.650 | — | — | €11.849 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €12.804 | €14.639 | — | €15.436 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.891 | — | — | €29.978 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.281 | €97 | 23.4× | 10.96 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.867 | €61 | 32× | 13.39 | 0.8 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.636 | €90 | 29.6× | 9.48 | 0.57 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.041 | €72 | 29.1× | 12.25 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.461 | €77 | 32.2× | 10.16 | 0.61 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.187 | €85 | 25.8× | 11.43 | 0.69 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.718 | €90 | 30.4× | 9.2 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.060 | €86 | 24× | 12.14 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.027 | €82 | 24.8× | 12.33 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.035 | €73 | 27.7× | 12.29 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.253 | €85 | 26.8× | 11.1 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.616 | €96 | 27.3× | 9.56 | 0.57 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 51.7% | 42.9% | 5.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.8 | 48 | 56.8% | 37.8% | 5.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.8 | 54 | 37.5% | 52% | 10.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.4 | 50 | 47.8% | 45.6% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.4 | 56 | 28.7% | 58.4% | 13% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.5% | 33.1% | 3.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8 | 53 | 39.7% | 53.1% | 7.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 53.4% | 41.6% | 5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.8 | 48 | 55.7% | 40.1% | 4.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 50 | 48.3% | 44.1% | 7.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 8.5 | 50 | 49.5% | 45.6% | 4.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 46.5% | 45.8% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.38 | 1.79 | 0.53 | 8.41 | 10.92 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 54 | 4.67 | 0.23 | 0.15 | 6.5 | 1.45 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 56 | 5.95 | 0.91 | 0.43 | 8.11 | 5.06 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 51 | 4.93 | 0.38 | 0.29 | 7.7 | 2.76 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 5.11 | 0.42 | 0.25 | 7.98 | 2.96 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 42 | 5.91 | 0.96 | 0.47 | 8.25 | 4.84 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.89 | 0.92 | 0.42 | 8.49 | 5.25 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 51 | 5.64 | 0 | 0 | 8.36 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | 5.79 | 0.97 | 0.45 | 8.07 | 4.76 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.45 | 0.12 | 0.04 | 2.12 | 1.75 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 49 | 5.06 | 0.34 | 0.16 | 4.3 | 2.7 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 41 | 5.1 | 0.42 | 0.15 | 3.28 | 4.61 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.96 | 1.59 | 1.58 | 0.78 | 4.3 | 9.02 | 29.77 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.16 | 1.88 | 1.81 | 0.16 | 0.7 | 7.31 | 11 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.95 | 2.65 | 2.68 | 0.65 | 3.55 | 8.9 | 25.32 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.88 | 3.18 | 3.19 | 0.48 | 2.18 | 8.18 | 16.82 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.14 | 1.66 | 1.78 | 0.24 | 1.1 | 8.67 | 18.51 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.86 | 4.38 | 4.22 | 1.08 | 5.17 | 8.78 | 22.15 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.67 | 2.65 | 2.36 | 0.63 | 3.04 | 9.08 | 24.6 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.43 | 2.25 | 2.22 | 0.53 | 2.59 | 9.15 | 23.56 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.36 | 2.28 | 2.25 | 0.59 | 2.62 | 8.77 | 22.33 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.2 | 0.36 | 0.43 | 0.11 | 0.66 | 2.38 | 5.68 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.55 | 1.1 | 0.89 | 0.25 | 1.2 | 4.85 | 12.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.61 | 0.9 | 0.97 | 0.58 | 2.64 | 3.3 | 12.61 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.43 | 20.14 | 20.23 | 20.05 | 120.85 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 7.85 | 2.71 | 2.58 | 2.56 | 15.7 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.74 | 9.83 | 9.89 | 10.03 | 59.49 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 14.75 | 4.91 | 4.89 | 4.95 | 29.5 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 15.82 | 5.41 | 5.27 | 5.14 | 31.64 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.98 | 8.96 | 9.01 | 9.02 | 53.97 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.66 | 9.83 | 9.82 | 10 | 59.31 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 28.84 | 9.42 | 9.78 | 9.65 | 57.69 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 27.23 | 9.07 | 9.22 | 8.95 | 54.47 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.1 | 3.07 | 2.94 | 3.09 | 18.2 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.82 | 5.22 | 5.39 | 5.21 | 31.64 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.1 | 8.7 | 8.71 | 8.69 | 52.2 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.89 | 0.3 | 6.9 | 1.01 | 3.59 | 4.72 | €3.225 | 6.25 | 100% |
| Bootstrap Struggle | 0.63 | 0.41 | 1.73 | 1.45 | 1.33 | 1.73 | €1.925 | 5.61 | 72.3% |
| Aggressive Marketing | 2.85 | 0.73 | 6.38 | 1.03 | 3.52 | 3.04 | €2.930 | 5.47 | 100% |
| Scandal Recovery | 1.45 | 0.66 | 4.02 | 1.49 | 2.32 | 2.64 | €2.088 | 7.32 | 94.2% |
| Festival Push | 1.96 | 0.9 | 5 | 1.29 | 2.75 | 1.48 | €2.224 | 6.88 | 100% |
| Chaos Tour | 2.52 | 0.88 | 5.93 | 1.22 | 3.23 | 3.08 | €2.816 | 7.02 | 94.6% |
| Cult Hypergrowth | 2.84 | 0.52 | 6.36 | 1 | 3.49 | 3.77 | €2.912 | 5.29 | 100% |
| No Social (Fame 0-50) | 2.43 | 0.82 | 5.89 | 1.3 | 3.24 | 2.77 | €2.641 | 6.45 | 99.2% |
| High Controversy | 2.42 | 0.92 | 5.54 | 1.19 | 3.17 | 3.39 | €2.732 | 7.87 | 96.2% |
| Early Game Probe (Fame 0–50) | 0.79 | 0.36 | 0.64 | 0.53 | 0.92 | 1.65 | €843 | 0.04 | 94.2% |
| Mid Game Probe (Fame 60–150) | 1.92 | 0.59 | 2.85 | 0.86 | 2.42 | 2.28 | €2.296 | 2.76 | 96.9% |
| Late Game Probe (Fame 175+) | 2.06 | 0.24 | 2.69 | 0.57 | 2.38 | 2.82 | €2.447 | 0.68 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €52.361 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 21300 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 59.62% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.718 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €55.481 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.43 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.71 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 47745 | 26399 | 0 | 26399 | 46 | 0 | 260/260 |
| Bootstrap Struggle | 6824 | 5289 | 0 | 5289 | 17 | 0 | 260/260 |
| Aggressive Marketing | 29369 | 20166 | 0 | 20166 | 17 | 0 | 260/260 |
| Scandal Recovery | 13986 | 10244 | 0 | 10244 | 18 | 0 | 260/260 |
| Festival Push | 17078 | 12249 | 0 | 12249 | 10 | 0 | 260/260 |
| Chaos Tour | 23062 | 16268 | 0 | 16268 | 47 | 0 | 260/260 |
| Cult Hypergrowth | 28503 | 19671 | 0 | 19671 | 19 | 0 | 260/260 |
| No Social (Fame 0-50) | 27142 | 18151 | 0 | 18151 | 32 | 0 | 260/260 |
| High Controversy | 23602 | 17014 | 0 | 17014 | 33 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7401 | 4287 | 0 | 4287 | 9 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13595 | 9435 | 0 | 9435 | 15 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 21284 | 10304 | 0 | 10304 | 19 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €52.361 | €51.660 | €17.745 | €31.261 | €75.214 |
| Bootstrap Struggle | €1.990 | €0 | €3.688 | €0 | €6.808 |
| Aggressive Marketing | €23.775 | €24.014 | €9.879 | €11.178 | €36.670 |
| Scandal Recovery | €7.688 | €6.651 | €6.826 | €0 | €16.806 |
| Festival Push | €11.013 | €10.286 | €8.631 | €0 | €23.245 |
| Chaos Tour | €17.662 | €16.571 | €8.645 | €7.179 | €31.017 |
| Cult Hypergrowth | €25.167 | €25.281 | €9.809 | €13.389 | €37.039 |
| No Social (Fame 0-50) | €17.335 | €16.349 | €8.249 | €6.783 | €29.191 |
| High Controversy | €17.324 | €16.396 | €8.652 | €6.231 | €29.614 |
| Early Game Probe (Fame 0–50) | €11.849 | €11.216 | €4.858 | €6.202 | €18.976 |
| Mid Game Probe (Fame 60–150) | €15.436 | €14.626 | €6.816 | €7.099 | €25.218 |
| Late Game Probe (Fame 175+) | €29.978 | €29.075 | €9.296 | €18.884 | €41.390 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 155 | 260 | 59.62% | 53.55% | 65.40% |
| Aggressive Marketing | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Scandal Recovery | 53 | 260 | 20.38% | 15.94% | 25.70% |
| Festival Push | 41 | 260 | 15.77% | 11.84% | 20.69% |
| Chaos Tour | 4 | 260 | 1.54% | 0.60% | 3.89% |
| Cult Hypergrowth | 5 | 260 | 1.92% | 0.82% | 4.42% |
| No Social (Fame 0-50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| High Controversy | 5 | 260 | 1.92% | 0.82% | 4.42% |
| Early Game Probe (Fame 0–50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Mid Game Probe (Fame 60–150) | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €52.361 | 260 / €52.361 | 0 / €0 |
| Bootstrap Struggle | 260 / €1.990 | 105 / €4.929 | 155 / €0 |
| Aggressive Marketing | 260 / €23.775 | 257 / €24.053 | 3 / €0 |
| Scandal Recovery | 260 / €7.688 | 207 / €9.657 | 53 / €0 |
| Festival Push | 260 / €11.013 | 219 / €13.075 | 41 / €0 |
| Chaos Tour | 260 / €17.662 | 256 / €17.937 | 4 / €0 |
| Cult Hypergrowth | 260 / €25.167 | 255 / €25.660 | 5 / €0 |
| No Social (Fame 0-50) | 260 / €17.335 | 258 / €17.470 | 2 / €0 |
| High Controversy | 260 / €17.324 | 255 / €17.664 | 5 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €11.849 | 260 / €11.849 | 0 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €15.436 | 257 / €15.616 | 3 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.978 | 260 / €29.978 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €17.745 | 0.3389 | 62.15% | 76.75% |
| Bootstrap Struggle | €3.688 | 1.8533 | 90.57% | 99.75% |
| Aggressive Marketing | €9.879 | 0.4155 | 58.96% | 86.20% |
| Scandal Recovery | €6.826 | 0.8879 | 76.74% | 99.29% |
| Festival Push | €8.631 | 0.7837 | 70.96% | 99.12% |
| Chaos Tour | €8.645 | 0.4895 | 56.32% | 88.91% |
| Cult Hypergrowth | €9.809 | 0.3898 | 59.25% | 84.10% |
| No Social (Fame 0-50) | €8.249 | 0.4759 | 55.11% | 83.91% |
| High Controversy | €8.652 | 0.4994 | 59.68% | 88.07% |
| Early Game Probe (Fame 0–50) | €4.858 | 0.41 | 27.00% | 49.69% |
| Mid Game Probe (Fame 60–150) | €6.816 | 0.4416 | 45.38% | 76.89% |
| Late Game Probe (Fame 175+) | €9.296 | 0.3101 | 51.18% | 68.11% |

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
| brandDeals | ✅ | 155903 | 2429 | 53 |
| postOptions | ✅ | 12233 | 12233 | 29 |
| socialTrends | ✅ | 192067 | 22981 | 5 |
| contraband | ✅ | 192067 | 21205 | 37 |
| minigamesTravel | ✅ | 76006 | 44772 | - |
| minigamesRoadie | ✅ | 25287 | 22956 | - |
| minigamesKabelsalat | ✅ | 25410 | 17650 | - |
| minigamesAmp | ✅ | 25309 | 18189 | - |
| sponsorship | ✅ | 172673 | 1941 | - |
| restStops | ✅ | 98823 | 16024 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €52.361 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 788.03 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 59.62% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €1.990 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 825.27 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €23.775 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 991.26 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 20.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €7.688 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 926.79 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 15.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €8.500 – €50.000 | €11.013 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1062.7 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €17.662 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 852.45 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €25.167 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 957.84 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 59.62% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €52.361 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.71 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
