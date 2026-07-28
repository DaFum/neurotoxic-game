# Game Balance Simulation – Analyse

Erstellt am: 2026-07-28T08:01:55.972Z

## Reproduzierbarkeit

- Report-Version: 13
- Node-Version: v22.22.2
- Basis-Commit: b604065dacd720f3a8347485c2cba06e63936d1b
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 013cc91f41e1eccab99ff9879827e9d161cb9f41460882d633fdc1cb7b1b605b
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
| Baseline Touring | €500 | 0 | €27.630 | 31.65% | 0.03 | 3.6% | 12811 | 8 | 55 | 6.8 | 10 | 0 | 0% | €4.564 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €3.406 | 71.55% | 0.03 | 0.7% | 1347 | 2 | 59 | 0.72 | 1.73 | 0 | 21.92% | €2.295 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €17.902 | 34.21% | 0.03 | 4.2% | 5332 | 5 | 55 | 2.66 | 4.98 | 0 | 0.38% | €4.911 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €8.657 | 52.17% | 0.03 | 2.7% | 2646 | 3 | 57 | 1.95 | 2.98 | 0 | 1.15% | €3.682 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €10.390 | 50.76% | 0.02 | 5.1% | 3019 | 3 | 59 | 2.2 | 2.96 | 0 | 2.31% | €4.489 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €15.566 | 34.24% | 0.03 | 3.4% | 4807 | 4 | 43 | 3.76 | 4.98 | 0 | 0.38% | €4.216 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €18.518 | 35.44% | 0.03 | 5.2% | 5816 | 5 | 56 | 3.14 | 5 | 0 | 0% | €5.148 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €15.338 | 35.26% | 0.04 | 2.5% | 4947 | 4 | 50 | 0 | 5 | 0 | 0% | €4.059 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €10.515 | 38.93% | 0.06 | 1.7% | 4335 | 4 | 48 | 55.6 | 4.7 | 0.43 | 3.08% | €2.908 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €15.358 | 34.5% | 0.04 | 3.6% | 5117 | 5 | 50 | 4.28 | 5 | 0 | 0% | €4.159 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €17.674 | 32.08% | 0.03 | 3.8% | 5028 | 5 | 51 | 3.43 | 5 | 0 | 0% | €4.740 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €36.125 | 28.97% | 0.03 | 4.5% | 12700 | 7 | 54 | 5.69 | 9.99 | 0.02 | 0% | €5.160 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €30.871 | €500 | €4.564 | 0.13 | 0.07 | 6.78 | 1.02 | 1.26 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €4.093 | €151 | €2.295 | 0.01 | 0.02 | 3.93 | 0 | 0.15 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €19.588 | €378 | €4.911 | 0.05 | 0.03 | 5.83 | 0.16 | 0.9 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €9.624 | €253 | €3.682 | 0.01 | 0.02 | 5.03 | 0.01 | 0.53 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €11.898 | €259 | €4.489 | 0.02 | 0.02 | 4.96 | 0.02 | 0.38 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €16.733 | €378 | €4.216 | 0.07 | 0.03 | 5.65 | 0.1 | 0.75 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €20.545 | €378 | €5.148 | 0.02 | 0.02 | 5.72 | 0.13 | 0.8 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €16.424 | €368 | €4.059 | 0 | 0 | 5.62 | 0.13 | 0.87 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| High Controversy | €11.517 | €336 | €2.908 | 0.05 | 0.03 | 5.54 | 0.17 | 0.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €16.681 | €376 | €4.159 | 0.04 | 0.03 | 5.56 | 0.15 | 0.92 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Mid Game Probe (Fame 60–150) | €19.470 | €1.231 | €4.740 | 0.04 | 0.02 | 5.83 | 0.18 | 0.92 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €37.859 | €4.985 | €5.160 | 0.13 | 0.04 | 7.19 | 1.08 | 1.22 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-holdout-marker-plus-run-index`, 260 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 0% ✅ | 0% ✅ | ✅ |
| baseline_touring | Endgeld | €15.000 – €47.000 | €27.630 ✅ | €28.029 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1608.77 ✅ | 1607.3 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 21.92% ✅ | 21.15% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €2.000 – €7.000 | €3.406 ✅ | €3.586 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1496.47 ✅ | 1448.57 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 0.38% ✅ | 0.38% ✅ | ✅ |
| aggressive_marketing | Endgeld | €9.000 – €28.000 | €17.902 ✅ | €18.295 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1635.96 ✅ | 1622.19 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 1.15% ✅ | 2.31% ✅ | ✅ |
| scandal_recovery | Endgeld | €4.500 – €15.000 | €8.657 ✅ | €8.595 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1584.86 ✅ | 1631.2 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 2.31% ✅ | 0.77% ✅ | ✅ |
| festival_push | Endgeld | €5.500 – €18.000 | €10.390 ✅ | €10.542 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 1724.76 ✅ | 1755.61 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 0.38% ✅ | 0% ✅ | ✅ |
| chaos_tour | Endgeld | €8.000 – €26.000 | €15.566 ✅ | €15.299 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1490.44 ✅ | 1510.59 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 0% ✅ | 0.38% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €9.500 – €31.000 | €18.518 ✅ | €19.047 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1669.78 ✅ | 1636.47 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €7.649 | €15.923 | €21.120 | €27.630 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €273 | €933 | €627 | €3.406 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €1.605 | €7.974 | €12.724 | €17.902 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €263 | €950 | €5.849 | €8.657 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €266 | €1.277 | €7.509 | €10.390 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €1.277 | €6.934 | €10.937 | €15.566 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €1.712 | €8.246 | €13.011 | €18.518 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.095 | €6.213 | €9.993 | €15.338 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €659 | €4.146 | €6.976 | €10.515 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.168 | €6.646 | €10.591 | €15.358 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.448 | €8.767 | €12.797 | €17.674 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €13.969 | €20.936 | €25.487 | €36.125 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.564 | €86 | 52.9× | 2.74 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €2.295 | €46 | 56.3× | 5.45 | 0.35 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Aggressive Marketing | €4.911 | €72 | 68.4× | 2.55 | 0.16 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €3.682 | €54 | 68.1× | 3.39 | 0.22 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Festival Push | €4.489 | €57 | 79.8× | 2.78 | 0.18 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Chaos Tour | €4.216 | €70 | 60.6× | 2.96 | 0.19 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Cult Hypergrowth | €5.148 | €73 | 70.6× | 2.43 | 0.16 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| No Social (Fame 0-50) | €4.059 | €69 | 59.1× | 3.08 | 0.2 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| High Controversy | €2.908 | €62 | 48.1× | 4.3 | 0.28 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €4.159 | €70 | 59.8× | 3.01 | 0.19 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Mid Game Probe (Fame 60–150) | €4.740 | €75 | 63.1× | 2.64 | 0.17 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Late Game Probe (Fame 175+) | €5.160 | €93 | 55.4× | 2.42 | 0.16 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.2 | 63 | 10.7% | 62.3% | 27% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.8 | 58 | 14.4% | 69.2% | 16.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6 | 65 | 6.5% | 66% | 27.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.3 | 63 | 10.2% | 65% | 24.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.1 | 70 | 3% | 47.7% | 49.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 7.2 | 57 | 26.8% | 59.8% | 13.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6 | 65 | 6.8% | 64.2% | 29.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.6 | 61 | 16.6% | 64.2% | 19.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 58 | 22.4% | 62.6% | 15% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.5 | 62 | 14.6% | 64.1% | 21.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.7 | 61 | 14.7% | 67.4% | 17.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 5.9 | 65 | 7.7% | 60.3% | 32% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 55 | 0 | 0.07 | 0.01 | 1.03 | 1.87 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Bootstrap Struggle | 59 | 0 | 0.01 | 0 | 1.1 | 0.35 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 55 | 0 | 0.03 | 0.02 | 1.07 | 0.86 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 57 | 0 | 0.02 | 0 | 1.09 | 0.51 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 59 | 0 | 0.02 | 0 | 1.11 | 0.5 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 43 | 0 | 0.03 | 0.01 | 1.11 | 0.94 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 56 | 0 | 0.01 | 0 | 1.04 | 0.85 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 50 | 0 | 0 | 0 | 1.07 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 48 | 0.43 | 0.02 | 0.01 | 1.07 | 0.88 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 0 | 0.02 | 0 | 1.13 | 0.99 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 51 | 0 | 0.02 | 0 | 1.06 | 0.8 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 54 | 0.02 | 0.03 | 0 | 1.02 | 1.89 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.11 | 0.22 | 0.23 | 0.12 | 0.62 | 1.28 | 12.4 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.22 | 0.26 | 0.25 | 0.02 | 0.17 | 1.09 | 8.2 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.19 | 0.32 | 0.36 | 0.15 | 0.67 | 1.17 | 11.43 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.18 | 0.4 | 0.5 | 0.08 | 0.49 | 1.14 | 10.29 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.15 | 0.3 | 0.24 | 0.03 | 0.21 | 1.22 | 10.32 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.26 | 0.6 | 0.55 | 0.22 | 0.93 | 1.14 | 11.3 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.17 | 0.3 | 0.29 | 0.12 | 0.59 | 1.23 | 11.48 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.17 | 0.32 | 0.32 | 0.12 | 0.48 | 1.23 | 11.17 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.18 | 0.32 | 0.27 | 0.08 | 0.42 | 1.13 | 10.88 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.12 | 0.22 | 0.18 | 0.04 | 0.27 | 1.25 | 11.26 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.13 | 0.22 | 0.2 | 0.07 | 0.37 | 1.12 | 11.66 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.23 | 0.35 | 0.35 | 0.2 | 1 | 1.2 | 12.67 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 10 | 3.32 | 3.36 | 3.32 | 20 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 1.73 | 0.59 | 0.58 | 0.56 | 3.46 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 4.98 | 1.66 | 1.6 | 1.72 | 9.96 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 2.98 | 0.96 | 1 | 1.02 | 5.96 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 2.96 | 1.03 | 0.99 | 0.94 | 5.92 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 4.98 | 1.67 | 1.62 | 1.69 | 9.96 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 5 | 1.76 | 1.61 | 1.63 | 10 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 5 | 1.58 | 1.73 | 1.68 | 9.99 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 4.7 | 1.57 | 1.52 | 1.62 | 9.41 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 5 | 1.66 | 1.65 | 1.68 | 9.99 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 5 | 1.62 | 1.67 | 1.71 | 10 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 9.99 | 3.34 | 3.4 | 3.25 | 19.98 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.74 | 0.23 | 0.37 | 0.34 | 0.74 | 2.3 | €1 | 0 | 99.6% |
| Bootstrap Struggle | 0.05 | 0.05 | 0.01 | 0.32 | 0.05 | 0.62 | €0 | 0 | 70% |
| Aggressive Marketing | 0.53 | 0.19 | 0.21 | 0.29 | 0.53 | 1.33 | €0 | 0 | 99.2% |
| Scandal Recovery | 0.16 | 0.07 | 0.02 | 0.27 | 0.16 | 1.11 | €0 | 0 | 92.3% |
| Festival Push | 0.28 | 0.13 | 0.07 | 0.28 | 0.28 | 0.72 | €0 | 0 | 99.2% |
| Chaos Tour | 0.41 | 0.16 | 0.19 | 0.32 | 0.41 | 1.33 | €0 | 0 | 93.1% |
| Cult Hypergrowth | 0.48 | 0.16 | 0.2 | 0.41 | 0.48 | 1.81 | €0 | 0 | 100% |
| No Social (Fame 0-50) | 0.37 | 0.15 | 0.13 | 0.29 | 0.37 | 1.25 | €1 | 0 | 97.7% |
| High Controversy | 0.2 | 0.08 | 0.12 | 0.29 | 0.2 | 1.45 | €143 | 0 | 93.8% |
| Early Game Probe (Fame 0–50) | 0.33 | 0.13 | 0.14 | 0.29 | 0.33 | 1.63 | €0 | 0 | 96.9% |
| Mid Game Probe (Fame 60–150) | 0.53 | 0.23 | 0.26 | 0.34 | 0.53 | 1.55 | €1 | 0 | 98.1% |
| Late Game Probe (Fame 175+) | 0.84 | 0.14 | 0.42 | 0.24 | 0.84 | 2.34 | €6 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €36.125 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 12811 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 21.92% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €5.160 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €37.859 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 10 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 2.56 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 16083 | 3271 | 0 | 3271 | 1 | 0 | 260/260 |
| Bootstrap Struggle | 2684 | 1336 | 0 | 1336 | 0 | 0 | 260/260 |
| Aggressive Marketing | 8154 | 2822 | 0 | 2822 | 1 | 0 | 260/260 |
| Scandal Recovery | 4716 | 2069 | 0 | 2069 | 0 | 0 | 260/260 |
| Festival Push | 5057 | 2037 | 0 | 2037 | 0 | 0 | 260/260 |
| Chaos Tour | 7427 | 2619 | 0 | 2619 | 1 | 0 | 260/260 |
| Cult Hypergrowth | 8349 | 2533 | 0 | 2533 | 1 | 0 | 260/260 |
| No Social (Fame 0-50) | 7570 | 2622 | 0 | 2622 | 0 | 0 | 260/260 |
| High Controversy | 6992 | 2656 | 0 | 2656 | 1 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7838 | 2721 | 0 | 2721 | 0 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 7774 | 2806 | 0 | 2806 | 0 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 15996 | 3470 | 0 | 3470 | 1 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €27.630 | €25.617 | €9.961 | €16.371 | €41.727 |
| Bootstrap Struggle | €3.406 | €3.126 | €3.130 | €0 | €7.409 |
| Aggressive Marketing | €17.902 | €17.466 | €5.781 | €11.515 | €25.412 |
| Scandal Recovery | €8.657 | €7.859 | €4.065 | €4.311 | €14.047 |
| Festival Push | €10.390 | €9.724 | €4.782 | €5.549 | €17.522 |
| Chaos Tour | €15.566 | €14.949 | €5.528 | €9.721 | €23.012 |
| Cult Hypergrowth | €18.518 | €17.782 | €5.880 | €11.923 | €26.472 |
| No Social (Fame 0-50) | €15.338 | €14.309 | €5.673 | €9.365 | €22.749 |
| High Controversy | €10.515 | €9.810 | €5.712 | €4.040 | €19.080 |
| Early Game Probe (Fame 0–50) | €15.358 | €14.292 | €5.482 | €9.582 | €23.643 |
| Mid Game Probe (Fame 60–150) | €17.674 | €16.829 | €5.894 | €10.470 | €25.579 |
| Late Game Probe (Fame 175+) | €36.125 | €34.491 | €11.657 | €22.111 | €52.346 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 57 | 260 | 21.92% | 17.32% | 27.34% |
| Aggressive Marketing | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Scandal Recovery | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Festival Push | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Chaos Tour | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Cult Hypergrowth | 0 | 260 | 0.00% | 0.00% | 1.46% |
| No Social (Fame 0-50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| High Controversy | 8 | 260 | 3.08% | 1.57% | 5.95% |
| Early Game Probe (Fame 0–50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Mid Game Probe (Fame 60–150) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 0.00% | 1–5% | 10% | 0.00–1.46% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Bootstrap Struggle | 21.92% | 15–30% | 60% | 17.32–27.34% | contained | within_target | within_target | stable | 🟢 healthy |
| Aggressive Marketing | 0.38% | 2–8% | 15% | 0.07–2.15% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Scandal Recovery | 1.15% | 8–20% | 50% | 0.39–3.34% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Festival Push | 2.31% | 5–15% | 35% | 1.06–4.94% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Chaos Tour | 0.38% | 8–20% | 25% | 0.07–2.15% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 0.00% | 2–10% | 12% | 0.00–1.46% | entirely_below | below_target | below_target | stable | 🔵 low_risk |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ baseline_touring: Insolvenzrate 0% liegt unter dem Zielkorridor 1–5% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ aggressive_marketing: Insolvenzrate 0.38% liegt unter dem Zielkorridor 2–8% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ scandal_recovery: Insolvenzrate 1.15% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ festival_push: Insolvenzrate 2.31% liegt unter dem Zielkorridor 5–15% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate 0.38% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ cult_hypergrowth: Insolvenzrate 0% liegt unter dem Zielkorridor 2–10% — das Szenario ist sicherer als beabsichtigt.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0% | 0.38% | 0% | 0% | 0 | 34.71% | 50.76% | €16.371 | — | 21.92% |
| Bootstrap Struggle | 21.92% | 100% | 99.62% | 0.38% | 4.36 | 71.25% | 91.6% | €1.203 | 7 | 4.23% |
| Aggressive Marketing | 0.38% | 100% | 3.46% | 0% | 1.07 | 30.57% | 59.89% | €11.525 | 4 | 17.69% |
| Scandal Recovery | 1.15% | 100% | 46.54% | 0% | 2.62 | 50.4% | 70.84% | €4.505 | 6 | 6.92% |
| Festival Push | 2.31% | 100% | 43.46% | 0% | 2.41 | 50.4% | 65.77% | €5.779 | 6 | 12.69% |
| Chaos Tour | 0.38% | 100% | 6.15% | 0% | 1.2 | 28.45% | 61.26% | €9.749 | 4 | 15% |
| Cult Hypergrowth | 0% | 100% | 3.85% | 0% | 1.06 | 32.6% | 60.31% | €11.923 | — | 14.62% |
| No Social (Fame 0-50) | 0% | 100% | 4.62% | 0% | 1.26 | 29.53% | 58.65% | €9.365 | — | 14.23% |
| High Controversy | 3.08% | 100% | 14.62% | 0% | 1.97 | 33.37% | 67.23% | €4.499 | 4 | 7.69% |
| Early Game Probe (Fame 0–50) | 0% | 100% | 3.85% | 0% | 1.2 | 29.04% | 59.32% | €9.582 | — | 12.69% |
| Mid Game Probe (Fame 60–150) | 0% | 3.46% | 0% | 0% | 0.03 | 25.07% | 63.07% | €10.470 | — | 21.54% |
| Late Game Probe (Fame 175+) | 0% | 0% | 0% | 0% | 0 | 29.62% | 48.28% | €22.111 | — | 13.46% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zwei Spalten tragen kaum Signal und sagen warum: „je < €500“ sättigt bei 100%, weil der Startstand selbst €500 beträgt und ein einziger Tag ohne Gig darunter führt — aussagekräftig sind hier die Tage-Spalte und die €250-Marke. „Saldo 0“ bleibt bei 0%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 67 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 98.46% | 3 | 99.62% | 3 | 11.35 | 16.93% | MERCH | €14.352,85 | €12.732,62 | 0.64 | 0.17 | 0.25 | 60.87 |
| Bootstrap Struggle | 1 | 91.92% | 5 | 87.31% | 2 | 7.95 | 11.86% | MERCH | €1.333,17 | €1.250,18 | 3.08 | 1.19 | 6.95 | 55.4 |
| Aggressive Marketing | 1 | 97.69% | 4 | 92.31% | 2 | 10.5 | 15.67% | MERCH | €6.639,81 | €6.107,69 | 1.38 | 0.33 | 2.02 | 59.27 |
| Scandal Recovery | 1 | 96.15% | 5 | 94.23% | 2 | 9.71 | 14.49% | HQ | €2.790,33 | €2.626,54 | 2.39 | 0.74 | 7.7 | 54.01 |
| Festival Push | 1 | 98.08% | 5 | 95% | 2 | 9.82 | 14.65% | MERCH | €3.562,53 | €3.329,2 | 2.26 | 0.69 | 6.68 | 55.01 |
| Chaos Tour | 1 | 97.69% | 4 | 94.23% | 2 | 10.4 | 15.52% | MERCH | €5.786,97 | €5.395,26 | 1.51 | 0.39 | 2.3 | 59.15 |
| Cult Hypergrowth | 1 | 96.92% | 4 | 95.38% | 2 | 10.58 | 15.79% | HQ | €7.083,94 | €6.508,92 | 1.31 | 0.34 | 1.87 | 59.44 |
| No Social (Fame 0-50) | 1 | 98.08% | 4 | 93.46% | 2 | 10.35 | 15.44% | HQ | €5.457,01 | €5.100,49 | 1.38 | 0.56 | 2.16 | 59.12 |
| High Controversy | 1 | 99.23% | 4 | 90.38% | 2 | 10.14 | 15.13% | HQ | €3.941,25 | €3.710,12 | 1.67 | 0.59 | 2.71 | 58.48 |
| Early Game Probe (Fame 0–50) | 1 | 98.08% | 4 | 93.46% | 2 | 10.38 | 15.49% | MERCH | €5.701,77 | €5.276,49 | 1.42 | 0.42 | 2.17 | 59.21 |
| Mid Game Probe (Fame 60–150) | 1 | 99.23% | 4 | 93.08% | 3 | 10.63 | 15.87% | INSTRUMENT | €7.272,77 | €6.731,54 | 1.44 | 0.02 | 1.9 | 59.2 |
| Late Game Probe (Fame 175+) | 1 | 99.62% | 2 | 100% | 4 | 11.44 | 17.07% | GEAR | €19.720,16 | €17.913,88 | 0.54 | 0 | 0.02 | 60.76 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €4.562 | €4.564 | 1 | 0 | 0.04% | €86 | 1.89% | 95.35% |
| Bootstrap Struggle | €487 | €2.610 | 0.187 | 0 | 0% | €46 | 1.78% | 95.35% |
| Aggressive Marketing | €2.460 | €4.925 | 0.5 | 0 | 0% | €72 | 1.46% | 95.35% |
| Scandal Recovery | €1.110 | €3.708 | 0.299 | 0 | 0% | €54 | 1.47% | 95.35% |
| Festival Push | €1.356 | €4.547 | 0.298 | 0 | 0% | €57 | 1.25% | 95.35% |
| Chaos Tour | €2.112 | €4.227 | 0.5 | 0 | 0% | €70 | 1.65% | 95.35% |
| Cult Hypergrowth | €2.574 | €5.148 | 0.5 | 0 | 0% | €73 | 1.42% | 95.35% |
| No Social (Fame 0-50) | €2.027 | €4.057 | 0.5 | 0 | 0.04% | €69 | 1.69% | 95.35% |
| High Controversy | €1.434 | €2.992 | 0.479 | 0.17 | 1.76% | €62 | 2.08% | 95.35% |
| Early Game Probe (Fame 0–50) | €2.078 | €4.160 | 0.5 | 0 | 0% | €70 | 1.67% | 95.35% |
| Mid Game Probe (Fame 60–150) | €2.368 | €4.739 | 0.5 | 0 | 0.04% | €75 | 1.58% | 95.35% |
| Late Game Probe (Fame 175+) | €5.152 | €5.158 | 0.999 | 0.01 | 0.12% | €93 | 1.81% | 95.35% |

„Katalog < 1 Gig“ ist der Anteil der 43 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind in allen Szenarien 0, und das ist ein Befund über den Verschleiß, nicht über Pausen.** Der Ruhe-Auslöser nutzt die Marken, die das Spiel selbst im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50). Gemessen über alle Runs fällt die niedrigste Stamina nie unter 47 und die Mood liegt durch die tägliche Drift bei genau 50 — die Verschleißmechanik erreicht ihre eigenen Warnschwellen also nie. Dichte Touren erzeugen damit keinen Druck, der eine Pause erzwingen würde, und die Opportunitätskosten einer Pause sind in diesem Modell folglich nicht messbar. `avgFreeRestStops` im JSON zählt separat die Ruhetage ohne bezahlten Klinikbesuch; `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €27.630 | 260 / €27.630 | 0 / €0 |
| Bootstrap Struggle | 260 / €3.406 | 203 / €4.363 | 57 / €0 |
| Aggressive Marketing | 260 / €17.902 | 259 / €17.972 | 1 / €0 |
| Scandal Recovery | 260 / €8.657 | 257 / €8.758 | 3 / €0 |
| Festival Push | 260 / €10.390 | 254 / €10.635 | 6 / €0 |
| Chaos Tour | 260 / €15.566 | 259 / €15.626 | 1 / €0 |
| Cult Hypergrowth | 260 / €18.518 | 260 / €18.518 | 0 / €0 |
| No Social (Fame 0-50) | 260 / €15.338 | 260 / €15.338 | 0 / €0 |
| High Controversy | 260 / €10.515 | 252 / €10.848 | 8 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €15.358 | 260 / €15.358 | 0 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €17.674 | 260 / €17.674 | 0 / €0 |
| Late Game Probe (Fame 175+) | 260 / €36.125 | 260 / €36.125 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €9.961 | 0.3605 | 31.65% | 50.76% |
| Bootstrap Struggle | €3.130 | 0.919 | 71.55% | 91.60% |
| Aggressive Marketing | €5.781 | 0.3229 | 34.21% | 59.89% |
| Scandal Recovery | €4.065 | 0.4696 | 52.17% | 70.84% |
| Festival Push | €4.782 | 0.4603 | 50.76% | 65.77% |
| Chaos Tour | €5.528 | 0.3551 | 34.24% | 61.26% |
| Cult Hypergrowth | €5.880 | 0.3175 | 35.44% | 60.31% |
| No Social (Fame 0-50) | €5.673 | 0.3699 | 35.26% | 58.65% |
| High Controversy | €5.712 | 0.5432 | 38.93% | 67.23% |
| Early Game Probe (Fame 0–50) | €5.482 | 0.3569 | 34.50% | 59.32% |
| Mid Game Probe (Fame 60–150) | €5.894 | 0.3335 | 32.08% | 63.07% |
| Late Game Probe (Fame 175+) | €11.657 | 0.3227 | 28.97% | 48.28% |

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
| brandDeals | ✅ | 28045 | 88 | 20 |
| postOptions | ✅ | 2719 | 2719 | 25 |
| socialTrends | ✅ | 30844 | 3692 | 5 |
| contraband | ✅ | 30844 | 3360 | 37 |
| minigamesTravel | ✅ | 16202 | 9544 | - |
| minigamesRoadie | ✅ | 5396 | 4896 | - |
| minigamesKabelsalat | ✅ | 5392 | 3762 | - |
| minigamesAmp | ✅ | 5414 | 3824 | - |
| sponsorship | ✅ | 28244 | 73 | - |
| restStops | ✅ | 16254 | 1 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €15.000 – €47.000 | €27.630 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1608.77 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 21.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €2.000 – €7.000 | €3.406 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1496.47 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €9.000 – €28.000 | €17.902 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1635.96 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €15.000 | €8.657 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1584.86 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €5.500 – €18.000 | €10.390 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1724.76 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €8.000 – €26.000 | €15.566 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1490.44 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Cult Hypergrowth | Endgeld | €9.500 – €31.000 | €18.518 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1669.78 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-2.228 | 80.71 | 0.09 |
| Bootstrap Struggle | 4.61% | €-1.051 | 30.97 | -0.1 |
| Aggressive Marketing | 0% | €-202 | 106.28 | -0.01 |
| Scandal Recovery | 0% | €-879 | 113.35 | 0 |
| Festival Push | 1.54% | €-747 | 92.82 | -0.02 |
| Chaos Tour | 0% | €-925 | 87.75 | 0.03 |
| Cult Hypergrowth | -0.38% | €-818 | 96.34 | 0.02 |
| No Social (Fame 0-50) | 0% | €-661 | 48.7 | 0 |
| High Controversy | 2.7% | €-2.059 | 108.78 | -0.27 |
| Early Game Probe (Fame 0–50) | 0% | €-588 | 65.66 | 0.01 |
| Mid Game Probe (Fame 60–150) | 0% | €-261 | 86.88 | 0.01 |
| Late Game Probe (Fame 175+) | 0% | €-81 | 38.74 | 0.03 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 21.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €36.125 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 2.56 Event-Impulsen (inkl. Gig-Events).

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
