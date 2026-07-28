# Game Balance Simulation – Analyse

Erstellt am: 2026-07-28T09:00:00.247Z

## Reproduzierbarkeit

- Report-Version: 13
- Node-Version: v22.22.2
- Basis-Commit: fe086afbb3b412bb52714b46111b04de41061fb4
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 47b6ab54bb69b387fbd1796d81a34a8adea411e741f0c72e4a3f68e7e807ef33
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
| Baseline Touring | €500 | 0 | €28.913 | 17.15% | 0.04 | 7.8% | 11099 | 7 | 49 | 5.58 | 8.67 | 0 | 0.38% | €4.168 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €913 | 76.44% | 0.08 | 0% | 1137 | 2 | 61 | 0.8 | 1.42 | 0 | 37.31% | €970 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €7.599 | 37.23% | 0.06 | 0% | 4314 | 4 | 53 | 2.47 | 4.15 | 0 | 4.23% | €2.317 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €2.787 | 58.87% | 0.07 | 0% | 2184 | 3 | 59 | 1.7 | 2.54 | 0 | 10.38% | €1.544 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €4.085 | 55.03% | 0.05 | 0% | 2541 | 3 | 60 | 1.59 | 2.56 | 0 | 7.31% | €2.040 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €5.618 | 41.21% | 0.08 | 0% | 3992 | 4 | 47 | 3.5 | 4.19 | 0 | 4.23% | €1.855 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €7.563 | 37.19% | 0.06 | 0% | 4808 | 4 | 55 | 2.58 | 4.2 | 0 | 5% | €2.269 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €4.668 | 43.63% | 0.09 | 0% | 4143 | 4 | 53 | 0 | 4.12 | 0 | 7.69% | €1.553 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €2.288 | 56.5% | 0.15 | 0% | 3781 | 4 | 50 | 56.45 | 3.87 | 0.25 | 19.62% | €938 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €4.655 | 42.68% | 0.09 | 0% | 4117 | 4 | 52 | 3.12 | 4.05 | 0 | 6.54% | €1.602 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €5.902 | 34.7% | 0.08 | 0% | 3952 | 4 | 50 | 3.51 | 4.19 | 0 | 1.15% | €1.792 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €31.245 | 21.84% | 0.04 | 8.4% | 10619 | 7 | 52 | 5.78 | 8.79 | 0 | 0% | €4.344 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €28.933 | €492 | €4.168 | 0.23 | 0.08 | 6.2 | 1.2 | 1.1 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €1.511 | €125 | €970 | 0 | 0 | 3.52 | 0 | 0.11 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €7.975 | €356 | €2.317 | 0.03 | 0.03 | 5.48 | 0.27 | 0.68 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €3.331 | €230 | €1.544 | 0.01 | 0.01 | 4.8 | 0.02 | 0.39 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €4.677 | €245 | €2.040 | 0.01 | 0.02 | 4.84 | 0.02 | 0.25 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €6.003 | €343 | €1.855 | 0.04 | 0.03 | 5.31 | 0.15 | 0.65 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €7.931 | €353 | €2.269 | 0.02 | 0.02 | 5.17 | 0.22 | 0.59 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €4.944 | €334 | €1.553 | 0 | 0 | 5.08 | 0.23 | 0.72 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €2.718 | €263 | €938 | 0 | 0.02 | 4.86 | 0.22 | 0.62 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Early Game Probe (Fame 0–50) | €4.964 | €339 | €1.602 | 0.05 | 0.03 | 5.07 | 0.23 | 0.72 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €6.239 | €1.121 | €1.792 | 0.02 | 0.01 | 5.27 | 0.19 | 0.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €31.286 | €4.849 | €4.344 | 0.11 | 0.05 | 6.4 | 1.2 | 1.06 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-holdout-marker-plus-run-index`, 260 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 0.38% ✅ | 0% ✅ | ✅ |
| baseline_touring | Endgeld | €15.000 – €47.000 | €28.913 ✅ | €28.678 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1636.26 ✅ | 1593.92 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 37.31% ✅ | 36.54% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €550 – €1.700 | €913 ✅ | €974 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1427.72 ✅ | 1422.73 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 4.23% ✅ | 3.46% ✅ | ✅ |
| aggressive_marketing | Endgeld | €4.100 – €13.000 | €7.599 ✅ | €7.527 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1636.61 ✅ | 1644.49 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 10.38% ✅ | 14.62% ✅ | ✅ |
| scandal_recovery | Endgeld | €1.500 – €4.800 | €2.787 ✅ | €2.712 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1518.26 ✅ | 1598.69 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 7.31% ✅ | 7.69% ✅ | ✅ |
| festival_push | Endgeld | €2.200 – €7.100 | €4.085 ✅ | €3.635 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 1654.71 ✅ | 1693.01 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 4.23% ✅ | 5.38% ✅ | ✅ |
| chaos_tour | Endgeld | €2.900 – €9.300 | €5.618 ✅ | €5.362 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1510.59 ✅ | 1501.27 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 5% ✅ | 1.54% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €4.200 – €13.000 | €7.563 ✅ | €7.952 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1670.63 ✅ | 1676.72 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €2.841 | €6.022 | €8.226 | €28.913 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €273 | €817 | €520 | €913 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing | €1.573 | €3.269 | €5.002 | €7.599 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €263 | €931 | €2.168 | €2.787 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Festival Push | €266 | €1.230 | €3.015 | €4.085 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Chaos Tour | €1.293 | €2.601 | €3.954 | €5.618 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €1.564 | €3.156 | €5.093 | €7.563 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.019 | €2.128 | €3.176 | €4.668 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €641 | €1.148 | €1.649 | €2.288 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.168 | €2.085 | €3.257 | €4.655 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €1.980 | €2.802 | €3.991 | €5.902 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.704 | €10.567 | €12.472 | €31.245 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.168 | €89 | 46.9× | 3 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €970 | €52 | 23× | 12.89 | 0.84 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.317 | €72 | 33.2× | 5.39 | 0.35 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.544 | €56 | 29.7× | 8.1 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.040 | €58 | 37.3× | 6.13 | 0.4 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.855 | €67 | 28.3× | 6.74 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.269 | €71 | 32.9× | 5.51 | 0.36 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.553 | €65 | 25× | 8.05 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €938 | €58 | 17.9× | 13.33 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.602 | €67 | 24.9× | 7.8 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.792 | €71 | 25.3× | 6.98 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €4.344 | €102 | 42.5× | 2.88 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.2 | 63 | 10.6% | 63.2% | 26.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.7 | 54 | 11.9% | 70.2% | 17.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.9 | 64 | 6.5% | 61.8% | 31.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.2 | 62 | 7.7% | 65.4% | 26.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5 | 68 | 1.7% | 46% | 52.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.9 | 59 | 21.4% | 62.2% | 16.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 5.9 | 64 | 5.8% | 64.4% | 29.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.5 | 60 | 14.3% | 63.6% | 22.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7 | 59 | 19.4% | 64.7% | 15.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.5 | 61 | 13.9% | 64.8% | 21.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.6 | 61 | 13.9% | 67.2% | 19% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.1 | 64 | 9.1% | 62.5% | 28.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 49 | 0 | 0.08 | 0.01 | 1.07 | 1.51 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 61 | 0 | 0 | 0 | 1.01 | 0.29 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 53 | 0 | 0.02 | 0 | 1.01 | 0.76 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 0 | 0.01 | 0 | 1 | 0.44 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Festival Push | 60 | 0 | 0.02 | 0 | 1.13 | 0.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 47 | 0 | 0.03 | 0 | 1.14 | 0.75 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 55 | 0 | 0.02 | 0 | 1.12 | 0.7 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 53 | 0 | 0 | 0 | 1.07 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | 0.25 | 0.01 | 0 | 0.92 | 0.69 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 52 | 0 | 0.03 | 0 | 1.04 | 0.74 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 50 | 0 | 0.01 | 0 | 1.14 | 0.79 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 52 | 0 | 0.05 | 0 | 1.07 | 1.69 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.12 | 0.18 | 0.23 | 0.13 | 0.52 | 1.18 | 11.7 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.22 | 0.26 | 0.2 | 0.02 | 0.14 | 0.98 | 7.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.23 | 0.3 | 0.31 | 0.15 | 0.52 | 1.09 | 10.89 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.22 | 0.41 | 0.45 | 0.08 | 0.4 | 1.07 | 9.64 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.13 | 0.32 | 0.2 | 0.05 | 0.16 | 1.24 | 9.91 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.32 | 0.52 | 0.54 | 0.19 | 0.73 | 1.21 | 10.73 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.2 | 0.3 | 0.32 | 0.13 | 0.41 | 1.22 | 10.79 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.18 | 0.32 | 0.29 | 0.11 | 0.36 | 1.11 | 10.3 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.18 | 0.29 | 0.22 | 0.09 | 0.37 | 1.1 | 9.47 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.09 | 0.16 | 0.16 | 0.03 | 0.28 | 1.18 | 10.43 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.12 | 0.27 | 0.23 | 0.06 | 0.32 | 1.12 | 11.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.19 | 0.29 | 0.37 | 0.2 | 0.85 | 1.18 | 12.13 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 8.67 | 2.89 | 2.93 | 2.85 | 17.34 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 1.42 | 0.52 | 0.43 | 0.47 | 2.84 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 4.15 | 1.35 | 1.39 | 1.41 | 8.3 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 2.54 | 0.82 | 0.85 | 0.87 | 5.08 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 2.56 | 0.92 | 0.85 | 0.79 | 5.12 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 4.19 | 1.43 | 1.45 | 1.31 | 8.38 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 4.2 | 1.47 | 1.37 | 1.37 | 8.41 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 4.12 | 1.39 | 1.32 | 1.41 | 8.24 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 3.87 | 1.27 | 1.25 | 1.35 | 7.74 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 4.05 | 1.31 | 1.4 | 1.35 | 8.11 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 4.19 | 1.39 | 1.37 | 1.43 | 8.38 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 8.79 | 2.94 | 2.92 | 2.93 | 17.58 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.35 | 0.17 | 0.13 | 0.32 | 0.35 | 2.05 | €1 | 0 | 99.6% |
| Bootstrap Struggle | 0 | 0 | 0 | 0.3 | 0 | 0.53 | €0 | 0 | 63.8% |
| Aggressive Marketing | 0.12 | 0.08 | 0.03 | 0.27 | 0.12 | 1.21 | €0 | 0 | 95.8% |
| Scandal Recovery | 0.01 | 0.01 | 0 | 0.3 | 0.01 | 0.91 | €0 | 0 | 87.7% |
| Festival Push | 0.03 | 0.02 | 0.02 | 0.26 | 0.03 | 0.69 | €0 | 0 | 95.8% |
| Chaos Tour | 0.07 | 0.05 | 0.02 | 0.27 | 0.07 | 1.17 | €0 | 0 | 92.3% |
| Cult Hypergrowth | 0.13 | 0.09 | 0.04 | 0.37 | 0.13 | 1.4 | €1 | 0 | 97.3% |
| No Social (Fame 0-50) | 0.03 | 0.03 | 0.02 | 0.28 | 0.03 | 1.15 | €0 | 0 | 93.5% |
| High Controversy | 0 | 0 | 0 | 0.34 | 0 | 1.2 | €81 | 0.03 | 90% |
| Early Game Probe (Fame 0–50) | 0.03 | 0.03 | 0.01 | 0.33 | 0.03 | 1.31 | €0 | 0 | 95% |
| Mid Game Probe (Fame 60–150) | 0.04 | 0.03 | 0.01 | 0.38 | 0.04 | 1.31 | €0 | 0 | 95.8% |
| Late Game Probe (Fame 175+) | 0.68 | 0.3 | 0.33 | 0.3 | 0.68 | 2.2 | €0 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €31.245 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 11099 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 37.31% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €4.344 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €31.286 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.79 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 2.30 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 14177 | 3077 | 0 | 3077 | 0 | 0 | 260/260 |
| Bootstrap Struggle | 2254 | 1117 | 0 | 1117 | 0 | 0 | 260/260 |
| Aggressive Marketing | 6888 | 2574 | 0 | 2574 | 0 | 0 | 260/260 |
| Scandal Recovery | 3994 | 1809 | 0 | 1809 | 0 | 0 | 260/260 |
| Festival Push | 4381 | 1840 | 0 | 1840 | 0 | 0 | 260/260 |
| Chaos Tour | 6376 | 2384 | 0 | 2384 | 1 | 0 | 260/260 |
| Cult Hypergrowth | 7128 | 2320 | 0 | 2320 | 0 | 0 | 260/260 |
| No Social (Fame 0-50) | 6374 | 2230 | 0 | 2230 | 0 | 0 | 260/260 |
| High Controversy | 5888 | 2107 | 0 | 2107 | 0 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 6495 | 2378 | 0 | 2378 | 0 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 6450 | 2558 | 0 | 2558 | 0 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 13832 | 3388 | 0 | 3388 | 1 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €28.913 | €28.896 | €5.458 | €22.370 | €35.387 |
| Bootstrap Struggle | €913 | €423 | €1.212 | €0 | €2.825 |
| Aggressive Marketing | €7.599 | €7.719 | €3.096 | €4.080 | €11.470 |
| Scandal Recovery | €2.787 | €2.692 | €1.858 | €0 | €5.075 |
| Festival Push | €4.085 | €4.103 | €2.395 | €630 | €6.963 |
| Chaos Tour | €5.618 | €5.740 | €2.624 | €2.277 | €8.900 |
| Cult Hypergrowth | €7.563 | €7.820 | €3.081 | €4.200 | €11.116 |
| No Social (Fame 0-50) | €4.668 | €4.747 | €2.193 | €1.698 | €7.302 |
| High Controversy | €2.288 | €2.230 | €1.789 | €0 | €4.613 |
| Early Game Probe (Fame 0–50) | €4.655 | €4.713 | €2.345 | €1.472 | €7.435 |
| Mid Game Probe (Fame 60–150) | €5.902 | €5.912 | €2.267 | €3.002 | €8.914 |
| Late Game Probe (Fame 175+) | €31.245 | €30.671 | €6.053 | €24.114 | €39.432 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 97 | 260 | 37.31% | 31.65% | 43.33% |
| Aggressive Marketing | 11 | 260 | 4.23% | 2.38% | 7.42% |
| Scandal Recovery | 27 | 260 | 10.38% | 7.24% | 14.69% |
| Festival Push | 19 | 260 | 7.31% | 4.73% | 11.13% |
| Chaos Tour | 11 | 260 | 4.23% | 2.38% | 7.42% |
| Cult Hypergrowth | 13 | 260 | 5.00% | 2.94% | 8.37% |
| No Social (Fame 0-50) | 20 | 260 | 7.69% | 5.03% | 11.58% |
| High Controversy | 51 | 260 | 19.62% | 15.25% | 24.87% |
| Early Game Probe (Fame 0–50) | 17 | 260 | 6.54% | 4.12% | 10.22% |
| Mid Game Probe (Fame 60–150) | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 0.38% | 1–5% | 10% | 0.07–2.15% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Bootstrap Struggle | 37.31% | 15–30% | 60% | 31.65–43.33% | entirely_above | above_target | above_target | stable | 🟠 high_risk |
| Aggressive Marketing | 4.23% | 2–8% | 15% | 2.38–7.42% | contained | within_target | within_target | stable | 🟢 healthy |
| Scandal Recovery | 10.38% | 8–20% | 50% | 7.24–14.69% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Festival Push | 7.31% | 5–15% | 35% | 4.73–11.13% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Chaos Tour | 4.23% | 8–20% | 25% | 2.38–7.42% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 5.00% | 2–10% | 12% | 2.94–8.37% | contained | within_target | below_target | unstable_boundary | 🟡 unstable |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ baseline_touring: Insolvenzrate 0.38% liegt unter dem Zielkorridor 1–5% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ bootstrap_struggle: Insolvenzrate 37.31% liegt über dem Zielkorridor 15–30%, aber noch unter der Sicherheitsgrenze.
- ⚠️ chaos_tour: Insolvenzrate 4.23% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ cult_hypergrowth: Kalibrierung und Holdout ordnen die Rate 5% unterschiedlich zum Korridor 2–10% ein — das Szenario liegt auf einer Korridorgrenze.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.38% | 4.23% | 1.15% | 0% | 0.06 | 9.86% | 45.89% | €22.438 | 4 | 16.15% |
| Bootstrap Struggle | 37.31% | 100% | 99.62% | 1.15% | 4.76 | 77.24% | 95.62% | €205 | 7 | 0.38% |
| Aggressive Marketing | 4.23% | 100% | 10% | 0% | 1.35 | 31.09% | 71.49% | €4.461 | 4 | 7.31% |
| Scandal Recovery | 10.38% | 100% | 51.92% | 1.15% | 2.95 | 54.48% | 86.21% | €973 | 6 | 0.77% |
| Festival Push | 7.31% | 100% | 48.46% | 1.54% | 2.62 | 53.18% | 78.21% | €1.415 | 6 | 1.92% |
| Chaos Tour | 4.23% | 100% | 17.69% | 0.38% | 1.56 | 34.12% | 78.16% | €2.806 | 6 | 4.62% |
| Cult Hypergrowth | 5% | 100% | 11.15% | 0.38% | 1.34 | 29.85% | 69.72% | €4.744 | 6 | 8.85% |
| No Social (Fame 0-50) | 7.69% | 100% | 15.38% | 0.77% | 1.68 | 38.21% | 80.32% | €2.794 | 5.5 | 2.69% |
| High Controversy | 19.62% | 100% | 41.54% | 0.77% | 2.8 | 54.7% | 88.18% | €925 | 6 | 0% |
| Early Game Probe (Fame 0–50) | 6.54% | 100% | 16.54% | 1.15% | 1.67 | 36.18% | 77.85% | €2.354 | 6 | 2.69% |
| Mid Game Probe (Fame 60–150) | 1.15% | 6.92% | 1.54% | 0% | 0.12 | 29.71% | 66.31% | €3.091 | 9 | 3.08% |
| Late Game Probe (Fame 175+) | 0% | 0% | 0% | 0% | 0 | 12.29% | 52.94% | €24.114 | — | 26.15% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zwei Spalten tragen kaum Signal und sagen warum: „je < €500“ sättigt bei 100%, weil der Startstand selbst €500 beträgt und ein einziger Tag ohne Gig darunter führt — aussagekräftig sind hier die Tage-Spalte und die €250-Marke. „Saldo 0“ bleibt bei 0%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Ankünfte ohne Bühne | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 8.67 | 9.97 | 9.97 | 99.23% | 1.3 | 0 |
| Bootstrap Struggle | 1.42 | 1.62 | 1.62 | 0% | 0.2 | 0 |
| Aggressive Marketing | 4.15 | 4.87 | 4.87 | 0% | 0.71 | 0 |
| Scandal Recovery | 2.54 | 2.85 | 2.85 | 0% | 0.31 | 0 |
| Festival Push | 2.56 | 2.88 | 2.88 | 0% | 0.33 | 0 |
| Chaos Tour | 4.19 | 4.87 | 4.87 | 0% | 0.68 | 0 |
| Cult Hypergrowth | 4.20 | 4.87 | 4.87 | 0% | 0.67 | 0 |
| No Social (Fame 0-50) | 4.12 | 4.79 | 4.79 | 0% | 0.67 | 0 |
| High Controversy | 3.87 | 4.36 | 4.36 | 0% | 0.49 | 0 |
| Early Game Probe (Fame 0–50) | 4.05 | 4.82 | 4.82 | 0% | 0.77 | 0 |
| Mid Game Probe (Fame 60–150) | 4.19 | 4.98 | 4.98 | 0% | 0.79 | 0 |
| Late Game Probe (Fame 175+) | 8.79 | 10 | 10 | 100% | 1.21 | 0 |

Knotentypen über alle Ankünfte: GIG 66.98% · FESTIVAL 10.03% · FINALE 9.95% · REST_STOP 4.94% · SUPPLY_STOP 4.32% · SPECIAL 3.78% (Beispiel Baseline Touring).

**Das beantwortet die Gap-1-Frage strukturell.** Nur ein Szenario, das praktisch täglich spielt, legt die zehn Hops zurück und erreicht das Finale; bei jedem zweiten oder vierten Tag endet die Tour auf halber Strecke und die zahlenden Bühnen der späten Ebenen werden nie erreicht. Die Dominanz dichter Touren ist damit kein zinseszinsartiger Exploit, sondern die einzige Gangart, die die Tour im Horizont überhaupt beendet — eine Struktureigenschaft der Karte, über die eine Designentscheidung zu treffen ist, kein Balancefehler, den ein Hebel wegdämpfen könnte.

Modellgrenze: Nicht-Gig-Tage verbrauchen keinen Hop. Im Spiel vergeht ein Tag nur durch Anreise, hier pausiert die Band am Ort. Die Gig-Kadenz bleibt damit die Szenario-Stellschraube `gigGapDays`, damit die Gap-Analyse aus Phase 3C weiter dasselbe misst; Streckenwahl, Erreichbarkeit und Entfernungen sind echt.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 67 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 98.08% | 3 | 93.46% | 3 | 10.65 | 15.9% | MERCH | €6.997,66 | €6.454,28 | 0.76 | 0.2 | 1.92 | 59.27 |
| Bootstrap Struggle | 1 | 85% | 5 | 84.23% | 2 | 7.2 | 10.75% | MERCH | €708,38 | €650,44 | 3.09 | 1.22 | 10.24 | 52.1 |
| Aggressive Marketing | 1 | 96.15% | 4 | 91.54% | 2 | 10.03 | 14.97% | MERCH | €2.918,34 | €2.772,91 | 1.7 | 0.43 | 4 | 57.29 |
| Scandal Recovery | 1 | 94.23% | 5 | 91.54% | 2 | 9.1 | 13.58% | HQ | €1.242,13 | €1.148,67 | 2.44 | 0.82 | 8.14 | 53.56 |
| Festival Push | 1 | 95.38% | 5 | 92.69% | 2 | 9.35 | 13.95% | MERCH | €1.670,21 | €1.572,25 | 2.45 | 0.68 | 7.87 | 53.85 |
| Chaos Tour | 1 | 98.08% | 4 | 90% | 2 | 9.96 | 14.86% | MERCH | €2.252,85 | €2.121,86 | 1.65 | 0.48 | 4.27 | 57.27 |
| Cult Hypergrowth | 1 | 96.54% | 4 | 92.31% | 2 | 10 | 14.92% | HQ | €2.903,63 | €2.760,46 | 1.48 | 0.43 | 4.23 | 57.12 |
| No Social (Fame 0-50) | 1 | 93.08% | 4 | 93.85% | 2 | 9.72 | 14.51% | HQ | €1.869,88 | €1.757,28 | 1.57 | 0.67 | 4.89 | 56.48 |
| High Controversy | 1 | 95.77% | 4 | 90% | 2 | 9.07 | 13.54% | HQ | €1.124,31 | €1.026,2 | 2.04 | 0.87 | 7.4 | 53.81 |
| Early Game Probe (Fame 0–50) | 1 | 92.69% | 4 | 90% | 2 | 9.79 | 14.62% | MERCH | €1.901,05 | €1.786,53 | 1.74 | 0.6 | 5.74 | 55.73 |
| Mid Game Probe (Fame 60–150) | 1 | 97.69% | 4 | 86.54% | 3 | 10.38 | 15.5% | INSTRUMENT | €2.649,81 | €2.479,29 | 1.75 | 0.04 | 3.65 | 57.42 |
| Late Game Probe (Fame 175+) | 1 | 98.85% | 2 | 93.85% | 4 | 10.84 | 16.18% | GEAR | €11.387,29 | €10.419,58 | 0.62 | 0.01 | 0.97 | 59.99 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €3.613 | €4.158 | 0.869 | 0 | 0.04% | €89 | 2.13% | 95.35% |
| Bootstrap Struggle | €193 | €1.207 | 0.16 | 0 | 0% | €52 | 4.35% | 93.02% |
| Aggressive Marketing | €1.013 | €2.388 | 0.424 | 0 | 0% | €72 | 3.01% | 95.35% |
| Scandal Recovery | €438 | €1.655 | 0.265 | 0 | 0% | €56 | 3.37% | 95.35% |
| Festival Push | €570 | €2.163 | 0.263 | 0 | 0% | €58 | 2.68% | 95.35% |
| Chaos Tour | €813 | €1.905 | 0.427 | 0 | 0% | €67 | 3.53% | 95.35% |
| Cult Hypergrowth | €1.003 | €2.343 | 0.428 | 0 | 0.04% | €71 | 3.04% | 95.35% |
| No Social (Fame 0-50) | €692 | €1.629 | 0.425 | 0 | 0% | €65 | 3.99% | 95.35% |
| High Controversy | €433 | €1.041 | 0.416 | 0.12 | 1.33% | €58 | 5.58% | 93.02% |
| Early Game Probe (Fame 0–50) | €691 | €1.660 | 0.416 | 0 | 0% | €67 | 4.02% | 95.35% |
| Mid Game Probe (Fame 60–150) | €748 | €1.782 | 0.42 | 0 | 0% | €71 | 3.96% | 95.35% |
| Late Game Probe (Fame 175+) | €3.800 | €4.324 | 0.879 | 0 | 0% | €102 | 2.35% | 95.35% |

„Katalog < 1 Gig“ ist der Anteil der 43 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und das ist ein Befund über den Verschleiß.** Der Ruhe-Auslöser nutzt die Marken, die das Spiel selbst im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50). Über alle Szenarien sinkt die niedrigste Stamina auf 31 und die niedrigste Mood auf 42, die Werte werden also durchaus unterschritten; in den Hauptszenarien führt das dennoch zu null Ruhetagen, weil die Ruheentscheidung nur an Gig-Tagen ausgewertet wird und die Tiefpunkte überwiegend dazwischen liegen. Messbar geruht wird bislang nur im Szenario mit hoher Controversy. Die Harmony sinkt bis 4 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin — nicht weil er null wäre, sondern weil die Stichprobe an Ruhetagen zu klein ist. Rastplatz-Knoten geben die kanonische Erholung (+20 Stamina / +10 Mood) auch bei bloßer Durchreise; `avgRestStopArrivals` zählt sie getrennt von `avgRestDays`, weil dafür kein Gig aufgegeben wurde. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €28.913 | 259 / €29.025 | 1 / €0 |
| Bootstrap Struggle | 260 / €913 | 163 / €1.456 | 97 / €0 |
| Aggressive Marketing | 260 / €7.599 | 249 / €7.934 | 11 / €0 |
| Scandal Recovery | 260 / €2.787 | 233 / €3.110 | 27 / €0 |
| Festival Push | 260 / €4.085 | 241 / €4.407 | 19 / €0 |
| Chaos Tour | 260 / €5.618 | 249 / €5.867 | 11 / €0 |
| Cult Hypergrowth | 260 / €7.563 | 247 / €7.961 | 13 / €0 |
| No Social (Fame 0-50) | 260 / €4.668 | 240 / €5.057 | 20 / €0 |
| High Controversy | 260 / €2.288 | 209 / €2.846 | 51 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €4.655 | 243 / €4.980 | 17 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €5.902 | 257 / €5.971 | 3 / €0 |
| Late Game Probe (Fame 175+) | 260 / €31.245 | 260 / €31.245 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €5.458 | 0.1888 | 17.15% | 45.89% |
| Bootstrap Struggle | €1.212 | 1.3275 | 76.44% | 95.62% |
| Aggressive Marketing | €3.096 | 0.4074 | 37.23% | 71.49% |
| Scandal Recovery | €1.858 | 0.6667 | 58.87% | 86.21% |
| Festival Push | €2.395 | 0.5863 | 55.03% | 78.21% |
| Chaos Tour | €2.624 | 0.4671 | 41.21% | 78.16% |
| Cult Hypergrowth | €3.081 | 0.4074 | 37.19% | 69.72% |
| No Social (Fame 0-50) | €2.193 | 0.4698 | 43.63% | 80.32% |
| High Controversy | €1.789 | 0.7819 | 56.50% | 88.18% |
| Early Game Probe (Fame 0–50) | €2.345 | 0.5038 | 42.68% | 77.85% |
| Mid Game Probe (Fame 60–150) | €2.267 | 0.3841 | 34.70% | 66.31% |
| Late Game Probe (Fame 175+) | €6.053 | 0.1937 | 21.84% | 52.94% |

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
| brandDeals | ✅ | 27319 | 80 | 21 |
| postOptions | ✅ | 2277 | 2277 | 25 |
| socialTrends | ✅ | 29969 | 3557 | 5 |
| contraband | ✅ | 29969 | 3305 | 37 |
| minigamesTravel | ✅ | 13714 | 8094 | - |
| minigamesRoadie | ✅ | 4603 | 4218 | - |
| minigamesKabelsalat | ✅ | 4553 | 3201 | - |
| minigamesAmp | ✅ | 4558 | 3262 | - |
| sponsorship | ✅ | 27469 | 75 | - |
| restStops | ✅ | 15859 | 9 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €15.000 – €47.000 | €28.913 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1636.26 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 37.31% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €550 – €1.700 | €913 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1427.72 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €4.100 – €13.000 | €7.599 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1636.61 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 10.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €1.500 – €4.800 | €2.787 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1518.26 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 7.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €2.200 – €7.100 | €4.085 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1654.71 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €2.900 – €9.300 | €5.618 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1510.59 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 5% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €4.200 – €13.000 | €7.563 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1670.63 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.38% | €-474 | 32.91 | -0.49 |
| Bootstrap Struggle | 6.54% | €-168 | -55.51 | -0.15 |
| Aggressive Marketing | 1.92% | €-600 | 17.87 | -0.36 |
| Scandal Recovery | 3.46% | €-221 | -49.22 | -0.17 |
| Festival Push | 4.62% | €-375 | -48.03 | -0.2 |
| Chaos Tour | 1.15% | €-207 | 18.37 | -0.28 |
| Cult Hypergrowth | 4.62% | €-743 | -31.91 | -0.37 |
| No Social (Fame 0-50) | 5.38% | €-487 | -14.77 | -0.42 |
| High Controversy | 5% | €-110 | 9.53 | -0.3 |
| Early Game Probe (Fame 0–50) | 2.69% | €-448 | 6.78 | -0.35 |
| Mid Game Probe (Fame 60–150) | 0.77% | €-430 | 6.89 | -0.36 |
| Late Game Probe (Fame 175+) | 0% | €-897 | 20.17 | -0.51 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 37.31% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €31.245 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 2.30 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 7/7 Szenarien unter ihrer harten Insolvenzgrenze.
- Risikobänder: low_risk 2 · high_risk 1 · healthy 3 · unstable 1.
- ⚠️ 4 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
