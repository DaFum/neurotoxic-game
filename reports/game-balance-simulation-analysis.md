# Game Balance Simulation – Analyse

Erstellt am: 2026-08-25T05:24:07.121Z

## Reproduzierbarkeit

- Report-Version: 14
- Source-Fingerprint: d0269349101cff2d6196e9bcc92c6dd94bc11844696333b2a420fadb3037c65c
- Generator-Fingerprint: d2ed5baad0da10bf89e6bb5f2429d2770b7da14561de7e7e6672e29c347efcd8
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
| Baseline Touring | €500 | 0 | €35.332 | 17.04% | 0.04 | 3% | 11330 | 7 | 58 | 4.87 | 8.47 | 0.09 | 2.1% | €4.864 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €27.811 | 29.95% | 0.04 | 1.1% | 7623 | 6 | 49 | 4.46 | 6.45 | 0.05 | 9.5% | €4.585 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €39.277 | 22.11% | 0.03 | 6.8% | 9908 | 7 | 59 | 4.8 | 7.37 | 0.05 | 3.05% | €6.190 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €28.175 | 30.77% | 0.04 | 2% | 7918 | 6 | 53 | 44.04 | 6.46 | 0.09 | 10.05% | €4.631 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €36.600 | 25.75% | 0.03 | 6.3% | 9424 | 6 | 61 | 3.66 | 6.83 | 0.04 | 3.75% | €6.091 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €33.992 | 22.44% | 0.04 | 2.6% | 8086 | 6 | 40 | 4.63 | 7.23 | 0.07 | 4.65% | €5.242 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €40.496 | 22.42% | 0.03 | 7.7% | 9823 | 7 | 61 | 4.75 | 7.34 | 0.05 | 3% | €6.349 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €29.126 | 23.62% | 0.04 | 0.7% | 8775 | 6 | 52 | 0 | 7.22 | 0.05 | 5.55% | €4.444 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.777 | 46.06% | 0.06 | 0.2% | 7283 | 6 | 51 | 58.5 | 5.76 | 0.3 | 29.9% | €2.602 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €29.796 | 24.39% | 0.04 | 1.3% | 8854 | 6 | 50 | 4.72 | 7.19 | 0.05 | 6.2% | €4.553 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €34.121 | 16.61% | 0.04 | 2.5% | 9311 | 6 | 52 | 5.21 | 7.49 | 0.07 | 0.1% | €5.241 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €40.830 | 21.43% | 0.03 | 5% | 11828 | 7 | 61 | 5.39 | 8.6 | 0.09 | 0.25% | €5.495 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €35.445 | €483 | €4.864 | 0.11 | 0.05 | 10.96 | 1.26 | 1.29 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €27.926 | €447 | €4.585 | 0.09 | 0.04 | 10.28 | 0.92 | 1.3 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Aggressive Marketing | €39.427 | €480 | €6.190 | 0.08 | 0.05 | 10.98 | 1.21 | 1.35 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €28.301 | €443 | €4.631 | 0.07 | 0.04 | 10.2 | 1.14 | 1.4 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Festival Push | €36.688 | €475 | €6.091 | 0.06 | 0.04 | 10.82 | 1.22 | 1.19 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €34.108 | €469 | €5.242 | 0.1 | 0.05 | 10.62 | 1.09 | 1.26 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €40.598 | €480 | €6.349 | 0.11 | 0.05 | 10.97 | 1.19 | 1.15 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €29.213 | €465 | €4.444 | 0 | 0 | 10.57 | 1.15 | 1.32 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| High Controversy | €17.083 | €346 | €2.602 | 0.09 | 0.05 | 8.48 | 0.88 | 0.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €29.907 | €462 | €4.553 | 0.08 | 0.04 | 10.5 | 1.16 | 1.4 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Mid Game Probe (Fame 60–150) | €34.228 | €1.464 | €5.241 | 0.11 | 0.05 | 11.25 | 1.22 | 1.47 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €41.098 | €4.896 | €5.495 | 0.12 | 0.06 | 11.49 | 1.25 | 1.24 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-first-income-full-report-namespace-plus-holdout-marker-plus-run-index`, 2000 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 2.1% ✅ | 2.3% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €35.332 ✅ | €35.698 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1882.1 ✅ | 1867.52 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 9.5% ✅ | 8.85% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €27.811 ✅ | €28.247 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1834.2 ✅ | 1807.79 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 3.05% ✅ | 3.35% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €39.277 ✅ | €39.182 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1949.67 ✅ | 1932.51 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 10.05% ✅ | 8.95% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €28.175 ✅ | €28.772 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1858.8 ✅ | 1858.73 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 3.75% ✅ | 4.45% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €36.600 ✅ | €36.364 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 2034.39 ✅ | 2045.43 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 4.65% ✅ | 3.65% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €33.992 ✅ | €34.626 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1722.1 ✅ | 1741.99 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 3% ✅ | 2.45% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €40.496 ✅ | €40.821 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1936.49 ✅ | 1932.44 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Harte Sicherheitsgrenzen (Holdout)

Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.

Abdeckung: 7 von 7 Szenarien mit konfigurierter Obergrenze gemessen. Fehlende Abdeckung ist selbst ein Fehlschlag — ein Gate, das nur einen Teil der harten Grenzen prüft, sagt über die übrigen nichts aus.

✅ Alle 7 geprüften Szenarien bleiben auf unabhängigen Seeds unter ihrer harten Grenze.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €2.948 | €6.239 | €8.399 | €35.332 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.937 | €3.678 | €5.218 | €27.811 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €3.030 | €6.436 | €8.664 | €39.277 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €1.920 | €4.048 | €5.037 | €28.175 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €2.863 | €6.183 | €7.738 | €36.600 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €2.365 | €4.925 | €6.665 | €33.992 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €3.117 | €6.648 | €8.939 | €40.496 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.988 | €4.275 | €5.819 | €29.126 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €1.015 | €1.771 | €2.266 | €16.777 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €2.077 | €4.318 | €5.889 | €29.796 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.249 | €5.998 | €7.854 | €34.121 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.790 | €11.147 | €13.189 | €40.830 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.864 | €90 | 54.5× | 2.57 | null | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €4.585 | €101 | 48.3× | 2.73 | null | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €6.190 | €104 | 60.5× | 2.02 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €4.631 | €101 | 48.9× | 2.7 | null | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €6.091 | €109 | 56.7× | 2.05 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Chaos Tour | €5.242 | €99 | 54.5× | 2.38 | null | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €6.349 | €104 | 61.7× | 1.97 | null | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| No Social (Fame 0-50) | €4.444 | €96 | 47.9× | 2.81 | null | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.602 | €84 | 39.8× | 4.8 | null | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €4.553 | €96 | 49.2× | 2.75 | null | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €5.241 | €103 | 50.1× | 2.39 | null | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €5.495 | €104 | 52.3× | 2.27 | null | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 5.6 | 66 | 6.7% | 53.9% | 39.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.4 | 62 | 14.3% | 59.5% | 26.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.3 | 68 | 4.9% | 48.6% | 46.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Scandal Recovery | 157 | 6 | 64 | 10.4% | 58.4% | 31.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 4.6 | 73 | 2.1% | 36.1% | 61.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.9 | 59 | 21.1% | 59.1% | 19.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 5.3 | 68 | 4.4% | 50% | 45.6% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| No Social (Fame 0-50) | 152 | 6.1 | 64 | 11.4% | 58.5% | 30.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 6.5 | 63 | 15.6% | 59.9% | 24.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.2 | 63 | 12% | 58.5% | 29.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.1 | 64 | 9.8% | 60.8% | 29.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 5.5 | 68 | 5.9% | 53% | 41.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 0.09 | 0.04 | 0.01 | 1.09 | 1.54 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Bootstrap Struggle | 49 | 0.05 | 0.04 | 0.01 | 1.01 | 1.18 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 59 | 0.05 | 0.04 | 0 | 1.12 | 1.35 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 53 | 0.09 | 0.03 | 0.01 | 1.04 | 1.17 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 61 | 0.04 | 0.03 | 0 | 1.08 | 1.22 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 40 | 0.07 | 0.04 | 0 | 1.08 | 1.3 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 61 | 0.05 | 0.04 | 0 | 1.1 | 1.33 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 52 | 0.05 | 0 | 0 | 1.07 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 0.3 | 0.04 | 0 | 0.88 | 1.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 50 | 0.05 | 0.03 | 0 | 1.05 | 1.29 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 52 | 0.07 | 0.05 | 0.01 | 1.08 | 1.38 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 61 | 0.09 | 0.05 | 0.01 | 1.14 | 1.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.13 | 8.78 | 8.71 | 0.2 | 0.76 | 1.22 | 11.62 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Bootstrap Struggle | 0.17 | 6.87 | 6.8 | 0.27 | 0.8 | 1.13 | 10.87 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Aggressive Marketing | 0.22 | 7.93 | 7.78 | 0.34 | 1.18 | 1.19 | 11.59 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Scandal Recovery | 0.28 | 7.12 | 6.98 | 0.43 | 1.23 | 1.16 | 10.8 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Festival Push | 0.16 | 7.18 | 7.06 | 0.24 | 0.69 | 1.18 | 11.45 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Chaos Tour | 0.33 | 8.04 | 7.88 | 0.5 | 1.76 | 1.16 | 11.25 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 0.21 | 7.82 | 7.72 | 0.35 | 1.04 | 1.2 | 11.57 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| No Social (Fame 0-50) | 0.17 | 7.68 | 7.57 | 0.28 | 0.87 | 1.19 | 11.21 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| High Controversy | 0.15 | 6.14 | 6.05 | 0.23 | 0.75 | 0.99 | 9.07 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Early Game Probe (Fame 0–50) | 0.1 | 7.43 | 7.41 | 0.18 | 0.53 | 1.2 | 11.1 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Mid Game Probe (Fame 60–150) | 0.13 | 7.84 | 7.78 | 0.24 | 0.77 | 1.23 | 11.9 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Late Game Probe (Fame 175+) | 0.18 | 9.05 | 8.96 | 0.3 | 1.08 | 1.2 | 12.12 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.79 | 2.86 | 2.82 | 2.79 | 18.26 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Bootstrap Struggle | 9.31 | 2.18 | 2.11 | 2.16 | 15.76 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Aggressive Marketing | 9.76 | 2.47 | 2.46 | 2.44 | 17.13 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Scandal Recovery | 9.25 | 2.14 | 2.11 | 2.21 | 15.71 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Festival Push | 9.71 | 2.3 | 2.3 | 2.23 | 16.54 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Chaos Tour | 9.61 | 2.42 | 2.38 | 2.43 | 16.84 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Cult Hypergrowth | 9.74 | 2.41 | 2.49 | 2.44 | 17.08 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| No Social (Fame 0-50) | 9.58 | 2.43 | 2.43 | 2.36 | 16.8 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| High Controversy | 7.62 | 1.94 | 1.92 | 1.9 | 13.38 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Early Game Probe (Fame 0–50) | 9.52 | 2.43 | 2.36 | 2.4 | 16.71 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Mid Game Probe (Fame 60–150) | 9.96 | 2.48 | 2.5 | 2.51 | 17.45 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |
| Late Game Probe (Fame 175+) | 9.95 | 2.91 | 2.82 | 2.87 | 18.55 | ✅ Hohe Minigame-Abdeckung – erreichbare Interaktionen werden genutzt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.36 | 0.17 | 0.13 | 0.32 | 0.36 | 2.41 | €29 | 0 | 98.8% |
| Bootstrap Struggle | 0.2 | 0.1 | 0.06 | 0.32 | 0.2 | 1.95 | €15 | 0 | 96.3% |
| Aggressive Marketing | 0.42 | 0.17 | 0.19 | 0.31 | 0.42 | 1.79 | €16 | 0 | 98.5% |
| Scandal Recovery | 0.2 | 0.1 | 0.06 | 0.3 | 0.2 | 1.93 | €32 | 0 | 96.8% |
| Festival Push | 0.38 | 0.17 | 0.14 | 0.33 | 0.38 | 1.32 | €13 | 0 | 98.8% |
| Chaos Tour | 0.31 | 0.14 | 0.11 | 0.32 | 0.31 | 1.57 | €23 | 0 | 96% |
| Cult Hypergrowth | 0.43 | 0.18 | 0.17 | 0.33 | 0.43 | 2.28 | €15 | 0 | 98.1% |
| No Social (Fame 0-50) | 0.25 | 0.13 | 0.07 | 0.33 | 0.25 | 1.69 | €17 | 0 | 97.8% |
| High Controversy | 0.08 | 0.05 | 0.02 | 0.28 | 0.08 | 1.67 | €105 | 0.02 | 94.9% |
| Early Game Probe (Fame 0–50) | 0.27 | 0.12 | 0.09 | 0.32 | 0.27 | 2.05 | €15 | 0 | 97.1% |
| Mid Game Probe (Fame 60–150) | 0.36 | 0.17 | 0.14 | 0.33 | 0.36 | 2.08 | €23 | 0 | 99.5% |
| Late Game Probe (Fame 175+) | 0.67 | 0.27 | 0.4 | 0.31 | 0.67 | 2.42 | €31 | 0 | 99.9% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €40.830 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 11828 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 29.9% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €6.349 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €41.098 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.6 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Late Game Probe (Fame 175+)** | 19.58 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 16068 | 4732 | 0 | 4732 | 5 | 0 | 2000/2000 |
| Bootstrap Struggle | 11898 | 4270 | 0 | 4270 | 5 | 0 | 2000/2000 |
| Aggressive Marketing | 14516 | 4603 | 0 | 4603 | 5 | 0 | 2000/2000 |
| Scandal Recovery | 12084 | 4161 | 0 | 4161 | 4 | 0 | 2000/2000 |
| Festival Push | 13963 | 4535 | 0 | 4535 | 4 | 0 | 2000/2000 |
| Chaos Tour | 12585 | 4492 | 0 | 4492 | 6 | 0 | 2000/2000 |
| Cult Hypergrowth | 14440 | 4612 | 0 | 4612 | 5 | 0 | 2000/2000 |
| No Social (Fame 0-50) | 13318 | 4538 | 0 | 4538 | 5 | 0 | 2000/2000 |
| High Controversy | 10373 | 3086 | 0 | 3086 | 4 | 0 | 2000/2000 |
| Early Game Probe (Fame 0–50) | 13281 | 4423 | 0 | 4423 | 5 | 0 | 2000/2000 |
| Mid Game Probe (Fame 60–150) | 14039 | 4783 | 0 | 4783 | 5 | 0 | 2000/2000 |
| Late Game Probe (Fame 175+) | 16547 | 4888 | 0 | 4888 | 6 | 0 | 2000/2000 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €35.332 | €36.426 | €9.848 | €24.054 | €46.163 |
| Bootstrap Struggle | €27.811 | €29.467 | €11.338 | €7.751 | €39.711 |
| Aggressive Marketing | €39.277 | €40.883 | €10.676 | €28.102 | €49.632 |
| Scandal Recovery | €28.175 | €30.061 | €12.190 | €0 | €41.246 |
| Festival Push | €36.600 | €38.239 | €10.735 | €25.132 | €47.076 |
| Chaos Tour | €33.992 | €36.253 | €11.031 | €22.245 | €44.763 |
| Cult Hypergrowth | €40.496 | €41.879 | €10.662 | €30.534 | €51.253 |
| No Social (Fame 0-50) | €29.126 | €30.149 | €9.677 | €20.611 | €39.527 |
| High Controversy | €16.777 | €21.077 | €13.067 | €0 | €32.586 |
| Early Game Probe (Fame 0–50) | €29.796 | €30.836 | €10.444 | €19.758 | €40.851 |
| Mid Game Probe (Fame 60–150) | €34.121 | €34.364 | €8.221 | €24.409 | €44.428 |
| Late Game Probe (Fame 175+) | €40.830 | €41.233 | €9.952 | €28.820 | €52.304 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 42 | 2000 | 2.10% | 1.56% | 2.83% |
| Bootstrap Struggle | 190 | 2000 | 9.50% | 8.29% | 10.86% |
| Aggressive Marketing | 61 | 2000 | 3.05% | 2.38% | 3.90% |
| Scandal Recovery | 201 | 2000 | 10.05% | 8.81% | 11.45% |
| Festival Push | 75 | 2000 | 3.75% | 3.00% | 4.68% |
| Chaos Tour | 93 | 2000 | 4.65% | 3.81% | 5.66% |
| Cult Hypergrowth | 60 | 2000 | 3.00% | 2.34% | 3.84% |
| No Social (Fame 0-50) | 111 | 2000 | 5.55% | 4.63% | 6.64% |
| High Controversy | 598 | 2000 | 29.90% | 27.93% | 31.94% |
| Early Game Probe (Fame 0–50) | 124 | 2000 | 6.20% | 5.22% | 7.34% |
| Mid Game Probe (Fame 60–150) | 2 | 2000 | 0.10% | 0.03% | 0.36% |
| Late Game Probe (Fame 175+) | 5 | 2000 | 0.25% | 0.11% | 0.58% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 2.10% | 1–5% | 10% | 1.56–2.83% | contained | within_target | within_target | stable | 🟢 healthy |
| Bootstrap Struggle | 9.50% | 15–30% | 60% | 8.29–10.86% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Aggressive Marketing | 3.05% | 2–8% | 15% | 2.38–3.90% | contained | within_target | within_target | stable | 🟢 healthy |
| Scandal Recovery | 10.05% | 8–20% | 50% | 8.81–11.45% | contained | within_target | within_target | stable | 🟢 healthy |
| Festival Push | 3.75% | 5–15% | 35% | 3.00–4.68% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Chaos Tour | 4.65% | 8–20% | 25% | 3.81–5.66% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 3.00% | 2–10% | 12% | 2.34–3.84% | contained | within_target | within_target | stable | 🟢 healthy |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ bootstrap_struggle: Insolvenzrate (Kalibrierung 9.5%, Holdout 8.85%) liegt unter dem Zielkorridor 15–30% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ festival_push: Insolvenzrate (Kalibrierung 3.75%, Holdout 4.45%) liegt unter dem Zielkorridor 5–15% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate (Kalibrierung 4.65%, Holdout 3.65%) liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.1% | 7.6% | 2.45% | 0.05% | 0.12 | 9.6% | 46% | €25.283 | 4 | 16.15% |
| Bootstrap Struggle | 9.5% | 19.75% | 9.65% | 0.1% | 0.38 | 21.17% | 76.14% | €22.269 | 5 | 9.55% |
| Aggressive Marketing | 3.05% | 8.3% | 3.5% | 0.05% | 0.14 | 14.42% | 49.87% | €29.975 | 5 | 15.8% |
| Scandal Recovery | 10.05% | 21.7% | 10.35% | 0.05% | 0.42 | 22.38% | 78.94% | €21.515 | 5 | 10.1% |
| Festival Push | 3.75% | 10.3% | 4.1% | 0.05% | 0.17 | 18.57% | 58.43% | €27.714 | 5 | 15.85% |
| Chaos Tour | 4.65% | 12.35% | 5.4% | 0% | 0.21 | 15.52% | 50.35% | €25.600 | 5 | 13.2% |
| Cult Hypergrowth | 3% | 7.9% | 3.25% | 0% | 0.13 | 14.44% | 50.35% | €32.357 | 4 | 17.1% |
| No Social (Fame 0-50) | 5.55% | 15.2% | 5.75% | 0.1% | 0.26 | 16.23% | 52.17% | €23.050 | 5 | 12.05% |
| High Controversy | 29.9% | 52.4% | 30.15% | 0.3% | 1.11 | 34.38% | 94% | €10.512 | 4 | 4.5% |
| Early Game Probe (Fame 0–50) | 6.2% | 15.15% | 6.45% | 0% | 0.27 | 16.63% | 55.04% | €23.391 | 5 | 11.7% |
| Mid Game Probe (Fame 60–150) | 0.1% | 0.2% | 0.15% | 0% | 0 | 11.26% | 35.46% | €24.436 | 7.5 | 15.95% |
| Late Game Probe (Fame 175+) | 0.25% | 0.35% | 0.2% | 0% | 0 | 10.54% | 54.5% | €29.018 | 9 | 24.9% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zur Lesart der beiden Schwellen: „je < €500“ trennt die Szenarien inzwischen deutlich (0.2% bis 52.4%) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens 0.3%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

„Finale erreicht“ und „Finale gespielt“ sind absichtlich zwei Spalten: die erste zählt die Ankunft am FINALE-Knoten, die zweite die tatsächlich absolvierte Show. Ein bei niedriger Harmony abgesagtes Finale steht deshalb in der ersten, aber nicht in der zweiten Spalte — eine Ankunft ist kein Beweis, dass gespielt wurde.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Baseline Touring | 8.47 | 9.79 | 9.79 | 94.05% | 94% | 1.32 | 0.03 | 0.03/0/0 | 0.09 | 0 |
| Bootstrap Struggle | 6.45 | 9.31 | 9.31 | 88.3% | 88% | 2.85 | 0.13 | 0.13/0/0 | 0.17 | 0 |
| Aggressive Marketing | 7.37 | 9.76 | 9.76 | 94.75% | 94.75% | 2.39 | 0.04 | 0.04/0/0 | 0.14 | 0 |
| Scandal Recovery | 6.46 | 9.25 | 9.25 | 86.4% | 86.3% | 2.79 | 0.13 | 0.13/0/0 | 0.16 | 0 |
| Festival Push | 6.83 | 9.71 | 9.71 | 94.55% | 94.55% | 2.89 | 0.05 | 0.05/0/0 | 0.07 | 0 |
| Chaos Tour | 7.23 | 9.61 | 9.61 | 92.05% | 91.3% | 2.36 | 0.06 | 0.06/0/0 | 0.38 | 0 |
| Cult Hypergrowth | 7.34 | 9.74 | 9.74 | 94.75% | 94.75% | 2.4 | 0.04 | 0.04/0/0 | 0.16 | 0 |
| No Social (Fame 0-50) | 7.22 | 9.58 | 9.58 | 92.5% | 92.45% | 2.36 | 0.08 | 0.08/0/0 | 0.22 | 0 |
| High Controversy | 5.76 | 7.62 | 7.62 | 60.2% | 59.95% | 1.85 | 0.39 | 0.39/0/0 | 0.2 | 0 |
| Early Game Probe (Fame 0–50) | 7.19 | 9.52 | 9.52 | 91.4% | 91.1% | 2.32 | 0.09 | 0.09/0/0 | 0.21 | 0 |
| Mid Game Probe (Fame 60–150) | 7.49 | 9.96 | 9.96 | 96.8% | 96.7% | 2.46 | 0 | 0/0/0 | 0.13 | 0 |
| Late Game Probe (Fame 175+) | 8.60 | 9.95 | 9.95 | 95.6% | 95.6% | 1.34 | 0 | 0/0/0 | 0.08 | 0 |

Knotentypen über alle Ankünfte: GIG 67.75% · FINALE 9.61% · FESTIVAL 9.13% · SPECIAL 4.58% · REST_STOP 4.58% · SUPPLY_STOP 4.36% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 94.05%, Bootstrap Struggle 88.3%, Aggressive Marketing 94.75%, Scandal Recovery 86.4%, Festival Push 94.55%, Chaos Tour 92.05%, Cult Hypergrowth 94.75%, No Social (Fame 0-50) 92.5%, High Controversy 60.2%, Early Game Probe (Fame 0–50) 91.4%, Mid Game Probe (Fame 60–150) 96.8%, Late Game Probe (Fame 175+) 95.6%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da 86.49% der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 28 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 99.05% | 2 | 100% | 1 | 10.36 | 37.01% | HQ | €6.644,22 | €5.790,05 | 1.06 | 0.1 | 1.19 | 23.19 |
| Bootstrap Struggle | 1 | 98.3% | 2 | 100% | 1 | 9.76 | 34.87% | HQ | €4.095,67 | €3.783,9 | 1.27 | 0.12 | 2 | 22.39 |
| Aggressive Marketing | 1 | 98.75% | 2 | 100% | 1 | 10.33 | 36.9% | HQ | €6.979,94 | €6.041,79 | 1.11 | 0.11 | 1.43 | 22.93 |
| Scandal Recovery | 1 | 98.25% | 2 | 100% | 1 | 9.71 | 34.66% | HQ | €4.278,35 | €3.934,94 | 1.19 | 0.14 | 1.61 | 22.55 |
| Festival Push | 1 | 98.9% | 2 | 100% | 1 | 10.22 | 36.5% | HQ | €6.120,69 | €5.393,15 | 1.14 | 0.1 | 1.31 | 23.08 |
| Chaos Tour | 1 | 98.65% | 2 | 100% | 1 | 10.09 | 36.03% | HQ | €5.288,84 | €4.788,69 | 1.18 | 0.12 | 1.56 | 22.84 |
| Cult Hypergrowth | 1 | 98.4% | 2 | 100% | 1 | 10.32 | 36.86% | HQ | €7.177,21 | €6.206,74 | 1.09 | 0.1 | 1.37 | 23.01 |
| No Social (Fame 0-50) | 1 | 98.8% | 2 | 100% | 1 | 10.04 | 35.85% | HQ | €4.630,16 | €4.225,57 | 1.18 | 0.12 | 1.5 | 22.91 |
| High Controversy | 1 | 97.5% | 2 | 100% | 1 | 8.26 | 29.51% | HQ | €2.668,85 | €2.506,46 | 1.01 | 0.22 | 1.79 | 19.7 |
| Early Game Probe (Fame 0–50) | 1 | 98.25% | 2 | 100% | 1 | 9.96 | 35.56% | HQ | €4.723,86 | €4.325,99 | 1.15 | 0.13 | 1.56 | 22.83 |
| Mid Game Probe (Fame 60–150) | 1 | 99.95% | 2 | 100% | 1 | 10.46 | 37.36% | HQ | €6.591,15 | €5.901,77 | 1.29 | 0.01 | 1.46 | 22.99 |
| Late Game Probe (Fame 175+) | 1 | 99.95% | 2 | 100% | 1 | 10.68 | 38.14% | HQ | €11.912,95 | €10.274,55 | 0.98 | 0.01 | 0.79 | 23.7 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €4.220 | €4.924 | 0.857 | 0.04 | 0.38% | €90 | 1.84% | 90% |
| Bootstrap Struggle | €3.292 | €4.875 | 0.675 | 0.02 | 0.24% | €101 | 2.07% | 90% |
| Aggressive Marketing | €4.685 | €6.265 | 0.748 | 0.02 | 0.23% | €104 | 1.65% | 90% |
| Scandal Recovery | €3.350 | €4.938 | 0.679 | 0.04 | 0.4% | €101 | 2.05% | 90% |
| Festival Push | €4.293 | €6.175 | 0.695 | 0.02 | 0.19% | €109 | 1.76% | 90% |
| Chaos Tour | €3.989 | €5.380 | 0.741 | 0.03 | 0.35% | €99 | 1.83% | 90% |
| Cult Hypergrowth | €4.806 | €6.438 | 0.746 | 0.02 | 0.24% | €104 | 1.62% | 90% |
| No Social (Fame 0-50) | €3.417 | €4.604 | 0.742 | 0.02 | 0.22% | €96 | 2.09% | 90% |
| High Controversy | €2.283 | €3.344 | 0.683 | 0.13 | 1.54% | €84 | 2.51% | 90% |
| Early Game Probe (Fame 0–50) | €3.516 | €4.737 | 0.742 | 0.03 | 0.26% | €96 | 2.03% | 90% |
| Mid Game Probe (Fame 60–150) | €3.883 | €5.179 | 0.75 | 0.03 | 0.35% | €103 | 1.99% | 90% |
| Late Game Probe (Fame 175+) | €4.701 | €5.463 | 0.861 | 0.04 | 0.44% | €104 | 1.91% | 90% |

„Katalog < 1 Gig“ ist der Anteil der 10 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien gilt: Stamina 21 unterschreitet die Marke 35; Mood 27 unterschreitet die Marke 50. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Ruhetage treten in 12 von 12 Szenarien überhaupt auf (High Controversy 1.54%, Late Game Probe (Fame 175+) 0.44%, Scandal Recovery 0.4%, Baseline Touring 0.38%, Chaos Tour 0.35%, Mid Game Probe (Fame 60–150) 0.35%, Early Game Probe (Fame 0–50) 0.26%, Bootstrap Struggle 0.24%, Cult Hypergrowth 0.24%, Aggressive Marketing 0.23%, No Social (Fame 0-50) 0.22%, Festival Push 0.19%); nennenswert ist der Anteil nur bei High Controversy, alle übrigen liegen im Promillebereich. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 2000 / €35.332 | 1958 / €36.090 | 42 / €0 |
| Bootstrap Struggle | 2000 / €27.811 | 1810 / €30.730 | 190 / €0 |
| Aggressive Marketing | 2000 / €39.277 | 1939 / €40.512 | 61 / €0 |
| Scandal Recovery | 2000 / €28.175 | 1799 / €31.323 | 201 / €0 |
| Festival Push | 2000 / €36.600 | 1925 / €38.026 | 75 / €0 |
| Chaos Tour | 2000 / €33.992 | 1907 / €35.650 | 93 / €0 |
| Cult Hypergrowth | 2000 / €40.496 | 1940 / €41.749 | 60 / €0 |
| No Social (Fame 0-50) | 2000 / €29.126 | 1889 / €30.838 | 111 / €0 |
| High Controversy | 2000 / €16.777 | 1402 / €23.933 | 598 / €0 |
| Early Game Probe (Fame 0–50) | 2000 / €29.796 | 1876 / €31.765 | 124 / €0 |
| Mid Game Probe (Fame 60–150) | 2000 / €34.121 | 1998 / €34.155 | 2 / €0 |
| Late Game Probe (Fame 175+) | 2000 / €40.830 | 1995 / €40.932 | 5 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €9.848 | 0.2787 | 17.04% | 46.00% |
| Bootstrap Struggle | €11.338 | 0.4077 | 29.95% | 76.14% |
| Aggressive Marketing | €10.676 | 0.2718 | 22.11% | 49.87% |
| Scandal Recovery | €12.190 | 0.4327 | 30.77% | 78.94% |
| Festival Push | €10.735 | 0.2933 | 25.75% | 58.43% |
| Chaos Tour | €11.031 | 0.3245 | 22.44% | 50.35% |
| Cult Hypergrowth | €10.662 | 0.2633 | 22.42% | 50.35% |
| No Social (Fame 0-50) | €9.677 | 0.3322 | 23.62% | 52.17% |
| High Controversy | €13.067 | 0.7789 | 46.06% | 94.00% |
| Early Game Probe (Fame 0–50) | €10.444 | 0.3505 | 24.39% | 55.04% |
| Mid Game Probe (Fame 60–150) | €8.221 | 0.2409 | 16.61% | 35.46% |
| Late Game Probe (Fame 175+) | €9.952 | 0.2437 | 21.43% | 54.50% |

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
| brandDeals | ✅ | 209067 | 1026 | 39 |
| postOptions | ✅ | 28678 | 28678 | 29 |
| socialTrends | ✅ | 230617 | 28048 | 5 |
| contraband | ✅ | 230617 | 25485 | 37 |
| minigamesTravel | ✅ | 227637 | 133778 | - |
| minigamesRoadie | ✅ | 57937 | 51361 | - |
| minigamesKabelsalat | ✅ | 57439 | 39907 | - |
| minigamesAmp | ✅ | 57491 | 39769 | - |
| sponsorship | ✅ | 211261 | 856 | - |
| restStops | ✅ | 230617 | 50 | - |
| eventTriggers.travel | ✅ | 227637 | 7110 | - |
| eventTriggers.preGig | ✅ | 172867 | 172844 | - |
| eventTriggers.gigMoments | ✅ | 172867 | 22904 | - |
| eventTriggers.postGig | ✅ | 172867 | 172867 | - |
| quests | ❌ | 0 | 0 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 2.1% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €35.332 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1882.1 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 9.5% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €27.811 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1834.2 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 3.05% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €39.277 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1949.67 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 10.05% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €28.175 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1858.8 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 3.75% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €13.000 – €43.000 | €36.600 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 2034.39 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.65% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €33.992 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1722.1 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 3% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €40.496 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1936.49 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Alt/Neu-Vergleich der vollständigen Simulationsreports

Dieser Vergleich ist **deskriptiv und ungepaart**; die Deltas sind keine gepaarten Effektschätzungen.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Fingerprint | `90b4ad237ed2df7bb76e70fa974cf32941daf7c304a86d22dd453ae1745d401a` | `d0269349101cff2d6196e9bcc92c6dd94bc11844696333b2a420fadb3037c65c` |
| Runs je Szenario | 2000 | 2000 |
| Seed-Namensraum | `#first-income-full-reports-v1` | `#first-income-full-reports-v1` |
| Seed-Strategie | `scenario-id-plus-first-income-full-report-namespace-plus-run-index` | `scenario-id-plus-first-income-full-report-namespace-plus-run-index` |
| Ausgelieferte Harness-Kadenz | `first-income` | `first-income` |

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.15% | €-130 | -9.18 | -0.01 |
| Bootstrap Struggle | 0.3% | €-367 | 4.69 | -0.02 |
| Aggressive Marketing | 0.1% | €-389 | -2.4 | 0.01 |
| Scandal Recovery | 0.4% | €-143 | 7.88 | -0.03 |
| Festival Push | -0.05% | €-128 | 1.33 | 0 |
| Chaos Tour | 0.05% | €-135 | 6.97 | -0.03 |
| Cult Hypergrowth | 0.05% | €89 | -2.84 | 0 |
| No Social (Fame 0-50) | 0.35% | €-168 | 4.51 | -0.02 |
| High Controversy | 1.05% | €-249 | 12.61 | -0.06 |
| Early Game Probe (Fame 0–50) | 0.1% | €-250 | 2.4 | -0.02 |
| Mid Game Probe (Fame 60–150) | -0.05% | €-135 | -1.24 | 0.01 |
| Late Game Probe (Fame 175+) | 0.05% | €35 | 3.88 | 0 |

## Kurzfazit

- Höchstes Risiko: **High Controversy** mit 29.9% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €40.830 Endgeld.
- Ereignisdichte: **Late Game Probe (Fame 175+)** mit Ø 19.58 Event-Impulsen (inkl. Gig-Events).

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
