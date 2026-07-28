# Game Balance Simulation – Analyse

Erstellt am: 2026-07-28T13:48:28.207Z

## Reproduzierbarkeit

- Report-Version: 13
- Node-Version: v22.22.2
- Basis-Commit: 06ae5316025877955afcfb5cf4e17f66cd2e4575
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 9e458a1705932f1ac16ca4564b0d54e98159dd9f3b464dd8f4673648719e7b77
- Szenariokonfiguration SHA-256: 924af59511d59596f6e10d7f75d961a30e36b1f58565254d6a6f894787d969aa
- KPI-Zielkonfiguration SHA-256: febc6b1b0d19adce4421249fb134fb2f1398be2a2a9993c84d3d18012ebe8e92
- Risikokorridor-Konfiguration SHA-256: 60ee341d74d9b77808c2bb229cb19a0bfb0bca3ed8da41858778261c6fa3817c
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
| Baseline Touring | €500 | 0 | €28.033 | 18.78% | 0.04 | 7.2% | 10350 | 7 | 49 | 6.19 | 8.54 | 0 | 2.69% | €4.051 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €17.231 | 50.66% | 0.05 | 7.5% | 5380 | 5 | 50 | 3.26 | 4.71 | 0 | 30.38% | €3.193 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €25.643 | 36.42% | 0.04 | 10.9% | 7813 | 6 | 53 | 3.52 | 6.4 | 0 | 10% | €4.533 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €19.044 | 47.59% | 0.05 | 8.4% | 5789 | 5 | 53 | 3.11 | 5.05 | 0.01 | 26.54% | €3.365 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €20.664 | 47.08% | 0.04 | 11.6% | 6340 | 5 | 57 | 3.23 | 5.12 | 0 | 27.31% | €3.697 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €22.096 | 39.62% | 0.05 | 6% | 6200 | 5 | 37 | 4.59 | 6.2 | 0 | 13.46% | €3.865 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.003 | 36.42% | 0.04 | 11.8% | 7904 | 6 | 55 | 3.06 | 6.48 | 0.01 | 10.38% | €4.565 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €22.720 | 36.16% | 0.05 | 6.9% | 7204 | 6 | 48 | 0 | 6.4 | 0 | 12.31% | €3.769 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €14.781 | 53.09% | 0.06 | 3.8% | 5662 | 5 | 46 | 59 | 5.33 | 0.08 | 31.92% | €2.478 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €21.056 | 40.79% | 0.05 | 7.1% | 6405 | 5 | 47 | 3.6 | 5.92 | 0 | 15.77% | €3.750 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €25.253 | 26.82% | 0.05 | 9% | 7652 | 6 | 46 | 4.07 | 6.64 | 0 | 2.69% | €4.495 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €30.986 | 22.08% | 0.04 | 8.4% | 10803 | 7 | 52 | 5.35 | 8.65 | 0 | 0.38% | €4.364 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €28.064 | €485 | €4.051 | 0.14 | 0.07 | 5.92 | 1.25 | 1.26 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €17.425 | €297 | €3.193 | 0.05 | 0.03 | 4.31 | 0.76 | 1 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €25.742 | €364 | €4.533 | 0.08 | 0.05 | 5.26 | 1.1 | 1.27 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €19.185 | €308 | €3.365 | 0.04 | 0.02 | 4.49 | 0.9 | 1.11 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €20.855 | €307 | €3.697 | 0.09 | 0.05 | 4.65 | 0.98 | 0.88 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €22.288 | €356 | €3.865 | 0.11 | 0.05 | 5.09 | 1.01 | 1.2 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €26.136 | €368 | €4.565 | 0.12 | 0.06 | 5.38 | 1.1 | 1.01 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €22.787 | €362 | €3.769 | 0 | 0 | 5.29 | 1.09 | 1.18 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €15.060 | €287 | €2.478 | 0.02 | 0.02 | 4.53 | 0.91 | 0.98 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Early Game Probe (Fame 0–50) | €21.159 | €346 | €3.750 | 0.07 | 0.04 | 4.93 | 1.06 | 1.3 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €25.310 | €1.244 | €4.495 | 0.01 | 0.02 | 5.64 | 1.22 | 1.38 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €31.091 | €4.780 | €4.364 | 0.15 | 0.07 | 6.53 | 1.27 | 1.22 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-holdout-marker-plus-run-index`, 260 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 2.69% ✅ | 1.15% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €28.033 ✅ | €28.286 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1554.14 ✅ | 1571.01 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 30.38% ✅ | 33.46% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €17.231 ✅ | €16.379 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1235.68 ✅ | 1117.87 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 10% ✅ | 11.92% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €25.643 ✅ | €24.979 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1490.53 ✅ | 1475.07 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 26.54% ✅ | 25.38% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €19.044 ✅ | €19.166 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1195.38 ✅ | 1216.45 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 27.31% ✅ | 25.77% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €20.664 ✅ | €20.484 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 1249.86 ✅ | 1346.1 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 13.46% ✅ | 15% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €22.096 ✅ | €21.624 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1292.51 ✅ | 1259.81 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 10.38% ✅ | 13.85% ❌ | ❌ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €26.003 ✅ | €24.660 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1484.04 ✅ | 1490.62 ✅ | ✅ |

❌ Auf unabhängigen Seeds abweichende Bänder: cult_hypergrowth: Insolvenzrate. Diese Bänder liegen auf einem Seed-Artefakt und sind neu abzuleiten.

## Harte Sicherheitsgrenzen (Holdout)

Diese Prüfung ist die einzige *blockierende* Schicht des Risikomodells. `KPI_TARGETS.bankruptcyMax` ist eine Obergrenze, keine Designhypothese — eine Überschreitung ist deshalb ein Fehler, egal auf welchem Seed-Strom sie auftritt. Die Kalibrierungskohorte allein kann das nicht entscheiden, weil die Bänder gegen genau diese Kohorte abgeleitet wurden. Die Zielkorridore in „Insolvenz-Zielkorridore“ bleiben davon getrennt und weiterhin nicht blockierend.

| Szenario | Metrik | Holdout | Harte Grenze | Stichprobe |
|---|---|---:|---:|---:|
| cult_hypergrowth | bankruptcyRate | 13.85% | 12% | 260 |

❌ 1 harte Sicherheitsgrenze(n) auf dem Holdout-Strom überschritten. Die Messimplementierung ist vollständig, aber die aktuelle produktionsneutrale Basis besteht die Holdout-Sicherheitsprüfung nicht — es gibt daher **keine Produktionsempfehlung**, bis die betroffenen Szenarien neu balanciert sind.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €2.886 | €6.003 | €7.902 | €28.033 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.378 | €3.034 | €3.629 | €17.231 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €2.837 | €5.977 | €7.972 | €25.643 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €1.747 | €3.543 | €4.608 | €19.044 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €2.240 | €4.569 | €5.977 | €20.664 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €2.052 | €4.323 | €5.768 | €22.096 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €2.891 | €6.427 | €8.320 | €26.003 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.963 | €3.778 | €5.078 | €22.720 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €1.076 | €1.720 | €1.968 | €14.781 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.730 | €3.643 | €4.818 | €21.056 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.027 | €5.422 | €6.922 | €25.253 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.485 | €10.390 | €12.137 | €30.986 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.051 | €88 | 46.7× | 3.09 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €3.193 | €110 | 39.6× | 3.91 | 0.25 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €4.533 | €109 | 45.7× | 2.76 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Scandal Recovery | €3.365 | €108 | 41.5× | 3.71 | 0.24 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Festival Push | €3.697 | €113 | 44× | 3.38 | 0.22 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Chaos Tour | €3.865 | €102 | 42.7× | 3.23 | 0.21 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Cult Hypergrowth | €4.565 | €108 | 46.5× | 2.74 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| No Social (Fame 0-50) | €3.769 | €98 | 42.7× | 3.32 | 0.21 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| High Controversy | €2.478 | €89 | 37× | 5.04 | 0.33 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €3.750 | €102 | 42.2× | 3.33 | 0.22 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Mid Game Probe (Fame 60–150) | €4.495 | €109 | 41.8× | 2.78 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Late Game Probe (Fame 175+) | €4.364 | €103 | 42.4× | 2.86 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.4 | 62 | 12.8% | 62.9% | 24.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.9 | 46 | 19.9% | 62.7% | 17.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.9 | 59 | 9% | 58.1% | 32.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.5 | 47 | 13.5% | 64.9% | 21.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.2 | 52 | 3.6% | 48.1% | 48.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 7.4 | 51 | 29.1% | 57.3% | 13.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6 | 58 | 6.8% | 64.7% | 28.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.6 | 55 | 15.8% | 64.5% | 19.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 53 | 23.8% | 60.1% | 16% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.7 | 54 | 17.6% | 61.6% | 20.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.6 | 60 | 12.2% | 68.5% | 19.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.1 | 64 | 9.1% | 62.6% | 28.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 49 | 0 | 0.07 | 0.02 | 1.16 | 1.6 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 50 | 0 | 0.02 | 0.01 | 1 | 0.82 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 53 | 0 | 0.03 | 0 | 1.05 | 1.13 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 53 | 0.01 | 0.02 | 0 | 0.88 | 0.92 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 57 | 0 | 0.03 | 0 | 0.86 | 0.9 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 37 | 0 | 0.05 | 0 | 0.9 | 1.17 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 55 | 0.01 | 0.05 | 0 | 1.14 | 1.13 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| No Social (Fame 0-50) | 48 | 0 | 0 | 0 | 0.95 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 46 | 0.08 | 0.01 | 0 | 0.92 | 0.96 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 47 | 0 | 0.03 | 0 | 0.99 | 1.01 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 46 | 0 | 0.01 | 0 | 1.15 | 1.1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 52 | 0 | 0.05 | 0.01 | 1.13 | 1.52 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.13 | 0.18 | 0.22 | 0.13 | 0.54 | 1.17 | 11.53 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.15 | 0.23 | 0.2 | 0.15 | 0.5 | 0.97 | 8.71 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.21 | 0.3 | 0.33 | 0.15 | 0.82 | 1.17 | 10.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.22 | 0.35 | 0.32 | 0.23 | 0.74 | 1 | 8.89 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.1 | 0.2 | 0.23 | 0.12 | 0.38 | 0.93 | 9.01 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.34 | 0.53 | 0.55 | 0.34 | 1.2 | 1.18 | 10.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.17 | 0.31 | 0.22 | 0.22 | 0.68 | 1.13 | 10.57 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.18 | 0.28 | 0.28 | 0.16 | 0.62 | 1.07 | 10.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.14 | 0.26 | 0.25 | 0.22 | 0.53 | 1.02 | 8.9 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.1 | 0.18 | 0.19 | 0.09 | 0.41 | 1.05 | 10.06 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.17 | 0.28 | 0.23 | 0.2 | 0.54 | 1.18 | 11.45 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.19 | 0.34 | 0.32 | 0.21 | 0.85 | 1.14 | 11.98 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.79 | 2.83 | 2.9 | 2.8 | 18.32 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 7.7 | 1.63 | 1.49 | 1.59 | 12.41 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 9.18 | 1.99 | 2.19 | 2.22 | 15.58 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 7.85 | 1.62 | 1.67 | 1.77 | 12.91 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 7.82 | 1.74 | 1.78 | 1.6 | 12.94 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 8.95 | 2 | 2.11 | 2.08 | 15.14 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 9.16 | 2.22 | 2.11 | 2.15 | 15.64 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 9.03 | 2.22 | 2.17 | 2.01 | 15.43 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 7.78 | 1.83 | 1.7 | 1.8 | 13.11 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 8.8 | 1.92 | 2 | 2 | 14.72 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 9.8 | 2.2 | 2.12 | 2.32 | 16.44 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 9.98 | 2.83 | 2.9 | 2.92 | 18.63 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.38 | 0.19 | 0.22 | 0.3 | 0.38 | 2.16 | €0 | 0 | 98.1% |
| Bootstrap Struggle | 0.18 | 0.09 | 0.05 | 0.26 | 0.18 | 1.26 | €0 | 0 | 72.3% |
| Aggressive Marketing | 0.28 | 0.13 | 0.12 | 0.36 | 0.28 | 1.43 | €1 | 0 | 90% |
| Scandal Recovery | 0.16 | 0.08 | 0.08 | 0.29 | 0.16 | 1.48 | €4 | 0 | 73.8% |
| Festival Push | 0.28 | 0.12 | 0.12 | 0.3 | 0.28 | 0.8 | €0 | 0 | 74.6% |
| Chaos Tour | 0.25 | 0.12 | 0.09 | 0.34 | 0.25 | 1.46 | €0 | 0 | 86.9% |
| Cult Hypergrowth | 0.41 | 0.18 | 0.13 | 0.27 | 0.41 | 1.82 | €2 | 0 | 90% |
| No Social (Fame 0-50) | 0.2 | 0.11 | 0.05 | 0.34 | 0.2 | 1.28 | €0 | 0 | 88.5% |
| High Controversy | 0.06 | 0.03 | 0.02 | 0.26 | 0.06 | 1.29 | €27 | 0 | 83.5% |
| Early Game Probe (Fame 0–50) | 0.23 | 0.09 | 0.07 | 0.3 | 0.23 | 1.68 | €0 | 0 | 86.9% |
| Mid Game Probe (Fame 60–150) | 0.27 | 0.16 | 0.11 | 0.32 | 0.27 | 1.85 | €1 | 0 | 97.3% |
| Late Game Probe (Fame 175+) | 0.65 | 0.32 | 0.41 | 0.3 | 0.65 | 2.14 | €0 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €30.986 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 10803 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 31.92% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €4.565 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €31.091 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.65 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 2.96 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 13472 | 3121 | 0 | 3121 | 0 | 0 | 260/260 |
| Bootstrap Struggle | 7526 | 2146 | 0 | 2146 | 1 | 0 | 260/260 |
| Aggressive Marketing | 10502 | 2688 | 0 | 2688 | 0 | 0 | 260/260 |
| Scandal Recovery | 8052 | 2262 | 0 | 2262 | 1 | 0 | 260/260 |
| Festival Push | 8528 | 2187 | 0 | 2187 | 0 | 0 | 260/260 |
| Chaos Tour | 8794 | 2591 | 0 | 2591 | 3 | 0 | 260/260 |
| Cult Hypergrowth | 10634 | 2730 | 0 | 2730 | 0 | 0 | 260/260 |
| No Social (Fame 0-50) | 9913 | 2708 | 0 | 2708 | 1 | 0 | 260/260 |
| High Controversy | 7945 | 2282 | 0 | 2282 | 1 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 8838 | 2433 | 0 | 2433 | 1 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 10532 | 2940 | 0 | 2940 | 0 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 14010 | 3382 | 0 | 3382 | 0 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €28.033 | €28.371 | €7.098 | €21.591 | €34.694 |
| Bootstrap Struggle | €17.231 | €22.020 | €11.903 | €0 | €29.225 |
| Aggressive Marketing | €25.643 | €27.213 | €10.053 | €13.676 | €35.215 |
| Scandal Recovery | €19.044 | €23.123 | €12.291 | €0 | €31.148 |
| Festival Push | €20.664 | €26.162 | €13.335 | €0 | €33.119 |
| Chaos Tour | €22.096 | €24.737 | €9.830 | €0 | €30.953 |
| Cult Hypergrowth | €26.003 | €27.268 | €10.451 | €0 | €36.221 |
| No Social (Fame 0-50) | €22.720 | €24.878 | €9.357 | €0 | €30.894 |
| High Controversy | €14.781 | €19.259 | €11.142 | €0 | €27.139 |
| Early Game Probe (Fame 0–50) | €21.056 | €23.712 | €10.035 | €0 | €29.787 |
| Mid Game Probe (Fame 60–150) | €25.253 | €25.240 | €6.452 | €19.431 | €32.047 |
| Late Game Probe (Fame 175+) | €30.986 | €30.569 | €6.729 | €22.430 | €38.870 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 7 | 260 | 2.69% | 1.31% | 5.45% |
| Bootstrap Struggle | 79 | 260 | 30.38% | 25.11% | 36.23% |
| Aggressive Marketing | 26 | 260 | 10.00% | 6.92% | 14.25% |
| Scandal Recovery | 69 | 260 | 26.54% | 21.54% | 32.22% |
| Festival Push | 71 | 260 | 27.31% | 22.25% | 33.02% |
| Chaos Tour | 35 | 260 | 13.46% | 9.84% | 18.15% |
| Cult Hypergrowth | 27 | 260 | 10.38% | 7.24% | 14.69% |
| No Social (Fame 0-50) | 32 | 260 | 12.31% | 8.85% | 16.86% |
| High Controversy | 83 | 260 | 31.92% | 26.55% | 37.82% |
| Early Game Probe (Fame 0–50) | 41 | 260 | 15.77% | 11.84% | 20.69% |
| Mid Game Probe (Fame 60–150) | 7 | 260 | 2.69% | 1.31% | 5.45% |
| Late Game Probe (Fame 175+) | 1 | 260 | 0.38% | 0.07% | 2.15% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 2.69% | 1–5% | 10% | 1.31–5.45% | straddles_upper | within_target | within_target | stable | 🟢 healthy |
| Bootstrap Struggle | 30.38% | 15–30% | 60% | 25.11–36.23% | straddles_upper | above_target | above_target | stable | 🟠 high_risk |
| Aggressive Marketing | 10.00% | 2–8% | 15% | 6.92–14.25% | straddles_upper | above_target | above_target | stable | 🟠 high_risk |
| Scandal Recovery | 26.54% | 8–20% | 50% | 21.54–32.22% | entirely_above | above_target | above_target | stable | 🟠 high_risk |
| Festival Push | 27.31% | 5–15% | 35% | 22.25–33.02% | entirely_above | above_target | above_target | stable | 🟠 high_risk |
| Chaos Tour | 13.46% | 8–20% | 25% | 9.84–18.15% | contained | within_target | within_target | stable | 🟢 healthy |
| Cult Hypergrowth | 10.38% | 2–10% | 12% | 7.24–14.69% | straddles_upper | above_target | above_safety_limit | unstable_boundary | 🔴 unsafe |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ bootstrap_struggle: Insolvenzrate (Kalibrierung 30.38%, Holdout 33.46%) liegt über dem Zielkorridor 15–30%, aber noch unter der Sicherheitsgrenze.
- ⚠️ aggressive_marketing: Insolvenzrate (Kalibrierung 10%, Holdout 11.92%) liegt über dem Zielkorridor 2–8%, aber noch unter der Sicherheitsgrenze.
- ⚠️ scandal_recovery: Insolvenzrate (Kalibrierung 26.54%, Holdout 25.38%) liegt über dem Zielkorridor 8–20%, aber noch unter der Sicherheitsgrenze.
- ⚠️ festival_push: Insolvenzrate (Kalibrierung 27.31%, Holdout 25.77%) liegt über dem Zielkorridor 5–15%, aber noch unter der Sicherheitsgrenze.
- ⚠️ cult_hypergrowth: Holdout 13.85% überschreitet die harte Sicherheitsgrenze 12% — das ist ein Safety-Gate-Befund, kein Designhinweis.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.69% | 5.38% | 2.69% | 0% | 0.11 | 10.46% | 49.18% | €22.106 | 5 | 18.85% |
| Bootstrap Struggle | 30.38% | 71.54% | 36.15% | 0.38% | 1.5 | 38.17% | 96% | €20.693 | 5 | 8.85% |
| Aggressive Marketing | 10% | 65.77% | 13.85% | 0% | 0.9 | 29.9% | 83.02% | €21.873 | 4 | 11.15% |
| Scandal Recovery | 26.54% | 67.31% | 34.23% | 0% | 1.35 | 36.7% | 94.31% | €19.980 | 4 | 7.69% |
| Festival Push | 27.31% | 67.69% | 34.62% | 0% | 1.35 | 36.96% | 94.22% | €21.990 | 4 | 11.54% |
| Chaos Tour | 13.46% | 66.15% | 17.31% | 0% | 0.97 | 30.2% | 86.22% | €19.793 | 4 | 11.92% |
| Cult Hypergrowth | 10.38% | 63.85% | 14.23% | 0% | 0.89 | 29.4% | 82.8% | €22.633 | 4 | 16.54% |
| No Social (Fame 0-50) | 12.31% | 65.38% | 16.15% | 0% | 0.96 | 30% | 83.46% | €20.986 | 4 | 10.77% |
| High Controversy | 31.92% | 79.23% | 33.08% | 0% | 1.67 | 42.77% | 97% | €16.619 | 5 | 2.69% |
| Early Game Probe (Fame 0–50) | 15.77% | 68.85% | 18.85% | 0% | 1.08 | 30.93% | 88.19% | €19.809 | 5 | 9.23% |
| Mid Game Probe (Fame 60–150) | 2.69% | 5% | 3.08% | 0% | 0.12 | 18.98% | 63.14% | €20.456 | 5 | 15.38% |
| Late Game Probe (Fame 175+) | 0.38% | 0.38% | 0.38% | 0% | 0 | 13.01% | 58.06% | €22.457 | 7 | 29.62% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zur Lesart der beiden Schwellen: „je < €500“ trennt die Szenarien inzwischen deutlich (0.38% bis 79.23%) und ist damit selbst ein Signal — ein früherer Stand dieses Reports erklärte die Spalte als bei 100% gesättigt, was für den damaligen Simulator ohne echte Routenwahl zutraf, für die vorliegenden Zahlen aber nicht mehr. „Saldo 0“ bleibt bei höchstens 0.38%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Finale gespielt | Ankünfte ohne Bühne | Ø blockierte Fahrten | davon Geld/Fuel/Zugang | Ø Tanken für Fahrt | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Baseline Touring | 8.54 | 9.79 | 9.79 | 97.31% | 97.31% | 1.25 | 0.04 | 0.04/0/0 | 0.11 | 0 |
| Bootstrap Struggle | 4.71 | 7.7 | 7.7 | 69.62% | 69.62% | 3 | 0.4 | 0.4/0/0 | 0.17 | 0 |
| Aggressive Marketing | 6.40 | 9.18 | 9.18 | 89.62% | 89.62% | 2.78 | 0.13 | 0.13/0/0 | 0.12 | 0 |
| Scandal Recovery | 5.05 | 7.85 | 7.85 | 73.08% | 72.69% | 2.8 | 0.38 | 0.38/0/0 | 0.16 | 0 |
| Festival Push | 5.12 | 7.82 | 7.82 | 72.69% | 72.69% | 2.7 | 0.38 | 0.38/0/0 | 0.05 | 0 |
| Chaos Tour | 6.20 | 8.95 | 8.95 | 86.15% | 85% | 2.74 | 0.18 | 0.18/0/0 | 0.4 | 0 |
| Cult Hypergrowth | 6.48 | 9.16 | 9.16 | 89.23% | 89.23% | 2.68 | 0.12 | 0.12/0/0 | 0.13 | 0 |
| No Social (Fame 0-50) | 6.40 | 9.03 | 9.03 | 87.69% | 87.69% | 2.63 | 0.16 | 0.16/0/0 | 0.21 | 0 |
| High Controversy | 5.33 | 7.78 | 7.78 | 63.85% | 63.46% | 2.45 | 0.46 | 0.46/0/0 | 0.2 | 0 |
| Early Game Probe (Fame 0–50) | 5.92 | 8.8 | 8.8 | 84.23% | 83.85% | 2.88 | 0.2 | 0.2/0/0 | 0.22 | 0 |
| Mid Game Probe (Fame 60–150) | 6.64 | 9.8 | 9.8 | 96.92% | 96.92% | 3.16 | 0.04 | 0.04/0/0 | 0.13 | 0 |
| Late Game Probe (Fame 175+) | 8.65 | 9.98 | 9.98 | 99.62% | 99.62% | 1.33 | 0 | 0/0/0 | 0.1 | 0 |

Knotentypen über alle Ankünfte: GIG 67.52% · FINALE 9.94% · FESTIVAL 9.78% · REST_STOP 4.79% · SPECIAL 4.08% · SUPPLY_STOP 3.89% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 97.31%, Bootstrap Struggle 69.62%, Aggressive Marketing 89.62%, Scandal Recovery 73.08%, Festival Push 72.69%, Chaos Tour 86.15%, Cult Hypergrowth 89.23%, No Social (Fame 0-50) 87.69%, High Controversy 63.85%, Early Game Probe (Fame 0–50) 84.23%, Mid Game Probe (Fame 60–150) 96.92%, Late Game Probe (Fame 175+) 99.62%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da 87.24% der besuchten Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 67 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 97.31% | 3 | 93.85% | 3 | 10.44 | 15.58% | MERCH | €7.030,57 | €6.485,91 | 0.69 | 0.17 | 2.64 | 58.57 |
| Bootstrap Struggle | 1 | 78.08% | 3 | 77.31% | 2 | 8.04 | 12% | MERCH | €3.971,5 | €3.745,95 | 1.39 | 0.34 | 10.78 | 50.76 |
| Aggressive Marketing | 1 | 89.62% | 4 | 92.69% | 2 | 9.66 | 14.42% | MERCH | €6.713,64 | €6.212,94 | 1.23 | 0.32 | 3.44 | 57.82 |
| Scandal Recovery | 1 | 74.62% | 3.5 | 88.46% | 2 | 8.15 | 12.17% | HQ | €4.589,95 | €4.341,4 | 1.4 | 0.38 | 10.2 | 51.23 |
| Festival Push | 1 | 76.54% | 4 | 87.31% | 2 | 8.22 | 12.26% | MERCH | €5.992,16 | €5.552,23 | 1.32 | 0.35 | 9.45 | 52.06 |
| Chaos Tour | 1 | 88.85% | 3 | 86.15% | 2 | 9.37 | 13.98% | MERCH | €4.996,54 | €4.675,18 | 1.32 | 0.27 | 4.36 | 57.04 |
| Cult Hypergrowth | 1 | 89.62% | 4 | 93.46% | 3 | 9.64 | 14.39% | HQ | €7.016,25 | €6.453,94 | 1.19 | 0.24 | 3.66 | 57.67 |
| No Social (Fame 0-50) | 1 | 88.46% | 4 | 91.92% | 2 | 9.45 | 14.11% | HQ | €4.625,62 | €4.365,76 | 1.25 | 0.34 | 4.51 | 56.79 |
| High Controversy | 1 | 85.38% | 4 | 87.69% | 2 | 8.31 | 12.41% | HQ | €2.622,56 | €2.478,02 | 1.57 | 0.56 | 9.03 | 52.29 |
| Early Game Probe (Fame 0–50) | 1 | 88.85% | 4 | 89.62% | 2 | 9.25 | 13.81% | MERCH | €4.475,79 | €4.193,85 | 1.37 | 0.42 | 5.59 | 55.7 |
| Mid Game Probe (Fame 60–150) | 1 | 97.69% | 3 | 90% | 3 | 10.41 | 15.53% | INSTRUMENT | €5.748,79 | €5.316,23 | 1.3 | 0.03 | 3.52 | 57.54 |
| Late Game Probe (Fame 175+) | 1 | 99.23% | 3 | 96.54% | 3 | 10.82 | 16.15% | INSTRUMENT | €11.086,78 | €10.105,92 | 0.74 | 0.01 | 1.03 | 59.82 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €3.576 | €4.126 | 0.867 | 0 | 0% | €88 | 2.14% | 95.35% |
| Bootstrap Struggle | €2.439 | €4.358 | 0.56 | 0 | 0% | €110 | 2.52% | 95.35% |
| Aggressive Marketing | €3.379 | €4.970 | 0.68 | 0 | 0.04% | €109 | 2.19% | 95.35% |
| Scandal Recovery | €2.657 | €4.472 | 0.594 | 0 | 0.05% | €108 | 2.41% | 95.35% |
| Festival Push | €2.999 | €4.961 | 0.605 | 0 | 0% | €113 | 2.27% | 95.35% |
| Chaos Tour | €2.918 | €4.361 | 0.669 | 0 | 0% | €102 | 2.34% | 95.35% |
| Cult Hypergrowth | €3.476 | €5.031 | 0.691 | 0 | 0.04% | €108 | 2.15% | 95.35% |
| No Social (Fame 0-50) | €2.883 | €4.198 | 0.687 | 0 | 0% | €98 | 2.34% | 95.35% |
| High Controversy | €2.028 | €3.279 | 0.619 | 0.05 | 0.54% | €89 | 2.7% | 95.35% |
| Early Game Probe (Fame 0–50) | €2.779 | €4.303 | 0.646 | 0 | 0% | €102 | 2.37% | 95.35% |
| Mid Game Probe (Fame 60–150) | €3.056 | €4.541 | 0.673 | 0 | 0.04% | €109 | 2.39% | 95.35% |
| Late Game Probe (Fame 175+) | €3.768 | €4.353 | 0.866 | 0 | 0% | €103 | 2.36% | 95.35% |

„Katalog < 1 Gig“ ist der Anteil der 43 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien sinkt die niedrigste Stamina auf 41 und die niedrigste Mood auf 44, die Marken werden also unterschritten. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Messbar geruht wird bislang nur im Szenario mit hoher Controversy. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €28.033 | 253 / €28.809 | 7 / €0 |
| Bootstrap Struggle | 260 / €17.231 | 181 / €24.752 | 79 / €0 |
| Aggressive Marketing | 260 / €25.643 | 234 / €28.492 | 26 / €0 |
| Scandal Recovery | 260 / €19.044 | 191 / €25.924 | 69 / €0 |
| Festival Push | 260 / €20.664 | 189 / €28.427 | 71 / €0 |
| Chaos Tour | 260 / €22.096 | 225 / €25.533 | 35 / €0 |
| Cult Hypergrowth | 260 / €26.003 | 233 / €29.017 | 27 / €0 |
| No Social (Fame 0-50) | 260 / €22.720 | 228 / €25.909 | 32 / €0 |
| High Controversy | 260 / €14.781 | 177 / €21.712 | 83 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €21.056 | 219 / €24.998 | 41 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €25.253 | 253 / €25.952 | 7 / €0 |
| Late Game Probe (Fame 175+) | 260 / €30.986 | 259 / €31.106 | 1 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €7.098 | 0.2532 | 18.78% | 49.18% |
| Bootstrap Struggle | €11.903 | 0.6908 | 50.66% | 96.00% |
| Aggressive Marketing | €10.053 | 0.392 | 36.42% | 83.02% |
| Scandal Recovery | €12.291 | 0.6454 | 47.59% | 94.31% |
| Festival Push | €13.335 | 0.6453 | 47.08% | 94.22% |
| Chaos Tour | €9.830 | 0.4449 | 39.62% | 86.22% |
| Cult Hypergrowth | €10.451 | 0.4019 | 36.42% | 82.80% |
| No Social (Fame 0-50) | €9.357 | 0.4118 | 36.16% | 83.46% |
| High Controversy | €11.142 | 0.7538 | 53.09% | 97.00% |
| Early Game Probe (Fame 0–50) | €10.035 | 0.4766 | 40.79% | 88.19% |
| Mid Game Probe (Fame 60–150) | €6.452 | 0.2555 | 26.82% | 63.14% |
| Late Game Probe (Fame 175+) | €6.729 | 0.2172 | 22.08% | 58.06% |

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
| brandDeals | ✅ | 25529 | 122 | 25 |
| postOptions | ✅ | 3185 | 3185 | 25 |
| socialTrends | ✅ | 28187 | 3386 | 5 |
| contraband | ✅ | 28187 | 3157 | 37 |
| minigamesTravel | ✅ | 27522 | 16106 | - |
| minigamesRoadie | ✅ | 6513 | 5785 | - |
| minigamesKabelsalat | ✅ | 6535 | 4537 | - |
| minigamesAmp | ✅ | 6565 | 4586 | - |
| sponsorship | ✅ | 25796 | 99 | - |
| restStops | ✅ | 28187 | 1 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 2.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €28.033 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1554.14 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 30.38% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €17.231 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1235.68 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 10% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €25.643 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1490.53 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 26.54% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €19.044 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1195.38 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 27.31% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €13.000 – €43.000 | €20.664 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1249.86 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 13.46% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €22.096 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1292.51 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 10.38% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €26.003 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1484.04 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -0.39% | €74 | -72.86 | 0.06 |
| Bootstrap Struggle | 0% | €7 | 122.23 | 0.01 |
| Aggressive Marketing | -0.77% | €434 | 32.07 | 0.07 |
| Scandal Recovery | 1.54% | €-426 | -45.11 | -0.12 |
| Festival Push | 1.54% | €-152 | -9.41 | -0.06 |
| Chaos Tour | 0% | €-660 | -15.65 | 0.08 |
| Cult Hypergrowth | 0% | €172 | -10.36 | 0.01 |
| No Social (Fame 0-50) | -1.15% | €577 | -5.13 | 0.1 |
| High Controversy | 3.07% | €-281 | 27.6 | 0.01 |
| Early Game Probe (Fame 0–50) | 3.46% | €-1.235 | -34.08 | -0.34 |
| Mid Game Probe (Fame 60–150) | 0.38% | €-9 | 7.11 | 0.07 |
| Late Game Probe (Fame 175+) | 0.38% | €247 | -38.64 | -0.01 |

## Kurzfazit

- Höchstes Risiko: **High Controversy** mit 31.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €30.986 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 2.96 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 6/7 Szenarien unter ihrer harten Insolvenzgrenze; 0 ohne Korridorurteil.
- ❌ **Blockierendes Gate „Harte Sicherheitsgrenzen (Holdout)“: fehlgeschlagen** (cult_hypergrowth 13.85% > 12%). Keine Produktionsempfehlung.
- Risikobänder: healthy 2 · high_risk 4 · unsafe 1.
- ⚠️ 5 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
