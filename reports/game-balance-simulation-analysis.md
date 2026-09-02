# Game Balance Simulation – Analyse

Erstellt am: 2026-09-02T13:44:53.732Z

## Reproduzierbarkeit

- Report-Version: 14
- Source-Fingerprint: 55c274d8b3970592227029676dc0ca4087cb397317e2daa6c73e0fc3a3575609
- Generator-Fingerprint: c58f8abfc9bae59e350caf9e327d68f665651dbb860aab0ee0778b66d9212261
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
| Events gesamt | 170 |
| Brand Deals | 54 |
| Post Options | 36 |
| Contraband-Items | 37 |
| Upgrade-Katalog | 28 |
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
| transport | 29 | travel, random |
| band | 62 | random, travel, post_gig |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 26 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €35.633 | 17.29% | 0.04 | 3% | 11341 | 7 | 57 | 6.04 | 8.45 | 0.08 | 1.95% | €4.895 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €28.064 | 29.75% | 0.04 | 1.1% | 7549 | 6 | 48 | 5.11 | 6.47 | 0.03 | 9.5% | €4.586 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €39.564 | 22.29% | 0.03 | 7% | 10071 | 7 | 59 | 4.95 | 7.38 | 0.04 | 2.85% | €6.216 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €28.803 | 30.02% | 0.04 | 2.1% | 7941 | 6 | 52 | 44.32 | 6.52 | 0.05 | 9.1% | €4.704 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €36.590 | 24.92% | 0.03 | 6.4% | 9557 | 6 | 61 | 4.8 | 6.83 | 0.02 | 3.85% | €6.044 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €34.106 | 21.95% | 0.04 | 2.4% | 8123 | 6 | 41 | 6.04 | 7.26 | 0.05 | 4.55% | €5.261 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €40.629 | 22.56% | 0.03 | 7.9% | 9855 | 7 | 62 | 4.63 | 7.34 | 0.02 | 2.8% | €6.405 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €29.489 | 23.55% | 0.04 | 0.8% | 8958 | 6 | 52 | 0.51 | 7.25 | 0.03 | 5.1% | €4.505 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €17.108 | 45.48% | 0.06 | 0.3% | 7356 | 6 | 50 | 58.13 | 5.79 | 0.23 | 30.1% | €2.637 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €29.961 | 24.01% | 0.04 | 1.2% | 8775 | 6 | 51 | 5.66 | 7.19 | 0.04 | 6.35% | €4.559 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €34.309 | 17.2% | 0.04 | 2.3% | 9197 | 6 | 51 | 6.51 | 7.51 | 0.06 | 0.05% | €5.232 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €41.189 | 22% | 0.03 | 5% | 12055 | 7 | 62 | 5.6 | 8.63 | 0.06 | 0.2% | €5.532 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €35.728 | €484 | €4.895 | 0.12 | 0.05 | 10.95 | 1.26 | 1.27 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €28.166 | €447 | €4.586 | 0.1 | 0.05 | 10.22 | 0.92 | 1.3 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Aggressive Marketing | €39.679 | €480 | €6.216 | 0.11 | 0.05 | 11.02 | 1.23 | 1.34 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €28.896 | €446 | €4.704 | 0.07 | 0.04 | 10.24 | 1.14 | 1.4 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Festival Push | €36.668 | €475 | €6.044 | 0.1 | 0.05 | 10.79 | 1.23 | 1.19 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €34.235 | €470 | €5.261 | 0.1 | 0.05 | 10.72 | 1.1 | 1.23 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €40.718 | €480 | €6.405 | 0.11 | 0.05 | 10.96 | 1.18 | 1.14 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €29.556 | €466 | €4.505 | 0 | 0 | 10.59 | 1.17 | 1.32 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| High Controversy | €17.381 | €346 | €2.637 | 0.07 | 0.04 | 8.5 | 0.88 | 0.99 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €30.056 | €462 | €4.559 | 0.08 | 0.05 | 10.51 | 1.15 | 1.41 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Mid Game Probe (Fame 60–150) | €34.400 | €1.464 | €5.232 | 0.1 | 0.05 | 11.22 | 1.23 | 1.5 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €41.344 | €4.895 | €5.532 | 0.12 | 0.06 | 11.5 | 1.25 | 1.23 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-first-income-full-report-namespace-plus-holdout-marker-plus-run-index`, 2000 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 1.95% ✅ | 2.35% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €35.633 ✅ | €35.533 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1889.32 ✅ | 1883.07 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 9.5% ✅ | 8.65% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €28.064 ✅ | €28.088 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1812.74 ✅ | 1804.61 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 2.85% ✅ | 3.4% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €39.564 ✅ | €39.457 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1965.56 ✅ | 1954.29 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 9.1% ✅ | 8.6% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €28.803 ✅ | €28.547 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1848.42 ✅ | 1852.72 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 3.85% ✅ | 4.65% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €36.590 ✅ | €36.296 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 2060.31 ✅ | 2046.77 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 4.55% ✅ | 4% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €34.106 ✅ | €34.394 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1711.73 ✅ | 1759.54 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 2.8% ✅ | 2.65% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €40.629 ✅ | €40.409 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1945.54 ✅ | 1938.12 ✅ | ✅ |
| no_social_probe | Insolvenzrate | ≤ 15% | 5.1% ✅ | 4.9% ✅ | ✅ |
| no_social_probe | Endgeld | €10.000 – €40.000 | €29.489 ✅ | €29.378 ✅ | ✅ |
| no_social_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1834.53 ✅ | 1821.9 ✅ | ✅ |
| high_controversy_probe | Insolvenzrate | ≤ 40% | 30.1% ✅ | 28.65% ✅ | ✅ |
| high_controversy_probe | Endgeld | €5.000 – €35.000 | €17.108 ✅ | €16.956 ✅ | ✅ |
| high_controversy_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1822.33 ✅ | 1789.52 ✅ | ✅ |
| early_game_probe | Insolvenzrate | ≤ 12% | 6.35% ✅ | 6.55% ✅ | ✅ |
| early_game_probe | Endgeld | €10.000 – €35.000 | €29.961 ✅ | €29.669 ✅ | ✅ |
| early_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1824.91 ✅ | 1811.49 ✅ | ✅ |
| mid_game_probe | Insolvenzrate | ≤ 5% | 0.05% ✅ | 0.25% ✅ | ✅ |
| mid_game_probe | Endgeld | €15.000 – €50.000 | €34.309 ✅ | €34.441 ✅ | ✅ |
| mid_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1861 ✅ | 1861.14 ✅ | ✅ |
| late_game_probe | Insolvenzrate | ≤ 5% | 0.2% ✅ | 0.1% ✅ | ✅ |
| late_game_probe | Endgeld | €20.000 – €80.000 | €41.189 ✅ | €41.017 ✅ | ✅ |
| late_game_probe | Fame-Fortschritt/Gig | 1000 – 2200 | 1954.4 ✅ | 1942.55 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Harte Sicherheitsgrenzen (Holdout)

Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.

Abdeckung: 12 von 12 Szenarien mit konfigurierter Obergrenze gemessen. Fehlende Abdeckung ist selbst ein Fehlschlag — ein Gate, das nur einen Teil der harten Grenzen prüft, sagt über die übrigen nichts aus.

✅ Alle 12 geprüften Szenarien bleiben auf unabhängigen Seeds unter ihrer harten Grenze.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €2.929 | €6.214 | €8.375 | €35.633 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.943 | €3.697 | €5.238 | €28.064 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €3.042 | €6.442 | €8.675 | €39.564 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €1.935 | €4.100 | €5.075 | €28.803 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €2.858 | €6.165 | €7.695 | €36.590 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €2.359 | €4.957 | €6.694 | €34.106 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €3.125 | €6.680 | €8.913 | €40.629 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €2.007 | €4.275 | €5.831 | €29.489 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €1.024 | €1.783 | €2.288 | €17.108 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €2.066 | €4.363 | €5.933 | €29.961 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.252 | €6.011 | €7.807 | €34.309 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.800 | €11.203 | €13.158 | €41.189 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.895 | €91 | 54.6× | 2.55 | null | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €4.586 | €101 | 48.4× | 2.73 | null | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €6.216 | €103 | 60.8× | 2.01 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €4.704 | €101 | 49.4× | 2.66 | null | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €6.044 | €109 | 56.4× | 2.07 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Chaos Tour | €5.261 | €98 | 54.8× | 2.38 | null | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €6.405 | €105 | 62× | 1.95 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| No Social (Fame 0-50) | €4.505 | €96 | 48.3× | 2.77 | null | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.637 | €84 | 40.3× | 4.74 | null | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €4.559 | €96 | 49.3× | 2.74 | null | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €5.232 | €103 | 50.3× | 2.39 | null | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €5.532 | €104 | 52.7× | 2.26 | null | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 5.6 | 66 | 7% | 53.1% | 39.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.4 | 62 | 14.7% | 60.2% | 25.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.3 | 68 | 4.7% | 48.2% | 47.1% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Scandal Recovery | 157 | 6.1 | 64 | 10.7% | 58.5% | 30.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 4.5 | 73 | 2% | 35.7% | 62.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 59 | 20.5% | 59.3% | 20.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 5.3 | 68 | 4.3% | 49.3% | 46.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| No Social (Fame 0-50) | 152 | 6.1 | 64 | 11.1% | 58% | 30.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 6.5 | 63 | 15.6% | 59.1% | 25.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.2 | 63 | 11.8% | 58.5% | 29.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.2 | 64 | 11.2% | 60.4% | 28.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 5.5 | 68 | 5.8% | 52.3% | 41.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 57 | 0.08 | 0.05 | 0.01 | 1.05 | 1.56 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Bootstrap Struggle | 48 | 0.03 | 0.04 | 0.01 | 1.03 | 1.19 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 59 | 0.04 | 0.05 | 0.01 | 1.07 | 1.32 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 52 | 0.05 | 0.04 | 0 | 1.04 | 1.18 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 61 | 0.02 | 0.04 | 0 | 1.07 | 1.22 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 41 | 0.05 | 0.04 | 0.01 | 1.06 | 1.33 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 62 | 0.02 | 0.04 | 0 | 1.08 | 1.32 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 52 | 0.03 | 0 | 0 | 1.1 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | 0.23 | 0.03 | 0 | 0.87 | 1.02 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 51 | 0.04 | 0.04 | 0 | 1.06 | 1.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 51 | 0.06 | 0.04 | 0.01 | 1.08 | 1.41 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 62 | 0.06 | 0.05 | 0.01 | 1.13 | 1.54 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.45 | 7.68 | 9.37 | 0.2 | 0.76 | 1.2 | 11.59 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Bootstrap Struggle | 0.35 | 6.28 | 7.16 | 0.25 | 0.81 | 1.18 | 10.82 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Aggressive Marketing | 0.44 | 7.07 | 8.37 | 0.35 | 1.16 | 1.16 | 11.64 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Scandal Recovery | 0.41 | 6.5 | 7.46 | 0.4 | 1.17 | 1.17 | 10.83 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Festival Push | 0.34 | 6.5 | 7.52 | 0.23 | 0.66 | 1.16 | 11.44 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Chaos Tour | 0.54 | 7.18 | 8.35 | 0.54 | 1.68 | 1.21 | 11.32 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 0.44 | 7 | 8.26 | 0.32 | 1.01 | 1.18 | 11.59 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| No Social (Fame 0-50) | 0.39 | 6.88 | 8.07 | 0.28 | 0.92 | 1.14 | 11.2 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| High Controversy | 0.28 | 5.68 | 6.33 | 0.23 | 0.72 | 0.94 | 9.09 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Early Game Probe (Fame 0–50) | 0.34 | 6.68 | 7.86 | 0.17 | 0.54 | 1.17 | 11.13 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Mid Game Probe (Fame 60–150) | 0.36 | 7.07 | 8.28 | 0.23 | 0.76 | 1.2 | 11.85 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Late Game Probe (Fame 175+) | 0.47 | 7.99 | 9.69 | 0.31 | 1.05 | 1.21 | 12.15 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.8 | 2.83 | 2.8 | 2.81 | 18.24 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Bootstrap Struggle | 9.32 | 2.18 | 2.15 | 2.15 | 15.8 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Aggressive Marketing | 9.77 | 2.45 | 2.47 | 2.46 | 17.15 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Scandal Recovery | 9.31 | 2.19 | 2.17 | 2.16 | 15.83 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Festival Push | 9.71 | 2.3 | 2.27 | 2.26 | 16.54 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Chaos Tour | 9.63 | 2.37 | 2.45 | 2.44 | 16.89 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Cult Hypergrowth | 9.77 | 2.43 | 2.45 | 2.46 | 17.11 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| No Social (Fame 0-50) | 9.61 | 2.44 | 2.4 | 2.4 | 16.85 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| High Controversy | 7.65 | 1.95 | 1.9 | 1.94 | 13.44 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Early Game Probe (Fame 0–50) | 9.52 | 2.4 | 2.4 | 2.38 | 16.7 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Mid Game Probe (Fame 60–150) | 9.97 | 2.5 | 2.53 | 2.48 | 17.48 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Late Game Probe (Fame 175+) | 9.97 | 2.88 | 2.86 | 2.89 | 18.6 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.37 | 0.17 | 0.14 | 0.32 | 0.37 | 2.21 | €25 | 0 | 98.8% |
| Bootstrap Struggle | 0.22 | 0.12 | 0.06 | 0.3 | 0.22 | 1.8 | €9 | 0 | 96% |
| Aggressive Marketing | 0.42 | 0.19 | 0.18 | 0.34 | 0.42 | 1.61 | €12 | 0 | 98.6% |
| Scandal Recovery | 0.22 | 0.11 | 0.07 | 0.3 | 0.22 | 1.82 | €17 | 0 | 97.3% |
| Festival Push | 0.36 | 0.15 | 0.14 | 0.33 | 0.36 | 1.17 | €8 | 0 | 98.8% |
| Chaos Tour | 0.33 | 0.16 | 0.14 | 0.32 | 0.33 | 1.49 | €16 | 0 | 96.5% |
| Cult Hypergrowth | 0.44 | 0.18 | 0.18 | 0.32 | 0.44 | 2.1 | €6 | 0 | 98.3% |
| No Social (Fame 0-50) | 0.27 | 0.13 | 0.08 | 0.33 | 0.27 | 1.53 | €10 | 0 | 97.5% |
| High Controversy | 0.08 | 0.04 | 0.02 | 0.28 | 0.08 | 1.6 | €79 | 0.01 | 95% |
| Early Game Probe (Fame 0–50) | 0.26 | 0.12 | 0.08 | 0.33 | 0.26 | 1.93 | €12 | 0 | 97.3% |
| Mid Game Probe (Fame 60–150) | 0.37 | 0.17 | 0.15 | 0.33 | 0.37 | 1.99 | €18 | 0 | 99.5% |
| Late Game Probe (Fame 175+) | 0.71 | 0.3 | 0.37 | 0.32 | 0.71 | 2.23 | €18 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €41.189 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 12055 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 30.1% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €6.405 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €41.344 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.63 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Late Game Probe (Fame 175+)** | 19.50 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 16081 | 4735 | 0 | 4735 | 5 | 0 | 2000/2000 |
| Bootstrap Struggle | 11801 | 4248 | 0 | 4248 | 4 | 0 | 2000/2000 |
| Aggressive Marketing | 14660 | 4584 | 0 | 4584 | 4 | 0 | 2000/2000 |
| Scandal Recovery | 12132 | 4187 | 0 | 4187 | 4 | 0 | 2000/2000 |
| Festival Push | 14138 | 4577 | 0 | 4577 | 4 | 0 | 2000/2000 |
| Chaos Tour | 12564 | 4435 | 0 | 4435 | 6 | 0 | 2000/2000 |
| Cult Hypergrowth | 14445 | 4586 | 0 | 4586 | 4 | 0 | 2000/2000 |
| No Social (Fame 0-50) | 13413 | 4450 | 0 | 4450 | 5 | 0 | 2000/2000 |
| High Controversy | 10479 | 3118 | 0 | 3118 | 5 | 0 | 2000/2000 |
| Early Game Probe (Fame 0–50) | 13269 | 4490 | 0 | 4490 | 5 | 0 | 2000/2000 |
| Mid Game Probe (Fame 60–150) | 13938 | 4797 | 0 | 4797 | 5 | 0 | 2000/2000 |
| Late Game Probe (Fame 175+) | 16816 | 4930 | 0 | 4930 | 5 | 0 | 2000/2000 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €35.633 | €36.733 | €9.766 | €24.992 | €46.514 |
| Bootstrap Struggle | €28.064 | €29.655 | €11.292 | €11.082 | €39.773 |
| Aggressive Marketing | €39.564 | €41.126 | €10.484 | €29.566 | €49.551 |
| Scandal Recovery | €28.803 | €30.937 | €11.784 | €10.098 | €41.186 |
| Festival Push | €36.590 | €38.329 | €10.862 | €25.285 | €47.281 |
| Chaos Tour | €34.106 | €36.654 | €10.863 | €22.120 | €44.484 |
| Cult Hypergrowth | €40.629 | €41.918 | €10.266 | €31.071 | €50.474 |
| No Social (Fame 0-50) | €29.489 | €30.136 | €9.433 | €21.388 | €39.607 |
| High Controversy | €17.108 | €21.121 | €13.185 | €0 | €32.983 |
| Early Game Probe (Fame 0–50) | €29.961 | €31.192 | €10.300 | €20.569 | €40.766 |
| Mid Game Probe (Fame 60–150) | €34.309 | €34.299 | €8.374 | €24.739 | €44.811 |
| Late Game Probe (Fame 175+) | €41.189 | €41.498 | €9.358 | €29.407 | €52.385 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 39 | 2000 | 1.95% | 1.43% | 2.65% |
| Bootstrap Struggle | 190 | 2000 | 9.50% | 8.29% | 10.86% |
| Aggressive Marketing | 57 | 2000 | 2.85% | 2.21% | 3.67% |
| Scandal Recovery | 182 | 2000 | 9.10% | 7.92% | 10.44% |
| Festival Push | 77 | 2000 | 3.85% | 3.09% | 4.79% |
| Chaos Tour | 91 | 2000 | 4.55% | 3.72% | 5.55% |
| Cult Hypergrowth | 56 | 2000 | 2.80% | 2.16% | 3.62% |
| No Social (Fame 0-50) | 102 | 2000 | 5.10% | 4.22% | 6.15% |
| High Controversy | 602 | 2000 | 30.10% | 28.13% | 32.15% |
| Early Game Probe (Fame 0–50) | 127 | 2000 | 6.35% | 5.36% | 7.50% |
| Mid Game Probe (Fame 60–150) | 1 | 2000 | 0.05% | 0.01% | 0.28% |
| Late Game Probe (Fame 175+) | 4 | 2000 | 0.20% | 0.08% | 0.51% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 1.95% | 1–5% | 10% | 1.43–2.65% | contained | within_target | within_target | stable | 🟢 healthy |
| Bootstrap Struggle | 9.50% | 15–30% | 60% | 8.29–10.86% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Aggressive Marketing | 2.85% | 2–8% | 15% | 2.21–3.67% | contained | within_target | within_target | stable | 🟢 healthy |
| Scandal Recovery | 9.10% | 8–20% | 50% | 7.92–10.44% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Festival Push | 3.85% | 5–15% | 35% | 3.09–4.79% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Chaos Tour | 4.55% | 8–20% | 25% | 3.72–5.55% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 2.80% | 2–10% | 12% | 2.16–3.62% | contained | within_target | within_target | stable | 🟢 healthy |
| No Social (Fame 0-50) | 5.10% | 2–12% | 15% | 4.22–6.15% | contained | within_target | within_target | stable | 🟢 healthy |
| High Controversy | 30.10% | 20–35% | 40% | 28.13–32.15% | contained | within_target | within_target | stable | 🟢 healthy |
| Early Game Probe (Fame 0–50) | 6.35% | 2–10% | 12% | 5.36–7.50% | contained | within_target | within_target | stable | 🟢 healthy |
| Mid Game Probe (Fame 60–150) | 0.05% | 0–4% | 5% | 0.01–0.28% | contained | within_target | within_target | stable | 🟢 healthy |
| Late Game Probe (Fame 175+) | 0.20% | 0–4% | 5% | 0.08–0.51% | contained | within_target | within_target | stable | 🟢 healthy |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ bootstrap_struggle: Insolvenzrate (Kalibrierung 9.5%, Holdout 8.65%) liegt unter dem Zielkorridor 15–30% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ festival_push: Insolvenzrate (Kalibrierung 3.85%, Holdout 4.65%) liegt unter dem Zielkorridor 5–15% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate (Kalibrierung 4.55%, Holdout 4%) liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1.95% | 7.55% | 2.25% | 0.05% | 0.11 | 9.88% | 46.2% | €25.925 | 4 | 16.1% |
| Bootstrap Struggle | 9.5% | 19.95% | 9.7% | 0.05% | 0.38 | 21.83% | 74.6% | €22.779 | 5 | 11.3% |
| Aggressive Marketing | 2.85% | 8.15% | 3.35% | 0% | 0.13 | 14.44% | 51.68% | €30.916 | 4 | 17.9% |
| Scandal Recovery | 9.1% | 20.95% | 9.55% | 0.05% | 0.4 | 22.17% | 75.52% | €21.995 | 5 | 10.85% |
| Festival Push | 3.85% | 10.1% | 4.25% | 0.05% | 0.17 | 17.79% | 55.13% | €27.586 | 5 | 14.8% |
| Chaos Tour | 4.55% | 12.25% | 5.15% | 0% | 0.21 | 14.83% | 48.92% | €25.428 | 5 | 14.45% |
| Cult Hypergrowth | 2.8% | 7.7% | 3.1% | 0% | 0.13 | 14.74% | 52.49% | €32.701 | 4 | 17.25% |
| No Social (Fame 0-50) | 5.1% | 15.1% | 5.3% | 0.05% | 0.25 | 16.25% | 52.04% | €23.576 | 5 | 12.2% |
| High Controversy | 30.1% | 52.25% | 30.15% | 0.15% | 1.12 | 33.43% | 94.52% | €12.351 | 5 | 4.2% |
| Early Game Probe (Fame 0–50) | 6.35% | 15.15% | 6.55% | 0% | 0.27 | 16.85% | 51.98% | €24.049 | 5 | 11.9% |
| Mid Game Probe (Fame 60–150) | 0.05% | 0.15% | 0.15% | 0% | 0 | 11.95% | 38.66% | €24.765 | 7 | 16.1% |
| Late Game Probe (Fame 175+) | 0.2% | 0.2% | 0.2% | 0% | 0 | 11.33% | 55.72% | €29.590 | 8.5 | 26.85% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zur Lesart der beiden Schwellen: „je < €500“ trennt die Szenarien inzwischen deutlich (0.15% bis 52.25%) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens 0.15%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

„Finale erreicht“ und „Finale gespielt“ sind absichtlich zwei Spalten: die erste zählt die Ankunft am FINALE-Knoten, die zweite die tatsächlich absolvierte Show. Ein bei niedriger Harmony abgesagtes Finale steht deshalb in der ersten, aber nicht in der zweiten Spalte — eine Ankunft ist kein Beweis, dass gespielt wurde.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Baseline Touring | 8.45 | 9.8 | 9.8 | 94.65% | 94.55% | 1.35 | 0.03 | 0.03/0/0 | 0.1 | 0 |
| Bootstrap Struggle | 6.47 | 9.32 | 9.32 | 88.9% | 88.75% | 2.84 | 0.13 | 0.13/0/0 | 0.18 | 0 |
| Aggressive Marketing | 7.38 | 9.77 | 9.77 | 95.1% | 95.1% | 2.38 | 0.04 | 0.04/0/0 | 0.15 | 0 |
| Scandal Recovery | 6.52 | 9.31 | 9.31 | 88.45% | 88.25% | 2.78 | 0.12 | 0.12/0/0 | 0.17 | 0 |
| Festival Push | 6.83 | 9.71 | 9.71 | 94.7% | 94.65% | 2.89 | 0.05 | 0.05/0/0 | 0.07 | 0 |
| Chaos Tour | 7.26 | 9.63 | 9.63 | 92.85% | 91.75% | 2.34 | 0.06 | 0.06/0/0 | 0.4 | 0 |
| Cult Hypergrowth | 7.34 | 9.77 | 9.77 | 96.1% | 96% | 2.42 | 0.04 | 0.04/0/0 | 0.17 | 0 |
| No Social (Fame 0-50) | 7.25 | 9.61 | 9.61 | 93.65% | 93.4% | 2.36 | 0.07 | 0.07/0/0 | 0.23 | 0 |
| High Controversy | 5.79 | 7.65 | 7.65 | 61.75% | 61.25% | 1.85 | 0.4 | 0.4/0/0 | 0.19 | 0 |
| Early Game Probe (Fame 0–50) | 7.19 | 9.52 | 9.52 | 91.7% | 91.65% | 2.32 | 0.08 | 0.08/0/0 | 0.19 | 0 |
| Mid Game Probe (Fame 60–150) | 7.51 | 9.97 | 9.97 | 97.15% | 96.95% | 2.45 | 0 | 0/0/0 | 0.13 | 0 |
| Late Game Probe (Fame 175+) | 8.63 | 9.97 | 9.97 | 97.25% | 97.25% | 1.34 | 0 | 0/0/0 | 0.09 | 0 |

Knotentypen über alle Ankünfte: GIG 67.43% · FINALE 9.66% · FESTIVAL 9.1% · SPECIAL 4.83% · SUPPLY_STOP 4.49% · REST_STOP 4.49% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 94.65%, Bootstrap Struggle 88.9%, Aggressive Marketing 95.1%, Scandal Recovery 88.45%, Festival Push 94.7%, Chaos Tour 92.85%, Cult Hypergrowth 96.1%, No Social (Fame 0-50) 93.65%, High Controversy 61.75%, Early Game Probe (Fame 0–50) 91.7%, Mid Game Probe (Fame 60–150) 97.15%, Late Game Probe (Fame 175+) 97.25%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da 86.19% der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 28 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 99.05% | 2 | 100% | 1 | 10.34 | 36.94% | HQ | €6.484,77 | €5.667,5 | 1.06 | 0.1 | 1.17 | 23.21 |
| Bootstrap Struggle | 1 | 98.3% | 2 | 100% | 1 | 9.77 | 34.89% | HQ | €4.115,6 | €3.831,84 | 1.24 | 0.12 | 1.98 | 22.41 |
| Aggressive Marketing | 1 | 98.7% | 2 | 100% | 1 | 10.35 | 36.98% | HQ | €6.909,29 | €5.958,64 | 1.11 | 0.11 | 1.42 | 22.96 |
| Scandal Recovery | 1 | 98.55% | 2 | 100% | 1 | 9.71 | 34.69% | HQ | €4.281,95 | €3.971,43 | 1.21 | 0.14 | 1.62 | 22.54 |
| Festival Push | 1 | 99% | 2 | 100% | 1 | 10.22 | 36.51% | HQ | €6.066 | €5.393,29 | 1.15 | 0.1 | 1.29 | 23.08 |
| Chaos Tour | 1 | 98.65% | 2 | 100% | 1 | 10.11 | 36.09% | HQ | €5.311,18 | €4.794,39 | 1.19 | 0.11 | 1.55 | 22.84 |
| Cult Hypergrowth | 1 | 98.4% | 2 | 100% | 1 | 10.35 | 36.98% | HQ | €7.161,27 | €6.167,05 | 1.11 | 0.1 | 1.35 | 23.03 |
| No Social (Fame 0-50) | 1 | 98.8% | 2 | 100% | 1 | 10.06 | 35.94% | HQ | €4.703,13 | €4.307,1 | 1.14 | 0.12 | 1.53 | 22.85 |
| High Controversy | 1 | 97.55% | 2 | 100% | 1 | 8.27 | 29.53% | HQ | €2.641,79 | €2.473,13 | 0.99 | 0.22 | 1.8 | 19.69 |
| Early Game Probe (Fame 0–50) | 1 | 98.4% | 2 | 100% | 1 | 9.99 | 35.69% | HQ | €4.775,18 | €4.388,19 | 1.15 | 0.13 | 1.6 | 22.79 |
| Mid Game Probe (Fame 60–150) | 1 | 99.9% | 2 | 100% | 1 | 10.45 | 37.32% | HQ | €6.524,89 | €5.865,79 | 1.31 | 0.01 | 1.45 | 23.01 |
| Late Game Probe (Fame 175+) | 1 | 99.95% | 2 | 100% | 1 | 10.7 | 38.21% | HQ | €11.979,43 | €10.335,41 | 0.98 | 0.02 | 0.78 | 23.73 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €4.230 | €4.951 | 0.854 | 0.04 | 0.37% | €91 | 1.83% | 90% |
| Bootstrap Struggle | €3.306 | €4.880 | 0.677 | 0.02 | 0.17% | €101 | 2.07% | 90% |
| Aggressive Marketing | €4.712 | €6.289 | 0.749 | 0.02 | 0.2% | €103 | 1.65% | 90% |
| Scandal Recovery | €3.402 | €4.982 | 0.683 | 0.03 | 0.27% | €101 | 2.03% | 90% |
| Festival Push | €4.271 | €6.142 | 0.695 | 0.01 | 0.14% | €109 | 1.77% | 90% |
| Chaos Tour | €4.013 | €5.394 | 0.744 | 0.03 | 0.28% | €98 | 1.83% | 90% |
| Cult Hypergrowth | €4.840 | €6.490 | 0.746 | 0.01 | 0.12% | €105 | 1.61% | 90% |
| No Social (Fame 0-50) | €3.458 | €4.651 | 0.744 | 0.01 | 0.13% | €96 | 2.07% | 90% |
| High Controversy | €2.325 | €3.396 | 0.685 | 0.1 | 1.16% | €84 | 2.48% | 90% |
| Early Game Probe (Fame 0–50) | €3.526 | €4.751 | 0.742 | 0.02 | 0.22% | €96 | 2.03% | 90% |
| Mid Game Probe (Fame 60–150) | €3.894 | €5.182 | 0.752 | 0.03 | 0.29% | €103 | 1.99% | 90% |
| Late Game Probe (Fame 175+) | €4.747 | €5.500 | 0.863 | 0.03 | 0.26% | €104 | 1.9% | 90% |

„Katalog < 1 Gig“ ist der Anteil der 10 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien gilt: Stamina 16 unterschreitet die Marke 35; Mood 35 unterschreitet die Marke 50. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Ruhetage treten in 12 von 12 Szenarien überhaupt auf (High Controversy 1.16%, Baseline Touring 0.37%, Mid Game Probe (Fame 60–150) 0.29%, Chaos Tour 0.28%, Scandal Recovery 0.27%, Late Game Probe (Fame 175+) 0.26%, Early Game Probe (Fame 0–50) 0.22%, Aggressive Marketing 0.2%, Bootstrap Struggle 0.17%, Festival Push 0.14%, No Social (Fame 0-50) 0.13%, Cult Hypergrowth 0.12%); nennenswert ist der Anteil nur bei High Controversy, alle übrigen liegen im Promillebereich. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 2000 / €35.633 | 1961 / €36.342 | 39 / €0 |
| Bootstrap Struggle | 2000 / €28.064 | 1810 / €31.010 | 190 / €0 |
| Aggressive Marketing | 2000 / €39.564 | 1943 / €40.724 | 57 / €0 |
| Scandal Recovery | 2000 / €28.803 | 1818 / €31.687 | 182 / €0 |
| Festival Push | 2000 / €36.590 | 1923 / €38.056 | 77 / €0 |
| Chaos Tour | 2000 / €34.106 | 1909 / €35.731 | 91 / €0 |
| Cult Hypergrowth | 2000 / €40.629 | 1944 / €41.799 | 56 / €0 |
| No Social (Fame 0-50) | 2000 / €29.489 | 1898 / €31.074 | 102 / €0 |
| High Controversy | 2000 / €17.108 | 1398 / €24.475 | 602 / €0 |
| Early Game Probe (Fame 0–50) | 2000 / €29.961 | 1873 / €31.992 | 127 / €0 |
| Mid Game Probe (Fame 60–150) | 2000 / €34.309 | 1999 / €34.326 | 1 / €0 |
| Late Game Probe (Fame 175+) | 2000 / €41.189 | 1996 / €41.272 | 4 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €9.766 | 0.2741 | 17.29% | 46.20% |
| Bootstrap Struggle | €11.292 | 0.4024 | 29.75% | 74.60% |
| Aggressive Marketing | €10.484 | 0.265 | 22.29% | 51.68% |
| Scandal Recovery | €11.784 | 0.4091 | 30.02% | 75.52% |
| Festival Push | €10.862 | 0.2969 | 24.92% | 55.13% |
| Chaos Tour | €10.863 | 0.3185 | 21.95% | 48.92% |
| Cult Hypergrowth | €10.266 | 0.2527 | 22.56% | 52.49% |
| No Social (Fame 0-50) | €9.433 | 0.3199 | 23.55% | 52.04% |
| High Controversy | €13.185 | 0.7707 | 45.48% | 94.52% |
| Early Game Probe (Fame 0–50) | €10.300 | 0.3438 | 24.01% | 51.98% |
| Mid Game Probe (Fame 60–150) | €8.374 | 0.2441 | 17.20% | 38.66% |
| Late Game Probe (Fame 175+) | €9.358 | 0.2272 | 22.00% | 55.72% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 170 |
| brandDealsAvailable | 54 |
| postOptionsAvailable | 36 |
| contrabandItemsAvailable | 37 |
| upgradesAvailable | 28 |
| socialPlatformsAvailable | 4 |
| trendsAvailable | 5 |
| songsAvailable | 7 |
| questsAvailable | 32 |
| assetChassisAvailable | 24 |
| assetModulesAvailable | 63 |
| loanProfilesAvailable | 5 |

## Ausführungsabdeckung (Coverage)

*Note: `Covered` is true when a feature has any evaluation, activation, or observed ID. It does not require all possible catalog IDs to be seen.*

| Feature | Covered | Evaluations / Attempts | Activations / Completions | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 209035 | 1082 | 40 |
| postOptions | ✅ | 28821 | 28821 | 29 |
| socialTrends | ✅ | 230758 | 27833 | 5 |
| contraband | ✅ | 230758 | 25309 | 37 |
| minigamesTravel | ✅ | 228042 | 133502 | - |
| minigamesRoadie | ✅ | 57880 | 51550 | - |
| minigamesKabelsalat | ✅ | 57676 | 40048 | - |
| minigamesAmp | ✅ | 57680 | 40124 | - |
| sponsorship | ✅ | 211373 | 925 | - |
| restStops | ✅ | 230758 | 22 | - |
| eventTriggers.travel | ✅ | 228042 | 7007 | - |
| eventTriggers.preGig | ✅ | 173236 | 172564 | - |
| eventTriggers.gigMoments | ✅ | 173236 | 22448 | - |
| eventTriggers.postGig | ✅ | 173236 | 173061 | - |
| quests | ✅ | offers: 10499 (u:24) | acts: 5294 (u:24), comp: 492 (u:6) | 32 in registry |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 1.95% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €35.633 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1889.32 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 9.5% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €28.064 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1812.74 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 2.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €39.564 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1965.56 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 9.1% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €28.803 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1848.42 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 3.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €13.000 – €43.000 | €36.590 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 2060.31 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.55% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €34.106 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1711.73 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 2.8% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €40.629 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1945.54 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | Insolvenzrate | ≤ 15% | 5.1% | ✅ | Solide – deutlich unter Risikogrenze. |
| No Social (Fame 0-50) | Endgeld | €10.000 – €40.000 | €29.489 | ✅ | Zentral im Zielband – sehr gute Balance. |
| No Social (Fame 0-50) | Fame-Fortschritt/Gig | 1000 – 2200 | 1834.53 | ✅ | Im Zielband – leicht außermittig. |
| High Controversy | Insolvenzrate | ≤ 40% | 30.1% | ✅ | Akzeptabel – innerhalb Toleranz. |
| High Controversy | Endgeld | €5.000 – €35.000 | €17.108 | ✅ | Zentral im Zielband – sehr gute Balance. |
| High Controversy | Fame-Fortschritt/Gig | 1000 – 2200 | 1822.33 | ✅ | Im Zielband – leicht außermittig. |
| Early Game Probe (Fame 0–50) | Insolvenzrate | ≤ 12% | 6.35% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Early Game Probe (Fame 0–50) | Endgeld | €10.000 – €35.000 | €29.961 | ✅ | Im Zielband – leicht außermittig. |
| Early Game Probe (Fame 0–50) | Fame-Fortschritt/Gig | 1000 – 2200 | 1824.91 | ✅ | Im Zielband – leicht außermittig. |
| Mid Game Probe (Fame 60–150) | Insolvenzrate | ≤ 5% | 0.05% | ✅ | Solide – deutlich unter Risikogrenze. |
| Mid Game Probe (Fame 60–150) | Endgeld | €15.000 – €50.000 | €34.309 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Mid Game Probe (Fame 60–150) | Fame-Fortschritt/Gig | 1000 – 2200 | 1861 | ✅ | Im Zielband – leicht außermittig. |
| Late Game Probe (Fame 175+) | Insolvenzrate | ≤ 5% | 0.2% | ✅ | Solide – deutlich unter Risikogrenze. |
| Late Game Probe (Fame 175+) | Endgeld | €20.000 – €80.000 | €41.189 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Late Game Probe (Fame 175+) | Fame-Fortschritt/Gig | 1000 – 2200 | 1954.4 | ✅ | Im Zielband – leicht außermittig. |

## Alt/Neu-Vergleich der vollständigen Simulationsreports

Dieser Vergleich ist **deskriptiv und ungepaart**; die Deltas sind keine gepaarten Effektschätzungen.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Fingerprint | `2859a98e843bdd7ba097d20dd514685351975b2aef7e4041aa79ad0e3233511b` | `55c274d8b3970592227029676dc0ca4087cb397317e2daa6c73e0fc3a3575609` |
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

- Höchstes Risiko: **High Controversy** mit 30.1% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €41.189 Endgeld.
- Ereignisdichte: **Late Game Probe (Fame 175+)** mit Ø 19.50 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 12
- Fehlgeschlagen: 0
- Nicht bewertet: 0

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 12/12 Szenarien unter ihrer harten Insolvenzgrenze; 0 ohne Korridorurteil.
- ✅ Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: bestanden.
- Risikobänder: healthy 9 · low_risk 3.
- ⚠️ 3 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle bewerteten KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
