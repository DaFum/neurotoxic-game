# Game Balance Simulation – Analyse

Erstellt am: 2026-10-23T14:05:48.319Z

## Reproduzierbarkeit

- Report-Version: 14
- Source-Fingerprint: b9ed068a8aeaef3f2d0a309cfb4a2d9a26152995022ea943311e52d497555bb8
- Generator-Fingerprint: 261a98ee05611459c36d42eb477f0c41b143db62148e2bed7fbc843b6ee3ab26
- Artefaktschema: 1
- Seed-Namensraum: #first-income-full-reports-v1
- Runs je Szenario: 2000
- Working Tree Dirty: Ja

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
| Events gesamt | 204 |
| Brand Deals | 54 |
| Post Options | 37 |
| Contraband-Items | 38 |
| Upgrade-Katalog | 28 |
| Social Platforms | 4 |
| Trends | 5 |
| Songs | 7 |
| Quests (Registry) | 43 |
| Asset-Chassis-Arten | 4 |
| Asset-Module | 66 |
| Kredit-Profile | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 34 | travel, random |
| band | 86 | random, travel, post_gig |
| gig | 23 | gig_mid, gig_intro, random |
| financial | 32 | random, post_gig |
| special | 29 | special_location, random, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €6.964 | 17.93% | 0.14 | 0% | 11366 | 7 | 54 | 5.49 | 8.36 | 0.06 | 3.45% | €1.107 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €4.470 | 39.38% | 0.18 | 0% | 7292 | 6 | 48 | 5.03 | 6.25 | 0.02 | 15.55% | €1.018 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €6.506 | 25.08% | 0.15 | 0% | 9711 | 6 | 54 | 4.97 | 7.3 | 0.04 | 4.85% | €1.182 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €4.267 | 40.29% | 0.19 | 0% | 7508 | 6 | 53 | 42.15 | 6.14 | 0.09 | 17.1% | €987 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €5.834 | 30.02% | 0.15 | 0% | 9548 | 6 | 59 | 4.54 | 6.7 | 0.02 | 6.25% | €1.157 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €5.479 | 28.9% | 0.17 | 0% | 7927 | 6 | 40 | 5.35 | 7.11 | 0.05 | 7.55% | €1.096 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €6.704 | 23.96% | 0.14 | 0% | 9629 | 6 | 57 | 4.59 | 7.28 | 0.04 | 4.1% | €1.188 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €5.309 | 30.29% | 0.17 | 0% | 8851 | 6 | 51 | 0.46 | 7.07 | 0.04 | 9.05% | €1.050 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| High Controversy | €500 | 0 | €2.501 | 56.97% | 0.22 | 0% | 6790 | 5 | 53 | 58.18 | 5.24 | 0.24 | 42.4% | €672 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €5.262 | 31.46% | 0.17 | 0% | 8612 | 6 | 49 | 5.04 | 7.02 | 0.03 | 10.2% | €1.051 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €6.898 | 17.62% | 0.17 | 0% | 9184 | 6 | 49 | 5.6 | 7.47 | 0.05 | 0.3% | €1.142 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €11.264 | 8.86% | 0.15 | 0% | 11547 | 7 | 54 | 5.63 | 8.62 | 0.07 | 0.1% | €1.169 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €7.011 | €477 | €1.107 | 0.12 | 0.06 | 10.57 | 1.25 | 1.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €4.629 | €417 | €1.018 | 0.07 | 0.04 | 9.69 | 0.89 | 1.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Aggressive Marketing | €6.560 | €470 | €1.182 | 0.12 | 0.06 | 10.53 | 1.22 | 1.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €4.451 | €409 | €987 | 0.07 | 0.04 | 9.56 | 1.09 | 1.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €5.908 | €461 | €1.157 | 0.08 | 0.05 | 10.35 | 1.25 | 1.15 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €5.575 | €453 | €1.096 | 0.11 | 0.05 | 10.23 | 1.09 | 1.18 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €6.761 | €473 | €1.188 | 0.07 | 0.04 | 10.54 | 1.19 | 1.13 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €5.406 | €448 | €1.050 | 0 | 0 | 10.06 | 1.14 | 1.29 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €2.899 | €295 | €672 | 0.07 | 0.03 | 7.65 | 0.79 | 0.89 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Early Game Probe (Fame 0–50) | €5.371 | €443 | €1.051 | 0.08 | 0.05 | 10.01 | 1.14 | 1.38 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €6.937 | €1.446 | €1.142 | 0.1 | 0.05 | 11.08 | 1.25 | 1.49 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €11.443 | €4.921 | €1.169 | 0.14 | 0.06 | 11.14 | 1.27 | 1.24 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-first-income-full-report-namespace-plus-holdout-marker-plus-run-index`, 2000 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 3.45% ✅ | 2.7% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €6.964 ❌ | €6.997 ❌ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1894.83 ✅ | 1908.52 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 15.55% ✅ | 16.35% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €4.470 ❌ | €4.460 ❌ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1799.6 ✅ | 1803.69 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 4.85% ✅ | 4.35% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €6.506 ❌ | €6.495 ❌ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1927.33 ✅ | 1924.7 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 17.1% ✅ | 15.25% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €4.267 ❌ | €4.388 ❌ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1854.44 ✅ | 1856.61 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 6.25% ✅ | 6.85% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €5.834 ❌ | €5.835 ❌ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 2084.82 ✅ | 2034.8 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 7.55% ✅ | 7.05% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €5.479 ❌ | €5.464 ❌ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1718.28 ✅ | 1744.59 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 4.1% ✅ | 4.3% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €6.704 ❌ | €6.750 ❌ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1919.03 ✅ | 1932.42 ✅ | ✅ |
| no_social_probe | Insolvenzrate | ≤ 15% | 9.05% ✅ | 9.05% ✅ | ✅ |
| no_social_probe | Endgeld | €10.000 – €40.000 | €5.309 ❌ | €5.363 ❌ | ✅ |
| no_social_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1841.27 ✅ | 1831.33 ✅ | ✅ |
| high_controversy_probe | Insolvenzrate | ≤ 45% | 42.4% ✅ | 40.4% ✅ | ✅ |
| high_controversy_probe | Endgeld | €5.000 – €35.000 | €2.501 ❌ | €2.597 ❌ | ✅ |
| high_controversy_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1834.85 ✅ | 1819.65 ✅ | ✅ |
| early_game_probe | Insolvenzrate | ≤ 12% | 10.2% ✅ | 10.45% ✅ | ✅ |
| early_game_probe | Endgeld | €10.000 – €35.000 | €5.262 ❌ | €5.207 ❌ | ✅ |
| early_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1840.48 ✅ | 1817.05 ✅ | ✅ |
| mid_game_probe | Insolvenzrate | ≤ 5% | 0.3% ✅ | 0.3% ✅ | ✅ |
| mid_game_probe | Endgeld | €15.000 – €50.000 | €6.898 ❌ | €6.939 ❌ | ✅ |
| mid_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1868.61 ✅ | 1867.53 ✅ | ✅ |
| late_game_probe | Insolvenzrate | ≤ 5% | 0.1% ✅ | 0.05% ✅ | ✅ |
| late_game_probe | Endgeld | €20.000 – €80.000 | €11.264 ❌ | €11.211 ❌ | ✅ |
| late_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1909.06 ✅ | 1930.08 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Harte Sicherheitsgrenzen (Holdout)

Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.

Abdeckung: 12 von 12 Szenarien mit konfigurierter Obergrenze gemessen. Fehlende Abdeckung ist selbst ein Fehlschlag — ein Gate, das nur einen Teil der harten Grenzen prüft, sagt über die übrigen nichts aus.

✅ Alle 12 geprüften Szenarien bleiben auf unabhängigen Seeds unter ihrer harten Grenze.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €1.646 | €2.967 | €3.760 | €6.964 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.204 | €1.830 | €2.340 | €4.470 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €1.574 | €2.721 | €3.436 | €6.506 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €1.186 | €1.997 | €2.177 | €4.267 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €1.549 | €2.724 | €3.135 | €5.834 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €1.336 | €2.274 | €2.837 | €5.479 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €1.609 | €2.827 | €3.598 | €6.704 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.230 | €2.147 | €2.676 | €5.309 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €751 | €1.067 | €1.129 | €2.501 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.255 | €2.141 | €2.633 | €5.262 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €2.319 | €3.361 | €3.957 | €6.898 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €6.253 | €7.574 | €8.367 | €11.264 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.107 | €75 | 15× | 11.29 | null | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.018 | €84 | 13× | 12.28 | null | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.182 | €84 | 14.5× | 10.58 | null | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €987 | €84 | 12.8× | 12.66 | null | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.157 | €89 | 13.5× | 10.8 | null | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.096 | €81 | 14.2× | 11.41 | null | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €1.188 | €85 | 14.4× | 10.52 | null | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.050 | €80 | 13.8× | 11.9 | null | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €672 | €74 | 11.6× | 18.6 | null | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.051 | €80 | 13.9× | 11.89 | null | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.142 | €88 | 13× | 10.95 | null | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €1.169 | €99 | 11.8× | 10.69 | null | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 5.6 | 66 | 7% | 53.4% | 39.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.4 | 62 | 14.8% | 60.7% | 24.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.4 | 68 | 5.8% | 50.1% | 44.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.1 | 64 | 10.6% | 58.6% | 30.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 4.5 | 73 | 2.5% | 35.1% | 62.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 59 | 21.5% | 58.4% | 20.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 5.4 | 67 | 5% | 50.8% | 44.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.1 | 64 | 11.1% | 59.5% | 29.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 6.4 | 64 | 14.8% | 58.6% | 26.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.2 | 63 | 13% | 58.2% | 28.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.1 | 64 | 10.1% | 60.6% | 29.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 5.6 | 67 | 6.3% | 55% | 38.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 54 | 0.06 | 0.05 | 0.01 | 1.08 | 1.5 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 48 | 0.02 | 0.03 | 0 | 0.99 | 1.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 54 | 0.04 | 0.05 | 0.01 | 1.1 | 1.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 53 | 0.09 | 0.03 | 0 | 1.02 | 1.07 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 59 | 0.02 | 0.04 | 0.01 | 1.04 | 1.17 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 40 | 0.05 | 0.05 | 0 | 1.07 | 1.23 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 57 | 0.04 | 0.03 | 0 | 1.06 | 1.32 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 51 | 0.04 | 0 | 0 | 1.05 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 53 | 0.24 | 0.03 | 0.01 | 0.85 | 0.96 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 49 | 0.03 | 0.04 | 0.01 | 1.03 | 1.24 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 49 | 0.05 | 0.04 | 0 | 1.09 | 1.34 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 54 | 0.07 | 0.05 | 0.01 | 1.09 | 1.58 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.32 | 7.71 | 9.28 | 0.18 | 0.72 | 1.18 | 11.2 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Bootstrap Struggle | 0.27 | 6.13 | 6.87 | 0.29 | 0.79 | 1.12 | 10.25 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Aggressive Marketing | 0.35 | 7.11 | 8.22 | 0.34 | 1.17 | 1.18 | 11.14 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Scandal Recovery | 0.53 | 6.14 | 6.87 | 0.39 | 1.18 | 1.13 | 10.14 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Festival Push | 0.26 | 6.5 | 7.36 | 0.21 | 0.69 | 1.14 | 11 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Chaos Tour | 0.45 | 7.08 | 8.21 | 0.54 | 1.7 | 1.16 | 10.85 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 0.35 | 7.07 | 8.15 | 0.33 | 1.01 | 1.12 | 11.17 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| No Social (Fame 0-50) | 0.3 | 6.83 | 7.88 | 0.29 | 0.9 | 1.17 | 10.68 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| High Controversy | 0.29 | 5.23 | 5.65 | 0.21 | 0.68 | 0.94 | 8.2 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Early Game Probe (Fame 0–50) | 0.25 | 6.59 | 7.66 | 0.17 | 0.53 | 1.15 | 10.64 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Mid Game Probe (Fame 60–150) | 0.31 | 7.14 | 8.24 | 0.25 | 0.76 | 1.2 | 11.72 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Late Game Probe (Fame 175+) | 0.38 | 8.07 | 9.69 | 0.29 | 1.11 | 1.19 | 11.81 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.71 | 2.76 | 2.82 | 2.78 | 18.07 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Bootstrap Struggle | 8.98 | 2.09 | 2.09 | 2.07 | 15.23 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Aggressive Marketing | 9.64 | 2.45 | 2.42 | 2.42 | 16.93 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Scandal Recovery | 8.81 | 1.99 | 2.06 | 2.09 | 14.95 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Festival Push | 9.55 | 2.23 | 2.25 | 2.22 | 16.25 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Chaos Tour | 9.44 | 2.37 | 2.39 | 2.34 | 16.54 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Cult Hypergrowth | 9.68 | 2.42 | 2.41 | 2.45 | 16.96 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| No Social (Fame 0-50) | 9.37 | 2.39 | 2.34 | 2.34 | 16.44 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| High Controversy | 6.96 | 1.77 | 1.73 | 1.73 | 12.19 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Early Game Probe (Fame 0–50) | 9.29 | 2.34 | 2.35 | 2.33 | 16.31 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Mid Game Probe (Fame 60–150) | 9.96 | 2.47 | 2.5 | 2.5 | 17.43 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Late Game Probe (Fame 175+) | 9.96 | 2.87 | 2.88 | 2.88 | 18.59 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.01 | 0.01 | 0 | 0.32 | 0.01 | 2.17 | €21 | 0 | 98.5% |
| Bootstrap Struggle | 0 | 0 | 0 | 0.32 | 0 | 1.73 | €7 | 0 | 95.3% |
| Aggressive Marketing | 0.01 | 0.01 | 0 | 0.32 | 0.01 | 1.59 | €12 | 0 | 98.4% |
| Scandal Recovery | 0 | 0 | 0 | 0.29 | 0 | 1.71 | €31 | 0 | 96.5% |
| Festival Push | 0.01 | 0.01 | 0 | 0.32 | 0.01 | 1.1 | €7 | 0 | 98.7% |
| Chaos Tour | 0.01 | 0.01 | 0 | 0.34 | 0.01 | 1.41 | €16 | 0 | 96% |
| Cult Hypergrowth | 0.01 | 0.01 | 0 | 0.34 | 0.01 | 2.03 | €12 | 0 | 97.8% |
| No Social (Fame 0-50) | 0 | 0 | 0 | 0.32 | 0 | 1.49 | €15 | 0 | 97.7% |
| High Controversy | 0 | 0 | 0 | 0.25 | 0 | 1.47 | €82 | 0.02 | 94.8% |
| Early Game Probe (Fame 0–50) | 0.01 | 0.01 | 0 | 0.33 | 0.01 | 1.88 | €10 | 0 | 96.9% |
| Mid Game Probe (Fame 60–150) | 0.02 | 0.02 | 0.01 | 0.33 | 0.02 | 1.98 | €16 | 0 | 99.5% |
| Late Game Probe (Fame 175+) | 0.43 | 0.31 | 0.25 | 0.32 | 0.43 | 2.21 | €23 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €11.264 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 11547 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 42.4% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €1.188 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €11.443 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.62 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Late Game Probe (Fame 175+)** | 19.54 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 15958 | 4587 | 0 | 4587 | 4 | 0 | 2000/2000 |
| Bootstrap Struggle | 11257 | 3962 | 0 | 3962 | 4 | 0 | 2000/2000 |
| Aggressive Marketing | 14154 | 4439 | 0 | 4439 | 4 | 0 | 2000/2000 |
| Scandal Recovery | 11428 | 3916 | 0 | 3916 | 3 | 0 | 2000/2000 |
| Festival Push | 14034 | 4483 | 0 | 4483 | 4 | 0 | 2000/2000 |
| Chaos Tour | 12297 | 4365 | 0 | 4365 | 6 | 0 | 2000/2000 |
| Cult Hypergrowth | 14179 | 4546 | 0 | 4546 | 4 | 0 | 2000/2000 |
| No Social (Fame 0-50) | 13085 | 4230 | 0 | 4230 | 3 | 0 | 2000/2000 |
| High Controversy | 9477 | 2684 | 0 | 2684 | 3 | 0 | 2000/2000 |
| Early Game Probe (Fame 0–50) | 12945 | 4329 | 0 | 4329 | 4 | 0 | 2000/2000 |
| Mid Game Probe (Fame 60–150) | 13915 | 4787 | 0 | 4787 | 4 | 0 | 2000/2000 |
| Late Game Probe (Fame 175+) | 16409 | 5033 | 0 | 5033 | 4 | 0 | 2000/2000 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €6.964 | €7.239 | €1.886 | €5.070 | €8.927 |
| Bootstrap Struggle | €4.470 | €4.920 | €2.318 | €0 | €6.942 |
| Aggressive Marketing | €6.506 | €6.797 | €2.123 | €4.268 | €8.737 |
| Scandal Recovery | €4.267 | €4.801 | €2.347 | €0 | €6.794 |
| Festival Push | €5.834 | €6.107 | €2.186 | €3.362 | €8.232 |
| Chaos Tour | €5.479 | €5.833 | €2.075 | €3.199 | €7.660 |
| Cult Hypergrowth | €6.704 | €6.983 | €2.075 | €4.497 | €8.928 |
| No Social (Fame 0-50) | €5.309 | €5.715 | €2.132 | €2.687 | €7.526 |
| High Controversy | €2.501 | €2.834 | €2.388 | €0 | €5.547 |
| Early Game Probe (Fame 0–50) | €5.262 | €5.695 | €2.213 | €0 | €7.556 |
| Mid Game Probe (Fame 60–150) | €6.898 | €6.978 | €1.547 | €4.883 | €8.821 |
| Late Game Probe (Fame 175+) | €11.264 | €11.464 | €1.876 | €8.970 | €13.380 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 69 | 2000 | 3.45% | 2.74% | 4.34% |
| Bootstrap Struggle | 311 | 2000 | 15.55% | 14.03% | 17.20% |
| Aggressive Marketing | 97 | 2000 | 4.85% | 3.99% | 5.88% |
| Scandal Recovery | 342 | 2000 | 17.10% | 15.51% | 18.81% |
| Festival Push | 125 | 2000 | 6.25% | 5.27% | 7.40% |
| Chaos Tour | 151 | 2000 | 7.55% | 6.47% | 8.79% |
| Cult Hypergrowth | 82 | 2000 | 4.10% | 3.32% | 5.06% |
| No Social (Fame 0-50) | 181 | 2000 | 9.05% | 7.87% | 10.39% |
| High Controversy | 848 | 2000 | 42.40% | 40.25% | 44.58% |
| Early Game Probe (Fame 0–50) | 204 | 2000 | 10.20% | 8.95% | 11.60% |
| Mid Game Probe (Fame 60–150) | 6 | 2000 | 0.30% | 0.14% | 0.65% |
| Late Game Probe (Fame 175+) | 2 | 2000 | 0.10% | 0.03% | 0.36% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 3.45% | 1–5% | 10% | 2.74–4.34% | contained | within_target | within_target | stable | 🟢 healthy |
| Bootstrap Struggle | 15.55% | 15–30% | 60% | 14.03–17.20% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Aggressive Marketing | 4.85% | 2–8% | 15% | 3.99–5.88% | contained | within_target | within_target | stable | 🟢 healthy |
| Scandal Recovery | 17.10% | 8–20% | 50% | 15.51–18.81% | contained | within_target | within_target | stable | 🟢 healthy |
| Festival Push | 6.25% | 5–15% | 35% | 5.27–7.40% | contained | within_target | within_target | stable | 🟢 healthy |
| Chaos Tour | 7.55% | 8–20% | 25% | 6.47–8.79% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 4.10% | 2–10% | 12% | 3.32–5.06% | contained | within_target | within_target | stable | 🟢 healthy |
| No Social (Fame 0-50) | 9.05% | 2–12% | 15% | 7.87–10.39% | contained | within_target | within_target | stable | 🟢 healthy |
| High Controversy | 42.40% | 20–35% | 45% | 40.25–44.58% | entirely_above | above_target | above_target | stable | 🟠 high_risk |
| Early Game Probe (Fame 0–50) | 10.20% | 2–10% | 12% | 8.95–11.60% | straddles_upper | above_target | above_target | stable | 🟠 high_risk |
| Mid Game Probe (Fame 60–150) | 0.30% | 0–4% | 5% | 0.14–0.65% | contained | within_target | within_target | stable | 🟢 healthy |
| Late Game Probe (Fame 175+) | 0.10% | 0–4% | 5% | 0.03–0.36% | contained | within_target | within_target | stable | 🟢 healthy |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ chaos_tour: Insolvenzrate (Kalibrierung 7.55%, Holdout 7.05%) liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ high_controversy_probe: Insolvenzrate (Kalibrierung 42.4%, Holdout 40.4%) liegt über dem Zielkorridor 20–35%, aber noch unter der Sicherheitsgrenze.
- ⚠️ early_game_probe: Insolvenzrate (Kalibrierung 10.2%, Holdout 10.45%) liegt über dem Zielkorridor 2–10%, aber noch unter der Sicherheitsgrenze.
- ⚠️ early_game_probe: Probe-Ziel avgGigNet (Kalibrierung 1051, Holdout 1043) liegt unter dem Zielkorridor 3500–5500.
- ⚠️ early_game_probe: Probe-Ziel travelCostShareOfGigNetPct (Kalibrierung 7.22, Holdout 7.23) liegt über dem Zielkorridor 1.5–4.
- ⚠️ late_game_probe: Probe-Ziel travelCostShareOfGigNetPct (Kalibrierung 8.47, Holdout 8.5) liegt über dem Zielkorridor 1.5–6.
- ⚠️ late_game_probe: Probe-Ziel gigCapHitPct (Kalibrierung 0, Holdout 0) liegt unter dem Zielkorridor 2–10.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 3.45% | 10.35% | 3.6% | 0% | 0.16 | 13.22% | 38.44% | €5.383 | 5 | 0.6% |
| Bootstrap Struggle | 15.55% | 28.95% | 15.9% | 0.1% | 0.59 | 30.82% | 91% | €3.513 | 6 | 0.3% |
| Aggressive Marketing | 4.85% | 11.55% | 5.3% | 0.05% | 0.21 | 19.05% | 48.98% | €4.748 | 5 | 0.55% |
| Scandal Recovery | 17.1% | 30.75% | 17.8% | 0.1% | 0.64 | 31.96% | 91.42% | €3.262 | 5 | 0.05% |
| Festival Push | 6.25% | 15.15% | 6.7% | 0.05% | 0.27 | 23.93% | 57.31% | €4.148 | 5 | 0.5% |
| Chaos Tour | 7.55% | 18.4% | 8.3% | 0.3% | 0.34 | 22.75% | 57.67% | €4.067 | 5 | 0.9% |
| Cult Hypergrowth | 4.1% | 10.7% | 4.55% | 0% | 0.18 | 18.82% | 46% | €4.970 | 4 | 1.3% |
| No Social (Fame 0-50) | 9.05% | 21.1% | 9.3% | 0% | 0.39 | 23.14% | 65.39% | €4.042 | 5 | 0.2% |
| High Controversy | 42.4% | 64.3% | 42.9% | 0.15% | 1.44 | 51.73% | 96.19% | €2.550 | 5 | 0% |
| Early Game Probe (Fame 0–50) | 10.2% | 21.95% | 10.6% | 0.1% | 0.4 | 23.99% | 77.81% | €4.034 | 5 | 0.5% |
| Mid Game Probe (Fame 60–150) | 0.3% | 0.4% | 0.25% | 0% | 0.01 | 14.71% | 32.29% | €4.901 | 9 | 1.6% |
| Late Game Probe (Fame 175+) | 0.1% | 0.1% | 0.05% | 0% | 0 | 6.14% | 18.01% | €8.985 | 8 | 29.35% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zur Lesart der beiden Schwellen: „je < €500“ trennt die Szenarien inzwischen deutlich (0.1% bis 64.3%) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens 0.3%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

„Finale erreicht“ und „Finale gespielt“ sind absichtlich zwei Spalten: die erste zählt die Ankunft am FINALE-Knoten, die zweite die tatsächlich absolvierte Show. Ein bei niedriger Harmony abgesagtes Finale steht deshalb in der ersten, aber nicht in der zweiten Spalte — eine Ankunft ist kein Beweis, dass gespielt wurde.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Baseline Touring | 8.36 | 9.71 | 9.71 | 93.5% | 93.3% | 1.34 | 0.05 | 0.05/0/0 | 0.1 | 0 |
| Bootstrap Struggle | 6.25 | 8.98 | 8.98 | 83.15% | 82.85% | 2.73 | 0.21 | 0.21/0/0 | 0.18 | 0 |
| Aggressive Marketing | 7.30 | 9.64 | 9.64 | 93.55% | 93.5% | 2.34 | 0.07 | 0.07/0/0 | 0.14 | 0 |
| Scandal Recovery | 6.14 | 8.81 | 8.81 | 79.15% | 78.95% | 2.66 | 0.23 | 0.23/0/0 | 0.15 | 0 |
| Festival Push | 6.70 | 9.55 | 9.55 | 92.4% | 92.4% | 2.85 | 0.08 | 0.08/0/0 | 0.08 | 0 |
| Chaos Tour | 7.11 | 9.44 | 9.44 | 90% | 88.85% | 2.31 | 0.11 | 0.11/0/0 | 0.4 | 0 |
| Cult Hypergrowth | 7.28 | 9.68 | 9.68 | 94.2% | 94.15% | 2.4 | 0.05 | 0.05/0/0 | 0.16 | 0 |
| No Social (Fame 0-50) | 7.07 | 9.37 | 9.37 | 89.1% | 89.05% | 2.29 | 0.12 | 0.12/0/0 | 0.26 | 0 |
| High Controversy | 5.24 | 6.96 | 6.96 | 50.3% | 50.05% | 1.72 | 0.54 | 0.54/0/0 | 0.17 | 0 |
| Early Game Probe (Fame 0–50) | 7.02 | 9.29 | 9.29 | 88.05% | 87.6% | 2.26 | 0.13 | 0.13/0/0 | 0.21 | 0 |
| Mid Game Probe (Fame 60–150) | 7.47 | 9.96 | 9.96 | 97.05% | 96.85% | 2.48 | 0 | 0/0/0 | 0.12 | 0 |
| Late Game Probe (Fame 175+) | 8.62 | 9.96 | 9.96 | 96.45% | 96.35% | 1.33 | 0 | 0/0/0 | 0.08 | 0 |

Knotentypen über alle Ankünfte: GIG 67.52% · FINALE 9.63% · FESTIVAL 9.01% · SPECIAL 4.86% · REST_STOP 4.61% · SUPPLY_STOP 4.38% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 93.5%, Bootstrap Struggle 83.15%, Aggressive Marketing 93.55%, Scandal Recovery 79.15%, Festival Push 92.4%, Chaos Tour 90%, Cult Hypergrowth 94.2%, No Social (Fame 0-50) 89.1%, High Controversy 50.3%, Early Game Probe (Fame 0–50) 88.05%, Mid Game Probe (Fame 60–150) 97.05%, Late Game Probe (Fame 175+) 96.45%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da 86.16% der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 28 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 98.95% | 2 | 100% | 1 | 10.15 | 36.25% | HQ | €2.474,35 | €2.357,14 | 1.12 | 0.11 | 1.17 | 23.09 |
| Bootstrap Struggle | 1 | 98.25% | 2 | 100% | 1 | 9.45 | 33.75% | HQ | €1.657,58 | €1.541,51 | 1.26 | 0.17 | 2.05 | 22.22 |
| Aggressive Marketing | 1 | 98.7% | 2 | 100% | 1 | 10.1 | 36.06% | HQ | €2.331,63 | €2.213,69 | 1.18 | 0.13 | 1.42 | 22.83 |
| Scandal Recovery | 1 | 98.1% | 2 | 100% | 1 | 9.34 | 33.34% | HQ | €1.680,53 | €1.567,6 | 1.2 | 0.18 | 1.82 | 22.2 |
| Festival Push | 1 | 98.9% | 3 | 100% | 1 | 9.99 | 35.68% | HQ | €2.167,06 | €2.049,31 | 1.2 | 0.12 | 1.39 | 22.86 |
| Chaos Tour | 1 | 98.45% | 2 | 100% | 1 | 9.87 | 35.25% | HQ | €1.976,07 | €1.859,11 | 1.2 | 0.14 | 1.57 | 22.7 |
| Cult Hypergrowth | 1 | 98.15% | 2 | 100% | 1 | 10.1 | 36.07% | HQ | €2.430,28 | €2.312,54 | 1.16 | 0.11 | 1.32 | 22.94 |
| No Social (Fame 0-50) | 1 | 98.55% | 2 | 100% | 1 | 9.8 | 35.01% | HQ | €1.911,19 | €1.795,08 | 1.16 | 0.15 | 1.57 | 22.71 |
| High Controversy | 1 | 96.8% | 2 | 100% | 1 | 7.71 | 27.55% | HQ | €1.174,65 | €1.075,48 | 1 | 0.3 | 1.88 | 19.47 |
| Early Game Probe (Fame 0–50) | 1 | 98.05% | 2 | 100% | 1 | 9.73 | 34.76% | HQ | €1.871,57 | €1.755,97 | 1.14 | 0.15 | 1.54 | 22.72 |
| Mid Game Probe (Fame 60–150) | 1 | 100% | 2 | 100% | 1 | 10.38 | 37.07% | HQ | €3.048,7 | €2.923,45 | 1.32 | 0 | 1.45 | 22.9 |
| Late Game Probe (Fame 175+) | 1 | 100% | 2 | 100% | 1 | 10.43 | 37.24% | HQ | €7.227,95 | €7.100,26 | 1.13 | 0 | 1.11 | 23.18 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €962 | €1.130 | 0.851 | 0.03 | 0.32% | €75 | 6.64% | 90% |
| Bootstrap Struggle | €730 | €1.093 | 0.668 | 0.01 | 0.12% | €84 | 7.69% | 90% |
| Aggressive Marketing | €905 | €1.212 | 0.746 | 0.02 | 0.17% | €84 | 6.9% | 90% |
| Scandal Recovery | €713 | €1.075 | 0.664 | 0.04 | 0.43% | €84 | 7.84% | 90% |
| Festival Push | €824 | €1.194 | 0.69 | 0.01 | 0.13% | €89 | 7.43% | 90% |
| Chaos Tour | €841 | €1.142 | 0.737 | 0.02 | 0.25% | €81 | 7.06% | 90% |
| Cult Hypergrowth | €906 | €1.218 | 0.743 | 0.02 | 0.19% | €85 | 6.96% | 90% |
| No Social (Fame 0-50) | €811 | €1.101 | 0.737 | 0.02 | 0.19% | €80 | 7.26% | 90% |
| High Controversy | €559 | €857 | 0.652 | 0.11 | 1.34% | €74 | 8.64% | 90% |
| Early Game Probe (Fame 0–50) | €814 | €1.106 | 0.736 | 0.02 | 0.17% | €80 | 7.22% | 90% |
| Mid Game Probe (Fame 60–150) | €853 | €1.141 | 0.747 | 0.03 | 0.28% | €88 | 7.67% | 90% |
| Late Game Probe (Fame 175+) | €1.008 | €1.169 | 0.863 | 0.04 | 0.35% | €99 | 8.47% | 90% |

„Katalog < 1 Gig“ ist der Anteil der 10 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien gilt: Stamina 16 unterschreitet die Marke 35; Mood 34 unterschreitet die Marke 50. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Ruhetage treten in 12 von 12 Szenarien überhaupt auf (High Controversy 1.34%, Scandal Recovery 0.43%, Late Game Probe (Fame 175+) 0.35%, Baseline Touring 0.32%, Mid Game Probe (Fame 60–150) 0.28%, Chaos Tour 0.25%, Cult Hypergrowth 0.19%, No Social (Fame 0-50) 0.19%, Aggressive Marketing 0.17%, Early Game Probe (Fame 0–50) 0.17%, Festival Push 0.13%, Bootstrap Struggle 0.12%); nennenswert ist der Anteil nur bei High Controversy, alle übrigen liegen im Promillebereich. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 2000 / €6.964 | 1931 / €7.213 | 69 / €0 |
| Bootstrap Struggle | 2000 / €4.470 | 1689 / €5.293 | 311 / €0 |
| Aggressive Marketing | 2000 / €6.506 | 1903 / €6.838 | 97 / €0 |
| Scandal Recovery | 2000 / €4.267 | 1658 / €5.147 | 342 / €0 |
| Festival Push | 2000 / €5.834 | 1875 / €6.223 | 125 / €0 |
| Chaos Tour | 2000 / €5.479 | 1849 / €5.926 | 151 / €0 |
| Cult Hypergrowth | 2000 / €6.704 | 1918 / €6.991 | 82 / €0 |
| No Social (Fame 0-50) | 2000 / €5.309 | 1819 / €5.837 | 181 / €0 |
| High Controversy | 2000 / €2.501 | 1152 / €4.343 | 848 / €0 |
| Early Game Probe (Fame 0–50) | 2000 / €5.262 | 1796 / €5.860 | 204 / €0 |
| Mid Game Probe (Fame 60–150) | 2000 / €6.898 | 1994 / €6.919 | 6 / €0 |
| Late Game Probe (Fame 175+) | 2000 / €11.264 | 1998 / €11.275 | 2 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €1.886 | 0.2708 | 17.93% | 38.44% |
| Bootstrap Struggle | €2.318 | 0.5186 | 39.38% | 91.00% |
| Aggressive Marketing | €2.123 | 0.3263 | 25.08% | 48.98% |
| Scandal Recovery | €2.347 | 0.55 | 40.29% | 91.42% |
| Festival Push | €2.186 | 0.3747 | 30.02% | 57.31% |
| Chaos Tour | €2.075 | 0.3787 | 28.90% | 57.67% |
| Cult Hypergrowth | €2.075 | 0.3095 | 23.96% | 46.00% |
| No Social (Fame 0-50) | €2.132 | 0.4016 | 30.29% | 65.39% |
| High Controversy | €2.388 | 0.9548 | 56.97% | 96.19% |
| Early Game Probe (Fame 0–50) | €2.213 | 0.4206 | 31.46% | 77.81% |
| Mid Game Probe (Fame 60–150) | €1.547 | 0.2243 | 17.62% | 32.29% |
| Late Game Probe (Fame 175+) | €1.876 | 0.1665 | 8.86% | 18.01% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 204 |
| brandDealsAvailable | 54 |
| postOptionsAvailable | 37 |
| contrabandItemsAvailable | 38 |
| upgradesAvailable | 28 |
| socialPlatformsAvailable | 4 |
| trendsAvailable | 5 |
| songsAvailable | 7 |
| questsAvailable | 43 |
| assetChassisAvailable | 24 |
| assetModulesAvailable | 66 |
| loanProfilesAvailable | 5 |

## Ausführungsabdeckung (Coverage)

*Note: `Covered` is true when a feature has any evaluation, activation, or observed ID. It does not require all possible catalog IDs to be seen.*

| Feature | Covered | Evaluations / Attempts | Activations / Completions | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 205377 | 1037 | 40 |
| postOptions | ✅ | 27791 | 27791 | 28 |
| socialTrends | ✅ | 226624 | 27365 | 5 |
| contraband | ✅ | 226624 | 24916 | 38 |
| minigamesTravel | ✅ | 222710 | 130597 | - |
| minigamesRoadie | ✅ | 56328 | 50132 | - |
| minigamesKabelsalat | ✅ | 56476 | 39395 | - |
| minigamesAmp | ✅ | 56317 | 39074 | - |
| sponsorship | ✅ | 207607 | 880 | - |
| restStops | ✅ | 226624 | 45 | - |
| eventTriggers.travel | ✅ | 222710 | 6994 | - |
| eventTriggers.preGig | ✅ | 169121 | 168568 | - |
| eventTriggers.gigMoments | ✅ | 169121 | 22440 | - |
| eventTriggers.postGig | ✅ | 169121 | 168887 | - |
| quests | ✅ | offers: 92880 (u:29) | acts: 46758 (u:28), comp: 1247 (u:8) | 43 in registry |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 3.45% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €6.964 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1894.83 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 15.55% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €4.470 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1799.6 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 4.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €6.506 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1927.33 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 17.1% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €4.267 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1854.44 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 6.25% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €13.000 – €43.000 | €5.834 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 2084.82 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 7.55% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €5.479 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1718.28 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 4.1% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €6.704 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1919.03 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | Insolvenzrate | ≤ 15% | 9.05% | ✅ | Akzeptabel – innerhalb Toleranz. |
| No Social (Fame 0-50) | Endgeld | €10.000 – €40.000 | €5.309 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| No Social (Fame 0-50) | Fame-Fortschritt/Gig | 1000 – 2200 | 1841.27 | ✅ | Im Zielband – leicht außermittig. |
| High Controversy | Insolvenzrate | ≤ 45% | 42.4% | ✅ | Akzeptabel – innerhalb Toleranz. |
| High Controversy | Endgeld | €5.000 – €35.000 | €2.501 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| High Controversy | Fame-Fortschritt/Gig | 1000 – 2200 | 1834.85 | ✅ | Im Zielband – leicht außermittig. |
| Early Game Probe (Fame 0–50) | Insolvenzrate | ≤ 12% | 10.2% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Early Game Probe (Fame 0–50) | Endgeld | €10.000 – €35.000 | €5.262 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Early Game Probe (Fame 0–50) | Fame-Fortschritt/Gig | 1000 – 2200 | 1840.48 | ✅ | Im Zielband – leicht außermittig. |
| Mid Game Probe (Fame 60–150) | Insolvenzrate | ≤ 5% | 0.3% | ✅ | Solide – deutlich unter Risikogrenze. |
| Mid Game Probe (Fame 60–150) | Endgeld | €15.000 – €50.000 | €6.898 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Mid Game Probe (Fame 60–150) | Fame-Fortschritt/Gig | 1000 – 2200 | 1868.61 | ✅ | Im Zielband – leicht außermittig. |
| Late Game Probe (Fame 175+) | Insolvenzrate | ≤ 5% | 0.1% | ✅ | Solide – deutlich unter Risikogrenze. |
| Late Game Probe (Fame 175+) | Endgeld | €20.000 – €80.000 | €11.264 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Late Game Probe (Fame 175+) | Fame-Fortschritt/Gig | 1000 – 2200 | 1909.06 | ✅ | Im Zielband – leicht außermittig. |

## Alt/Neu-Vergleich der vollständigen Simulationsreports

Dieser Vergleich ist **deskriptiv und ungepaart**; die Deltas sind keine gepaarten Effektschätzungen.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Fingerprint | `9eabbdd9e5f21f618987382b0bbe2fe101f1482ea92434c8659e72e4b5418f88` | `b9ed068a8aeaef3f2d0a309cfb4a2d9a26152995022ea943311e52d497555bb8` |
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

- Höchstes Risiko: **High Controversy** mit 42.4% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €11.264 Endgeld.
- Ereignisdichte: **Late Game Probe (Fame 175+)** mit Ø 19.54 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 0
- Fehlgeschlagen: 12
- Nicht bewertet: 0

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 12/12 Szenarien unter ihrer harten Insolvenzgrenze; 0 ohne Korridorurteil.
- ✅ Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: bestanden.
- Risikobänder (Gesamtstatus je Szenario, alle Metriken): healthy 8 · low_risk 3 · high_risk 1.
- Risikobänder (nur Insolvenz-Korridor, wie in der Tabelle): healthy 9 · low_risk 1 · high_risk 2.
- ⚠️ 7 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Scandal Recovery (Endgeld) · Festival Push (Endgeld) · Chaos Tour (Endgeld) · Cult Hypergrowth (Endgeld) · No Social (Fame 0-50) (Endgeld) · High Controversy (Endgeld) · Early Game Probe (Fame 0–50) (Endgeld) · Mid Game Probe (Fame 60–150) (Endgeld) · Late Game Probe (Fame 175+) (Endgeld)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
