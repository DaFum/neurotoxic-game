# Game Balance Simulation – Analyse

Erstellt am: 2026-07-28T08:25:56.694Z

## Reproduzierbarkeit

- Report-Version: 13
- Node-Version: v22.22.2
- Basis-Commit: 1d1a4240828460e5c68db8f080c0e822d848078f
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 3412558db90f376510ec87d4338246c240995137ac4eb6d462efe9b55db2f81b
- Szenariokonfiguration SHA-256: 924af59511d59596f6e10d7f75d961a30e36b1f58565254d6a6f894787d969aa
- KPI-Zielkonfiguration SHA-256: 3dc121493fa11aad91a76c1be2fbbaab48746efb7c7ed5adc560fc53e4e0ece3
- Seed-Strategie: scenario-id-plus-run-index

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 10 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |
| Klinik-Heilung | €280 × 1.2^Besuche · +30 Stamina / +10 Mood |

## Fame-Shop-Audit

Shop-only kosten **8330 Fame**, mit Legacy-Upgrades **14180 Fame**.
Das teuerste einzelne Fame-Item kostet **2700 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 2.700 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 45 | 1150 | 3 | 8 | 12 | Fame-Gewinn ist zu niedrig fuer das Ziel von 6-10 guten Gigs bis 14180 Fame (Tour-Horizont 10 Gigs). |
| 50 | 1250 | 3 | 7 | 11 | Fame-Gewinn ist zu niedrig fuer das Ziel von 6-10 guten Gigs bis 14180 Fame (Tour-Horizont 10 Gigs). |
| 55 | 1350 | 2 | 7 | 10 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 14180 Fame (Tour-Horizont 10 Gigs). |
| 60 | 1450 | 2 | 6 | 10 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 14180 Fame (Tour-Horizont 10 Gigs). |
| 70 | 1650 | 2 | 5 | 8 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 14180 Fame (Tour-Horizont 10 Gigs). |
| 85 | 1950 | 2 | 5 | 7 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 14180 Fame (Tour-Horizont 10 Gigs). |
| 100 | 2250 | 2 | 5 | 7 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 14180 Fame (Tour-Horizont 10 Gigs). |

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
| Baseline Touring | €500 | 0 | €29.387 | 14.76% | 0.04 | 6.7% | 11621 | 7 | 48 | 6.54 | 9.16 | 0 | 0% | €4.083 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €1.081 | 73.9% | 0.07 | 0% | 1227 | 2 | 60 | 1.19 | 1.57 | 0 | 30.77% | €1.063 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €8.199 | 33.68% | 0.06 | 0% | 4679 | 4 | 51 | 2.89 | 4.51 | 0 | 2.31% | €2.330 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €3.008 | 57.05% | 0.07 | 0% | 2356 | 3 | 58 | 1.81 | 2.71 | 0 | 6.92% | €1.586 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €4.460 | 53.05% | 0.05 | 0% | 2779 | 3 | 59 | 1.54 | 2.76 | 0 | 2.69% | €2.134 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €5.825 | 37.47% | 0.08 | 0% | 4200 | 4 | 45 | 3.23 | 4.47 | 0 | 3.08% | €1.822 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €8.306 | 32.6% | 0.06 | 0% | 5281 | 5 | 54 | 3.15 | 4.57 | 0 | 0.38% | €2.335 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €5.155 | 39.24% | 0.09 | 0% | 4502 | 4 | 51 | 0 | 4.54 | 0 | 2.31% | €1.581 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €2.398 | 52.63% | 0.16 | 0% | 4087 | 4 | 48 | 56.63 | 4.17 | 0.32 | 14.62% | €942 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €5.103 | 38.15% | 0.09 | 0% | 4472 | 4 | 50 | 3.15 | 4.4 | 0 | 3.85% | €1.632 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €6.332 | 30.64% | 0.08 | 0% | 4406 | 4 | 49 | 3.17 | 4.55 | 0 | 0.38% | €1.759 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €32.142 | 21.08% | 0.04 | 7.3% | 11137 | 7 | 52 | 5.71 | 9.3 | 0 | 0% | €4.264 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €29.414 | €498 | €4.083 | 0.2 | 0.1 | 6.24 | 1.23 | 1.14 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €1.666 | €138 | €1.063 | 0.01 | 0.01 | 3.69 | 0 | 0.12 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €8.541 | €370 | €2.330 | 0.03 | 0.03 | 5.49 | 0.26 | 0.76 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €3.516 | €240 | €1.586 | 0.01 | 0.01 | 4.88 | 0.01 | 0.44 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €5.024 | €255 | €2.134 | 0.01 | 0.02 | 4.91 | 0.03 | 0.32 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €6.170 | €358 | €1.822 | 0.04 | 0.03 | 5.37 | 0.18 | 0.7 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €8.624 | €373 | €2.335 | 0.03 | 0.02 | 5.4 | 0.23 | 0.65 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €5.310 | €354 | €1.581 | 0 | 0 | 5.31 | 0.23 | 0.78 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €2.831 | €285 | €942 | 0.01 | 0.02 | 4.97 | 0.23 | 0.71 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Early Game Probe (Fame 0–50) | €5.318 | €355 | €1.632 | 0.03 | 0.02 | 5.22 | 0.22 | 0.78 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €6.594 | €1.165 | €1.759 | 0.02 | 0.01 | 5.3 | 0.2 | 0.85 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €32.224 | €4.890 | €4.264 | 0.13 | 0.05 | 6.49 | 1.18 | 1.12 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-holdout-marker-plus-run-index`, 260 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 0% ✅ | 0% ✅ | ✅ |
| baseline_touring | Endgeld | €15.000 – €47.000 | €29.387 ✅ | €29.314 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1603.35 ✅ | 1559.52 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 30.77% ✅ | 29.23% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €550 – €1.700 | €1.081 ✅ | €1.163 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1483.23 ✅ | 1441.57 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 2.31% ✅ | 1.54% ✅ | ✅ |
| aggressive_marketing | Endgeld | €4.100 – €13.000 | €8.199 ✅ | €8.108 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1618.74 ✅ | 1650.01 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 6.92% ✅ | 10% ✅ | ✅ |
| scandal_recovery | Endgeld | €1.500 – €4.800 | €3.008 ✅ | €2.955 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1567.48 ✅ | 1622.22 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 2.69% ✅ | 4.23% ✅ | ✅ |
| festival_push | Endgeld | €2.200 – €7.100 | €4.460 ✅ | €4.175 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 1702.74 ✅ | 1722.28 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 3.08% ✅ | 1.92% ✅ | ✅ |
| chaos_tour | Endgeld | €2.900 – €9.300 | €5.825 ✅ | €5.895 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1492.22 ✅ | 1518.36 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 0.38% ✅ | 1.15% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €4.200 – €13.000 | €8.306 ✅ | €8.515 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1702.54 ✅ | 1647.52 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €3.064 | €6.409 | €8.578 | €29.387 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €273 | €866 | €560 | €1.081 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €1.613 | €3.537 | €5.394 | €8.199 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €263 | €965 | €2.296 | €3.008 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Festival Push | €266 | €1.261 | €3.261 | €4.460 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €1.313 | €2.713 | €4.174 | €5.825 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €1.665 | €3.466 | €5.586 | €8.306 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.045 | €2.200 | €3.328 | €5.155 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €651 | €1.196 | €1.787 | €2.398 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.210 | €2.300 | €3.629 | €5.103 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €2.014 | €3.101 | €4.470 | €6.332 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.913 | €11.184 | €12.998 | €32.142 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.083 | €85 | 47.7× | 3.06 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €1.063 | €49 | 25.3× | 11.76 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.330 | €68 | 34.7× | 5.36 | 0.35 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.586 | €54 | 30.7× | 7.88 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.134 | €55 | 39.2× | 5.86 | 0.38 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.822 | €64 | 29× | 6.86 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.335 | €68 | 34.1× | 5.35 | 0.35 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.581 | €61 | 26.2× | 7.91 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €942 | €55 | 18.5× | 13.27 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.632 | €63 | 26.2× | 7.66 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.759 | €67 | 26.4× | 7.11 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €4.264 | €97 | 44× | 2.93 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.5 | 62 | 13.1% | 63.7% | 23.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.7 | 57 | 14% | 68.9% | 17.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.1 | 63 | 8.7% | 61.5% | 29.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.3 | 63 | 10.1% | 63% | 27% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.1 | 70 | 2.2% | 45.8% | 51.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 7 | 58 | 23.5% | 62% | 14.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6 | 64 | 7.2% | 64.3% | 28.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.6 | 61 | 15.7% | 63.7% | 20.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 59 | 21.6% | 62.6% | 15.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.6 | 60 | 16.3% | 63.7% | 20% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.7 | 61 | 14.7% | 67.2% | 18.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.3 | 63 | 11.2% | 63.2% | 25.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 48 | 0 | 0.09 | 0.01 | 1.11 | 1.64 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 60 | 0 | 0.01 | 0 | 1.04 | 0.35 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 51 | 0 | 0.03 | 0.01 | 1.05 | 0.82 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 58 | 0 | 0.01 | 0 | 1.04 | 0.44 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 59 | 0 | 0.01 | 0 | 1.15 | 0.39 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 45 | 0 | 0.03 | 0 | 1.09 | 0.79 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 0 | 0.02 | 0 | 1.13 | 0.73 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 51 | 0 | 0 | 0 | 1.1 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 48 | 0.32 | 0.02 | 0 | 0.94 | 0.72 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 0 | 0.02 | 0 | 1.04 | 0.79 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 49 | 0 | 0.01 | 0 | 1.12 | 0.83 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 52 | 0 | 0.05 | 0.01 | 1.02 | 1.82 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.12 | 0.21 | 0.22 | 0.12 | 0.55 | 1.12 | 11.77 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.22 | 0.28 | 0.23 | 0.03 | 0.13 | 1.04 | 7.78 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.23 | 0.32 | 0.35 | 0.15 | 0.57 | 1.16 | 11.05 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.22 | 0.42 | 0.43 | 0.09 | 0.42 | 1.1 | 9.93 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.12 | 0.32 | 0.22 | 0.04 | 0.18 | 1.25 | 10.2 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.35 | 0.48 | 0.55 | 0.2 | 0.8 | 1.2 | 10.88 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.21 | 0.32 | 0.33 | 0.13 | 0.43 | 1.24 | 11.16 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.18 | 0.33 | 0.32 | 0.12 | 0.4 | 1.19 | 10.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.18 | 0.3 | 0.26 | 0.11 | 0.38 | 1.1 | 9.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.08 | 0.15 | 0.18 | 0.03 | 0.25 | 1.19 | 10.76 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.15 | 0.24 | 0.24 | 0.05 | 0.3 | 1.18 | 11.26 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.18 | 0.28 | 0.39 | 0.2 | 0.93 | 1.22 | 12.2 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.16 | 3.04 | 3.08 | 3.03 | 18.31 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 1.57 | 0.56 | 0.51 | 0.5 | 3.14 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 4.51 | 1.49 | 1.49 | 1.52 | 9.01 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 2.71 | 0.87 | 0.92 | 0.93 | 5.43 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 2.76 | 0.97 | 0.93 | 0.86 | 5.52 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 4.47 | 1.57 | 1.47 | 1.42 | 8.93 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 4.57 | 1.51 | 1.5 | 1.56 | 9.14 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 4.54 | 1.55 | 1.46 | 1.53 | 9.08 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 4.17 | 1.38 | 1.37 | 1.42 | 8.34 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 4.4 | 1.4 | 1.51 | 1.5 | 8.81 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 4.55 | 1.49 | 1.52 | 1.53 | 9.09 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 9.3 | 3.13 | 3.07 | 3.1 | 18.6 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.37 | 0.18 | 0.17 | 0.33 | 0.37 | 2.12 | €0 | 0 | 99.6% |
| Bootstrap Struggle | 0 | 0 | 0 | 0.3 | 0 | 0.57 | €0 | 0 | 67.7% |
| Aggressive Marketing | 0.14 | 0.09 | 0.05 | 0.3 | 0.14 | 1.27 | €0 | 0 | 96.5% |
| Scandal Recovery | 0.01 | 0.01 | 0 | 0.31 | 0.01 | 0.99 | €0 | 0 | 90.4% |
| Festival Push | 0.02 | 0.01 | 0.02 | 0.27 | 0.02 | 0.71 | €0 | 0 | 98.8% |
| Chaos Tour | 0.08 | 0.07 | 0.03 | 0.3 | 0.08 | 1.23 | €1 | 0 | 92.7% |
| Cult Hypergrowth | 0.15 | 0.1 | 0.03 | 0.37 | 0.15 | 1.5 | €1 | 0 | 98.8% |
| No Social (Fame 0-50) | 0.03 | 0.03 | 0.01 | 0.31 | 0.03 | 1.21 | €1 | 0 | 96.5% |
| High Controversy | 0 | 0 | 0 | 0.33 | 0 | 1.2 | €104 | 0.03 | 91.2% |
| Early Game Probe (Fame 0–50) | 0.05 | 0.03 | 0.03 | 0.35 | 0.05 | 1.42 | €0 | 0 | 95.4% |
| Mid Game Probe (Fame 60–150) | 0.06 | 0.04 | 0.03 | 0.35 | 0.06 | 1.38 | €0 | 0 | 96.9% |
| Late Game Probe (Fame 175+) | 0.63 | 0.25 | 0.37 | 0.28 | 0.63 | 2.28 | €1 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €32.142 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 11621 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 30.77% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €4.264 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €32.224 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 9.3 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 2.38 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 14726 | 3105 | 0 | 3105 | 0 | 0 | 260/260 |
| Bootstrap Struggle | 2459 | 1232 | 0 | 1232 | 0 | 0 | 260/260 |
| Aggressive Marketing | 7419 | 2739 | 0 | 2739 | 0 | 0 | 260/260 |
| Scandal Recovery | 4300 | 1943 | 0 | 1943 | 0 | 0 | 260/260 |
| Festival Push | 4717 | 1938 | 0 | 1938 | 0 | 0 | 260/260 |
| Chaos Tour | 6706 | 2505 | 0 | 2505 | 1 | 0 | 260/260 |
| Cult Hypergrowth | 7802 | 2520 | 0 | 2520 | 0 | 0 | 260/260 |
| No Social (Fame 0-50) | 6949 | 2447 | 0 | 2447 | 0 | 0 | 260/260 |
| High Controversy | 6284 | 2197 | 0 | 2197 | 1 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7007 | 2534 | 0 | 2534 | 0 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 6985 | 2639 | 0 | 2639 | 0 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 14470 | 3507 | 0 | 3507 | 1 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €29.387 | €29.708 | €5.205 | €22.511 | €35.384 |
| Bootstrap Struggle | €1.081 | €733 | €1.252 | €0 | €2.997 |
| Aggressive Marketing | €8.199 | €8.180 | €2.879 | €4.783 | €11.787 |
| Scandal Recovery | €3.008 | €2.794 | €1.915 | €457 | €5.515 |
| Festival Push | €4.460 | €4.489 | €2.271 | €1.415 | €7.601 |
| Chaos Tour | €5.825 | €5.808 | €2.630 | €2.608 | €9.011 |
| Cult Hypergrowth | €8.306 | €8.369 | €2.629 | €4.960 | €11.531 |
| No Social (Fame 0-50) | €5.155 | €5.111 | €2.014 | €2.642 | €7.698 |
| High Controversy | €2.398 | €2.309 | €1.832 | €0 | €4.623 |
| Early Game Probe (Fame 0–50) | €5.103 | €4.991 | €2.126 | €2.536 | €7.860 |
| Mid Game Probe (Fame 60–150) | €6.332 | €6.423 | €2.152 | €3.406 | €9.057 |
| Late Game Probe (Fame 175+) | €32.142 | €31.919 | €6.609 | €23.681 | €40.462 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 80 | 260 | 30.77% | 25.47% | 36.63% |
| Aggressive Marketing | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Scandal Recovery | 18 | 260 | 6.92% | 4.42% | 10.68% |
| Festival Push | 7 | 260 | 2.69% | 1.31% | 5.45% |
| Chaos Tour | 8 | 260 | 3.08% | 1.57% | 5.95% |
| Cult Hypergrowth | 1 | 260 | 0.38% | 0.07% | 2.15% |
| No Social (Fame 0-50) | 6 | 260 | 2.31% | 1.06% | 4.94% |
| High Controversy | 38 | 260 | 14.62% | 10.84% | 19.42% |
| Early Game Probe (Fame 0–50) | 10 | 260 | 3.85% | 2.10% | 6.93% |
| Mid Game Probe (Fame 60–150) | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 0.00% | 1–5% | 10% | 0.00–1.46% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Bootstrap Struggle | 30.77% | 15–30% | 60% | 25.47–36.63% | straddles_upper | above_target | within_target | unstable_boundary | 🟡 unstable |
| Aggressive Marketing | 2.31% | 2–8% | 15% | 1.06–4.94% | straddles_lower | within_target | below_target | unstable_boundary | 🟡 unstable |
| Scandal Recovery | 6.92% | 8–20% | 50% | 4.42–10.68% | straddles_lower | below_target | within_target | unstable_boundary | 🟡 unstable |
| Festival Push | 2.69% | 5–15% | 35% | 1.31–5.45% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Chaos Tour | 3.08% | 8–20% | 25% | 1.57–5.95% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 0.38% | 2–10% | 12% | 0.07–2.15% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ baseline_touring: Insolvenzrate 0% liegt unter dem Zielkorridor 1–5% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ bootstrap_struggle: Kalibrierung und Holdout ordnen die Rate 30.77% unterschiedlich zum Korridor 15–30% ein — das Szenario liegt auf einer Korridorgrenze.
- ⚠️ aggressive_marketing: Kalibrierung und Holdout ordnen die Rate 2.31% unterschiedlich zum Korridor 2–8% ein — das Szenario liegt auf einer Korridorgrenze.
- ⚠️ scandal_recovery: Kalibrierung und Holdout ordnen die Rate 6.92% unterschiedlich zum Korridor 8–20% ein — das Szenario liegt auf einer Korridorgrenze.
- ⚠️ festival_push: Insolvenzrate 2.69% liegt unter dem Zielkorridor 5–15% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate 3.08% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ cult_hypergrowth: Insolvenzrate 0.38% liegt unter dem Zielkorridor 2–10% — das Szenario ist sicherer als beabsichtigt.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0% | 1.54% | 0% | 0% | 0.02 | 8.42% | 44.81% | €22.511 | — | 16.15% |
| Bootstrap Struggle | 30.77% | 100% | 99.62% | 0.38% | 4.66 | 71.8% | 92.61% | €309 | 7.5 | 0.38% |
| Aggressive Marketing | 2.31% | 100% | 5.38% | 0% | 1.2 | 28.22% | 60.21% | €5.153 | 3.5 | 8.46% |
| Scandal Recovery | 6.92% | 100% | 50% | 0.38% | 2.89 | 54.4% | 79.61% | €1.133 | 8 | 1.15% |
| Festival Push | 2.69% | 100% | 46.54% | 0.38% | 2.5 | 50.4% | 74.4% | €1.660 | 7 | 1.15% |
| Chaos Tour | 3.08% | 100% | 12.69% | 0% | 1.38 | 32.88% | 65.32% | €2.758 | 6 | 6.54% |
| Cult Hypergrowth | 0.38% | 100% | 5.38% | 0% | 1.13 | 27.2% | 57.2% | €5.035 | 3 | 9.23% |
| No Social (Fame 0-50) | 2.31% | 100% | 9.62% | 0.77% | 1.49 | 36.55% | 67.39% | €2.792 | 5.5 | 2.69% |
| High Controversy | 14.62% | 100% | 33.08% | 0.38% | 2.62 | 48.61% | 83.34% | €945 | 6 | 0% |
| Early Game Probe (Fame 0–50) | 3.85% | 100% | 10.77% | 0.77% | 1.46 | 33.2% | 69.75% | €3.127 | 6 | 3.46% |
| Mid Game Probe (Fame 60–150) | 0.38% | 5% | 0.38% | 0% | 0.06 | 26.33% | 63.07% | €3.420 | 8 | 3.85% |
| Late Game Probe (Fame 175+) | 0% | 0% | 0% | 0% | 0 | 12.78% | 52.36% | €23.681 | — | 23.08% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zwei Spalten tragen kaum Signal und sagen warum: „je < €500“ sättigt bei 100%, weil der Startstand selbst €500 beträgt und ein einziger Tag ohne Gig darunter führt — aussagekräftig sind hier die Tage-Spalte und die €250-Marke. „Saldo 0“ bleibt bei 0%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Ankünfte ohne Bühne | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 9.16 | 10 | 10 | 100% | 0.84 | 0 |
| Bootstrap Struggle | 1.57 | 1.67 | 1.67 | 0% | 0.1 | 0 |
| Aggressive Marketing | 4.51 | 4.92 | 4.92 | 0% | 0.41 | 0 |
| Scandal Recovery | 2.71 | 2.91 | 2.91 | 0% | 0.2 | 0 |
| Festival Push | 2.76 | 2.96 | 2.96 | 0% | 0.2 | 0 |
| Chaos Tour | 4.47 | 4.9 | 4.9 | 0% | 0.43 | 0 |
| Cult Hypergrowth | 4.57 | 4.98 | 4.98 | 0% | 0.41 | 0 |
| No Social (Fame 0-50) | 4.54 | 4.93 | 4.93 | 0% | 0.39 | 0 |
| High Controversy | 4.17 | 4.45 | 4.45 | 0% | 0.28 | 0 |
| Early Game Probe (Fame 0–50) | 4.40 | 4.89 | 4.89 | 0% | 0.49 | 0 |
| Mid Game Probe (Fame 60–150) | 4.55 | 4.99 | 4.99 | 0% | 0.44 | 0 |
| Late Game Probe (Fame 175+) | 9.30 | 10 | 10 | 99.62% | 0.69 | 0 |

Knotentypen über alle Ankünfte: GIG 63.15% · FINALE 10% · FESTIVAL 9.35% · SPECIAL 9.08% · REST_STOP 4.38% · SUPPLY_STOP 4.04% (Beispiel Baseline Touring).

**Das beantwortet die Gap-1-Frage strukturell.** Nur ein Szenario, das praktisch täglich spielt, legt die zehn Hops zurück und erreicht das Finale; bei jedem zweiten oder vierten Tag endet die Tour auf halber Strecke und die zahlenden Bühnen der späten Ebenen werden nie erreicht. Die Dominanz dichter Touren ist damit kein zinseszinsartiger Exploit, sondern die einzige Gangart, die die Tour im Horizont überhaupt beendet — eine Struktureigenschaft der Karte, über die eine Designentscheidung zu treffen ist, kein Balancefehler, den ein Hebel wegdämpfen könnte.

Modellgrenze: Nicht-Gig-Tage verbrauchen keinen Hop. Im Spiel vergeht ein Tag nur durch Anreise, hier pausiert die Band am Ort. Die Gig-Kadenz bleibt damit die Szenario-Stellschraube `gigGapDays`, damit die Gap-Analyse aus Phase 3C weiter dasselbe misst; Streckenwahl, Erreichbarkeit und Entfernungen sind echt.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 67 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 98.85% | 3 | 95% | 3 | 10.72 | 16% | MERCH | €7.355,88 | €6.742,17 | 0.75 | 0.2 | 1.75 | 59.41 |
| Bootstrap Struggle | 1 | 89.23% | 5 | 86.15% | 2 | 7.58 | 11.32% | MERCH | €748,86 | €688,53 | 3.11 | 1.2 | 7.9 | 54.44 |
| Aggressive Marketing | 1 | 96.92% | 4 | 91.54% | 2 | 10.2 | 15.22% | MERCH | €3.075,67 | €2.924,33 | 1.6 | 0.4 | 3.54 | 57.75 |
| Scandal Recovery | 1 | 96.54% | 5 | 91.54% | 2 | 9.39 | 14.01% | HQ | €1.273,06 | €1.181,54 | 2.46 | 0.86 | 7.73 | 53.98 |
| Festival Push | 1 | 96.15% | 5 | 93.85% | 2 | 9.6 | 14.33% | MERCH | €1.727,98 | €1.625,55 | 2.4 | 0.69 | 6.7 | 55.03 |
| Chaos Tour | 1 | 98.08% | 4 | 91.15% | 2 | 10.07 | 15.03% | MERCH | €2.326,64 | €2.188,91 | 1.61 | 0.43 | 3.76 | 57.74 |
| Cult Hypergrowth | 1 | 97.69% | 4 | 93.85% | 2 | 10.29 | 15.36% | HQ | €3.082,51 | €2.941,91 | 1.4 | 0.38 | 3.1 | 58.23 |
| No Social (Fame 0-50) | 1 | 95.77% | 4 | 95% | 2 | 10.08 | 15.04% | HQ | €1.904,3 | €1.792,12 | 1.55 | 0.68 | 3.88 | 57.46 |
| High Controversy | 1 | 98.08% | 4 | 89.62% | 2 | 9.29 | 13.87% | HQ | €1.164,08 | €1.064,82 | 2 | 0.87 | 6.53 | 54.67 |
| Early Game Probe (Fame 0–50) | 1 | 95% | 4 | 91.15% | 2 | 10 | 14.93% | MERCH | €2.036,93 | €1.922,56 | 1.66 | 0.52 | 4.41 | 57.03 |
| Mid Game Probe (Fame 60–150) | 1 | 97.69% | 4 | 86.15% | 3 | 10.39 | 15.51% | INSTRUMENT | €2.855,52 | €2.693,86 | 1.63 | 0.03 | 3.15 | 57.95 |
| Late Game Probe (Fame 175+) | 1 | 98.46% | 2 | 95% | 4 | 10.91 | 16.28% | GEAR | €11.871,93 | €10.826,68 | 0.6 | 0 | 0.74 | 60.2 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €3.731 | €4.074 | 0.916 | 0 | 0% | €85 | 2.09% | 95.35% |
| Bootstrap Struggle | €214 | €1.239 | 0.173 | 0 | 0% | €49 | 3.95% | 93.02% |
| Aggressive Marketing | €1.080 | €2.365 | 0.457 | 0 | 0% | €68 | 2.88% | 95.35% |
| Scandal Recovery | €456 | €1.648 | 0.277 | 0 | 0% | €54 | 3.25% | 95.35% |
| Festival Push | €607 | €2.175 | 0.279 | 0 | 0% | €55 | 2.55% | 95.35% |
| Chaos Tour | €843 | €1.862 | 0.453 | 0 | 0.04% | €64 | 3.45% | 95.35% |
| Cult Hypergrowth | €1.070 | €2.333 | 0.459 | 0 | 0.04% | €68 | 2.93% | 95.35% |
| No Social (Fame 0-50) | €735 | €1.604 | 0.458 | 0 | 0.04% | €61 | 3.81% | 95.35% |
| High Controversy | €451 | €1.021 | 0.442 | 0.14 | 1.47% | €55 | 5.42% | 93.02% |
| Early Game Probe (Fame 0–50) | €741 | €1.659 | 0.447 | 0 | 0% | €63 | 3.81% | 95.35% |
| Mid Game Probe (Fame 60–150) | €799 | €1.754 | 0.455 | 0 | 0% | €67 | 3.79% | 95.35% |
| Late Game Probe (Fame 175+) | €3.962 | €4.258 | 0.93 | 0 | 0.04% | €97 | 2.27% | 95.35% |

„Katalog < 1 Gig“ ist der Anteil der 43 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind in allen Szenarien 0, und das ist ein Befund über den Verschleiß, nicht über Pausen.** Der Ruhe-Auslöser nutzt die Marken, die das Spiel selbst im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50). Gemessen über alle Runs fällt die niedrigste Stamina nie unter 47 und die Mood liegt durch die tägliche Drift bei genau 50 — die Verschleißmechanik erreicht ihre eigenen Warnschwellen also nie. Dichte Touren erzeugen damit keinen Druck, der eine Pause erzwingen würde, und die Opportunitätskosten einer Pause sind in diesem Modell folglich nicht messbar. `avgFreeRestStops` im JSON zählt separat die Ruhetage ohne bezahlten Klinikbesuch; `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €29.387 | 260 / €29.387 | 0 / €0 |
| Bootstrap Struggle | 260 / €1.081 | 180 / €1.562 | 80 / €0 |
| Aggressive Marketing | 260 / €8.199 | 254 / €8.393 | 6 / €0 |
| Scandal Recovery | 260 / €3.008 | 242 / €3.232 | 18 / €0 |
| Festival Push | 260 / €4.460 | 253 / €4.584 | 7 / €0 |
| Chaos Tour | 260 / €5.825 | 252 / €6.010 | 8 / €0 |
| Cult Hypergrowth | 260 / €8.306 | 259 / €8.338 | 1 / €0 |
| No Social (Fame 0-50) | 260 / €5.155 | 254 / €5.277 | 6 / €0 |
| High Controversy | 260 / €2.398 | 222 / €2.808 | 38 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €5.103 | 250 / €5.307 | 10 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €6.332 | 259 / €6.357 | 1 / €0 |
| Late Game Probe (Fame 175+) | 260 / €32.142 | 260 / €32.142 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €5.205 | 0.1771 | 14.76% | 44.81% |
| Bootstrap Struggle | €1.252 | 1.1582 | 73.90% | 92.61% |
| Aggressive Marketing | €2.879 | 0.3511 | 33.68% | 60.21% |
| Scandal Recovery | €1.915 | 0.6366 | 57.05% | 79.61% |
| Festival Push | €2.271 | 0.5092 | 53.05% | 74.40% |
| Chaos Tour | €2.630 | 0.4515 | 37.47% | 65.32% |
| Cult Hypergrowth | €2.629 | 0.3165 | 32.60% | 57.20% |
| No Social (Fame 0-50) | €2.014 | 0.3907 | 39.24% | 67.39% |
| High Controversy | €1.832 | 0.764 | 52.63% | 83.34% |
| Early Game Probe (Fame 0–50) | €2.126 | 0.4166 | 38.15% | 69.75% |
| Mid Game Probe (Fame 60–150) | €2.152 | 0.3399 | 30.64% | 63.07% |
| Late Game Probe (Fame 175+) | €6.609 | 0.2056 | 21.08% | 52.36% |

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
| brandDeals | ✅ | 27691 | 80 | 20 |
| postOptions | ✅ | 2425 | 2425 | 25 |
| socialTrends | ✅ | 30418 | 3637 | 5 |
| contraband | ✅ | 30418 | 3333 | 37 |
| minigamesTravel | ✅ | 14744 | 8711 | - |
| minigamesRoadie | ✅ | 4930 | 4499 | - |
| minigamesKabelsalat | ✅ | 4897 | 3409 | - |
| minigamesAmp | ✅ | 4917 | 3521 | - |
| sponsorship | ✅ | 27848 | 75 | - |
| restStops | ✅ | 16054 | 7 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €15.000 – €47.000 | €29.387 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1603.35 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 30.77% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €550 – €1.700 | €1.081 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1483.23 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €4.100 – €13.000 | €8.199 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1618.74 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 6.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €1.500 – €4.800 | €3.008 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1567.48 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 2.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €2.200 – €7.100 | €4.460 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1702.74 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 3.08% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €2.900 – €9.300 | €5.825 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1492.22 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €4.200 – €13.000 | €8.306 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1702.54 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €1.757 | -5.42 | -0.84 |
| Bootstrap Struggle | 8.85% | €-2.325 | -13.24 | -0.16 |
| Aggressive Marketing | 1.93% | €-9.703 | -17.22 | -0.47 |
| Scandal Recovery | 5.77% | €-5.649 | -17.38 | -0.27 |
| Festival Push | 0.38% | €-5.930 | -22.02 | -0.2 |
| Chaos Tour | 2.7% | €-9.741 | 1.78 | -0.51 |
| Cult Hypergrowth | 0.38% | €-10.212 | 32.76 | -0.43 |
| No Social (Fame 0-50) | 2.31% | €-10.183 | 1.46 | -0.46 |
| High Controversy | 11.54% | €-8.117 | 29.37 | -0.53 |
| Early Game Probe (Fame 0–50) | 3.85% | €-10.255 | 22.79 | -0.6 |
| Mid Game Probe (Fame 60–150) | 0.38% | €-11.342 | -7.39 | -0.45 |
| Late Game Probe (Fame 175+) | 0% | €-3.983 | -46.72 | -0.69 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 30.77% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €32.142 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 2.38 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 7/7 Szenarien unter ihrer harten Insolvenzgrenze.
- Risikobänder: low_risk 4 · unstable 3.
- ⚠️ 7 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
