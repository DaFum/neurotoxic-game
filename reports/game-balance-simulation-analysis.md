# Game Balance Simulation – Analyse

Erstellt am: 2026-08-12T09:33:46.553Z

## Reproduzierbarkeit

- Report-Version: 14
- Source-Fingerprint: 90b4ad237ed2df7bb76e70fa974cf32941daf7c304a86d22dd453ae1745d401a
- Generator-Fingerprint: 73d64bfa6dcc2ff2cccb113dee9309eeef3981c449f5576b1f496ccdd127e514
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
| Events gesamt | 164 |
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
| transport | 26 | travel, random |
| band | 59 | random, post_gig, travel |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 26 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €35.462 | 17.09% | 0.04 | 3% | 11402 | 7 | 59 | 4.84 | 8.48 | 0.08 | 1.95% | €4.909 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €28.178 | 29.55% | 0.04 | 1.2% | 7611 | 6 | 49 | 4.12 | 6.47 | 0.04 | 9.2% | €4.623 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €39.666 | 22.09% | 0.03 | 6.9% | 9902 | 7 | 59 | 4.43 | 7.36 | 0.05 | 2.95% | €6.228 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €28.318 | 30.51% | 0.04 | 2.1% | 7789 | 6 | 53 | 44.15 | 6.49 | 0.1 | 9.65% | €4.637 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €36.728 | 25.25% | 0.03 | 6.2% | 9440 | 6 | 61 | 3.7 | 6.83 | 0.04 | 3.8% | €6.097 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €34.127 | 22.54% | 0.04 | 2.7% | 8078 | 6 | 41 | 4.63 | 7.26 | 0.07 | 4.6% | €5.263 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €40.407 | 22.52% | 0.03 | 7.6% | 9797 | 6 | 61 | 4.63 | 7.34 | 0.05 | 2.95% | €6.340 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €29.294 | 23.29% | 0.04 | 0.7% | 8742 | 6 | 52 | 0 | 7.24 | 0.04 | 5.2% | €4.467 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €17.026 | 45.48% | 0.06 | 0.2% | 6768 | 5 | 50 | 58.59 | 5.82 | 0.29 | 28.85% | €2.623 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €30.046 | 24.06% | 0.04 | 1.4% | 8821 | 6 | 50 | 4.97 | 7.21 | 0.04 | 6.1% | €4.572 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €34.256 | 16.82% | 0.04 | 2.5% | 9282 | 6 | 52 | 5.36 | 7.48 | 0.07 | 0.15% | €5.238 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €40.795 | 21.9% | 0.03 | 4.9% | 11835 | 7 | 61 | 5.5 | 8.6 | 0.09 | 0.2% | €5.504 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €35.565 | €484 | €4.909 | 0.12 | 0.05 | 11.02 | 1.23 | 1.3 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €28.288 | €448 | €4.623 | 0.09 | 0.04 | 10.28 | 0.92 | 1.29 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Aggressive Marketing | €39.782 | €480 | €6.228 | 0.08 | 0.05 | 10.95 | 1.22 | 1.34 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €28.461 | €444 | €4.637 | 0.07 | 0.04 | 10.23 | 1.14 | 1.4 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Festival Push | €36.823 | €476 | €6.097 | 0.07 | 0.04 | 10.82 | 1.22 | 1.19 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €34.246 | €469 | €5.263 | 0.1 | 0.06 | 10.65 | 1.1 | 1.25 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €40.503 | €480 | €6.340 | 0.1 | 0.05 | 10.99 | 1.17 | 1.16 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €29.385 | €466 | €4.467 | 0 | 0 | 10.58 | 1.15 | 1.32 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| High Controversy | €17.296 | €349 | €2.623 | 0.08 | 0.04 | 8.57 | 0.9 | 1 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €30.133 | €463 | €4.572 | 0.09 | 0.05 | 10.51 | 1.15 | 1.4 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Mid Game Probe (Fame 60–150) | €34.337 | €1.463 | €5.238 | 0.11 | 0.05 | 11.25 | 1.23 | 1.48 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €41.056 | €4.896 | €5.504 | 0.1 | 0.06 | 11.47 | 1.25 | 1.24 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-first-income-full-report-namespace-plus-holdout-marker-plus-run-index`, 2000 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 1.95% ✅ | 2.3% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €35.462 ✅ | €35.504 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1891.28 ✅ | 1867.87 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 9.2% ✅ | 8.7% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €28.178 ✅ | €28.370 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1829.51 ✅ | 1809.68 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 2.95% ✅ | 3.3% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €39.666 ✅ | €39.123 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1952.07 ✅ | 1935.37 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 9.65% ✅ | 8.7% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €28.318 ✅ | €28.642 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1850.92 ✅ | 1851.91 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 3.8% ✅ | 4.45% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €36.728 ✅ | €36.551 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 2033.06 ✅ | 2042.97 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 4.6% ✅ | 3.5% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €34.127 ✅ | €34.536 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1715.13 ✅ | 1743.75 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 2.95% ✅ | 2.55% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €40.407 ✅ | €40.834 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1939.33 ✅ | 1937.89 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Harte Sicherheitsgrenzen (Holdout)

Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.

Abdeckung: 7 von 7 Szenarien mit konfigurierter Obergrenze gemessen. Fehlende Abdeckung ist selbst ein Fehlschlag — ein Gate, das nur einen Teil der harten Grenzen prüft, sagt über die übrigen nichts aus.

✅ Alle 7 geprüften Szenarien bleiben auf unabhängigen Seeds unter ihrer harten Grenze.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €2.949 | €6.246 | €8.423 | €35.462 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.940 | €3.690 | €5.225 | €28.178 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €3.021 | €6.423 | €8.647 | €39.666 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €1.916 | €4.035 | €5.018 | €28.318 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €2.864 | €6.202 | €7.751 | €36.728 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €2.358 | €4.919 | €6.658 | €34.127 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €3.121 | €6.649 | €8.977 | €40.407 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.993 | €4.285 | €5.829 | €29.294 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €1.013 | €1.800 | €2.352 | €17.026 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €2.079 | €4.325 | €5.919 | €30.046 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.248 | €5.991 | €7.844 | €34.256 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.788 | €11.129 | €13.170 | €40.795 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.909 | €90 | 54.9× | 2.55 | null | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €4.623 | €101 | 48.7× | 2.7 | null | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €6.228 | €104 | 60.9× | 2.01 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €4.637 | €101 | 49× | 2.7 | null | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €6.097 | €109 | 56.8× | 2.05 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Chaos Tour | €5.263 | €98 | 54.9× | 2.38 | null | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €6.340 | €104 | 61.7× | 1.97 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| No Social (Fame 0-50) | €4.467 | €96 | 47.9× | 2.8 | null | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.623 | €84 | 39.8× | 4.77 | null | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €4.572 | €96 | 49.4× | 2.73 | null | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €5.238 | €103 | 50.1× | 2.39 | null | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €5.504 | €104 | 52.4× | 2.27 | null | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 5.6 | 67 | 6.3% | 53.9% | 39.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.4 | 62 | 14.8% | 58.9% | 26.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.3 | 68 | 5.1% | 48.5% | 46.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.1 | 64 | 10.6% | 58.6% | 30.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 4.5 | 73 | 2% | 36.1% | 61.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.9 | 59 | 20.8% | 59.5% | 19.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 5.3 | 68 | 4.3% | 50.3% | 45.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| No Social (Fame 0-50) | 152 | 6.1 | 64 | 11% | 58.8% | 30.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 6.5 | 63 | 17% | 59.1% | 23.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.2 | 63 | 12.3% | 58.3% | 29.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.1 | 64 | 10% | 60% | 30% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 5.5 | 68 | 6.1% | 53.1% | 40.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59 | 0.08 | 0.04 | 0.01 | 1.1 | 1.54 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Bootstrap Struggle | 49 | 0.04 | 0.04 | 0 | 1.03 | 1.17 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 59 | 0.05 | 0.04 | 0.01 | 1.13 | 1.31 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 53 | 0.1 | 0.03 | 0 | 1.01 | 1.19 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 61 | 0.04 | 0.03 | 0.01 | 1.07 | 1.22 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 41 | 0.07 | 0.05 | 0 | 1.07 | 1.3 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 61 | 0.05 | 0.04 | 0 | 1.09 | 1.31 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 52 | 0.04 | 0 | 0 | 1.07 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | 0.29 | 0.03 | 0.01 | 0.88 | 1.03 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 0.04 | 0.04 | 0 | 1.05 | 1.31 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 52 | 0.07 | 0.05 | 0.01 | 1.07 | 1.38 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 61 | 0.09 | 0.04 | 0.01 | 1.14 | 1.54 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.13 | 8.79 | 8.73 | 0.2 | 0.78 | 1.23 | 11.68 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Bootstrap Struggle | 0.18 | 6.9 | 6.82 | 0.27 | 0.81 | 1.13 | 10.88 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Aggressive Marketing | 0.22 | 7.92 | 7.79 | 0.35 | 1.17 | 1.2 | 11.57 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Scandal Recovery | 0.27 | 7.12 | 6.99 | 0.4 | 1.21 | 1.15 | 10.83 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Festival Push | 0.15 | 7.18 | 7.07 | 0.22 | 0.68 | 1.18 | 11.45 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Chaos Tour | 0.34 | 8.08 | 7.89 | 0.48 | 1.73 | 1.15 | 11.28 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 0.2 | 7.8 | 7.71 | 0.33 | 1.05 | 1.18 | 11.61 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| No Social (Fame 0-50) | 0.17 | 7.69 | 7.59 | 0.28 | 0.87 | 1.17 | 11.22 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| High Controversy | 0.15 | 6.2 | 6.11 | 0.23 | 0.75 | 0.96 | 9.13 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Early Game Probe (Fame 0–50) | 0.1 | 7.45 | 7.42 | 0.16 | 0.54 | 1.19 | 11.13 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Mid Game Probe (Fame 60–150) | 0.13 | 7.83 | 7.77 | 0.23 | 0.74 | 1.23 | 11.88 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Late Game Probe (Fame 175+) | 0.18 | 9.03 | 8.96 | 0.29 | 1.08 | 1.18 | 12.11 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.81 | 2.88 | 2.8 | 2.8 | 18.29 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Bootstrap Struggle | 9.33 | 2.2 | 2.12 | 2.15 | 15.8 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Aggressive Marketing | 9.76 | 2.47 | 2.45 | 2.45 | 17.13 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Scandal Recovery | 9.28 | 2.15 | 2.16 | 2.18 | 15.77 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Festival Push | 9.71 | 2.29 | 2.3 | 2.24 | 16.54 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Chaos Tour | 9.63 | 2.41 | 2.42 | 2.43 | 16.89 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Cult Hypergrowth | 9.74 | 2.4 | 2.5 | 2.44 | 17.08 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| No Social (Fame 0-50) | 9.6 | 2.42 | 2.44 | 2.38 | 16.84 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| High Controversy | 7.69 | 1.95 | 1.89 | 1.98 | 13.51 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Early Game Probe (Fame 0–50) | 9.53 | 2.42 | 2.39 | 2.4 | 16.74 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Mid Game Probe (Fame 60–150) | 9.96 | 2.47 | 2.51 | 2.51 | 17.45 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Late Game Probe (Fame 175+) | 9.95 | 2.87 | 2.86 | 2.88 | 18.56 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.36 | 0.16 | 0.14 | 0.32 | 0.36 | 2.42 | €27 | 0 | 98.9% |
| Bootstrap Struggle | 0.21 | 0.1 | 0.06 | 0.32 | 0.21 | 1.92 | €14 | 0 | 96.5% |
| Aggressive Marketing | 0.43 | 0.19 | 0.19 | 0.3 | 0.43 | 1.79 | €19 | 0 | 98.5% |
| Scandal Recovery | 0.2 | 0.1 | 0.06 | 0.3 | 0.2 | 1.91 | €34 | 0 | 97% |
| Festival Push | 0.38 | 0.17 | 0.14 | 0.32 | 0.38 | 1.34 | €13 | 0 | 98.6% |
| Chaos Tour | 0.32 | 0.15 | 0.12 | 0.32 | 0.32 | 1.57 | €22 | 0 | 96.5% |
| Cult Hypergrowth | 0.42 | 0.18 | 0.17 | 0.33 | 0.42 | 2.29 | €18 | 0 | 98% |
| No Social (Fame 0-50) | 0.26 | 0.13 | 0.07 | 0.33 | 0.26 | 1.69 | €15 | 0 | 97.8% |
| High Controversy | 0.08 | 0.04 | 0.02 | 0.28 | 0.08 | 1.65 | €100 | 0.02 | 95.2% |
| Early Game Probe (Fame 0–50) | 0.27 | 0.13 | 0.09 | 0.32 | 0.27 | 2.04 | €14 | 0 | 97% |
| Mid Game Probe (Fame 60–150) | 0.34 | 0.16 | 0.13 | 0.33 | 0.34 | 2.07 | €22 | 0 | 99.4% |
| Late Game Probe (Fame 175+) | 0.69 | 0.28 | 0.41 | 0.3 | 0.69 | 2.42 | €29 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €40.795 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 11835 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 28.85% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €6.340 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €41.056 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.6 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Late Game Probe (Fame 175+)** | 19.53 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 16158 | 4750 | 0 | 4750 | 5 | 0 | 2000/2000 |
| Bootstrap Struggle | 11901 | 4285 | 0 | 4285 | 5 | 0 | 2000/2000 |
| Aggressive Marketing | 14524 | 4617 | 0 | 4617 | 5 | 0 | 2000/2000 |
| Scandal Recovery | 12071 | 4278 | 0 | 4278 | 4 | 0 | 2000/2000 |
| Festival Push | 13984 | 4540 | 0 | 4540 | 4 | 0 | 2000/2000 |
| Chaos Tour | 12576 | 4491 | 0 | 4491 | 6 | 0 | 2000/2000 |
| Cult Hypergrowth | 14471 | 4669 | 0 | 4669 | 5 | 0 | 2000/2000 |
| No Social (Fame 0-50) | 13299 | 4552 | 0 | 4552 | 5 | 0 | 2000/2000 |
| High Controversy | 10400 | 3627 | 0 | 3627 | 4 | 0 | 2000/2000 |
| Early Game Probe (Fame 0–50) | 13306 | 4480 | 0 | 4480 | 5 | 0 | 2000/2000 |
| Mid Game Probe (Fame 60–150) | 14032 | 4805 | 0 | 4805 | 5 | 0 | 2000/2000 |
| Late Game Probe (Fame 175+) | 16516 | 4850 | 0 | 4850 | 6 | 0 | 2000/2000 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €35.462 | €36.457 | €9.672 | €24.182 | €46.349 |
| Bootstrap Struggle | €28.178 | €29.677 | €11.339 | €10.576 | €39.889 |
| Aggressive Marketing | €39.666 | €41.216 | €10.690 | €28.600 | €49.951 |
| Scandal Recovery | €28.318 | €30.446 | €12.169 | €5.531 | €41.022 |
| Festival Push | €36.728 | €38.502 | €10.837 | €25.617 | €47.076 |
| Chaos Tour | €34.127 | €36.356 | €11.067 | €21.718 | €45.020 |
| Cult Hypergrowth | €40.407 | €41.904 | €10.608 | €30.458 | €50.759 |
| No Social (Fame 0-50) | €29.294 | €30.055 | €9.565 | €20.579 | €39.777 |
| High Controversy | €17.026 | €21.290 | €12.889 | €0 | €32.285 |
| Early Game Probe (Fame 0–50) | €30.046 | €31.130 | €10.466 | €19.594 | €41.158 |
| Mid Game Probe (Fame 60–150) | €34.256 | €34.313 | €8.202 | €24.496 | €44.775 |
| Late Game Probe (Fame 175+) | €40.795 | €41.071 | €9.784 | €29.048 | €52.114 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 39 | 2000 | 1.95% | 1.43% | 2.65% |
| Bootstrap Struggle | 184 | 2000 | 9.20% | 8.01% | 10.55% |
| Aggressive Marketing | 59 | 2000 | 2.95% | 2.29% | 3.79% |
| Scandal Recovery | 193 | 2000 | 9.65% | 8.43% | 11.02% |
| Festival Push | 76 | 2000 | 3.80% | 3.05% | 4.73% |
| Chaos Tour | 92 | 2000 | 4.60% | 3.77% | 5.61% |
| Cult Hypergrowth | 59 | 2000 | 2.95% | 2.29% | 3.79% |
| No Social (Fame 0-50) | 104 | 2000 | 5.20% | 4.31% | 6.26% |
| High Controversy | 577 | 2000 | 28.85% | 26.91% | 30.87% |
| Early Game Probe (Fame 0–50) | 122 | 2000 | 6.10% | 5.13% | 7.24% |
| Mid Game Probe (Fame 60–150) | 3 | 2000 | 0.15% | 0.05% | 0.44% |
| Late Game Probe (Fame 175+) | 4 | 2000 | 0.20% | 0.08% | 0.51% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 1.95% | 1–5% | 10% | 1.43–2.65% | contained | within_target | within_target | stable | 🟢 healthy |
| Bootstrap Struggle | 9.20% | 15–30% | 60% | 8.01–10.55% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Aggressive Marketing | 2.95% | 2–8% | 15% | 2.29–3.79% | contained | within_target | within_target | stable | 🟢 healthy |
| Scandal Recovery | 9.65% | 8–20% | 50% | 8.43–11.02% | contained | within_target | within_target | stable | 🟢 healthy |
| Festival Push | 3.80% | 5–15% | 35% | 3.05–4.73% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Chaos Tour | 4.60% | 8–20% | 25% | 3.77–5.61% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 2.95% | 2–10% | 12% | 2.29–3.79% | contained | within_target | within_target | stable | 🟢 healthy |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ bootstrap_struggle: Insolvenzrate (Kalibrierung 9.2%, Holdout 8.7%) liegt unter dem Zielkorridor 15–30% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ festival_push: Insolvenzrate (Kalibrierung 3.8%, Holdout 4.45%) liegt unter dem Zielkorridor 5–15% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate (Kalibrierung 4.6%, Holdout 3.5%) liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1.95% | 7.4% | 2.3% | 0.05% | 0.11 | 9.83% | 46.2% | €25.253 | 4 | 15.55% |
| Bootstrap Struggle | 9.2% | 19.6% | 9.3% | 0.1% | 0.38 | 21.2% | 72.74% | €22.546 | 5 | 9.75% |
| Aggressive Marketing | 2.95% | 8.3% | 3.4% | 0.05% | 0.14 | 14.36% | 50.52% | €30.590 | 5 | 17.3% |
| Scandal Recovery | 9.65% | 21.6% | 10.15% | 0.05% | 0.41 | 22.41% | 76.23% | €21.406 | 5 | 9.4% |
| Festival Push | 3.8% | 10.1% | 4% | 0.05% | 0.17 | 18.23% | 56.2% | €27.842 | 5 | 16.3% |
| Chaos Tour | 4.6% | 12.75% | 5.3% | 0% | 0.22 | 15.64% | 49.81% | €25.290 | 5 | 13.9% |
| Cult Hypergrowth | 2.95% | 7.9% | 3.3% | 0% | 0.13 | 14.61% | 50.65% | €32.135 | 4 | 16.9% |
| No Social (Fame 0-50) | 5.2% | 15% | 5.5% | 0.1% | 0.26 | 16.06% | 50.96% | €23.017 | 5 | 12.35% |
| High Controversy | 28.85% | 52.55% | 29.25% | 0.25% | 1.11 | 33.89% | 93.86% | €10.696 | 4 | 4.3% |
| Early Game Probe (Fame 0–50) | 6.1% | 15.15% | 6.3% | 0% | 0.27 | 16.46% | 53.61% | €23.461 | 5 | 11.75% |
| Mid Game Probe (Fame 60–150) | 0.15% | 0.25% | 0.15% | 0% | 0.01 | 11.5% | 36.84% | €24.543 | 8 | 15.15% |
| Late Game Probe (Fame 175+) | 0.2% | 0.25% | 0.2% | 0% | 0 | 11.26% | 54.92% | €29.092 | 8.5 | 25.45% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zur Lesart der beiden Schwellen: „je < €500“ trennt die Szenarien inzwischen deutlich (0.25% bis 52.55%) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens 0.25%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

„Finale erreicht“ und „Finale gespielt“ sind absichtlich zwei Spalten: die erste zählt die Ankunft am FINALE-Knoten, die zweite die tatsächlich absolvierte Show. Ein bei niedriger Harmony abgesagtes Finale steht deshalb in der ersten, aber nicht in der zweiten Spalte — eine Ankunft ist kein Beweis, dass gespielt wurde.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Baseline Touring | 8.48 | 9.81 | 9.81 | 94.45% | 94.4% | 1.32 | 0.03 | 0.03/0/0 | 0.1 | 0 |
| Bootstrap Struggle | 6.47 | 9.33 | 9.33 | 88.8% | 88.5% | 2.85 | 0.12 | 0.12/0/0 | 0.16 | 0 |
| Aggressive Marketing | 7.36 | 9.76 | 9.76 | 94.8% | 94.75% | 2.39 | 0.04 | 0.04/0/0 | 0.14 | 0 |
| Scandal Recovery | 6.49 | 9.28 | 9.28 | 86.4% | 86.25% | 2.78 | 0.13 | 0.13/0/0 | 0.15 | 0 |
| Festival Push | 6.83 | 9.71 | 9.71 | 94.55% | 94.5% | 2.88 | 0.05 | 0.05/0/0 | 0.08 | 0 |
| Chaos Tour | 7.26 | 9.63 | 9.63 | 92.1% | 91.5% | 2.35 | 0.06 | 0.06/0/0 | 0.38 | 0 |
| Cult Hypergrowth | 7.34 | 9.74 | 9.74 | 94.6% | 94.6% | 2.4 | 0.04 | 0.04/0/0 | 0.17 | 0 |
| No Social (Fame 0-50) | 7.24 | 9.6 | 9.6 | 92.8% | 92.75% | 2.36 | 0.07 | 0.07/0/0 | 0.23 | 0 |
| High Controversy | 5.82 | 7.69 | 7.69 | 61.45% | 61.1% | 1.86 | 0.39 | 0.39/0/0 | 0.2 | 0 |
| Early Game Probe (Fame 0–50) | 7.21 | 9.53 | 9.53 | 91.45% | 91.2% | 2.31 | 0.08 | 0.08/0/0 | 0.21 | 0 |
| Mid Game Probe (Fame 60–150) | 7.48 | 9.96 | 9.96 | 97% | 96.85% | 2.47 | 0 | 0/0/0 | 0.12 | 0 |
| Late Game Probe (Fame 175+) | 8.60 | 9.95 | 9.95 | 96.15% | 96.15% | 1.35 | 0 | 0/0/0 | 0.09 | 0 |

Knotentypen über alle Ankünfte: GIG 67.55% · FINALE 9.63% · FESTIVAL 9.32% · SPECIAL 4.64% · REST_STOP 4.59% · SUPPLY_STOP 4.27% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 94.45%, Bootstrap Struggle 88.8%, Aggressive Marketing 94.8%, Scandal Recovery 86.4%, Festival Push 94.55%, Chaos Tour 92.1%, Cult Hypergrowth 94.6%, No Social (Fame 0-50) 92.8%, High Controversy 61.45%, Early Game Probe (Fame 0–50) 91.45%, Mid Game Probe (Fame 60–150) 97%, Late Game Probe (Fame 175+) 96.15%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da 86.5% der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 28 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 99.1% | 2 | 100% | 1 | 10.39 | 37.11% | HQ | €6.748,48 | €5.840,41 | 1.07 | 0.1 | 1.19 | 23.19 |
| Bootstrap Struggle | 1 | 98.35% | 2 | 100% | 1 | 9.8 | 34.99% | HQ | €4.133,22 | €3.828,23 | 1.27 | 0.12 | 1.99 | 22.39 |
| Aggressive Marketing | 1 | 98.75% | 2 | 100% | 1 | 10.33 | 36.89% | HQ | €6.933,4 | €6.010,81 | 1.12 | 0.1 | 1.43 | 22.94 |
| Scandal Recovery | 1 | 98.25% | 2 | 100% | 1 | 9.72 | 34.73% | HQ | €4.231,12 | €3.887,51 | 1.2 | 0.15 | 1.62 | 22.8 |
| Festival Push | 1 | 98.85% | 2 | 100% | 1 | 10.18 | 36.36% | HQ | €6.117,7 | €5.404,11 | 1.15 | 0.1 | 1.31 | 23.09 |
| Chaos Tour | 1 | 98.7% | 2 | 100% | 1 | 10.11 | 36.11% | HQ | €5.338,91 | €4.818,28 | 1.18 | 0.12 | 1.52 | 22.88 |
| Cult Hypergrowth | 1 | 98.35% | 2 | 100% | 1 | 10.3 | 36.8% | HQ | €7.219,17 | €6.235,69 | 1.1 | 0.1 | 1.38 | 23.01 |
| No Social (Fame 0-50) | 1 | 98.75% | 2 | 100% | 1 | 10.05 | 35.91% | HQ | €4.716,52 | €4.322,89 | 1.16 | 0.12 | 1.49 | 22.92 |
| High Controversy | 1 | 96.95% | 2 | 100% | 1 | 8.37 | 29.9% | HQ | €2.822,34 | €2.645,61 | 1.16 | 0.3 | 2.2 | 22.21 |
| Early Game Probe (Fame 0–50) | 1 | 98.35% | 2 | 100% | 1 | 9.98 | 35.63% | HQ | €4.731,97 | €4.337,99 | 1.15 | 0.13 | 1.55 | 22.84 |
| Mid Game Probe (Fame 60–150) | 1 | 100% | 2 | 100% | 1 | 10.45 | 37.33% | HQ | €6.551,28 | €5.901,05 | 1.31 | 0 | 1.47 | 22.98 |
| Late Game Probe (Fame 175+) | 1 | 100% | 2 | 100% | 1 | 10.69 | 38.16% | HQ | €12.001,41 | €10.384,44 | 0.98 | 0.01 | 0.8 | 23.7 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €4.256 | €4.963 | 0.858 | 0.04 | 0.37% | €90 | 1.82% | 90% |
| Bootstrap Struggle | €3.325 | €4.909 | 0.677 | 0.02 | 0.21% | €101 | 2.05% | 90% |
| Aggressive Marketing | €4.712 | €6.305 | 0.747 | 0.02 | 0.24% | €104 | 1.64% | 90% |
| Scandal Recovery | €3.358 | €4.936 | 0.68 | 0.04 | 0.44% | €101 | 2.04% | 90% |
| Festival Push | €4.302 | €6.182 | 0.696 | 0.02 | 0.19% | €109 | 1.76% | 90% |
| Chaos Tour | €4.009 | €5.396 | 0.743 | 0.03 | 0.35% | €98 | 1.82% | 90% |
| Cult Hypergrowth | €4.800 | €6.434 | 0.746 | 0.03 | 0.28% | €104 | 1.62% | 90% |
| No Social (Fame 0-50) | €3.426 | €4.614 | 0.743 | 0.02 | 0.2% | €96 | 2.09% | 90% |
| High Controversy | €2.293 | €3.346 | 0.685 | 0.12 | 1.47% | €84 | 2.51% | 90% |
| Early Game Probe (Fame 0–50) | €3.532 | €4.752 | 0.743 | 0.03 | 0.26% | €96 | 2.02% | 90% |
| Mid Game Probe (Fame 60–150) | €3.877 | €5.179 | 0.749 | 0.03 | 0.31% | €103 | 2% | 90% |
| Late Game Probe (Fame 175+) | €4.705 | €5.468 | 0.86 | 0.04 | 0.38% | €104 | 1.91% | 90% |

„Katalog < 1 Gig“ ist der Anteil der 10 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien gilt: Stamina 21 unterschreitet die Marke 35; Mood 30 unterschreitet die Marke 50. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Ruhetage treten in 12 von 12 Szenarien überhaupt auf (High Controversy 1.47%, Scandal Recovery 0.44%, Late Game Probe (Fame 175+) 0.38%, Baseline Touring 0.37%, Chaos Tour 0.35%, Mid Game Probe (Fame 60–150) 0.31%, Cult Hypergrowth 0.28%, Early Game Probe (Fame 0–50) 0.26%, Aggressive Marketing 0.24%, Bootstrap Struggle 0.21%, No Social (Fame 0-50) 0.2%, Festival Push 0.19%); nennenswert ist der Anteil nur bei High Controversy, alle übrigen liegen im Promillebereich. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 2000 / €35.462 | 1961 / €36.167 | 39 / €0 |
| Bootstrap Struggle | 2000 / €28.178 | 1816 / €31.033 | 184 / €0 |
| Aggressive Marketing | 2000 / €39.666 | 1941 / €40.871 | 59 / €0 |
| Scandal Recovery | 2000 / €28.318 | 1807 / €31.342 | 193 / €0 |
| Festival Push | 2000 / €36.728 | 1924 / €38.179 | 76 / €0 |
| Chaos Tour | 2000 / €34.127 | 1908 / €35.773 | 92 / €0 |
| Cult Hypergrowth | 2000 / €40.407 | 1941 / €41.636 | 59 / €0 |
| No Social (Fame 0-50) | 2000 / €29.294 | 1896 / €30.901 | 104 / €0 |
| High Controversy | 2000 / €17.026 | 1423 / €23.930 | 577 / €0 |
| Early Game Probe (Fame 0–50) | 2000 / €30.046 | 1878 / €31.998 | 122 / €0 |
| Mid Game Probe (Fame 60–150) | 2000 / €34.256 | 1997 / €34.308 | 3 / €0 |
| Late Game Probe (Fame 175+) | 2000 / €40.795 | 1996 / €40.877 | 4 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €9.672 | 0.2727 | 17.09% | 46.20% |
| Bootstrap Struggle | €11.339 | 0.4024 | 29.55% | 72.74% |
| Aggressive Marketing | €10.690 | 0.2695 | 22.09% | 50.52% |
| Scandal Recovery | €12.169 | 0.4297 | 30.51% | 76.23% |
| Festival Push | €10.837 | 0.2951 | 25.25% | 56.20% |
| Chaos Tour | €11.067 | 0.3243 | 22.54% | 49.81% |
| Cult Hypergrowth | €10.608 | 0.2625 | 22.52% | 50.65% |
| No Social (Fame 0-50) | €9.565 | 0.3265 | 23.29% | 50.96% |
| High Controversy | €12.889 | 0.757 | 45.48% | 93.86% |
| Early Game Probe (Fame 0–50) | €10.466 | 0.3483 | 24.06% | 53.61% |
| Mid Game Probe (Fame 60–150) | €8.202 | 0.2394 | 16.82% | 36.84% |
| Late Game Probe (Fame 175+) | €9.784 | 0.2398 | 21.90% | 54.92% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 164 |
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
| brandDeals | ✅ | 209300 | 1049 | 39 |
| postOptions | ✅ | 28603 | 28603 | 29 |
| socialTrends | ✅ | 230857 | 27919 | 5 |
| contraband | ✅ | 230857 | 25457 | 37 |
| minigamesTravel | ✅ | 227953 | 133763 | - |
| minigamesRoadie | ✅ | 57848 | 51324 | - |
| minigamesKabelsalat | ✅ | 57666 | 40153 | - |
| minigamesAmp | ✅ | 57645 | 39934 | - |
| sponsorship | ✅ | 211468 | 882 | - |
| restStops | ✅ | 230857 | 42 | - |
| eventTriggers.travel | ✅ | 227953 | 6880 | - |
| eventTriggers.preGig | ✅ | 173159 | 173134 | - |
| eventTriggers.gigMoments | ✅ | 173159 | 22819 | - |
| eventTriggers.postGig | ✅ | 173159 | 173159 | - |
| quests | ❌ | 0 | 0 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 1.95% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €35.462 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1891.28 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 9.2% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €28.178 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1829.51 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 2.95% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €39.666 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1952.07 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 9.65% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €28.318 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1850.92 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 3.8% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €13.000 – €43.000 | €36.728 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 2033.06 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.6% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €34.127 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1715.13 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 2.95% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €40.407 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1939.33 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Alt/Neu-Vergleich der vollständigen Simulationsreports

Dieser Vergleich ist **deskriptiv und ungepaart**; die Deltas sind keine gepaarten Effektschätzungen.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Fingerprint | `54d7b46e689e08a83595501ea90db6822431cb9d537f4b0fac97686c14acfa2f` | `90b4ad237ed2df7bb76e70fa974cf32941daf7c304a86d22dd453ae1745d401a` |
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

- Höchstes Risiko: **High Controversy** mit 28.85% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €40.795 Endgeld.
- Ereignisdichte: **Late Game Probe (Fame 175+)** mit Ø 19.53 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 7/7 Szenarien unter ihrer harten Insolvenzgrenze; 0 ohne Korridorurteil.
- ✅ Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: bestanden.
- Risikobänder: healthy 4 · low_risk 3.
- ⚠️ 3 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle bewerteten KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
