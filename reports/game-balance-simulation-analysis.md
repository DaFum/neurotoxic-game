# Game Balance Simulation – Analyse

Erstellt am: 2026-10-07T08:50:52.326Z

## Reproduzierbarkeit

- Report-Version: 14
- Source-Fingerprint: 06609b8e5994adaf4324048385a7e9ff29fa16eb0c87603556c8af0fa8efa24f
- Generator-Fingerprint: 073962daf7339e5e7dc01fc732e601d1a086f266ba52d9b36037c42c5cd62f4a
- Artefaktschema: 1
- Seed-Namensraum: #first-income-full-reports-v1
- Runs je Szenario: 2000
- Working Tree Dirty: Nein

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 2000 |
| Tage je Run | 10 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |
| Klinik-Heilung | €280 × 1.2^Besuche · +30 Stamina / +10 Mood |

## Fame-Shop-Audit

Shop-only kosten **8330 Fame**, mit Legacy-Upgrades **10660 Fame**.
Das teuerste einzelne Fame-Item kostet **2700 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 2.700 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 45 | 1310 | 3 | 7 | 8 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 10660 Fame (Tour-Horizont 10 Gigs). |
| 50 | 1420 | 2 | 6 | 7 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 10660 Fame (Tour-Horizont 10 Gigs). |
| 55 | 1530 | 2 | 6 | 7 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 10660 Fame (Tour-Horizont 10 Gigs). |
| 60 | 1640 | 2 | 6 | 6 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 10660 Fame (Tour-Horizont 10 Gigs). |
| 70 | 1860 | 2 | 5 | 6 | Fame-Gewinn liegt im Zielkorridor von 6-10 guten Gigs bis 10660 Fame (Tour-Horizont 10 Gigs). |
| 85 | 2190 | 2 | 4 | 5 | Fame-Gewinn ist zu hoch fuer das Ziel von 6-10 guten Gigs bis 10660 Fame (Tour-Horizont 10 Gigs). |
| 100 | 2520 | 2 | 4 | 4 | Fame-Gewinn ist zu hoch fuer das Ziel von 6-10 guten Gigs bis 10660 Fame (Tour-Horizont 10 Gigs). |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 181 |
| Brand Deals | 54 |
| Post Options | 37 |
| Contraband-Items | 38 |
| Upgrade-Katalog | 28 |
| Social Platforms | 4 |
| Trends | 5 |
| Songs | 7 |
| Quests (Registry) | 35 |
| Asset-Chassis-Arten | 4 |
| Asset-Module | 63 |
| Kredit-Profile | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 32 | travel, random |
| band | 68 | random, travel, post_gig |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 28 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €6.972 | 17.62% | 0.14 | 0% | 11208 | 7 | 53 | 5.88 | 8.4 | 0.06 | 3% | €1.110 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €4.433 | 39.91% | 0.18 | 0% | 7291 | 6 | 49 | 4.7 | 6.21 | 0.02 | 15.7% | €1.014 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €6.496 | 24.57% | 0.15 | 0% | 9841 | 7 | 54 | 5.16 | 7.31 | 0.03 | 4.2% | €1.183 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €4.312 | 39.87% | 0.19 | 0% | 7676 | 6 | 52 | 44.42 | 6.22 | 0.07 | 16.25% | €997 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €5.816 | 29.84% | 0.15 | 0% | 9355 | 6 | 59 | 4.75 | 6.69 | 0.03 | 6.7% | €1.150 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €5.500 | 28.35% | 0.17 | 0% | 7967 | 6 | 39 | 5.69 | 7.16 | 0.04 | 7.1% | €1.098 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €6.671 | 24.13% | 0.14 | 0% | 9835 | 7 | 57 | 4.58 | 7.26 | 0.04 | 4.55% | €1.185 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €5.320 | 31.21% | 0.17 | 0% | 8709 | 6 | 51 | 0.46 | 7.05 | 0.04 | 9.05% | €1.053 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| High Controversy | €500 | 0 | €2.521 | 57.12% | 0.22 | 0% | 6700 | 5 | 51 | 58.97 | 5.27 | 0.21 | 42.05% | €672 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €5.277 | 31.37% | 0.17 | 0% | 8664 | 6 | 50 | 5.28 | 7.05 | 0.04 | 9.3% | €1.056 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €6.959 | 17.24% | 0.17 | 0% | 9158 | 6 | 48 | 5.85 | 7.51 | 0.05 | 0.2% | €1.144 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €11.314 | 8.58% | 0.15 | 0% | 11582 | 7 | 54 | 5.71 | 8.64 | 0.06 | 0.05% | €1.171 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €7.012 | €478 | €1.110 | 0.11 | 0.05 | 10.66 | 1.26 | 1.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €4.591 | €414 | €1.014 | 0.09 | 0.05 | 9.65 | 0.87 | 1.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Aggressive Marketing | €6.550 | €472 | €1.183 | 0.11 | 0.06 | 10.58 | 1.23 | 1.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €4.485 | €413 | €997 | 0.09 | 0.05 | 9.61 | 1.11 | 1.32 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €5.892 | €460 | €1.150 | 0.09 | 0.05 | 10.36 | 1.23 | 1.15 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €5.588 | €455 | €1.098 | 0.09 | 0.05 | 10.31 | 1.1 | 1.22 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €6.731 | €471 | €1.185 | 0.1 | 0.05 | 10.54 | 1.18 | 1.12 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €5.415 | €446 | €1.053 | 0 | 0 | 10.17 | 1.14 | 1.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €2.901 | €296 | €672 | 0.06 | 0.03 | 7.65 | 0.82 | 0.9 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Early Game Probe (Fame 0–50) | €5.378 | €446 | €1.056 | 0.1 | 0.05 | 10.08 | 1.15 | 1.36 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €6.996 | €1.448 | €1.144 | 0.1 | 0.04 | 11.08 | 1.25 | 1.5 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €11.459 | €4.935 | €1.171 | 0.14 | 0.06 | 11.16 | 1.26 | 1.21 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-first-income-full-report-namespace-plus-holdout-marker-plus-run-index`, 2000 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 3% ✅ | 3.1% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €6.972 ❌ | €6.958 ❌ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1878.27 ✅ | 1898.08 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 15.7% ✅ | 14.65% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €4.433 ❌ | €4.505 ❌ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1805.29 ✅ | 1812.48 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 4.2% ✅ | 5.35% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €6.496 ❌ | €6.326 ❌ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1940.39 ✅ | 1944.12 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 16.25% ✅ | 14.3% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €4.312 ❌ | €4.363 ❌ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1859.94 ✅ | 1871.84 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 6.7% ✅ | 7.25% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €5.816 ❌ | €5.789 ❌ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 2059.25 ✅ | 2034.32 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 7.1% ✅ | 6.6% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €5.500 ❌ | €5.471 ❌ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1713.01 ✅ | 1747.91 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 4.55% ✅ | 3.6% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €6.671 ❌ | €6.792 ❌ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1947.31 ✅ | 1931.44 ✅ | ✅ |
| no_social_probe | Insolvenzrate | ≤ 15% | 9.05% ✅ | 8.3% ✅ | ✅ |
| no_social_probe | Endgeld | €10.000 – €40.000 | €5.320 ❌ | €5.386 ❌ | ✅ |
| no_social_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1832.75 ✅ | 1821.17 ✅ | ✅ |
| high_controversy_probe | Insolvenzrate | ≤ 45% | 42.05% ✅ | 41.55% ✅ | ✅ |
| high_controversy_probe | Endgeld | €5.000 – €35.000 | €2.521 ❌ | €2.505 ❌ | ✅ |
| high_controversy_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1808.85 ✅ | 1818.72 ✅ | ✅ |
| early_game_probe | Insolvenzrate | ≤ 12% | 9.3% ✅ | 9.95% ✅ | ✅ |
| early_game_probe | Endgeld | €10.000 – €35.000 | €5.277 ❌ | €5.224 ❌ | ✅ |
| early_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1829.46 ✅ | 1807.6 ✅ | ✅ |
| mid_game_probe | Insolvenzrate | ≤ 5% | 0.2% ✅ | 0.15% ✅ | ✅ |
| mid_game_probe | Endgeld | €15.000 – €50.000 | €6.959 ❌ | €6.967 ❌ | ✅ |
| mid_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1853.52 ✅ | 1857.57 ✅ | ✅ |
| late_game_probe | Insolvenzrate | ≤ 5% | 0.05% ✅ | 0.1% ✅ | ✅ |
| late_game_probe | Endgeld | €20.000 – €80.000 | €11.314 ❌ | €11.153 ❌ | ✅ |
| late_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1901.48 ✅ | 1930.7 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Harte Sicherheitsgrenzen (Holdout)

Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.

Abdeckung: 12 von 12 Szenarien mit konfigurierter Obergrenze gemessen. Fehlende Abdeckung ist selbst ein Fehlschlag — ein Gate, das nur einen Teil der harten Grenzen prüft, sagt über die übrigen nichts aus.

✅ Alle 12 geprüften Szenarien bleiben auf unabhängigen Seeds unter ihrer harten Grenze.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €1.647 | €2.967 | €3.751 | €6.972 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.196 | €1.816 | €2.293 | €4.433 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €1.574 | €2.720 | €3.434 | €6.496 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €1.192 | €2.011 | €2.208 | €4.312 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €1.547 | €2.701 | €3.113 | €5.816 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €1.335 | €2.281 | €2.875 | €5.500 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €1.616 | €2.826 | €3.580 | €6.671 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.243 | €2.161 | €2.671 | €5.320 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €746 | €1.053 | €1.113 | €2.521 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.256 | €2.143 | €2.652 | €5.277 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €2.315 | €3.375 | €3.977 | €6.959 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €6.250 | €7.569 | €8.332 | €11.314 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.110 | €75 | 15.1× | 11.26 | null | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.014 | €84 | 13× | 12.33 | null | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.183 | €84 | 14.5× | 10.57 | null | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €997 | €84 | 12.8× | 12.54 | null | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.150 | €89 | 13.4× | 10.87 | null | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.098 | €80 | 14.2× | 11.38 | null | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.185 | €85 | 14.4× | 10.55 | null | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.053 | €80 | 13.8× | 11.87 | null | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €672 | €74 | 11.6× | 18.6 | null | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.056 | €80 | 13.9× | 11.84 | null | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.144 | €87 | 13.1× | 10.93 | null | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.171 | €99 | 11.8× | 10.67 | null | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 5.7 | 66 | 7.7% | 53.5% | 38.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.4 | 62 | 15% | 59.4% | 25.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.4 | 68 | 5.5% | 48.8% | 45.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.1 | 64 | 11.2% | 58% | 30.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 4.6 | 73 | 2.5% | 36.8% | 60.7% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.9 | 59 | 21.9% | 58.7% | 19.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 5.4 | 68 | 4.7% | 51.1% | 44.2% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| No Social (Fame 0-50) | 152 | 6.1 | 64 | 11.6% | 58% | 30.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 6.5 | 64 | 15.5% | 59.2% | 25.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.2 | 63 | 12.3% | 58.7% | 29% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.2 | 64 | 11.8% | 60.2% | 28% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 5.6 | 67 | 7% | 54.3% | 38.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 53 | 0.06 | 0.04 | 0.01 | 1.06 | 1.52 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 49 | 0.02 | 0.04 | 0.01 | 0.98 | 1.13 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 54 | 0.03 | 0.05 | 0.01 | 1.05 | 1.31 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 52 | 0.07 | 0.04 | 0 | 0.99 | 1.11 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 59 | 0.03 | 0.04 | 0.01 | 1.05 | 1.22 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 39 | 0.04 | 0.04 | 0 | 1.08 | 1.3 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 57 | 0.04 | 0.04 | 0.01 | 1.09 | 1.34 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 51 | 0.04 | 0 | 0 | 1.1 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 0.21 | 0.03 | 0 | 0.84 | 0.94 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 0.04 | 0.04 | 0.01 | 1.05 | 1.27 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 48 | 0.05 | 0.04 | 0 | 1.08 | 1.38 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 54 | 0.06 | 0.05 | 0 | 1.13 | 1.56 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.43 | 7.65 | 9.29 | 0.18 | 0.74 | 1.16 | 11.3 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Bootstrap Struggle | 0.34 | 6.02 | 6.87 | 0.27 | 0.79 | 1.14 | 10.24 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Aggressive Marketing | 0.44 | 6.98 | 8.3 | 0.34 | 1.13 | 1.19 | 11.21 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Scandal Recovery | 0.41 | 6.17 | 7.09 | 0.37 | 1.14 | 1.11 | 10.22 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Festival Push | 0.32 | 6.37 | 7.36 | 0.22 | 0.68 | 1.15 | 10.99 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Chaos Tour | 0.53 | 7.06 | 8.26 | 0.52 | 1.64 | 1.18 | 10.91 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 0.45 | 6.92 | 8.15 | 0.31 | 1 | 1.18 | 11.16 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| No Social (Fame 0-50) | 0.37 | 6.69 | 7.89 | 0.27 | 0.89 | 1.16 | 10.77 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| High Controversy | 0.25 | 5.2 | 5.78 | 0.21 | 0.67 | 0.89 | 8.21 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Early Game Probe (Fame 0–50) | 0.32 | 6.55 | 7.71 | 0.16 | 0.52 | 1.13 | 10.71 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Mid Game Probe (Fame 60–150) | 0.36 | 7.06 | 8.29 | 0.23 | 0.77 | 1.2 | 11.7 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Late Game Probe (Fame 175+) | 0.45 | 8.01 | 9.69 | 0.29 | 1.04 | 1.19 | 11.8 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.74 | 2.81 | 2.78 | 2.8 | 18.13 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Bootstrap Struggle | 8.95 | 2.1 | 2.05 | 2.06 | 15.16 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Aggressive Marketing | 9.69 | 2.44 | 2.44 | 2.44 | 17.01 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Scandal Recovery | 8.9 | 2.1 | 2.08 | 2.04 | 15.12 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Festival Push | 9.53 | 2.25 | 2.24 | 2.21 | 16.23 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Chaos Tour | 9.48 | 2.38 | 2.4 | 2.38 | 16.64 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Cult Hypergrowth | 9.65 | 2.41 | 2.42 | 2.43 | 16.91 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| No Social (Fame 0-50) | 9.38 | 2.36 | 2.36 | 2.33 | 16.43 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| High Controversy | 7 | 1.8 | 1.73 | 1.74 | 12.27 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Early Game Probe (Fame 0–50) | 9.35 | 2.37 | 2.35 | 2.33 | 16.4 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Mid Game Probe (Fame 60–150) | 9.96 | 2.52 | 2.52 | 2.47 | 17.47 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Late Game Probe (Fame 175+) | 9.97 | 2.89 | 2.85 | 2.9 | 18.61 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.01 | 0.01 | 0 | 0.34 | 0.01 | 2.16 | €20 | 0 | 99% |
| Bootstrap Struggle | 0 | 0 | 0 | 0.3 | 0 | 1.74 | €7 | 0 | 95.7% |
| Aggressive Marketing | 0.01 | 0.01 | 0 | 0.32 | 0.01 | 1.6 | €11 | 0 | 98.5% |
| Scandal Recovery | 0 | 0 | 0 | 0.29 | 0 | 1.75 | €22 | 0 | 97.1% |
| Festival Push | 0.01 | 0.01 | 0 | 0.33 | 0.01 | 1.11 | €9 | 0 | 98.8% |
| Chaos Tour | 0.01 | 0.01 | 0 | 0.33 | 0.01 | 1.46 | €14 | 0 | 95.8% |
| Cult Hypergrowth | 0.01 | 0.01 | 0 | 0.34 | 0.01 | 2.05 | €12 | 0 | 98.3% |
| No Social (Fame 0-50) | 0 | 0 | 0 | 0.31 | 0 | 1.48 | €13 | 0 | 97.3% |
| High Controversy | 0 | 0 | 0 | 0.26 | 0 | 1.49 | €69 | 0.02 | 94.4% |
| Early Game Probe (Fame 0–50) | 0 | 0 | 0 | 0.33 | 0 | 1.91 | €12 | 0 | 97.3% |
| Mid Game Probe (Fame 60–150) | 0.02 | 0.01 | 0.01 | 0.33 | 0.02 | 1.97 | €17 | 0 | 99.3% |
| Late Game Probe (Fame 175+) | 0.42 | 0.3 | 0.26 | 0.3 | 0.42 | 2.21 | €20 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €11.314 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 11582 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 42.05% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €1.185 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €11.459 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.64 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Late Game Probe (Fame 175+)** | 19.48 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 15867 | 4654 | 0 | 4654 | 5 | 0 | 2000/2000 |
| Bootstrap Struggle | 11261 | 3966 | 0 | 3966 | 4 | 0 | 2000/2000 |
| Aggressive Marketing | 14320 | 4474 | 0 | 4474 | 4 | 0 | 2000/2000 |
| Scandal Recovery | 11599 | 3919 | 0 | 3919 | 4 | 0 | 2000/2000 |
| Festival Push | 13802 | 4443 | 0 | 4443 | 4 | 0 | 2000/2000 |
| Chaos Tour | 12322 | 4349 | 0 | 4349 | 6 | 0 | 2000/2000 |
| Cult Hypergrowth | 14337 | 4499 | 0 | 4499 | 4 | 0 | 2000/2000 |
| No Social (Fame 0-50) | 12994 | 4281 | 0 | 4281 | 4 | 0 | 2000/2000 |
| High Controversy | 9376 | 2672 | 0 | 2672 | 4 | 0 | 2000/2000 |
| Early Game Probe (Fame 0–50) | 12975 | 4306 | 0 | 4306 | 4 | 0 | 2000/2000 |
| Mid Game Probe (Fame 60–150) | 13883 | 4780 | 0 | 4780 | 5 | 0 | 2000/2000 |
| Late Game Probe (Fame 175+) | 16365 | 4953 | 0 | 4953 | 5 | 0 | 2000/2000 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €6.972 | €7.190 | €1.860 | €4.985 | €8.927 |
| Bootstrap Struggle | €4.433 | €4.872 | €2.313 | €0 | €6.917 |
| Aggressive Marketing | €6.496 | €6.726 | €2.067 | €4.224 | €8.748 |
| Scandal Recovery | €4.312 | €4.763 | €2.314 | €0 | €6.842 |
| Festival Push | €5.816 | €6.113 | €2.227 | €3.342 | €8.223 |
| Chaos Tour | €5.500 | €5.787 | €2.064 | €3.331 | €7.697 |
| Cult Hypergrowth | €6.671 | €6.914 | €2.119 | €4.481 | €8.945 |
| No Social (Fame 0-50) | €5.320 | €5.729 | €2.139 | €2.600 | €7.556 |
| High Controversy | €2.521 | €2.926 | €2.404 | €0 | €5.666 |
| Early Game Probe (Fame 0–50) | €5.277 | €5.638 | €2.170 | €2.377 | €7.531 |
| Mid Game Probe (Fame 60–150) | €6.959 | €6.950 | €1.534 | €5.026 | €8.871 |
| Late Game Probe (Fame 175+) | €11.314 | €11.467 | €1.818 | €9.104 | €13.443 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 60 | 2000 | 3.00% | 2.34% | 3.84% |
| Bootstrap Struggle | 314 | 2000 | 15.70% | 14.17% | 17.36% |
| Aggressive Marketing | 84 | 2000 | 4.20% | 3.41% | 5.17% |
| Scandal Recovery | 325 | 2000 | 16.25% | 14.70% | 17.93% |
| Festival Push | 134 | 2000 | 6.70% | 5.69% | 7.88% |
| Chaos Tour | 142 | 2000 | 7.10% | 6.05% | 8.31% |
| Cult Hypergrowth | 91 | 2000 | 4.55% | 3.72% | 5.55% |
| No Social (Fame 0-50) | 181 | 2000 | 9.05% | 7.87% | 10.39% |
| High Controversy | 841 | 2000 | 42.05% | 39.90% | 44.23% |
| Early Game Probe (Fame 0–50) | 186 | 2000 | 9.30% | 8.10% | 10.65% |
| Mid Game Probe (Fame 60–150) | 4 | 2000 | 0.20% | 0.08% | 0.51% |
| Late Game Probe (Fame 175+) | 1 | 2000 | 0.05% | 0.01% | 0.28% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 3.00% | 1–5% | 10% | 2.34–3.84% | contained | within_target | within_target | stable | 🟢 healthy |
| Bootstrap Struggle | 15.70% | 15–30% | 60% | 14.17–17.36% | straddles_lower | within_target | below_target | unstable_boundary | 🟡 unstable |
| Aggressive Marketing | 4.20% | 2–8% | 15% | 3.41–5.17% | contained | within_target | within_target | stable | 🟢 healthy |
| Scandal Recovery | 16.25% | 8–20% | 50% | 14.70–17.93% | contained | within_target | within_target | stable | 🟢 healthy |
| Festival Push | 6.70% | 5–15% | 35% | 5.69–7.88% | contained | within_target | within_target | stable | 🟢 healthy |
| Chaos Tour | 7.10% | 8–20% | 25% | 6.05–8.31% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 4.55% | 2–10% | 12% | 3.72–5.55% | contained | within_target | within_target | stable | 🟢 healthy |
| No Social (Fame 0-50) | 9.05% | 2–12% | 15% | 7.87–10.39% | contained | within_target | within_target | stable | 🟢 healthy |
| High Controversy | 42.05% | 20–35% | 45% | 39.90–44.23% | entirely_above | above_target | above_target | stable | 🟠 high_risk |
| Early Game Probe (Fame 0–50) | 9.30% | 2–10% | 12% | 8.10–10.65% | straddles_upper | within_target | within_target | stable | 🟢 healthy |
| Mid Game Probe (Fame 60–150) | 0.20% | 0–4% | 5% | 0.08–0.51% | contained | within_target | within_target | stable | 🟢 healthy |
| Late Game Probe (Fame 175+) | 0.05% | 0–4% | 5% | 0.01–0.28% | contained | within_target | within_target | stable | 🟢 healthy |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ bootstrap_struggle: Kalibrierung (within_target) und Holdout (below_target) ordnen die Raten unterschiedlich zum Korridor 15–30% ein — Kalibrierung 15.7%, Holdout 14.65%; das Szenario liegt auf einer Korridorgrenze.
- ⚠️ chaos_tour: Insolvenzrate (Kalibrierung 7.1%, Holdout 6.6%) liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ high_controversy_probe: Insolvenzrate (Kalibrierung 42.05%, Holdout 41.55%) liegt über dem Zielkorridor 20–35%, aber noch unter der Sicherheitsgrenze.
- ⚠️ early_game_probe: Probe-Ziel avgGigNet (Kalibrierung 1056, Holdout 1049) liegt unter dem Zielkorridor 3500–5500.
- ⚠️ early_game_probe: Probe-Ziel travelCostShareOfGigNetPct (Kalibrierung 7.22, Holdout 7.25) liegt über dem Zielkorridor 1.5–4.
- ⚠️ late_game_probe: Probe-Ziel travelCostShareOfGigNetPct (Kalibrierung 8.45, Holdout 8.51) liegt über dem Zielkorridor 1.5–6.
- ⚠️ late_game_probe: Probe-Ziel gigCapHitPct (Kalibrierung 0, Holdout 0) liegt unter dem Zielkorridor 2–10.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 3% | 10.05% | 3.25% | 0% | 0.16 | 13.36% | 36.41% | €5.321 | 4 | 0.75% |
| Bootstrap Struggle | 15.7% | 29.85% | 16.15% | 0.2% | 0.6 | 31.68% | 91.06% | €3.509 | 6 | 0.1% |
| Aggressive Marketing | 4.2% | 11.45% | 4.65% | 0.05% | 0.2 | 18.97% | 47.25% | €4.694 | 5 | 0.85% |
| Scandal Recovery | 16.25% | 31.1% | 16.85% | 0.15% | 0.63 | 31.65% | 91.16% | €3.368 | 5 | 0.05% |
| Festival Push | 6.7% | 14.75% | 7.1% | 0.15% | 0.27 | 23.74% | 56.44% | €4.103 | 5 | 0.65% |
| Chaos Tour | 7.1% | 18.45% | 7.55% | 0.05% | 0.33 | 22.34% | 56.2% | €4.067 | 5 | 0.65% |
| Cult Hypergrowth | 4.55% | 11.1% | 4.9% | 0% | 0.19 | 18.7% | 46.2% | €4.955 | 5 | 0.95% |
| No Social (Fame 0-50) | 9.05% | 21.85% | 9.35% | 0.1% | 0.39 | 24.67% | 70.3% | €3.992 | 5 | 0.15% |
| High Controversy | 42.05% | 63.4% | 42.7% | 0.35% | 1.42 | 50.49% | 96.5% | €2.684 | 5 | 0% |
| Early Game Probe (Fame 0–50) | 9.3% | 21.7% | 9.55% | 0% | 0.39 | 24.63% | 70.52% | €3.995 | 5 | 0.1% |
| Mid Game Probe (Fame 60–150) | 0.2% | 0.25% | 0.2% | 0.05% | 0 | 14.31% | 31.51% | €5.039 | 7.5 | 1.25% |
| Late Game Probe (Fame 175+) | 0.05% | 0.1% | 0.1% | 0% | 0 | 6.11% | 18.45% | €9.114 | 8 | 29.1% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zur Lesart der beiden Schwellen: „je < €500“ trennt die Szenarien inzwischen deutlich (0.1% bis 63.4%) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens 0.35%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

„Finale erreicht“ und „Finale gespielt“ sind absichtlich zwei Spalten: die erste zählt die Ankunft am FINALE-Knoten, die zweite die tatsächlich absolvierte Show. Ein bei niedriger Harmony abgesagtes Finale steht deshalb in der ersten, aber nicht in der zweiten Spalte — eine Ankunft ist kein Beweis, dass gespielt wurde.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Baseline Touring | 8.40 | 9.74 | 9.74 | 94% | 94% | 1.34 | 0.04 | 0.04/0/0 | 0.1 | 0 |
| Bootstrap Struggle | 6.21 | 8.95 | 8.95 | 82.6% | 82.45% | 2.73 | 0.21 | 0.21/0/0 | 0.18 | 0 |
| Aggressive Marketing | 7.31 | 9.69 | 9.69 | 93.9% | 93.85% | 2.37 | 0.06 | 0.06/0/0 | 0.14 | 0 |
| Scandal Recovery | 6.22 | 8.9 | 8.9 | 80.95% | 80.75% | 2.67 | 0.22 | 0.22/0/0 | 0.15 | 0 |
| Festival Push | 6.69 | 9.53 | 9.53 | 91.9% | 91.85% | 2.84 | 0.09 | 0.09/0/0 | 0.08 | 0 |
| Chaos Tour | 7.16 | 9.48 | 9.48 | 90.25% | 89% | 2.29 | 0.1 | 0.1/0/0 | 0.41 | 0 |
| Cult Hypergrowth | 7.26 | 9.65 | 9.65 | 93.7% | 93.65% | 2.39 | 0.06 | 0.06/0/0 | 0.18 | 0 |
| No Social (Fame 0-50) | 7.05 | 9.38 | 9.38 | 89.1% | 89.05% | 2.32 | 0.12 | 0.12/0/0 | 0.25 | 0 |
| High Controversy | 5.27 | 7 | 7 | 51.3% | 51.15% | 1.72 | 0.55 | 0.55/0/0 | 0.17 | 0 |
| Early Game Probe (Fame 0–50) | 7.05 | 9.35 | 9.35 | 88.65% | 88.55% | 2.3 | 0.13 | 0.12/0/0 | 0.2 | 0 |
| Mid Game Probe (Fame 60–150) | 7.51 | 9.96 | 9.96 | 97.3% | 97.05% | 2.45 | 0 | 0/0/0 | 0.13 | 0 |
| Late Game Probe (Fame 175+) | 8.64 | 9.97 | 9.97 | 96.95% | 96.75% | 1.33 | 0 | 0/0/0 | 0.08 | 0 |

Knotentypen über alle Ankünfte: GIG 67.29% · FINALE 9.65% · FESTIVAL 9.27% · SPECIAL 4.85% · REST_STOP 4.56% · SUPPLY_STOP 4.39% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 94%, Bootstrap Struggle 82.6%, Aggressive Marketing 93.9%, Scandal Recovery 80.95%, Festival Push 91.9%, Chaos Tour 90.25%, Cult Hypergrowth 93.7%, No Social (Fame 0-50) 89.1%, High Controversy 51.3%, Early Game Probe (Fame 0–50) 88.65%, Mid Game Probe (Fame 60–150) 97.3%, Late Game Probe (Fame 175+) 96.95%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da 86.21% der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 28 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 99.1% | 2 | 100% | 1 | 10.11 | 36.11% | HQ | €2.425,35 | €2.307,15 | 1.13 | 0.11 | 1.16 | 23.23 |
| Bootstrap Struggle | 1 | 98.1% | 2 | 100% | 1 | 9.39 | 33.55% | HQ | €1.658,36 | €1.543,76 | 1.22 | 0.17 | 2.05 | 22.33 |
| Aggressive Marketing | 1 | 98.65% | 2 | 100% | 1 | 10.06 | 35.94% | HQ | €2.289,4 | €2.171,27 | 1.18 | 0.12 | 1.41 | 22.98 |
| Scandal Recovery | 1 | 98.25% | 2 | 100% | 1 | 9.35 | 33.39% | HQ | €1.660,83 | €1.546,12 | 1.19 | 0.19 | 1.72 | 22.41 |
| Festival Push | 1 | 98.95% | 3 | 100% | 1 | 9.92 | 35.43% | HQ | €2.137,28 | €2.021,66 | 1.18 | 0.12 | 1.39 | 22.98 |
| Chaos Tour | 1 | 98.55% | 2 | 100% | 1 | 9.86 | 35.23% | HQ | €1.971,68 | €1.854,27 | 1.2 | 0.14 | 1.52 | 22.88 |
| Cult Hypergrowth | 1 | 98.35% | 2 | 100% | 1 | 10.02 | 35.78% | HQ | €2.416,96 | €2.298,65 | 1.18 | 0.12 | 1.42 | 22.97 |
| No Social (Fame 0-50) | 1 | 98.6% | 3 | 100% | 1 | 9.78 | 34.94% | HQ | €1.884,19 | €1.768,17 | 1.18 | 0.15 | 1.6 | 22.78 |
| High Controversy | 1 | 97.15% | 2 | 100% | 1 | 7.67 | 27.39% | HQ | €1.174,38 | €1.075,21 | 1 | 0.27 | 1.89 | 19.62 |
| Early Game Probe (Fame 0–50) | 1 | 98.25% | 2 | 100% | 1 | 9.75 | 34.82% | HQ | €1.888,57 | €1.772,34 | 1.15 | 0.17 | 1.58 | 22.83 |
| Mid Game Probe (Fame 60–150) | 1 | 99.95% | 2 | 100% | 1 | 10.33 | 36.89% | HQ | €3.018,99 | €2.893,62 | 1.36 | 0 | 1.45 | 23 |
| Late Game Probe (Fame 175+) | 1 | 100% | 2 | 100% | 1 | 10.35 | 36.95% | HQ | €7.182,18 | €7.052,83 | 1.14 | 0 | 1.09 | 23.41 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €965 | €1.131 | 0.853 | 0.03 | 0.33% | €75 | 6.63% | 90% |
| Bootstrap Struggle | €726 | €1.091 | 0.666 | 0.01 | 0.15% | €84 | 7.71% | 90% |
| Aggressive Marketing | €904 | €1.211 | 0.746 | 0.02 | 0.2% | €84 | 6.91% | 90% |
| Scandal Recovery | €719 | €1.077 | 0.668 | 0.03 | 0.3% | €84 | 7.81% | 90% |
| Festival Push | €821 | €1.190 | 0.69 | 0.01 | 0.14% | €89 | 7.44% | 90% |
| Chaos Tour | €844 | €1.140 | 0.74 | 0.03 | 0.28% | €80 | 7.05% | 90% |
| Cult Hypergrowth | €904 | €1.218 | 0.743 | 0.02 | 0.19% | €85 | 6.96% | 90% |
| No Social (Fame 0-50) | €810 | €1.103 | 0.734 | 0.02 | 0.19% | €80 | 7.27% | 90% |
| High Controversy | €560 | €856 | 0.654 | 0.09 | 1.15% | €74 | 8.63% | 90% |
| Early Game Probe (Fame 0–50) | €814 | €1.107 | 0.735 | 0.02 | 0.2% | €80 | 7.22% | 90% |
| Mid Game Probe (Fame 60–150) | €859 | €1.143 | 0.751 | 0.03 | 0.28% | €87 | 7.63% | 90% |
| Late Game Probe (Fame 175+) | €1.011 | €1.170 | 0.864 | 0.03 | 0.31% | €99 | 8.45% | 90% |

„Katalog < 1 Gig“ ist der Anteil der 10 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien gilt: Stamina 19 unterschreitet die Marke 35; Mood 35 unterschreitet die Marke 50. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Ruhetage treten in 12 von 12 Szenarien überhaupt auf (High Controversy 1.15%, Baseline Touring 0.33%, Late Game Probe (Fame 175+) 0.31%, Scandal Recovery 0.3%, Chaos Tour 0.28%, Mid Game Probe (Fame 60–150) 0.28%, Aggressive Marketing 0.2%, Early Game Probe (Fame 0–50) 0.2%, Cult Hypergrowth 0.19%, No Social (Fame 0-50) 0.19%, Bootstrap Struggle 0.15%, Festival Push 0.14%); nennenswert ist der Anteil nur bei High Controversy, alle übrigen liegen im Promillebereich. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 2000 / €6.972 | 1940 / €7.188 | 60 / €0 |
| Bootstrap Struggle | 2000 / €4.433 | 1686 / €5.258 | 314 / €0 |
| Aggressive Marketing | 2000 / €6.496 | 1916 / €6.781 | 84 / €0 |
| Scandal Recovery | 2000 / €4.312 | 1675 / €5.148 | 325 / €0 |
| Festival Push | 2000 / €5.816 | 1866 / €6.233 | 134 / €0 |
| Chaos Tour | 2000 / €5.500 | 1858 / €5.920 | 142 / €0 |
| Cult Hypergrowth | 2000 / €6.671 | 1909 / €6.988 | 91 / €0 |
| No Social (Fame 0-50) | 2000 / €5.320 | 1819 / €5.849 | 181 / €0 |
| High Controversy | 2000 / €2.521 | 1159 / €4.350 | 841 / €0 |
| Early Game Probe (Fame 0–50) | 2000 / €5.277 | 1814 / €5.818 | 186 / €0 |
| Mid Game Probe (Fame 60–150) | 2000 / €6.959 | 1996 / €6.973 | 4 / €0 |
| Late Game Probe (Fame 175+) | 2000 / €11.314 | 1999 / €11.320 | 1 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €1.860 | 0.2668 | 17.62% | 36.41% |
| Bootstrap Struggle | €2.313 | 0.5218 | 39.91% | 91.06% |
| Aggressive Marketing | €2.067 | 0.3182 | 24.57% | 47.25% |
| Scandal Recovery | €2.314 | 0.5366 | 39.87% | 91.16% |
| Festival Push | €2.227 | 0.3829 | 29.84% | 56.44% |
| Chaos Tour | €2.064 | 0.3753 | 28.35% | 56.20% |
| Cult Hypergrowth | €2.119 | 0.3176 | 24.13% | 46.20% |
| No Social (Fame 0-50) | €2.139 | 0.4021 | 31.21% | 70.30% |
| High Controversy | €2.404 | 0.9536 | 57.12% | 96.50% |
| Early Game Probe (Fame 0–50) | €2.170 | 0.4112 | 31.37% | 70.52% |
| Mid Game Probe (Fame 60–150) | €1.534 | 0.2204 | 17.24% | 31.51% |
| Late Game Probe (Fame 175+) | €1.818 | 0.1607 | 8.58% | 18.45% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 181 |
| brandDealsAvailable | 54 |
| postOptionsAvailable | 37 |
| contrabandItemsAvailable | 38 |
| upgradesAvailable | 28 |
| socialPlatformsAvailable | 4 |
| trendsAvailable | 5 |
| songsAvailable | 7 |
| questsAvailable | 35 |
| assetChassisAvailable | 24 |
| assetModulesAvailable | 63 |
| loanProfilesAvailable | 5 |

## Ausführungsabdeckung (Coverage)

*Note: `Covered` is true when a feature has any evaluation, activation, or observed ID. It does not require all possible catalog IDs to be seen.*

| Feature | Covered | Evaluations / Attempts | Activations / Completions | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 205699 | 1071 | 41 |
| postOptions | ✅ | 28169 | 28169 | 29 |
| socialTrends | ✅ | 226981 | 27318 | 5 |
| contraband | ✅ | 226981 | 25012 | 38 |
| minigamesTravel | ✅ | 223149 | 130728 | - |
| minigamesRoadie | ✅ | 56851 | 50584 | - |
| minigamesKabelsalat | ✅ | 56410 | 39218 | - |
| minigamesAmp | ✅ | 56277 | 39117 | - |
| sponsorship | ✅ | 207949 | 916 | - |
| restStops | ✅ | 226981 | 35 | - |
| eventTriggers.travel | ✅ | 223149 | 6747 | - |
| eventTriggers.preGig | ✅ | 169538 | 168814 | - |
| eventTriggers.gigMoments | ✅ | 169538 | 21982 | - |
| eventTriggers.postGig | ✅ | 169538 | 169324 | - |
| quests | ✅ | offers: 83560 (u:22) | acts: 41731 (u:23), comp: 972 (u:7) | 35 in registry |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 3% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €6.972 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1878.27 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 15.7% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €4.433 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1805.29 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 4.2% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €6.496 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1940.39 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 16.25% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €4.312 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1859.94 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 6.7% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €13.000 – €43.000 | €5.816 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 2059.25 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 7.1% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €5.500 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1713.01 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 4.55% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €6.671 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1947.31 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | Insolvenzrate | ≤ 15% | 9.05% | ✅ | Akzeptabel – innerhalb Toleranz. |
| No Social (Fame 0-50) | Endgeld | €10.000 – €40.000 | €5.320 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| No Social (Fame 0-50) | Fame-Fortschritt/Gig | 1000 – 2200 | 1832.75 | ✅ | Im Zielband – leicht außermittig. |
| High Controversy | Insolvenzrate | ≤ 45% | 42.05% | ✅ | Akzeptabel – innerhalb Toleranz. |
| High Controversy | Endgeld | €5.000 – €35.000 | €2.521 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| High Controversy | Fame-Fortschritt/Gig | 1000 – 2200 | 1808.85 | ✅ | Im Zielband – leicht außermittig. |
| Early Game Probe (Fame 0–50) | Insolvenzrate | ≤ 12% | 9.3% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Early Game Probe (Fame 0–50) | Endgeld | €10.000 – €35.000 | €5.277 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Early Game Probe (Fame 0–50) | Fame-Fortschritt/Gig | 1000 – 2200 | 1829.46 | ✅ | Im Zielband – leicht außermittig. |
| Mid Game Probe (Fame 60–150) | Insolvenzrate | ≤ 5% | 0.2% | ✅ | Solide – deutlich unter Risikogrenze. |
| Mid Game Probe (Fame 60–150) | Endgeld | €15.000 – €50.000 | €6.959 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Mid Game Probe (Fame 60–150) | Fame-Fortschritt/Gig | 1000 – 2200 | 1853.52 | ✅ | Im Zielband – leicht außermittig. |
| Late Game Probe (Fame 175+) | Insolvenzrate | ≤ 5% | 0.05% | ✅ | Solide – deutlich unter Risikogrenze. |
| Late Game Probe (Fame 175+) | Endgeld | €20.000 – €80.000 | €11.314 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Late Game Probe (Fame 175+) | Fame-Fortschritt/Gig | 1000 – 2200 | 1901.48 | ✅ | Im Zielband – leicht außermittig. |

## Alt/Neu-Vergleich der vollständigen Simulationsreports

Dieser Vergleich ist **deskriptiv und ungepaart**; die Deltas sind keine gepaarten Effektschätzungen.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Fingerprint | `ca0c1e91bacb1c028feb5c6d5e772e37cd37e91dbf70b80d504607c88197cb9f` | `06609b8e5994adaf4324048385a7e9ff29fa16eb0c87603556c8af0fa8efa24f` |
| Runs je Szenario | 2000 | 2000 |
| Seed-Namensraum | `#first-income-full-reports-v1` | `#first-income-full-reports-v1` |
| Seed-Strategie | `scenario-id-plus-first-income-full-report-namespace-plus-run-index` | `scenario-id-plus-first-income-full-report-namespace-plus-run-index` |
| Ausgelieferte Harness-Kadenz | `first-income` | `first-income` |

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €0 | 0 | 0 |
| Bootstrap Struggle | 0% | €0 | 0 | 0 |
| Aggressive Marketing | 0% | €0 | 0 | 0 |
| Scandal Recovery | 0% | €0 | 0 | 0 |
| Festival Push | 0% | €0 | 0 | 0 |
| Chaos Tour | 0% | €0 | 0 | 0 |
| Cult Hypergrowth | 0% | €0 | 0 | 0 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0% | €0 | 0 | 0 |
| Early Game Probe (Fame 0–50) | 0% | €0 | 0 | 0 |
| Mid Game Probe (Fame 60–150) | 0% | €0 | 0 | 0 |
| Late Game Probe (Fame 175+) | 0% | €0 | 0 | 0 |

## Kurzfazit

- Höchstes Risiko: **High Controversy** mit 42.05% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €11.314 Endgeld.
- Ereignisdichte: **Late Game Probe (Fame 175+)** mit Ø 19.48 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 0
- Fehlgeschlagen: 12
- Nicht bewertet: 0

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 12/12 Szenarien unter ihrer harten Insolvenzgrenze; 0 ohne Korridorurteil.
- ✅ Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: bestanden.
- Risikobänder: healthy 7 · unstable 1 · low_risk 3 · high_risk 1.
- ⚠️ 7 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Scandal Recovery (Endgeld) · Festival Push (Endgeld) · Chaos Tour (Endgeld) · Cult Hypergrowth (Endgeld) · No Social (Fame 0-50) (Endgeld) · High Controversy (Endgeld) · Early Game Probe (Fame 0–50) (Endgeld) · Mid Game Probe (Fame 60–150) (Endgeld) · Late Game Probe (Fame 175+) (Endgeld)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
