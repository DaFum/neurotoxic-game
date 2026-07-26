# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T22:03:12.275Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.2
- Basis-Commit: a333ab98560b1062e0f98ced83b2341caf48ce56
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: ceccbd87c7f85dfd0c7dc078e14f1facef15571dd803c502fe0bd8922685f291
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
| Baseline Touring | €500 | 0 | €56.087 | 61.71% | 0.1 | 2.8% | 21402 | 10 | 39 | 13.1 | 60.68 | 6.46 | 0.38% | €2.473 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €703 | 91.36% | 0.25 | 1.7% | 1078 | 2 | 55 | 0.92 | 4.13 | 2.49 | 88.46% | €1.146 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €24.855 | 59.58% | 0.11 | 3.9% | 9167 | 6 | 54 | 4.1 | 29.6 | 5.85 | 0.77% | €2.749 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €5.988 | 82.49% | 0.17 | 2% | 3088 | 3 | 54 | 2.37 | 13.21 | 4.45 | 40.77% | €1.951 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.556 | 77.05% | 0.13 | 3.4% | 4556 | 4 | 55 | 1.93 | 14.78 | 4.72 | 24.23% | €2.394 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.601 | 60.67% | 0.14 | 1.8% | 5789 | 5 | 42 | 4.62 | 26.4 | 5.73 | 4.62% | €2.250 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €25.260 | 59.57% | 0.1 | 3.9% | 8266 | 6 | 53 | 5.5 | 29.54 | 5.85 | 1.15% | €2.827 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €16.129 | 61.49% | 0.14 | 1.5% | 8843 | 6 | 50 | 0 | 27.87 | 5.51 | 5% | €2.138 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.075 | 62.84% | 0.14 | 1.7% | 6805 | 5 | 50 | 11.61 | 26.39 | 5.42 | 8.08% | €2.021 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €11.030 | 32.3% | 0.13 | 1.7% | 3170 | 3 | 42 | 4.66 | 9.08 | 2.44 | 0.77% | €2.054 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €13.545 | 48.92% | 0.15 | 1.8% | 4310 | 4 | 49 | 4.62 | 15.68 | 4.95 | 3.08% | €2.272 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.702 | 49.38% | 0.1 | 2.9% | 10683 | 7 | 40 | 10.22 | 26.09 | 4.98 | 0% | €2.657 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €59.670 | €495 | €2.473 | 6.77 | 2.2 | 21.31 | 8.07 | 11.87 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €3.980 | €83 | €1.146 | 0.17 | 0.14 | 2.59 | 0.28 | 1.62 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €31.734 | €404 | €2.749 | 2.85 | 1.32 | 17.11 | 4.27 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €11.031 | €221 | €1.951 | 0.91 | 0.48 | 8.72 | 1.71 | 4.73 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €14.684 | €259 | €2.394 | 1.03 | 0.51 | 10.56 | 1.97 | 4.94 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €22.070 | €388 | €2.250 | 2.17 | 1.02 | 14.19 | 3.53 | 7.33 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.219 | €407 | €2.827 | 2.88 | 1.21 | 16.89 | 4.1 | 7.33 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €21.811 | €379 | €2.138 | 0 | 0 | 15.13 | 3.89 | 7.56 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.642 | €314 | €2.021 | 2.42 | 1.05 | 14.44 | 3.69 | 7.2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.706 | €397 | €2.054 | 0.25 | 0.15 | 3.87 | 1.01 | 1.96 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.066 | €1.305 | €2.272 | 0.8 | 0.35 | 8.21 | 2.12 | 3.98 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.565 | €4.969 | €2.657 | 1.62 | 0.59 | 8.91 | 3.61 | 4.6 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.178 | €28.425 | €40.985 | €56.087 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.487 | €922 | €611 | €703 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €12.795 | €15.931 | €20.480 | €24.855 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.967 | €4.890 | €4.507 | €5.988 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.377 | €7.104 | €7.008 | €9.556 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €9.772 | €11.359 | €14.275 | €16.601 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.244 | €17.896 | €21.665 | €25.260 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.233 | €11.236 | €13.816 | €16.129 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.558 | €9.823 | €13.099 | €16.075 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.697 | — | — | €11.030 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.719 | €12.678 | — | €13.545 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.858 | — | — | €29.702 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.473 | €97 | 25.4× | 10.11 | 0.61 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.146 | €56 | 31.8× | 21.82 | 1.31 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.749 | €89 | 31.2× | 9.09 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.951 | €69 | 30.8× | 12.81 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.394 | €75 | 34× | 10.44 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.250 | €83 | 27.2× | 11.11 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.827 | €89 | 31.9× | 8.84 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.138 | €84 | 25.5× | 11.69 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.021 | €81 | 26.1× | 12.37 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.054 | €72 | 28.7× | 12.17 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.272 | €83 | 27.5× | 11 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.657 | €96 | 27.8× | 9.41 | 0.56 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 50.8% | 43.7% | 5.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.4 | 54 | 49.5% | 42.4% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 53 | 38.6% | 52.3% | 9.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.2 | 52 | 46.4% | 45% | 8.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.2 | 57 | 27.6% | 57.5% | 14.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.2% | 32.8% | 4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8 | 53 | 40.2% | 52.7% | 7.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.3% | 40.8% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.6 | 49 | 54% | 40.5% | 5.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 48.5% | 44% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.5 | 50 | 49% | 46.5% | 4.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 48% | 44.3% | 7.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.46 | 1.7 | 0.46 | 8.03 | 10.75 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 55 | 2.49 | 0.12 | 0.07 | 3.12 | 0.85 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 5.85 | 1 | 0.46 | 8.19 | 5.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 54 | 4.45 | 0.41 | 0.25 | 7.06 | 2.58 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 4.72 | 0.4 | 0.21 | 7.36 | 2.56 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 42 | 5.73 | 0.82 | 0.42 | 8.25 | 4.6 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.85 | 0.99 | 0.5 | 8.41 | 5.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.51 | 0 | 0 | 8.23 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | 5.42 | 0.87 | 0.43 | 7.79 | 4.62 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.44 | 0.12 | 0.04 | 2.08 | 1.64 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 49 | 4.95 | 0.3 | 0.1 | 4.38 | 2.82 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 4.98 | 0.47 | 0.11 | 3.25 | 4.7 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.03 | 1.67 | 1.66 | 0.9 | 4.25 | 9.05 | 29.71 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.56 | 0.9 | 0.78 | 0.09 | 0.36 | 3.33 | 4.55 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.83 | 2.73 | 2.86 | 0.74 | 3.48 | 8.9 | 24.82 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.61 | 2.88 | 2.95 | 0.42 | 1.92 | 7.17 | 14.36 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.9 | 1.58 | 1.55 | 0.19 | 0.99 | 7.89 | 16.72 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.67 | 4.3 | 4.28 | 0.98 | 5 | 8.77 | 21.93 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.58 | 2.55 | 2.21 | 0.75 | 2.93 | 8.68 | 24.68 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.37 | 2.1 | 2.25 | 0.53 | 2.49 | 9.03 | 22.97 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.24 | 2.21 | 2.11 | 0.48 | 2.6 | 8.58 | 21.76 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.2 | 0.39 | 0.44 | 0.08 | 0.59 | 2.3 | 5.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.61 | 1.04 | 1 | 0.24 | 1.12 | 4.55 | 12.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.65 | 0.85 | 0.91 | 0.62 | 2.54 | 3.43 | 12.55 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.68 | 20.28 | 20.02 | 20.38 | 121.36 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 4.13 | 1.39 | 1.4 | 1.35 | 8.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.6 | 10.02 | 9.78 | 9.8 | 59.2 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 13.21 | 4.33 | 4.38 | 4.5 | 26.42 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.78 | 5.03 | 4.91 | 4.83 | 29.55 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.4 | 8.74 | 8.72 | 8.93 | 52.79 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.54 | 9.76 | 10 | 9.78 | 59.08 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 27.87 | 9.07 | 9.45 | 9.36 | 55.75 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 26.39 | 8.86 | 8.82 | 8.72 | 52.79 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.08 | 3.02 | 2.93 | 3.13 | 18.16 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.68 | 5.19 | 5.3 | 5.19 | 31.36 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.09 | 8.73 | 8.67 | 8.68 | 52.17 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.96 | 0.36 | 6.75 | 0.98 | 3.65 | 4.78 | €3.265 | 6.07 | 100% |
| Bootstrap Struggle | 0.26 | 0.18 | 0.57 | 0.8 | 0.51 | 0.95 | €1.018 | 1.99 | 65% |
| Aggressive Marketing | 2.82 | 0.73 | 6.31 | 1.06 | 3.47 | 2.96 | €2.840 | 5.61 | 100% |
| Scandal Recovery | 1.12 | 0.61 | 3.07 | 1.46 | 1.91 | 2.43 | €1.855 | 6.18 | 92.7% |
| Festival Push | 1.65 | 0.74 | 4.23 | 1.22 | 2.41 | 1.5 | €2.020 | 6.1 | 98.5% |
| Chaos Tour | 2.42 | 0.92 | 5.77 | 1.25 | 3.22 | 3.08 | €2.692 | 7.47 | 97.3% |
| Cult Hypergrowth | 2.74 | 0.6 | 6.24 | 1.15 | 3.44 | 3.76 | €2.889 | 5.71 | 100% |
| No Social (Fame 0-50) | 2.31 | 0.9 | 5.44 | 1.31 | 3.11 | 2.68 | €2.548 | 6.97 | 98.1% |
| High Controversy | 2.13 | 0.89 | 5.03 | 1.21 | 2.9 | 3.42 | €2.482 | 7.08 | 97.7% |
| Early Game Probe (Fame 0–50) | 0.72 | 0.34 | 0.58 | 0.5 | 0.85 | 1.59 | €828 | 0.01 | 93.5% |
| Mid Game Probe (Fame 60–150) | 1.75 | 0.6 | 2.63 | 0.92 | 2.26 | 2.34 | €2.209 | 2.88 | 96.9% |
| Late Game Probe (Fame 175+) | 2.13 | 0.27 | 2.68 | 0.62 | 2.47 | 2.79 | €2.365 | 0.66 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €56.087 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 21402 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 88.46% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.827 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €59.670 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.68 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.24 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 47613 | 26169 | 0 | 26169 | 42 | 0 | 260/260 |
| Bootstrap Struggle | 3249 | 2162 | 0 | 2162 | 8 | 0 | 260/260 |
| Aggressive Marketing | 28964 | 19779 | 0 | 19779 | 18 | 0 | 260/260 |
| Scandal Recovery | 11839 | 8734 | 0 | 8734 | 17 | 0 | 260/260 |
| Festival Push | 15797 | 11232 | 0 | 11232 | 10 | 0 | 260/260 |
| Chaos Tour | 21852 | 16020 | 0 | 16020 | 43 | 0 | 260/260 |
| Cult Hypergrowth | 28177 | 19892 | 0 | 19892 | 19 | 0 | 260/260 |
| No Social (Fame 0-50) | 26446 | 17572 | 0 | 17572 | 32 | 0 | 260/260 |
| High Controversy | 23455 | 16621 | 0 | 16621 | 29 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7567 | 4388 | 0 | 4388 | 9 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13648 | 9383 | 0 | 9383 | 15 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 20915 | 10389 | 0 | 10389 | 19 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €56.087 | €53.724 | €21.146 | €30.760 | €82.292 |
| Bootstrap Struggle | €703 | €0 | €2.714 | €0 | €464 |
| Aggressive Marketing | €24.855 | €25.203 | €9.702 | €12.327 | €36.688 |
| Scandal Recovery | €5.988 | €2.459 | €7.711 | €0 | €18.081 |
| Festival Push | €9.556 | €8.094 | €8.822 | €0 | €19.634 |
| Chaos Tour | €16.601 | €16.770 | €8.886 | €4.431 | €28.549 |
| Cult Hypergrowth | €25.260 | €25.218 | €10.183 | €12.788 | €37.577 |
| No Social (Fame 0-50) | €16.129 | €15.021 | €8.569 | €5.131 | €27.560 |
| High Controversy | €16.075 | €15.527 | €9.342 | €3.657 | €29.307 |
| Early Game Probe (Fame 0–50) | €11.030 | €10.272 | €4.639 | €5.897 | €17.373 |
| Mid Game Probe (Fame 60–150) | €13.545 | €13.360 | €7.237 | €4.813 | €22.801 |
| Late Game Probe (Fame 175+) | €29.702 | €29.851 | €10.041 | €17.577 | €42.150 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 230 | 260 | 88.46% | 84.01% | 91.80% |
| Aggressive Marketing | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Scandal Recovery | 106 | 260 | 40.77% | 34.97% | 46.83% |
| Festival Push | 63 | 260 | 24.23% | 19.42% | 29.79% |
| Chaos Tour | 12 | 260 | 4.62% | 2.66% | 7.89% |
| Cult Hypergrowth | 3 | 260 | 1.15% | 0.39% | 3.34% |
| No Social (Fame 0-50) | 13 | 260 | 5.00% | 2.94% | 8.37% |
| High Controversy | 21 | 260 | 8.08% | 5.34% | 12.03% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 8 | 260 | 3.08% | 1.57% | 5.95% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €56.087 | 259 / €56.303 | 1 / €0 |
| Bootstrap Struggle | 260 / €703 | 30 / €6.093 | 230 / €0 |
| Aggressive Marketing | 260 / €24.855 | 258 / €25.048 | 2 / €0 |
| Scandal Recovery | 260 / €5.988 | 154 / €10.110 | 106 / €0 |
| Festival Push | 260 / €9.556 | 197 / €12.612 | 63 / €0 |
| Chaos Tour | 260 / €16.601 | 248 / €17.404 | 12 / €0 |
| Cult Hypergrowth | 260 / €25.260 | 257 / €25.555 | 3 / €0 |
| No Social (Fame 0-50) | 260 / €16.129 | 247 / €16.978 | 13 / €0 |
| High Controversy | 260 / €16.075 | 239 / €17.487 | 21 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €11.030 | 258 / €11.116 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €13.545 | 252 / €13.975 | 8 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.702 | 260 / €29.702 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €21.146 | 0.377 | 61.71% | 77.01% |
| Bootstrap Struggle | €2.714 | 3.8606 | 91.36% | 99.45% |
| Aggressive Marketing | €9.702 | 0.3903 | 59.58% | 82.26% |
| Scandal Recovery | €7.711 | 1.2877 | 82.49% | 99.31% |
| Festival Push | €8.822 | 0.9232 | 77.05% | 99.09% |
| Chaos Tour | €8.886 | 0.5353 | 60.67% | 91.21% |
| Cult Hypergrowth | €10.183 | 0.4031 | 59.57% | 82.40% |
| No Social (Fame 0-50) | €8.569 | 0.5313 | 61.49% | 88.95% |
| High Controversy | €9.342 | 0.5812 | 62.84% | 89.62% |
| Early Game Probe (Fame 0–50) | €4.639 | 0.4206 | 32.30% | 51.96% |
| Mid Game Probe (Fame 60–150) | €7.237 | 0.5343 | 48.92% | 80.34% |
| Late Game Probe (Fame 175+) | €10.041 | 0.3381 | 49.38% | 69.00% |

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
| brandDeals | ✅ | 143958 | 2342 | 53 |
| postOptions | ✅ | 11851 | 11851 | 28 |
| socialTrends | ✅ | 178892 | 21238 | 5 |
| contraband | ✅ | 178892 | 19798 | 37 |
| minigamesTravel | ✅ | 73696 | 73696 | - |
| minigamesRoadie | ✅ | 24550 | 24550 | - |
| minigamesKabelsalat | ✅ | 24536 | 24536 | - |
| minigamesAmp | ✅ | 24610 | 24610 | - |
| sponsorship | ✅ | 159828 | 1869 | - |
| restStops | ✅ | 94802 | 14751 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €56.087 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 781.23 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 88.46% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €703 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 813.67 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €24.855 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 975.49 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 40.77% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €5.988 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 890.7 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 24.23% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.556 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1059.81 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.62% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.601 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 826.91 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €25.260 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 961.29 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -0.77% | €-998 | 51.84 | 0.56 |
| Bootstrap Struggle | 2.69% | €-160 | 112.44 | -0.6 |
| Aggressive Marketing | -1.54% | €1.172 | 186.21 | -0.01 |
| Scandal Recovery | 1.92% | €-186 | 128.3 | 0.31 |
| Festival Push | 2.31% | €-1.047 | 224.53 | -0.69 |
| Chaos Tour | -0.76% | €-902 | 158.06 | -0.37 |
| Cult Hypergrowth | -0.39% | €-1.073 | 168.63 | 0.03 |
| No Social (Fame 0-50) | 1.54% | €144 | 240.85 | 0.26 |
| High Controversy | 3.08% | €-539 | 182.11 | -0.67 |
| Early Game Probe (Fame 0–50) | -0.77% | €419 | 102.4 | 0.01 |
| Mid Game Probe (Fame 60–150) | 1.93% | €-1.240 | 142.2 | -0.2 |
| Late Game Probe (Fame 175+) | 0% | €68 | 57.87 | 0.07 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 88.46% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €56.087 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.24 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
