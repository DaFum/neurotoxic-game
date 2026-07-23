# Game Balance Simulation – Analyse

Erstellt am: 2026-07-23T08:44:48.509Z

## Reproduzierbarkeit

- Report-Version: 10
- Node-Version: v22.22.1
- Basis-Commit: 717d8e82a641e44c45890cb784aed87bb0547fc6
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 3d3245d9149bc70dd32eebb12cdf05153dba223f63aadbfc179e2cf4f9ab178c
- Szenariokonfiguration SHA-256: e2f97ba93da6a842fa33908edf7acf33b2404c753b18903421f900c04aa7c6c0
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
| Baseline Touring | €500 | 0 | €57.611 | 60.5% | 0.1 | 2.8% | 17931 | 9 | 39 | 12.7 | 60.43 | 6.47 | 1.15% | €2.482 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €675 | 38.5% | 0.24 | 1.1% | 922 | 2 | 55 | 0.99 | 4.26 | 2.49 | 87.31% | €1.807 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €24.717 | 51.7% | 0.11 | 3.6% | 4188 | 4 | 55 | 5.26 | 29.57 | 5.87 | 1.92% | €2.745 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €6.421 | 54.3% | 0.17 | 1.8% | 1801 | 3 | 53 | 2.35 | 13.54 | 4.51 | 34.62% | €2.109 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €10.211 | 52.2% | 0.14 | 3.8% | 2109 | 3 | 54 | 2.23 | 14.78 | 4.8 | 24.23% | €2.532 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €17.085 | 47.1% | 0.15 | 1.8% | 2394 | 3 | 44 | 3.61 | 26.23 | 5.73 | 4.23% | €2.258 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €25.572 | 51.9% | 0.1 | 4% | 3810 | 4 | 53 | 5.47 | 29.65 | 5.83 | 0.38% | €2.847 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €17.271 | 49.6% | 0.14 | 1.6% | 3311 | 4 | 50 | 0 | 28.15 | 5.48 | 3.46% | €2.134 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.326 | 49% | 0.14 | 1.8% | 3053 | 3 | 51 | 12.15 | 26.21 | 5.4 | 7.69% | €2.122 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €10.994 | 16.7% | 0.13 | 1.6% | 2320 | 3 | 41 | 6.12 | 9.11 | 2.42 | 0.77% | €2.048 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €14.119 | 36% | 0.15 | 1.7% | 2475 | 3 | 48 | 5.48 | 15.68 | 4.93 | 1.92% | €2.295 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €30.126 | 46.2% | 0.1 | 3.3% | 9116 | 6 | 40 | 9.65 | 26.07 | 5.16 | 0% | €2.660 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €60.344 | €495 | €2.482 | 6.33 | 2.12 | 21.3 | 8.04 | 11.76 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €4.034 | €84 | €1.807 | 0.19 | 0.17 | 2.58 | 0.3 | 1.67 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €32.123 | €402 | €2.745 | 2.43 | 1.08 | 16.65 | 4.18 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €10.983 | €227 | €2.109 | 0.84 | 0.45 | 8.64 | 1.8 | 4.8 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €14.916 | €262 | €2.532 | 1.09 | 0.53 | 9.94 | 1.95 | 4.95 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €22.073 | €383 | €2.258 | 2.35 | 1.02 | 13.58 | 3.5 | 7.19 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.830 | €409 | €2.847 | 2.94 | 1.2 | 16.63 | 4.13 | 7.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €22.446 | €383 | €2.134 | 0 | 0 | 14.64 | 3.95 | 7.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.802 | €316 | €2.122 | 2.6 | 1.05 | 13.68 | 3.72 | 7.18 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.727 | €396 | €2.048 | 0.3 | 0.18 | 3.79 | 1.03 | 1.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.130 | €1.336 | €2.295 | 0.92 | 0.43 | 7.98 | 2.13 | 3.96 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.455 | €4.964 | €2.660 | 1.44 | 0.52 | 8.92 | 3.55 | 4.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.454 | €28.959 | €41.508 | €57.611 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.516 | €929 | €707 | €675 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €12.949 | €15.926 | €20.100 | €24.717 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.951 | €4.984 | €4.908 | €6.421 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.338 | €7.047 | €7.337 | €10.211 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €9.806 | €11.408 | €14.453 | €17.085 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.309 | €17.784 | €22.149 | €25.572 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.254 | €11.185 | €14.128 | €17.271 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.441 | €10.130 | €13.059 | €16.326 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.738 | — | — | €10.994 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.786 | €13.163 | — | €14.119 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €26.938 | — | — | €30.126 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.482 | €97 | 25.6× | 10.07 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.807 | €57 | 31.8× | 13.83 | 0.83 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.745 | €88 | 31.3× | 9.11 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.109 | €69 | 30.4× | 11.85 | 0.71 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.532 | €75 | 34× | 9.87 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.258 | €83 | 27.2× | 11.07 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.847 | €88 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.134 | €84 | 25.5× | 11.71 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.122 | €80 | 26.4× | 11.78 | 0.71 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.048 | €72 | 28.6× | 12.21 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.295 | €83 | 27.6× | 10.89 | 0.65 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.660 | €95 | 27.9× | 9.4 | 0.56 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.4 | 50 | 50.3% | 44.1% | 5.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.5 | 50 | 50.4% | 43% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 54 | 38% | 52.1% | 9.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.3 | 51 | 47.4% | 44.5% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.3 | 57 | 28.3% | 57.3% | 14.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.5% | 33.5% | 3.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8 | 53 | 40.1% | 53.3% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54% | 41.2% | 4.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 49 | 55% | 39.5% | 5.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.5 | 50 | 48.6% | 44% | 7.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.5 | 50 | 49.4% | 46% | 4.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 46.9% | 45.4% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.47 | 1.62 | 0.52 | 8.28 | 10.86 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 55 | 2.49 | 0.14 | 0.08 | 3.23 | 0.85 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 55 | 5.87 | 0.82 | 0.45 | 8.25 | 5.39 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 53 | 4.51 | 0.37 | 0.22 | 7.02 | 2.56 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 54 | 4.8 | 0.44 | 0.24 | 7.13 | 2.62 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 44 | 5.73 | 0.81 | 0.41 | 8.32 | 4.5 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 5.83 | 0.97 | 0.45 | 8.43 | 5.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.48 | 0 | 0 | 8.24 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 5.4 | 0.83 | 0.37 | 7.77 | 4.63 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 41 | 2.42 | 0.15 | 0.05 | 2.03 | 1.69 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 4.93 | 0.38 | 0.14 | 4.4 | 2.72 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 5.16 | 0.42 | 0.07 | 3.24 | 4.53 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.97 | 1.64 | 1.43 | 0.91 | 4.1 | 8.79 | 29.66 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.6 | 0.91 | 0.8 | 0.09 | 0.35 | 3.5 | 4.63 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.87 | 2.71 | 2.82 | 0.72 | 3.45 | 8.98 | 24.6 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.6 | 3.13 | 2.77 | 0.49 | 1.91 | 7.42 | 14.21 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.99 | 1.65 | 1.58 | 0.18 | 1.06 | 7.92 | 16.14 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.6 | 4.27 | 4.3 | 0.97 | 4.88 | 8.42 | 21.09 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.62 | 2.56 | 2.51 | 0.65 | 2.9 | 8.95 | 24.24 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.38 | 2.08 | 2.27 | 0.55 | 2.5 | 9.11 | 22.57 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.3 | 2.04 | 1.98 | 0.43 | 2.6 | 8.6 | 20.75 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.2 | 0.41 | 0.42 | 0.1 | 0.56 | 2.29 | 5.7 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.56 | 0.99 | 0.99 | 0.24 | 1.23 | 4.63 | 12.38 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.61 | 0.88 | 0.93 | 0.56 | 2.5 | 3.53 | 12.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.43 | 20.1 | 20.14 | 20.18 | 120.85 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 4.26 | 1.45 | 1.43 | 1.37 | 8.51 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.57 | 9.85 | 9.89 | 9.83 | 59.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 13.54 | 4.44 | 4.56 | 4.54 | 27.08 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.78 | 4.94 | 5.01 | 4.83 | 29.56 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.23 | 8.81 | 8.84 | 8.58 | 52.46 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.65 | 9.75 | 10.03 | 9.87 | 59.3 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 28.15 | 9.07 | 9.6 | 9.48 | 56.3 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 26.21 | 8.88 | 8.85 | 8.48 | 52.42 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.11 | 3.04 | 2.97 | 3.11 | 18.23 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.68 | 5.08 | 5.44 | 5.17 | 31.37 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 26.07 | 8.7 | 8.77 | 8.6 | 52.14 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.95 | 0.3 | 6.48 | 0.95 | 3.61 | 4.8 | €3.275 | 6.2 | 100% |
| Bootstrap Struggle | 0.28 | 0.18 | 0.66 | 0.78 | 0.56 | 0.95 | €1.016 | 1.96 | 66.2% |
| Aggressive Marketing | 2.82 | 0.75 | 6.51 | 1.03 | 3.47 | 3.03 | €2.861 | 5.48 | 100% |
| Scandal Recovery | 1.15 | 0.6 | 3.11 | 1.4 | 1.93 | 2.42 | €1.881 | 6.18 | 93.1% |
| Festival Push | 1.69 | 0.75 | 4.15 | 1.25 | 2.43 | 1.5 | €2.074 | 6.22 | 98.5% |
| Chaos Tour | 2.41 | 0.85 | 5.85 | 1.21 | 3.18 | 3.01 | €2.690 | 7.22 | 96.9% |
| Cult Hypergrowth | 2.77 | 0.54 | 6.23 | 1.07 | 3.45 | 3.68 | €2.888 | 5.68 | 100% |
| No Social (Fame 0-50) | 2.39 | 0.92 | 5.62 | 1.31 | 3.18 | 2.69 | €2.530 | 6.98 | 98.5% |
| High Controversy | 2.23 | 0.84 | 5.01 | 1.24 | 2.98 | 3.3 | €2.475 | 7.33 | 97.7% |
| Early Game Probe (Fame 0–50) | 0.71 | 0.33 | 0.58 | 0.51 | 0.84 | 1.63 | €825 | 0.01 | 93.5% |
| Mid Game Probe (Fame 60–150) | 1.86 | 0.61 | 2.84 | 0.87 | 2.33 | 2.29 | €2.200 | 2.83 | 96.5% |
| Late Game Probe (Fame 175+) | 2.13 | 0.27 | 2.65 | 0.59 | 2.42 | 2.8 | €2.470 | 0.68 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €57.611 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 17931 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 87.31% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.847 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €60.344 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.43 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.03 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €57.611 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 730.74 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 87.31% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €675 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 713.48 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €24.717 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 791.2 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 34.62% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €6.421 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 750.85 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 24.23% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €10.211 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 832.84 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €17.085 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 662.9 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €25.572 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 774.06 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €526 | 1.35 | 0.31 |
| Bootstrap Struggle | 1.54% | €-188 | 12.25 | -0.47 |
| Aggressive Marketing | -0.39% | €1.034 | 1.92 | -0.04 |
| Scandal Recovery | -4.23% | €247 | -11.55 | 0.64 |
| Festival Push | 2.31% | €-392 | -2.44 | -0.69 |
| Chaos Tour | -1.15% | €-418 | -5.95 | -0.54 |
| Cult Hypergrowth | -1.16% | €-761 | -18.6 | 0.14 |
| No Social (Fame 0-50) | 0% | €1.286 | 1.45 | 0.54 |
| High Controversy | 2.69% | €-288 | 1.72 | -0.85 |
| Early Game Probe (Fame 0–50) | -0.77% | €383 | -5.7 | 0.04 |
| Mid Game Probe (Fame 60–150) | 0.77% | €-666 | 3.53 | -0.2 |
| Late Game Probe (Fame 175+) | 0% | €492 | 3.79 | 0.05 |

## Feature-Abdeckung in der Simulation

- ✅ daily_updates
- ✅ gig_financials
- ✅ travel_expenses
- ✅ fuel_cost
- ✅ travel_minigame
- ✅ roadie_minigame
- ✅ kabelsalat_minigame
- ✅ amp_calibration_minigame
- ✅ gig_modifiers
- ✅ gig_physics
- ✅ world_events
- ✅ gig_events
- ✅ events_db
- ✅ brand_deals
- ✅ social_trends
- ✅ social_platforms
- ✅ post_options
- ✅ contraband
- ✅ sponsorship
- ✅ maintenance
- ✅ upgrades
- ✅ clinic
- ✅ rest_stops
- ✅ songs
- ✅ trait_unlocks
- ✅ region_reputation
- ✅ quest_events
- ✅ asset_acquisition
- ✅ asset_modules
- ✅ crowdfunding

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 87.31% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €57.611 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.03 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
