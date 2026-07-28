# Game Balance Simulation – Analyse

Erstellt am: 2026-07-28T07:04:14.795Z

## Reproduzierbarkeit

- Report-Version: 13
- Node-Version: v22.22.2
- Basis-Commit: 37733909c537a606589374ce5597fdd0b1edd319
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: f759d80542649c61929e3f1e1c1a4caf640328464615470a0176399a091d3d1e
- Szenariokonfiguration SHA-256: 924af59511d59596f6e10d7f75d961a30e36b1f58565254d6a6f894787d969aa
- KPI-Zielkonfiguration SHA-256: 1bb574c9754c41c53b184bf7b56710603d0fb2a49dc62b83ddb11722daea71b1
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
| Baseline Touring | €500 | 0 | €29.858 | 26.31% | 0.03 | 2.9% | 13329 | 8 | 48 | 6.18 | 9.91 | 0 | 0% | €4.537 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €4.457 | 60.19% | 0.03 | 1.7% | 2147 | 3 | 52 | 1.43 | 1.83 | 0 | 17.31% | €2.690 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €18.104 | 26.86% | 0.03 | 4.7% | 6218 | 5 | 50 | 3.8 | 4.99 | 0 | 0.38% | €4.884 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €9.536 | 38.14% | 0.03 | 2.1% | 3396 | 4 | 51 | 2.02 | 2.98 | 0 | 1.15% | €3.780 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €11.137 | 37.2% | 0.03 | 4.3% | 3699 | 4 | 53 | 2.49 | 2.98 | 0 | 0.77% | €4.414 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €16.491 | 24.94% | 0.04 | 2.9% | 5346 | 5 | 39 | 4.34 | 4.95 | 0 | 0.38% | €4.257 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €19.336 | 27.34% | 0.03 | 4.3% | 6214 | 5 | 52 | 2.97 | 4.98 | 0 | 0.38% | €5.060 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €15.999 | 24.76% | 0.04 | 2.7% | 5875 | 5 | 47 | 0 | 5 | 0 | 0% | €4.095 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €12.574 | 27.74% | 0.05 | 1.6% | 5496 | 5 | 41 | 54.22 | 4.97 | 0.01 | 0.38% | €3.060 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €15.946 | 22.09% | 0.04 | 2.1% | 6072 | 5 | 45 | 2.98 | 4.99 | 0 | 0% | €3.966 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €17.935 | 19.57% | 0.04 | 2.3% | 5805 | 5 | 47 | 2.81 | 4.99 | 0 | 0% | €4.461 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €36.206 | 28.51% | 0.03 | 4.2% | 13771 | 8 | 49 | 6.74 | 9.96 | 0 | 0% | €5.018 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €31.958 | €500 | €4.537 | 0.16 | 0.07 | 3.29 | 1.02 | 1.27 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €4.985 | €204 | €2.690 | 0 | 0.01 | 0.77 | 0 | 0.21 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €20.020 | €412 | €4.884 | 0.04 | 0.02 | 2.34 | 0.19 | 0.94 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €10.280 | €316 | €3.780 | 0.03 | 0.03 | 1.54 | 0.01 | 0.53 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €12.191 | €319 | €4.414 | 0.02 | 0.02 | 1.87 | 0.01 | 0.53 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €17.693 | €412 | €4.257 | 0.05 | 0.04 | 2.4 | 0.11 | 0.78 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €21.139 | €411 | €5.060 | 0.02 | 0.02 | 2.45 | 0.16 | 0.82 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €17.244 | €413 | €4.095 | 0 | 0 | 2.2 | 0.13 | 0.82 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| High Controversy | €13.063 | €380 | €3.060 | 0.04 | 0.03 | 2.04 | 0.17 | 0.85 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €16.635 | €412 | €3.966 | 0.05 | 0.03 | 2.19 | 0.15 | 0.89 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €19.282 | €1.390 | €4.461 | 0.05 | 0.03 | 2.51 | 0.21 | 0.93 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €37.556 | €4.999 | €5.018 | 0.14 | 0.07 | 3.62 | 1.07 | 1.21 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-holdout-marker-plus-run-index`, 260 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 0% ✅ | 0% ✅ | ✅ |
| baseline_touring | Endgeld | €15.000 – €47.000 | €29.858 ✅ | €27.880 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1528.06 ✅ | 1555.77 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 17.31% ✅ | 16.92% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €2.000 – €7.000 | €4.457 ✅ | €4.371 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1465.5 ✅ | 1448.9 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 0.38% ✅ | 0% ✅ | ✅ |
| aggressive_marketing | Endgeld | €9.000 – €28.000 | €18.104 ✅ | €18.646 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1529.68 ✅ | 1532.36 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 1.15% ✅ | 1.15% ✅ | ✅ |
| scandal_recovery | Endgeld | €4.500 – €15.000 | €9.536 ✅ | €9.533 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1471.51 ✅ | 1538.29 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 0.77% ✅ | 0.77% ✅ | ✅ |
| festival_push | Endgeld | €5.500 – €18.000 | €11.137 ✅ | €11.424 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 1631.94 ✅ | 1651.29 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 0.38% ✅ | 0.77% ✅ | ✅ |
| chaos_tour | Endgeld | €8.000 – €26.000 | €16.491 ✅ | €16.319 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1402.69 ✅ | 1407.74 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 0.38% ✅ | 0% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €9.500 – €31.000 | €19.336 ✅ | €19.656 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1573.44 ✅ | 1531.57 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €7.621 | €16.419 | €21.132 | €29.858 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €327 | €938 | €676 | €4.457 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €1.671 | €8.577 | €13.411 | €18.104 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €327 | €1.091 | €6.511 | €9.536 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €327 | €1.448 | €7.911 | €11.137 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €1.349 | €6.997 | €11.023 | €16.491 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €1.694 | €8.624 | €13.591 | €19.336 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.127 | €6.405 | €10.751 | €15.999 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €683 | €3.968 | €7.137 | €12.574 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.207 | €6.777 | €10.491 | €15.946 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.742 | €9.127 | €13.213 | €17.935 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €14.299 | €21.695 | €25.150 | €36.206 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.537 | €87 | 52.2× | 2.76 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €2.690 | €47 | 62.3× | 4.65 | 0.3 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Aggressive Marketing | €4.884 | €74 | 65.8× | 2.56 | 0.17 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €3.780 | €57 | 67× | 3.31 | 0.21 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Festival Push | €4.414 | €59 | 75.3× | 2.83 | 0.18 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Chaos Tour | €4.257 | €71 | 59.9× | 2.94 | 0.19 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Cult Hypergrowth | €5.060 | €74 | 68.2× | 2.47 | 0.16 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| No Social (Fame 0-50) | €4.095 | €71 | 58× | 3.05 | 0.2 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| High Controversy | €3.060 | €65 | 47.6× | 4.08 | 0.26 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €3.966 | €71 | 55.8× | 3.15 | 0.2 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Mid Game Probe (Fame 60–150) | €4.461 | €78 | 57.3× | 2.8 | 0.18 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Late Game Probe (Fame 175+) | €5.018 | €94 | 53.5× | 2.49 | 0.16 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 60 | 17% | 65.3% | 17.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.1 | 58 | 19.6% | 70.1% | 10.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 12.9% | 68.3% | 18.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.8 | 60 | 17.1% | 67.3% | 15.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.8 | 66 | 4.3% | 65.1% | 30.7% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 7.6 | 55 | 32.8% | 56.8% | 10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.6 | 61 | 12.3% | 70.2% | 17.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7.3 | 57 | 22.4% | 66.2% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.7 | 55 | 31.7% | 60% | 8.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 25.4% | 61.1% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19.6% | 70% | 10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.4 | 62 | 11.6% | 65.8% | 22.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 48 | 0 | 0.06 | 0 | 1.03 | 1.75 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 52 | 0 | 0.01 | 0 | 1.12 | 0.39 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 50 | 0 | 0.02 | 0 | 1.21 | 0.82 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 0 | 0.03 | 0 | 1.11 | 0.53 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 0 | 0.02 | 0 | 1.12 | 0.56 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 39 | 0 | 0.03 | 0.01 | 1.12 | 0.95 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 52 | 0 | 0.01 | 0 | 1.13 | 0.81 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 47 | 0 | 0 | 0 | 1.09 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 41 | 0.01 | 0.03 | 0 | 1.08 | 0.85 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Early Game Probe (Fame 0–50) | 45 | 0 | 0.03 | 0.01 | 1.1 | 0.98 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 47 | 0 | 0.02 | 0 | 1.08 | 0.88 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 49 | 0 | 0.06 | 0 | 1.1 | 1.73 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.12 | 0.21 | 0.25 | 0.12 | 0.65 | 1.24 | 4.31 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.21 | 0.3 | 0.19 | 0.03 | 0.18 | 1.12 | 1.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.24 | 0.32 | 0.39 | 0.11 | 0.7 | 1.1 | 3.21 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.22 | 0.45 | 0.43 | 0.09 | 0.38 | 1.19 | 2.25 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.13 | 0.26 | 0.24 | 0.02 | 0.23 | 1.18 | 2.58 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.33 | 0.63 | 0.58 | 0.18 | 1 | 1.21 | 3.25 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.19 | 0.35 | 0.28 | 0.12 | 0.53 | 1.27 | 3.36 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.2 | 0.3 | 0.32 | 0.13 | 0.49 | 1.15 | 3.12 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.16 | 0.32 | 0.3 | 0.14 | 0.52 | 1.18 | 2.82 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.1 | 0.19 | 0.21 | 0.03 | 0.3 | 1.31 | 3.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.11 | 0.26 | 0.24 | 0.08 | 0.33 | 1.15 | 3.77 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.21 | 0.28 | 0.28 | 0.22 | 0.96 | 1.17 | 4.83 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.91 | 3.22 | 3.32 | 3.37 | 19.82 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 1.83 | 0.63 | 0.63 | 0.56 | 3.65 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 4.99 | 1.7 | 1.7 | 1.59 | 9.98 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 2.98 | 0.99 | 1.01 | 0.97 | 5.95 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 2.98 | 1.06 | 0.95 | 0.98 | 5.97 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 4.95 | 1.63 | 1.69 | 1.62 | 9.89 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 4.98 | 1.62 | 1.69 | 1.67 | 9.96 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 5 | 1.65 | 1.6 | 1.75 | 10 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 4.97 | 1.65 | 1.69 | 1.64 | 9.95 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 4.99 | 1.62 | 1.59 | 1.78 | 9.98 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 4.99 | 1.65 | 1.67 | 1.68 | 9.99 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 9.96 | 3.31 | 3.38 | 3.27 | 19.92 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.62 | 0.14 | 0.34 | 0.33 | 0.62 | 1.85 | €0 | 0 | 100% |
| Bootstrap Struggle | 0.03 | 0.01 | 0 | 0.38 | 0.03 | 0.6 | €0 | 0 | 67.3% |
| Aggressive Marketing | 0.46 | 0.13 | 0.18 | 0.33 | 0.46 | 0.9 | €0 | 0 | 98.5% |
| Scandal Recovery | 0.18 | 0.1 | 0.07 | 0.35 | 0.18 | 0.75 | €0 | 0 | 89.2% |
| Festival Push | 0.24 | 0.13 | 0.06 | 0.32 | 0.24 | 0.43 | €0 | 0 | 98.1% |
| Chaos Tour | 0.4 | 0.15 | 0.12 | 0.33 | 0.4 | 1.14 | €0 | 0 | 89.2% |
| Cult Hypergrowth | 0.49 | 0.2 | 0.22 | 0.33 | 0.49 | 1.29 | €0 | 0 | 99.2% |
| No Social (Fame 0-50) | 0.37 | 0.15 | 0.14 | 0.32 | 0.37 | 0.87 | €0 | 0 | 95% |
| High Controversy | 0.18 | 0.09 | 0.06 | 0.28 | 0.18 | 1.09 | €4 | 0 | 88.5% |
| Early Game Probe (Fame 0–50) | 0.33 | 0.11 | 0.1 | 0.3 | 0.33 | 1.14 | €0 | 0 | 93.5% |
| Mid Game Probe (Fame 60–150) | 0.49 | 0.18 | 0.18 | 0.33 | 0.49 | 1.23 | €0 | 0 | 96.2% |
| Late Game Probe (Fame 175+) | 0.88 | 0.16 | 0.53 | 0.29 | 0.88 | 2.02 | €1 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €36.206 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 13771 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 17.31% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €5.060 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €37.556 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 9.96 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 2.72 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 15158 | 1829 | 0 | 1829 | 1 | 0 | 260/260 |
| Bootstrap Struggle | 2674 | 527 | 0 | 527 | 0 | 0 | 260/260 |
| Aggressive Marketing | 7638 | 1419 | 0 | 1419 | 0 | 0 | 260/260 |
| Scandal Recovery | 4375 | 978 | 0 | 978 | 1 | 0 | 260/260 |
| Festival Push | 4870 | 1171 | 0 | 1171 | 0 | 0 | 260/260 |
| Chaos Tour | 6948 | 1601 | 0 | 1601 | 1 | 0 | 260/260 |
| Cult Hypergrowth | 7830 | 1616 | 0 | 1616 | 0 | 0 | 260/260 |
| No Social (Fame 0-50) | 7333 | 1458 | 0 | 1458 | 1 | 0 | 260/260 |
| High Controversy | 6854 | 1357 | 0 | 1357 | 1 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7505 | 1433 | 0 | 1433 | 0 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 7338 | 1592 | 0 | 1592 | 1 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 15562 | 1965 | 0 | 1965 | 1 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €29.858 | €29.181 | €9.778 | €17.978 | €43.238 |
| Bootstrap Struggle | €4.457 | €3.873 | €3.531 | €0 | €8.086 |
| Aggressive Marketing | €18.104 | €17.566 | €5.224 | €12.544 | €24.741 |
| Scandal Recovery | €9.536 | €9.008 | €3.912 | €5.551 | €14.356 |
| Festival Push | €11.137 | €10.411 | €3.955 | €7.024 | €17.836 |
| Chaos Tour | €16.491 | €15.352 | €5.648 | €10.343 | €24.425 |
| Cult Hypergrowth | €19.336 | €19.019 | €5.679 | €12.813 | €27.030 |
| No Social (Fame 0-50) | €15.999 | €15.259 | €5.144 | €10.355 | €23.130 |
| High Controversy | €12.574 | €11.586 | €5.896 | €6.415 | €20.656 |
| Early Game Probe (Fame 0–50) | €15.946 | €15.530 | €4.868 | €10.278 | €22.826 |
| Mid Game Probe (Fame 60–150) | €17.935 | €17.338 | €5.613 | €11.425 | €26.510 |
| Late Game Probe (Fame 175+) | €36.206 | €35.804 | €10.269 | €23.767 | €50.282 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 45 | 260 | 17.31% | 13.19% | 22.37% |
| Aggressive Marketing | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Scandal Recovery | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Festival Push | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Chaos Tour | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Cult Hypergrowth | 1 | 260 | 0.38% | 0.07% | 2.15% |
| No Social (Fame 0-50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| High Controversy | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Early Game Probe (Fame 0–50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Mid Game Probe (Fame 60–150) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 0.00% | 1–5% | 10% | 0.00–1.46% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Bootstrap Struggle | 17.31% | 15–30% | 60% | 13.19–22.37% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Aggressive Marketing | 0.38% | 2–8% | 15% | 0.07–2.15% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Scandal Recovery | 1.15% | 8–20% | 50% | 0.39–3.34% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Festival Push | 0.77% | 5–15% | 35% | 0.21–2.76% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Chaos Tour | 0.38% | 8–20% | 25% | 0.07–2.15% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 0.38% | 2–10% | 12% | 0.07–2.15% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ baseline_touring: Insolvenzrate 0% liegt unter dem Zielkorridor 1–5% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ aggressive_marketing: Insolvenzrate 0.38% liegt unter dem Zielkorridor 2–8% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ scandal_recovery: Insolvenzrate 1.15% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ festival_push: Insolvenzrate 0.77% liegt unter dem Zielkorridor 5–15% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate 0.38% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ cult_hypergrowth: Insolvenzrate 0.38% liegt unter dem Zielkorridor 2–10% — das Szenario ist sicherer als beabsichtigt.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0% | 0% | 0% | 0% | 0 | 32.27% | 47.81% | €17.978 | — | 13.85% |
| Bootstrap Struggle | 17.31% | 100% | 98.08% | 0% | 4.24 | 51.6% | 82.44% | €2.680 | 8 | 1.15% |
| Aggressive Marketing | 0.38% | 100% | 0.38% | 0% | 1.02 | 17.2% | 56.41% | €12.611 | 10 | 12.69% |
| Scandal Recovery | 1.15% | 100% | 6.54% | 0% | 2.36 | 34.4% | 47.68% | €5.652 | 5 | 9.23% |
| Festival Push | 0.77% | 100% | 5.77% | 0% | 2.25 | 34.4% | 45.03% | €7.063 | 6 | 13.46% |
| Chaos Tour | 0.38% | 100% | 0.38% | 0% | 1.08 | 17.2% | 50.32% | €10.462 | 4 | 13.85% |
| Cult Hypergrowth | 0.38% | 100% | 1.15% | 0% | 1.03 | 17.2% | 57.19% | €12.829 | 4 | 18.46% |
| No Social (Fame 0-50) | 0% | 100% | 0% | 0% | 1.15 | 17.2% | 50.28% | €10.355 | — | 14.62% |
| High Controversy | 0.38% | 100% | 8.08% | 0% | 1.73 | 21.51% | 51.2% | €6.421 | 4 | 8.85% |
| Early Game Probe (Fame 0–50) | 0% | 100% | 0.38% | 0% | 1.08 | 17.2% | 36.49% | €10.278 | — | 10.77% |
| Mid Game Probe (Fame 60–150) | 0% | 0.38% | 0% | 0% | 0 | 8.18% | 51.75% | €11.425 | — | 16.92% |
| Late Game Probe (Fame 175+) | 0% | 0% | 0% | 0% | 0 | 30.81% | 47.79% | €23.767 | — | 15.77% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zwei Spalten tragen kaum Signal und sagen warum: „je < €500“ sättigt bei 100%, weil der Startstand selbst €500 beträgt und ein einziger Tag ohne Gig darunter führt — aussagekräftig sind hier die Tage-Spalte und die €250-Marke. „Saldo 0“ bleibt bei 0%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €29.858 | 260 / €29.858 | 0 / €0 |
| Bootstrap Struggle | 260 / €4.457 | 215 / €5.390 | 45 / €0 |
| Aggressive Marketing | 260 / €18.104 | 259 / €18.174 | 1 / €0 |
| Scandal Recovery | 260 / €9.536 | 257 / €9.647 | 3 / €0 |
| Festival Push | 260 / €11.137 | 258 / €11.223 | 2 / €0 |
| Chaos Tour | 260 / €16.491 | 259 / €16.555 | 1 / €0 |
| Cult Hypergrowth | 260 / €19.336 | 259 / €19.411 | 1 / €0 |
| No Social (Fame 0-50) | 260 / €15.999 | 260 / €15.999 | 0 / €0 |
| High Controversy | 260 / €12.574 | 259 / €12.623 | 1 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €15.946 | 260 / €15.946 | 0 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €17.935 | 260 / €17.935 | 0 / €0 |
| Late Game Probe (Fame 175+) | 260 / €36.206 | 260 / €36.206 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €9.778 | 0.3275 | 26.31% | 47.81% |
| Bootstrap Struggle | €3.531 | 0.7922 | 60.19% | 82.44% |
| Aggressive Marketing | €5.224 | 0.2886 | 26.86% | 56.41% |
| Scandal Recovery | €3.912 | 0.4102 | 38.14% | 47.68% |
| Festival Push | €3.955 | 0.3551 | 37.20% | 45.03% |
| Chaos Tour | €5.648 | 0.3425 | 24.94% | 50.32% |
| Cult Hypergrowth | €5.679 | 0.2937 | 27.34% | 57.19% |
| No Social (Fame 0-50) | €5.144 | 0.3215 | 24.76% | 50.28% |
| High Controversy | €5.896 | 0.4689 | 27.74% | 51.20% |
| Early Game Probe (Fame 0–50) | €4.868 | 0.3053 | 22.09% | 36.49% |
| Mid Game Probe (Fame 60–150) | €5.613 | 0.313 | 19.57% | 51.75% |
| Late Game Probe (Fame 175+) | €10.269 | 0.2836 | 28.51% | 47.79% |

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
| brandDeals | ✅ | 28197 | 96 | 23 |
| postOptions | ✅ | 2665 | 2665 | 25 |
| socialTrends | ✅ | 30992 | 3711 | 5 |
| contraband | ✅ | 30992 | 3454 | 37 |
| minigamesTravel | ✅ | 16258 | 9580 | - |
| minigamesRoadie | ✅ | 5391 | 4894 | - |
| minigamesKabelsalat | ✅ | 5440 | 3738 | - |
| minigamesAmp | ✅ | 5427 | 3957 | - |
| sponsorship | ✅ | 28392 | 80 | - |
| restStops | ✅ | 16312 | 0 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €15.000 – €47.000 | €29.858 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1528.06 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 17.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €2.000 – €7.000 | €4.457 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1465.5 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €9.000 – €28.000 | €18.104 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1529.68 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €15.000 | €9.536 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1471.51 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €5.500 – €18.000 | €11.137 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1631.94 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €8.000 – €26.000 | €16.491 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1402.69 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €9.500 – €31.000 | €19.336 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1573.44 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 17.31% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €36.206 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 2.72 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 7/7 Szenarien unter ihrer harten Insolvenzgrenze.
- Risikobänder: low_risk 6 · healthy 1.
- ⚠️ 6 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
