# Game Balance Simulation – Analyse

Erstellt am: 2026-07-29T11:47:43.912Z

## Reproduzierbarkeit

- Report-Version: 14
- Node-Version: v24.13.0
- Basis-Commit: 913d1f10af97255ac89a55f97a49867e93a0126b
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 40fd5cfb769149c129027f66a32351e232f88a304a1a3a89091d5cc81c2ea835
- Szenariokonfiguration SHA-256: 924af59511d59596f6e10d7f75d961a30e36b1f58565254d6a6f894787d969aa
- KPI-Zielkonfiguration SHA-256: febc6b1b0d19adce4421249fb134fb2f1398be2a2a9993c84d3d18012ebe8e92
- Risikokorridor-Konfiguration SHA-256: 60ee341d74d9b77808c2bb229cb19a0bfb0bca3ed8da41858778261c6fa3817c
- Seed-Strategie: scenario-id-plus-first-income-full-report-namespace-plus-run-index

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
| Baseline Touring | €500 | 0 | €28.359 | 18.14% | 0.04 | 7.1% | 10268 | 7 | 48 | 4.96 | 8.54 | 0 | 1.4% | €4.103 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €23.095 | 32.17% | 0.05 | 6.4% | 7027 | 5 | 41 | 4.4 | 6.65 | 0 | 7.85% | €3.960 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €28.695 | 23.99% | 0.04 | 10.5% | 9144 | 6 | 49 | 4.79 | 7.46 | 0 | 2% | €4.817 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €23.921 | 30.58% | 0.05 | 8.4% | 7503 | 6 | 46 | 4.04 | 6.73 | 0 | 5.85% | €4.195 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €26.569 | 27.97% | 0.04 | 11.7% | 8709 | 6 | 53 | 3.65 | 6.84 | 0 | 4.05% | €4.692 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €25.711 | 23.9% | 0.05 | 5.6% | 7330 | 6 | 33 | 4.98 | 7.33 | 0 | 3.7% | €4.207 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €28.895 | 24.74% | 0.04 | 10.9% | 8860 | 6 | 52 | 4.49 | 7.4 | 0 | 2.2% | €4.871 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €24.917 | 24.98% | 0.05 | 5.9% | 8191 | 6 | 44 | 0 | 7.32 | 0 | 4.8% | €3.971 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €17.064 | 42.5% | 0.06 | 2.7% | 6740 | 5 | 42 | 58.42 | 6.47 | 0.17 | 20.05% | €2.723 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €25.053 | 25.67% | 0.05 | 6.1% | 8069 | 6 | 42 | 4.97 | 7.34 | 0 | 4.35% | €4.010 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €27.231 | 21.16% | 0.05 | 7.7% | 8363 | 6 | 44 | 5.24 | 7.5 | 0 | 0.65% | €4.360 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €30.726 | 21.3% | 0.04 | 8.5% | 10824 | 7 | 52 | 5.51 | 8.64 | 0 | 0.1% | €4.376 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €28.426 | €488 | €4.103 | 0.1 | 0.04 | 6.03 | 1.27 | 1.29 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €23.192 | €452 | €3.960 | 0.08 | 0.04 | 5.61 | 0.95 | 1.33 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Aggressive Marketing | €28.754 | €483 | €4.817 | 0.1 | 0.06 | 6.03 | 1.24 | 1.34 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €24.002 | €463 | €4.195 | 0.09 | 0.04 | 5.71 | 1.19 | 1.43 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Festival Push | €26.641 | €473 | €4.692 | 0.08 | 0.05 | 5.96 | 1.24 | 1.17 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €25.782 | €472 | €4.207 | 0.09 | 0.05 | 5.82 | 1.1 | 1.25 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €28.974 | €482 | €4.871 | 0.1 | 0.06 | 6.09 | 1.19 | 1.14 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €24.976 | €470 | €3.971 | 0 | 0 | 5.8 | 1.16 | 1.31 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €17.342 | €388 | €2.723 | 0.08 | 0.04 | 5.14 | 1.03 | 1.14 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €25.122 | €469 | €4.010 | 0.1 | 0.05 | 5.9 | 1.19 | 1.45 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Mid Game Probe (Fame 60–150) | €27.265 | €1.420 | €4.360 | 0.1 | 0.05 | 6.11 | 1.23 | 1.45 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €30.817 | €4.866 | €4.376 | 0.13 | 0.06 | 6.46 | 1.26 | 1.21 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-first-income-full-report-namespace-plus-holdout-marker-plus-run-index`, 2000 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 1.4% ✅ | 1.6% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €28.359 ✅ | €27.974 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1574.77 ✅ | 1585.49 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 7.85% ✅ | 8.5% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €23.095 ✅ | €22.822 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1504.52 ✅ | 1527.19 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 2% ✅ | 2.65% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €28.695 ✅ | €28.386 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1640.16 ✅ | 1630.43 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 5.85% ✅ | 5.75% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €23.921 ✅ | €24.267 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1556.46 ✅ | 1544.42 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 4.05% ✅ | 3.95% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €26.569 ✅ | €26.453 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 1729.11 ✅ | 1715.81 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 3.7% ✅ | 3.8% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €25.711 ✅ | €25.685 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1419.4 ✅ | 1452.76 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 2.2% ✅ | 2.25% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €28.895 ✅ | €28.919 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1618.56 ✅ | 1605.41 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Harte Sicherheitsgrenzen (Holdout)

Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.

Abdeckung: 7 von 7 Szenarien mit konfigurierter Obergrenze gemessen. Fehlende Abdeckung ist selbst ein Fehlschlag — ein Gate, das nur einen Teil der harten Grenzen prüft, sagt über die übrigen nichts aus.

✅ Alle 7 geprüften Szenarien bleiben auf unabhängigen Seeds unter ihrer harten Grenze.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €2.871 | €5.968 | €7.982 | €28.359 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.934 | €3.614 | €4.984 | €23.095 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €2.972 | €6.207 | €8.301 | €28.695 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €2.276 | €4.626 | €5.620 | €23.921 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €2.788 | €5.959 | €7.338 | €26.569 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €2.370 | €4.772 | €6.314 | €25.711 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €3.062 | €6.466 | €8.558 | €28.895 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.964 | €4.110 | €5.505 | €24.917 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €1.105 | €1.903 | €2.299 | €17.064 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €2.037 | €4.217 | €5.617 | €25.053 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.072 | €5.520 | €7.117 | €27.231 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.474 | €10.579 | €12.423 | €30.726 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.103 | €89 | 46.3× | 3.05 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €3.960 | €98 | 42.1× | 3.16 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Aggressive Marketing | €4.817 | €102 | 47.5× | 2.59 | 0.17 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Scandal Recovery | €4.195 | €102 | 42.3× | 2.98 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Festival Push | €4.692 | €107 | 44.5× | 2.66 | 0.17 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Chaos Tour | €4.207 | €97 | 44.1× | 2.97 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Cult Hypergrowth | €4.871 | €103 | 47.6× | 2.57 | 0.17 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| No Social (Fame 0-50) | €3.971 | €94 | 43.2× | 3.15 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| High Controversy | €2.723 | €83 | 38.1× | 4.59 | 0.3 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €4.010 | €95 | 43.3× | 3.12 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Mid Game Probe (Fame 60–150) | €4.360 | €101 | 42.9× | 2.87 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Late Game Probe (Fame 175+) | €4.376 | €103 | 42.1× | 2.86 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.3 | 63 | 11.6% | 63.5% | 24.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7 | 59 | 22.3% | 62% | 15.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6 | 65 | 8.9% | 59.3% | 31.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.5 | 62 | 14.6% | 63.2% | 22.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.2 | 69 | 4% | 47.5% | 48.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 7.4 | 57 | 29.8% | 56.1% | 14.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6 | 65 | 7.9% | 61.8% | 30.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.8 | 60 | 17.8% | 63.1% | 19.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 59 | 26% | 58.9% | 15.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.8 | 60 | 18.9% | 62.4% | 18.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.7 | 61 | 16% | 66.1% | 17.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.1 | 64 | 8.9% | 63.3% | 27.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 48 | 0 | 0.04 | 0.01 | 1.07 | 1.51 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 41 | 0 | 0.04 | 0.01 | 1.06 | 1.2 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Aggressive Marketing | 49 | 0 | 0.04 | 0 | 1.07 | 1.33 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 46 | 0 | 0.04 | 0 | 1.07 | 1.19 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 0 | 0.04 | 0.01 | 1.08 | 1.19 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 33 | 0 | 0.04 | 0.01 | 1.06 | 1.33 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 52 | 0 | 0.04 | 0.01 | 1.08 | 1.33 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 44 | 0 | 0 | 0 | 1.06 | 0 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| High Controversy | 42 | 0.17 | 0.04 | 0 | 0.96 | 1.13 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Early Game Probe (Fame 0–50) | 42 | 0 | 0.04 | 0.01 | 1.06 | 1.34 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 44 | 0 | 0.04 | 0 | 1.04 | 1.34 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Late Game Probe (Fame 175+) | 52 | 0 | 0.05 | 0.01 | 1.11 | 1.6 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.11 | 0.2 | 0.21 | 0.14 | 0.56 | 1.22 | 11.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.16 | 0.27 | 0.29 | 0.19 | 0.67 | 1.16 | 11 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.21 | 0.38 | 0.36 | 0.25 | 0.94 | 1.18 | 11.63 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.25 | 0.42 | 0.44 | 0.28 | 0.94 | 1.2 | 11.19 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.14 | 0.26 | 0.23 | 0.15 | 0.52 | 1.22 | 11.46 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.34 | 0.56 | 0.56 | 0.36 | 1.33 | 1.18 | 11.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.17 | 0.35 | 0.32 | 0.22 | 0.79 | 1.16 | 11.65 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.16 | 0.31 | 0.27 | 0.2 | 0.69 | 1.16 | 11.23 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.15 | 0.27 | 0.28 | 0.16 | 0.61 | 1.06 | 9.99 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.1 | 0.16 | 0.19 | 0.11 | 0.44 | 1.12 | 11.33 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.13 | 0.26 | 0.21 | 0.15 | 0.56 | 1.25 | 11.77 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.18 | 0.29 | 0.3 | 0.18 | 0.85 | 1.21 | 12.15 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.89 | 2.87 | 2.82 | 2.85 | 18.43 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 9.5 | 2.21 | 2.23 | 2.21 | 16.15 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 9.86 | 2.5 | 2.47 | 2.5 | 17.33 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 9.61 | 2.27 | 2.22 | 2.24 | 16.34 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 9.73 | 2.26 | 2.27 | 2.31 | 16.57 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 9.73 | 2.41 | 2.45 | 2.46 | 17.05 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 9.84 | 2.47 | 2.44 | 2.49 | 17.24 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 9.67 | 2.4 | 2.45 | 2.47 | 16.99 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 8.58 | 2.16 | 2.15 | 2.16 | 15.05 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 9.72 | 2.45 | 2.42 | 2.47 | 17.06 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 9.96 | 2.49 | 2.51 | 2.49 | 17.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 9.99 | 2.88 | 2.87 | 2.88 | 18.62 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.35 | 0.17 | 0.12 | 0.33 | 0.35 | 2.12 | €1 | 0 | 99.3% |
| Bootstrap Struggle | 0.2 | 0.1 | 0.06 | 0.33 | 0.2 | 1.68 | €1 | 0 | 95.7% |
| Aggressive Marketing | 0.4 | 0.16 | 0.15 | 0.3 | 0.4 | 1.53 | €1 | 0 | 99.4% |
| Scandal Recovery | 0.24 | 0.12 | 0.09 | 0.32 | 0.24 | 1.76 | €1 | 0 | 97.7% |
| Festival Push | 0.35 | 0.17 | 0.14 | 0.32 | 0.35 | 1.01 | €1 | 0 | 99.2% |
| Chaos Tour | 0.3 | 0.13 | 0.11 | 0.33 | 0.3 | 1.59 | €1 | 0 | 94.8% |
| Cult Hypergrowth | 0.43 | 0.19 | 0.17 | 0.3 | 0.43 | 1.96 | €0 | 0 | 99% |
| No Social (Fame 0-50) | 0.22 | 0.11 | 0.06 | 0.33 | 0.22 | 1.42 | €0 | 0 | 98.2% |
| High Controversy | 0.1 | 0.06 | 0.02 | 0.3 | 0.1 | 1.54 | €54 | 0 | 95.5% |
| Early Game Probe (Fame 0–50) | 0.24 | 0.12 | 0.08 | 0.33 | 0.24 | 1.81 | €1 | 0 | 98% |
| Mid Game Probe (Fame 60–150) | 0.34 | 0.15 | 0.12 | 0.33 | 0.34 | 1.86 | €2 | 0 | 99.3% |
| Late Game Probe (Fame 175+) | 0.65 | 0.28 | 0.36 | 0.31 | 0.65 | 2.18 | €1 | 0 | 99.9% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €30.726 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 10824 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 20.05% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €4.871 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €30.817 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.64 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 3.15 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 13515 | 3246 | 0 | 3246 | 0 | 0 | 2000/2000 |
| Bootstrap Struggle | 9967 | 2939 | 0 | 2939 | 1 | 0 | 2000/2000 |
| Aggressive Marketing | 12257 | 3113 | 0 | 3113 | 1 | 0 | 2000/2000 |
| Scandal Recovery | 10508 | 3005 | 0 | 3005 | 1 | 0 | 2000/2000 |
| Festival Push | 11850 | 3140 | 0 | 3140 | 0 | 0 | 2000/2000 |
| Chaos Tour | 10392 | 3059 | 0 | 3059 | 3 | 0 | 2000/2000 |
| Cult Hypergrowth | 12026 | 3166 | 0 | 3166 | 0 | 0 | 2000/2000 |
| No Social (Fame 0-50) | 11242 | 3051 | 0 | 3051 | 1 | 0 | 2000/2000 |
| High Controversy | 9475 | 2733 | 0 | 2733 | 2 | 0 | 2000/2000 |
| Early Game Probe (Fame 0–50) | 11155 | 3086 | 0 | 3086 | 1 | 0 | 2000/2000 |
| Mid Game Probe (Fame 60–150) | 11547 | 3243 | 0 | 3243 | 1 | 0 | 2000/2000 |
| Late Game Probe (Fame 175+) | 13997 | 3347 | 0 | 3347 | 1 | 0 | 2000/2000 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €28.359 | €28.509 | €6.182 | €21.930 | €35.184 |
| Bootstrap Struggle | €23.095 | €24.314 | €8.001 | €16.779 | €30.552 |
| Aggressive Marketing | €28.695 | €28.837 | €7.074 | €21.780 | €36.584 |
| Scandal Recovery | €23.921 | €24.768 | €7.423 | €17.926 | €31.185 |
| Festival Push | €26.569 | €27.078 | €7.641 | €20.241 | €34.578 |
| Chaos Tour | €25.711 | €26.241 | €6.877 | €20.269 | €32.430 |
| Cult Hypergrowth | €28.895 | €29.073 | €7.223 | €21.706 | €36.930 |
| No Social (Fame 0-50) | €24.917 | €25.728 | €7.058 | €19.545 | €31.663 |
| High Controversy | €17.064 | €20.572 | €9.969 | €0 | €26.804 |
| Early Game Probe (Fame 0–50) | €25.053 | €25.652 | €6.997 | €19.872 | €31.829 |
| Mid Game Probe (Fame 60–150) | €27.231 | €26.990 | €5.338 | €21.368 | €33.820 |
| Late Game Probe (Fame 175+) | €30.726 | €30.381 | €6.393 | €22.824 | €39.032 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 28 | 2000 | 1.40% | 0.97% | 2.02% |
| Bootstrap Struggle | 157 | 2000 | 7.85% | 6.75% | 9.11% |
| Aggressive Marketing | 40 | 2000 | 2.00% | 1.47% | 2.71% |
| Scandal Recovery | 117 | 2000 | 5.85% | 4.90% | 6.97% |
| Festival Push | 81 | 2000 | 4.05% | 3.27% | 5.01% |
| Chaos Tour | 74 | 2000 | 3.70% | 2.96% | 4.62% |
| Cult Hypergrowth | 44 | 2000 | 2.20% | 1.64% | 2.94% |
| No Social (Fame 0-50) | 96 | 2000 | 4.80% | 3.95% | 5.83% |
| High Controversy | 401 | 2000 | 20.05% | 18.35% | 21.86% |
| Early Game Probe (Fame 0–50) | 87 | 2000 | 4.35% | 3.54% | 5.33% |
| Mid Game Probe (Fame 60–150) | 13 | 2000 | 0.65% | 0.38% | 1.11% |
| Late Game Probe (Fame 175+) | 2 | 2000 | 0.10% | 0.03% | 0.36% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 1.40% | 1–5% | 10% | 0.97–2.02% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Bootstrap Struggle | 7.85% | 15–30% | 60% | 6.75–9.11% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Aggressive Marketing | 2.00% | 2–8% | 15% | 1.47–2.71% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Scandal Recovery | 5.85% | 8–20% | 50% | 4.90–6.97% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Festival Push | 4.05% | 5–15% | 35% | 3.27–5.01% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Chaos Tour | 3.70% | 8–20% | 25% | 2.96–4.62% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 2.20% | 2–10% | 12% | 1.64–2.94% | straddles_lower | within_target | within_target | stable | 🟢 healthy |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ bootstrap_struggle: Insolvenzrate (Kalibrierung 7.85%, Holdout 8.5%) liegt unter dem Zielkorridor 15–30% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ scandal_recovery: Insolvenzrate (Kalibrierung 5.85%, Holdout 5.75%) liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ festival_push: Insolvenzrate (Kalibrierung 4.05%, Holdout 3.95%) liegt unter dem Zielkorridor 5–15% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate (Kalibrierung 3.7%, Holdout 3.8%) liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1.4% | 6.25% | 1.6% | 0% | 0.09 | 11.45% | 46.22% | €22.375 | 5 | 15.85% |
| Bootstrap Struggle | 7.85% | 17.95% | 8.25% | 0% | 0.35 | 25.43% | 70.84% | €19.893 | 6 | 9.75% |
| Aggressive Marketing | 2% | 7.95% | 2.5% | 0% | 0.12 | 17.17% | 53.11% | €22.268 | 5 | 15.35% |
| Scandal Recovery | 5.85% | 15.35% | 6.05% | 0% | 0.26 | 23.31% | 68.18% | €19.953 | 6 | 11.2% |
| Festival Push | 4.05% | 10.55% | 4.35% | 0.05% | 0.19 | 20.96% | 62.33% | €21.220 | 6 | 15.85% |
| Chaos Tour | 3.7% | 12% | 4% | 0.1% | 0.2 | 17.11% | 50.78% | €21.168 | 5 | 12.8% |
| Cult Hypergrowth | 2.2% | 7.75% | 2.4% | 0.05% | 0.12 | 17.91% | 55.61% | €22.304 | 5 | 17.5% |
| No Social (Fame 0-50) | 4.8% | 12.7% | 5% | 0.05% | 0.22 | 17.65% | 54.14% | €20.894 | 5 | 10.4% |
| High Controversy | 20.05% | 44.75% | 20.35% | 0.15% | 0.87 | 33.7% | 92.95% | €15.401 | 5 | 5.45% |
| Early Game Probe (Fame 0–50) | 4.35% | 13.6% | 4.55% | 0% | 0.22 | 18.78% | 54.82% | €20.730 | 6 | 11.2% |
| Mid Game Probe (Fame 60–150) | 0.65% | 1.45% | 0.7% | 0% | 0.03 | 15.06% | 47.54% | €21.534 | 6 | 14.4% |
| Late Game Probe (Fame 175+) | 0.1% | 0.1% | 0.1% | 0% | 0 | 12.85% | 51.85% | €22.831 | 8.5 | 25.4% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zur Lesart der beiden Schwellen: „je < €500“ trennt die Szenarien inzwischen deutlich (0.1% bis 44.75%) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens 0.15%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

„Finale erreicht“ und „Finale gespielt“ sind absichtlich zwei Spalten: die erste zählt die Ankunft am FINALE-Knoten, die zweite die tatsächlich absolvierte Show. Ein bei niedriger Harmony abgesagtes Finale steht deshalb in der ersten, aber nicht in der zweiten Spalte — eine Ankunft ist kein Beweis, dass gespielt wurde.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Baseline Touring | 8.54 | 9.89 | 9.89 | 98.35% | 98.35% | 1.35 | 0.02 | 0.02/0/0 | 0.11 | 0 |
| Bootstrap Struggle | 6.65 | 9.5 | 9.5 | 91.8% | 91.7% | 2.85 | 0.11 | 0.11/0/0 | 0.19 | 0 |
| Aggressive Marketing | 7.46 | 9.86 | 9.86 | 97.8% | 97.8% | 2.4 | 0.03 | 0.03/0/0 | 0.15 | 0 |
| Scandal Recovery | 6.73 | 9.61 | 9.61 | 93.95% | 93.9% | 2.88 | 0.08 | 0.08/0/0 | 0.16 | 0 |
| Festival Push | 6.84 | 9.73 | 9.73 | 95.7% | 95.65% | 2.89 | 0.06 | 0.06/0/0 | 0.08 | 0 |
| Chaos Tour | 7.33 | 9.73 | 9.73 | 95.95% | 94.7% | 2.39 | 0.05 | 0.05/0/0 | 0.39 | 0 |
| Cult Hypergrowth | 7.40 | 9.84 | 9.84 | 97.55% | 97.55% | 2.44 | 0.03 | 0.03/0/0 | 0.19 | 0 |
| No Social (Fame 0-50) | 7.32 | 9.67 | 9.67 | 95.1% | 95% | 2.35 | 0.06 | 0.06/0/0 | 0.24 | 0 |
| High Controversy | 6.47 | 8.58 | 8.58 | 72.85% | 72.35% | 2.1 | 0.26 | 0.26/0/0 | 0.21 | 0 |
| Early Game Probe (Fame 0–50) | 7.34 | 9.72 | 9.72 | 95.25% | 95% | 2.38 | 0.06 | 0.06/0/0 | 0.21 | 0 |
| Mid Game Probe (Fame 60–150) | 7.50 | 9.96 | 9.96 | 99.15% | 99.05% | 2.46 | 0.01 | 0.01/0/0 | 0.14 | 0 |
| Late Game Probe (Fame 175+) | 8.64 | 9.99 | 9.99 | 99.7% | 99.65% | 1.36 | 0 | 0/0/0 | 0.08 | 0 |

Knotentypen über alle Ankünfte: GIG 67.17% · FINALE 9.94% · FESTIVAL 9.25% · SPECIAL 4.6% · REST_STOP 4.54% · SUPPLY_STOP 4.49% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 98.35%, Bootstrap Struggle 91.8%, Aggressive Marketing 97.8%, Scandal Recovery 93.95%, Festival Push 95.7%, Chaos Tour 95.95%, Cult Hypergrowth 97.55%, No Social (Fame 0-50) 95.1%, High Controversy 72.85%, Early Game Probe (Fame 0–50) 95.25%, Mid Game Probe (Fame 60–150) 99.15%, Late Game Probe (Fame 175+) 99.7%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da 86.36% der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 67 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 98.35% | 3 | 93.7% | 3 | 10.54 | 15.73% | MERCH | €6.899,35 | €6.386,41 | 0.76 | 0.18 | 2.18 | 59.04 |
| Bootstrap Struggle | 1 | 97.6% | 3 | 92.5% | 3 | 10.06 | 15.01% | MERCH | €4.489,86 | €4.245,04 | 0.97 | 0.26 | 4.4 | 56.81 |
| Aggressive Marketing | 1 | 98.85% | 3 | 92.65% | 3 | 10.54 | 15.74% | MERCH | €7.258,94 | €6.681,13 | 0.82 | 0.18 | 2.61 | 58.58 |
| Scandal Recovery | 1 | 97.9% | 3 | 90.4% | 3 | 10.18 | 15.2% | MERCH | €5.179,84 | €4.854,31 | 0.94 | 0.24 | 3.34 | 57.85 |
| Festival Push | 1 | 98.35% | 3 | 92.25% | 3 | 10.36 | 15.46% | MERCH | €6.494,41 | €6.030,33 | 0.82 | 0.2 | 2.86 | 58.32 |
| Chaos Tour | 1 | 97.55% | 3 | 92.55% | 3 | 10.32 | 15.4% | MERCH | €5.729,22 | €5.386,96 | 0.89 | 0.2 | 3.17 | 58.04 |
| Cult Hypergrowth | 1 | 98.1% | 3 | 94.15% | 3 | 10.53 | 15.72% | MERCH | €7.395,13 | €6.782,78 | 0.86 | 0.16 | 2.45 | 58.73 |
| No Social (Fame 0-50) | 1 | 97.75% | 3 | 91.35% | 3 | 10.24 | 15.28% | MERCH | €5.094,15 | €4.792,19 | 0.9 | 0.21 | 3.24 | 57.97 |
| High Controversy | 1 | 96.9% | 3 | 86.8% | 2 | 9.24 | 13.79% | MERCH | €2.959,35 | €2.778,53 | 1.08 | 0.5 | 5.59 | 55.62 |
| Early Game Probe (Fame 0–50) | 1 | 98.3% | 3 | 91.55% | 3 | 10.28 | 15.34% | MERCH | €5.148,88 | €4.853,89 | 0.87 | 0.23 | 3 | 58.2 |
| Mid Game Probe (Fame 60–150) | 1 | 98.85% | 3 | 92.4% | 3 | 10.59 | 15.81% | HQ | €6.456,74 | €6.035,03 | 0.93 | 0.02 | 2.59 | 58.44 |
| Late Game Probe (Fame 175+) | 1 | 99.45% | 3 | 94.35% | 3 | 10.89 | 16.25% | HQ | €11.222,24 | €10.260,03 | 0.7 | 0.01 | 1.01 | 59.97 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €3.549 | €4.125 | 0.86 | 0 | 0.03% | €89 | 2.16% | 95.35% |
| Bootstrap Struggle | €2.836 | €4.136 | 0.686 | 0 | 0.02% | €98 | 2.38% | 95.35% |
| Aggressive Marketing | €3.645 | €4.841 | 0.753 | 0 | 0.01% | €102 | 2.1% | 95.35% |
| Scandal Recovery | €2.978 | €4.314 | 0.69 | 0 | 0.02% | €102 | 2.36% | 95.35% |
| Festival Push | €3.320 | €4.770 | 0.696 | 0 | 0.02% | €107 | 2.25% | 95.35% |
| Chaos Tour | €3.191 | €4.278 | 0.746 | 0 | 0.03% | €97 | 2.27% | 95.35% |
| Cult Hypergrowth | €3.671 | €4.910 | 0.748 | 0 | 0.02% | €103 | 2.1% | 95.35% |
| No Social (Fame 0-50) | €3.046 | €4.073 | 0.748 | 0 | 0.01% | €94 | 2.31% | 95.35% |
| High Controversy | €2.230 | €3.144 | 0.709 | 0.08 | 0.84% | €83 | 2.63% | 95.35% |
| Early Game Probe (Fame 0–50) | €3.059 | €4.096 | 0.747 | 0 | 0.03% | €95 | 2.31% | 95.35% |
| Mid Game Probe (Fame 60–150) | €3.252 | €4.328 | 0.751 | 0 | 0.02% | €101 | 2.33% | 95.35% |
| Late Game Probe (Fame 175+) | €3.758 | €4.350 | 0.864 | 0 | 0.02% | €103 | 2.37% | 95.35% |

„Katalog < 1 Gig“ ist der Anteil der 43 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien gilt: Stamina 36 bleibt über der Marke 35; Mood 41 unterschreitet die Marke 50. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Ruhetage treten in 12 von 12 Szenarien überhaupt auf (High Controversy 0.84%, Baseline Touring 0.03%, Chaos Tour 0.03%, Early Game Probe (Fame 0–50) 0.03%, Bootstrap Struggle 0.02%, Scandal Recovery 0.02%, Festival Push 0.02%, Cult Hypergrowth 0.02%, Mid Game Probe (Fame 60–150) 0.02%, Late Game Probe (Fame 175+) 0.02%, Aggressive Marketing 0.01%, No Social (Fame 0-50) 0.01%); nennenswert ist der Anteil nur bei High Controversy, alle übrigen liegen im Promillebereich. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 2000 / €28.359 | 1972 / €28.762 | 28 / €0 |
| Bootstrap Struggle | 2000 / €23.095 | 1843 / €25.063 | 157 / €0 |
| Aggressive Marketing | 2000 / €28.695 | 1960 / €29.280 | 40 / €0 |
| Scandal Recovery | 2000 / €23.921 | 1883 / €25.407 | 117 / €0 |
| Festival Push | 2000 / €26.569 | 1919 / €27.690 | 81 / €0 |
| Chaos Tour | 2000 / €25.711 | 1926 / €26.699 | 74 / €0 |
| Cult Hypergrowth | 2000 / €28.895 | 1956 / €29.545 | 44 / €0 |
| No Social (Fame 0-50) | 2000 / €24.917 | 1904 / €26.173 | 96 / €0 |
| High Controversy | 2000 / €17.064 | 1599 / €21.343 | 401 / €0 |
| Early Game Probe (Fame 0–50) | 2000 / €25.053 | 1913 / €26.192 | 87 / €0 |
| Mid Game Probe (Fame 60–150) | 2000 / €27.231 | 1987 / €27.409 | 13 / €0 |
| Late Game Probe (Fame 175+) | 2000 / €30.726 | 1998 / €30.757 | 2 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €6.182 | 0.218 | 18.14% | 46.22% |
| Bootstrap Struggle | €8.001 | 0.3464 | 32.17% | 70.84% |
| Aggressive Marketing | €7.074 | 0.2465 | 23.99% | 53.11% |
| Scandal Recovery | €7.423 | 0.3103 | 30.58% | 68.18% |
| Festival Push | €7.641 | 0.2876 | 27.97% | 62.33% |
| Chaos Tour | €6.877 | 0.2675 | 23.90% | 50.78% |
| Cult Hypergrowth | €7.223 | 0.25 | 24.74% | 55.61% |
| No Social (Fame 0-50) | €7.058 | 0.2833 | 24.98% | 54.14% |
| High Controversy | €9.969 | 0.5842 | 42.50% | 92.95% |
| Early Game Probe (Fame 0–50) | €6.997 | 0.2793 | 25.67% | 54.82% |
| Mid Game Probe (Fame 60–150) | €5.338 | 0.196 | 21.16% | 47.54% |
| Late Game Probe (Fame 175+) | €6.393 | 0.2081 | 21.30% | 51.85% |

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
| brandDeals | ✅ | 212119 | 1084 | 42 |
| postOptions | ✅ | 28970 | 28970 | 28 |
| socialTrends | ✅ | 233923 | 28238 | 5 |
| contraband | ✅ | 233923 | 25446 | 37 |
| minigamesTravel | ✅ | 232184 | 136008 | - |
| minigamesRoadie | ✅ | 58728 | 52240 | - |
| minigamesKabelsalat | ✅ | 58604 | 40596 | - |
| minigamesAmp | ✅ | 59076 | 40944 | - |
| sponsorship | ✅ | 214449 | 911 | - |
| restStops | ✅ | 233923 | 3 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 1.4% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €28.359 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1574.77 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 7.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €23.095 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1504.52 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 2% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €28.695 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1640.16 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 5.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €23.921 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1556.46 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 4.05% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €13.000 – €43.000 | €26.569 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1729.11 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 3.7% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €25.711 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1419.4 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 2.2% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €28.895 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1618.56 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Alt/Neu-Vergleich der vollständigen Simulationsreports

Dieser Vergleich ist **deskriptiv und ungepaart**; die Deltas sind keine gepaarten Effektschätzungen.

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Commit | `dc6f86a53f0c1070d9ca3c74f92abeb58225ddf0` | `913d1f10af97255ac89a55f97a49867e93a0126b` |
| Runs je Szenario | 260 | 2000 |
| Seed-Namensraum | `nicht angegeben` | `#first-income-full-reports-v1` |
| Seed-Strategie | `scenario-id-plus-run-index` | `scenario-id-plus-first-income-full-report-namespace-plus-run-index` |
| Ausgelieferte Harness-Kadenz | `nicht angegeben` | `first-income` |

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -1.29% | €326 | 20.63 | 0 |
| Bootstrap Struggle | -22.53% | €5.864 | 268.84 | 1.94 |
| Aggressive Marketing | -8% | €3.052 | 149.63 | 1.06 |
| Scandal Recovery | -20.69% | €4.877 | 361.08 | 1.68 |
| Festival Push | -23.26% | €5.905 | 479.25 | 1.72 |
| Chaos Tour | -9.76% | €3.615 | 126.89 | 1.13 |
| Cult Hypergrowth | -8.18% | €2.892 | 134.52 | 0.92 |
| No Social (Fame 0-50) | -7.51% | €2.197 | 147.31 | 0.92 |
| High Controversy | -11.87% | €2.283 | 140.31 | 1.14 |
| Early Game Probe (Fame 0–50) | -11.42% | €3.997 | 162.08 | 1.42 |
| Mid Game Probe (Fame 60–150) | -2.04% | €1.978 | -3.61 | 0.86 |
| Late Game Probe (Fame 175+) | -0.28% | €-260 | 2.17 | -0.01 |

## Kurzfazit

- Höchstes Risiko: **High Controversy** mit 20.05% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €30.726 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 3.15 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 7/7 Szenarien unter ihrer harten Insolvenzgrenze; 0 ohne Korridorurteil.
- ✅ Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: bestanden.
- Risikobänder: healthy 3 · low_risk 4.
- ⚠️ 4 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
