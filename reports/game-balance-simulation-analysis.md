# Game Balance Simulation – Analyse

Erstellt am: 2026-07-28T10:33:51.464Z

## Reproduzierbarkeit

- Report-Version: 13
- Node-Version: v22.22.2
- Basis-Commit: 8650f795321cbd93aea0ba48387d1297bd8608bf
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: e17b054ab4d238867005bae176b05b4a04465139c1fc21ab964576380c945db3
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
| Baseline Touring | €500 | 0 | €28.913 | 17.15% | 0.04 | 7.8% | 11099 | 7 | 49 | 5.58 | 8.67 | 0 | 0.38% | €4.168 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €22.308 | 44.77% | 0.04 | 7.5% | 6292 | 5 | 43 | 4.89 | 5.9 | 0 | 10% | €4.142 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €27.788 | 35.86% | 0.04 | 12.2% | 8693 | 6 | 51 | 4.18 | 6.93 | 0 | 1.92% | €4.979 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €24.222 | 40.94% | 0.04 | 9.1% | 6749 | 5 | 46 | 3.53 | 6.23 | 0 | 5.77% | €4.440 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €26.937 | 41.2% | 0.04 | 13.3% | 8315 | 6 | 53 | 3.83 | 6.45 | 0 | 5% | €4.895 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €24.341 | 37.44% | 0.04 | 7.2% | 7376 | 6 | 36 | 4.18 | 6.66 | 0 | 4.62% | €4.308 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €28.107 | 34.69% | 0.04 | 12.7% | 8096 | 6 | 53 | 4.82 | 6.97 | 0 | 1.92% | €5.042 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €24.773 | 32.96% | 0.04 | 5.9% | 7555 | 6 | 45 | 0 | 6.88 | 0 | 3.46% | €4.150 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €19.056 | 46.23% | 0.05 | 3.5% | 6920 | 5 | 42 | 56.68 | 6.41 | 0.1 | 11.92% | €3.201 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €24.205 | 36.79% | 0.05 | 7.1% | 7699 | 6 | 44 | 4.6 | 6.62 | 0 | 4.62% | €4.215 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €25.791 | 28.11% | 0.04 | 9.6% | 8097 | 6 | 46 | 4.2 | 6.72 | 0 | 0.38% | €4.593 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €31.245 | 21.84% | 0.04 | 8.4% | 10619 | 7 | 52 | 5.78 | 8.79 | 0 | 0% | €4.344 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €28.933 | €492 | €4.168 | 0.23 | 0.08 | 6.2 | 1.2 | 1.1 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €22.369 | €328 | €4.142 | 0.08 | 0.05 | 5.17 | 0.85 | 0.85 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Aggressive Marketing | €27.824 | €376 | €4.979 | 0.04 | 0.03 | 5.79 | 1.13 | 0.96 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €24.265 | €341 | €4.440 | 0.11 | 0.05 | 5.47 | 1.11 | 0.9 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Festival Push | €26.964 | €335 | €4.895 | 0.07 | 0.04 | 5.41 | 1.22 | 0.89 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €24.369 | €367 | €4.308 | 0.1 | 0.06 | 5.52 | 0.9 | 0.88 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €28.187 | €373 | €5.042 | 0.12 | 0.06 | 5.85 | 1.13 | 0.92 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €24.791 | €378 | €4.150 | 0 | 0 | 5.58 | 1.06 | 0.95 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| High Controversy | €19.176 | €332 | €3.201 | 0.03 | 0.02 | 4.95 | 0.99 | 0.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €24.231 | €366 | €4.215 | 0.1 | 0.05 | 5.5 | 1.11 | 0.96 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Mid Game Probe (Fame 60–150) | €25.802 | €1.229 | €4.593 | 0.03 | 0.03 | 5.74 | 1.16 | 0.99 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €31.286 | €4.849 | €4.344 | 0.11 | 0.05 | 6.4 | 1.2 | 1.06 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## KPI-Holdout-Validierung

Die KPI-Geldbänder wurden aus einem neutralen Kontrolllauf abgeleitet. Dieselben Szenarien laufen hier erneut auf einem disjunkten Seed-Strom (`scenario-id-plus-holdout-marker-plus-run-index`, 260 Runs), damit das Urteil nicht allein auf der Kohorte beruht, gegen die kalibriert wurde.

Verglichen wird jedes KPI-Band einzeln, nicht nur der Gesamtstatus: ein Szenariovergleich würde ein kompensierendes Paar (ein Band kippt auf Fail, ein anderes auf Pass) hinter unverändertem Gesamturteil verbergen.

| Szenario | Band | Ziel | Kalibrierung | Holdout | Übereinstimmung |
|---|---|---|---|---|---|
| baseline_touring | Insolvenzrate | ≤ 10% | 0.38% ✅ | 0% ✅ | ✅ |
| baseline_touring | Endgeld | €14.000 – €46.000 | €28.913 ✅ | €28.678 ✅ | ✅ |
| baseline_touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1636.26 ✅ | 1593.92 ✅ | ✅ |
| bootstrap_struggle | Insolvenzrate | ≤ 60% | 10% ✅ | 12.31% ✅ | ✅ |
| bootstrap_struggle | Endgeld | €11.000 – €36.000 | €22.308 ✅ | €21.740 ✅ | ✅ |
| bootstrap_struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1404.7 ✅ | 1345 ✅ | ✅ |
| aggressive_marketing | Insolvenzrate | ≤ 15% | 1.92% ✅ | 4.23% ✅ | ✅ |
| aggressive_marketing | Endgeld | €14.000 – €44.000 | €27.788 ✅ | €27.148 ✅ | ✅ |
| aggressive_marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1643.08 ✅ | 1551.57 ✅ | ✅ |
| scandal_recovery | Insolvenzrate | ≤ 50% | 5.77% ✅ | 5.38% ✅ | ✅ |
| scandal_recovery | Endgeld | €12.000 – €39.000 | €24.222 ✅ | €24.491 ✅ | ✅ |
| scandal_recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1437.13 ✅ | 1537.28 ✅ | ✅ |
| festival_push | Insolvenzrate | ≤ 35% | 5% ✅ | 6.92% ✅ | ✅ |
| festival_push | Endgeld | €13.000 – €43.000 | €26.937 ✅ | €26.237 ✅ | ✅ |
| festival_push | Fame-Fortschritt/Gig | 1000 – 2200 | 1650.33 ✅ | 1623.18 ✅ | ✅ |
| chaos_tour | Insolvenzrate | ≤ 25% | 4.62% ✅ | 5.77% ✅ | ✅ |
| chaos_tour | Endgeld | €12.000 – €39.000 | €24.341 ✅ | €24.101 ✅ | ✅ |
| chaos_tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1484.75 ✅ | 1441.4 ✅ | ✅ |
| cult_hypergrowth | Insolvenzrate | ≤ 12% | 1.92% ✅ | 4.23% ✅ | ✅ |
| cult_hypergrowth | Endgeld | €14.000 – €45.000 | €28.107 ✅ | €27.829 ✅ | ✅ |
| cult_hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1590.42 ✅ | 1569.06 ✅ | ✅ |

✅ Jedes einzelne KPI-Band urteilt auf unabhängigen Seeds gleich.

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €2.841 | €6.022 | €8.226 | €28.913 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.391 | €3.764 | €4.740 | €22.308 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €2.900 | €6.413 | €8.516 | €27.788 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €1.823 | €4.151 | €5.756 | €24.222 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €2.191 | €5.462 | €7.509 | €26.937 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €2.188 | €4.534 | €6.182 | €24.341 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €2.959 | €6.744 | €9.015 | €28.107 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €2.047 | €4.155 | €5.654 | €24.773 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €1.113 | €2.001 | €2.596 | €19.056 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.835 | €4.025 | €5.572 | €24.205 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.009 | €5.367 | €6.966 | €25.791 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €7.704 | €10.567 | €12.472 | €31.245 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.168 | €89 | 46.9× | 3 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €4.142 | €107 | 42.1× | 3.02 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Aggressive Marketing | €4.979 | €107 | 46.6× | 2.51 | 0.16 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Scandal Recovery | €4.440 | €107 | 43.1× | 2.82 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Festival Push | €4.895 | €110 | 45.8× | 2.55 | 0.17 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Chaos Tour | €4.308 | €102 | 43.4× | 2.9 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Cult Hypergrowth | €5.042 | €108 | 47.2× | 2.48 | 0.16 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| No Social (Fame 0-50) | €4.150 | €99 | 42.7× | 3.01 | 0.2 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| High Controversy | €3.201 | €89 | 39.3× | 3.91 | 0.25 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €4.215 | €101 | 42.8× | 2.97 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Mid Game Probe (Fame 60–150) | €4.593 | €109 | 41.4× | 2.72 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Late Game Probe (Fame 175+) | €4.344 | €102 | 42.5× | 2.88 | 0.19 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.2 | 63 | 10.6% | 63.2% | 26.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 6.9 | 54 | 22.6% | 60.5% | 16.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 5.9 | 65 | 8.4% | 57.6% | 34% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.5 | 58 | 14.5% | 64.3% | 21.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.2 | 66 | 3.7% | 48.9% | 47.4% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 7.2 | 55 | 25.2% | 60.3% | 14.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6 | 64 | 7.2% | 63.8% | 28.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.7 | 59 | 15.9% | 63.9% | 20.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 56 | 24.8% | 61.1% | 14% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 6.7 | 58 | 16.6% | 63.2% | 20.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 6.5 | 62 | 13.3% | 65% | 21.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.1 | 64 | 9.1% | 62.5% | 28.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 49 | 0 | 0.08 | 0.01 | 1.07 | 1.51 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 43 | 0 | 0.04 | 0 | 0.93 | 1.07 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Aggressive Marketing | 51 | 0 | 0.02 | 0 | 1.08 | 1.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 46 | 0 | 0.05 | 0 | 1.11 | 1.08 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 53 | 0 | 0.03 | 0 | 1.02 | 1.11 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 36 | 0 | 0.04 | 0.01 | 1.2 | 1.14 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | 0 | 0.05 | 0 | 1.2 | 1.3 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 45 | 0 | 0 | 0 | 0.99 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 42 | 0.1 | 0.02 | 0 | 0.95 | 1.02 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Early Game Probe (Fame 0–50) | 44 | 0 | 0.03 | 0.01 | 1.12 | 1.3 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 46 | 0 | 0.02 | 0 | 1.15 | 1.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 52 | 0 | 0.05 | 0 | 1.07 | 1.69 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.12 | 0.18 | 0.23 | 0.13 | 0.52 | 1.18 | 11.7 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.19 | 0.3 | 0.28 | 0.2 | 0.63 | 1.14 | 10.33 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.19 | 0.34 | 0.35 | 0.24 | 0.79 | 1.3 | 11.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.27 | 0.4 | 0.43 | 0.31 | 0.88 | 1.27 | 10.82 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.1 | 0.25 | 0.23 | 0.2 | 0.5 | 1.11 | 10.8 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.27 | 0.46 | 0.53 | 0.41 | 1.19 | 1.21 | 11.06 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.23 | 0.29 | 0.33 | 0.17 | 0.69 | 1.15 | 11.51 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.26 | 0.29 | 0.35 | 0.17 | 0.58 | 1.19 | 11.12 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.17 | 0.26 | 0.25 | 0.21 | 0.58 | 1.15 | 10.15 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.13 | 0.19 | 0.2 | 0.1 | 0.39 | 1.12 | 10.94 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.12 | 0.25 | 0.23 | 0.17 | 0.53 | 1.18 | 11.6 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.19 | 0.29 | 0.37 | 0.2 | 0.85 | 1.18 | 12.13 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 8.67 | 2.89 | 2.93 | 2.85 | 17.34 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 5.9 | 1.97 | 1.98 | 1.95 | 11.8 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 6.93 | 2.27 | 2.45 | 2.2 | 13.85 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 6.23 | 2.13 | 2.03 | 2.08 | 12.47 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 6.45 | 2.21 | 2.12 | 2.12 | 12.9 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 6.66 | 2.2 | 2.19 | 2.28 | 13.33 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 6.97 | 2.29 | 2.27 | 2.41 | 13.94 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 6.88 | 2.21 | 2.34 | 2.33 | 13.76 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 6.41 | 2.07 | 2.19 | 2.15 | 12.82 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 6.62 | 2.3 | 2.19 | 2.13 | 13.24 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 6.72 | 2.2 | 2.23 | 2.29 | 13.44 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 8.79 | 2.94 | 2.92 | 2.93 | 17.58 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.35 | 0.17 | 0.13 | 0.32 | 0.35 | 2.05 | €1 | 0 | 99.6% |
| Bootstrap Struggle | 0.21 | 0.11 | 0.09 | 0.29 | 0.21 | 1.62 | €1 | 0 | 88.5% |
| Aggressive Marketing | 0.39 | 0.17 | 0.12 | 0.32 | 0.39 | 1.46 | €0 | 0 | 98.1% |
| Scandal Recovery | 0.21 | 0.09 | 0.07 | 0.31 | 0.21 | 1.72 | €0 | 0 | 93.5% |
| Festival Push | 0.32 | 0.15 | 0.14 | 0.33 | 0.32 | 0.96 | €1 | 0 | 95.4% |
| Chaos Tour | 0.28 | 0.13 | 0.1 | 0.29 | 0.28 | 1.58 | €0 | 0 | 93.5% |
| Cult Hypergrowth | 0.4 | 0.15 | 0.15 | 0.31 | 0.4 | 1.87 | €1 | 0 | 98.1% |
| No Social (Fame 0-50) | 0.16 | 0.06 | 0.05 | 0.3 | 0.16 | 1.35 | €0 | 0 | 95.8% |
| High Controversy | 0.08 | 0.05 | 0.03 | 0.31 | 0.08 | 1.68 | €33 | 0 | 91.5% |
| Early Game Probe (Fame 0–50) | 0.25 | 0.13 | 0.06 | 0.33 | 0.25 | 1.74 | €1 | 0 | 95% |
| Mid Game Probe (Fame 60–150) | 0.31 | 0.13 | 0.11 | 0.35 | 0.31 | 1.92 | €0 | 0 | 99.6% |
| Late Game Probe (Fame 175+) | 0.68 | 0.3 | 0.33 | 0.3 | 0.68 | 2.2 | €0 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €31.245 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 11099 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **High Controversy** | 11.92% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €5.042 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €31.286 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 8.79 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 2.87 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 14177 | 3077 | 0 | 3077 | 0 | 0 | 260/260 |
| Bootstrap Struggle | 9073 | 2780 | 0 | 2780 | 1 | 0 | 260/260 |
| Aggressive Marketing | 11587 | 2894 | 0 | 2894 | 0 | 0 | 260/260 |
| Scandal Recovery | 9508 | 2759 | 0 | 2759 | 0 | 0 | 260/260 |
| Festival Push | 11105 | 2790 | 0 | 2790 | 0 | 0 | 260/260 |
| Chaos Tour | 10272 | 2894 | 0 | 2894 | 3 | 0 | 260/260 |
| Cult Hypergrowth | 11165 | 3069 | 0 | 3069 | 1 | 0 | 260/260 |
| No Social (Fame 0-50) | 10466 | 2911 | 0 | 2911 | 0 | 0 | 260/260 |
| High Controversy | 9373 | 2451 | 0 | 2451 | 1 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 10426 | 2726 | 0 | 2726 | 1 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 10887 | 2849 | 0 | 2849 | 1 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 13832 | 3388 | 0 | 3388 | 1 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €28.913 | €28.896 | €5.458 | €22.370 | €35.387 |
| Bootstrap Struggle | €22.308 | €24.267 | €8.505 | €6.328 | €29.612 |
| Aggressive Marketing | €27.788 | €27.692 | €7.089 | €20.504 | €36.470 |
| Scandal Recovery | €24.222 | €25.041 | €7.531 | €18.105 | €31.262 |
| Festival Push | €26.937 | €27.321 | €8.107 | €20.502 | €35.497 |
| Chaos Tour | €24.341 | €24.753 | €7.124 | €18.240 | €31.695 |
| Cult Hypergrowth | €28.107 | €28.315 | €6.940 | €21.649 | €36.034 |
| No Social (Fame 0-50) | €24.773 | €25.485 | €6.271 | €19.752 | €31.031 |
| High Controversy | €19.056 | €21.027 | €8.383 | €0 | €26.759 |
| Early Game Probe (Fame 0–50) | €24.205 | €24.464 | €6.768 | €19.899 | €31.440 |
| Mid Game Probe (Fame 60–150) | €25.791 | €25.533 | €4.716 | €20.605 | €31.775 |
| Late Game Probe (Fame 175+) | €31.245 | €30.671 | €6.053 | €24.114 | €39.432 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 26 | 260 | 10.00% | 6.92% | 14.25% |
| Aggressive Marketing | 5 | 260 | 1.92% | 0.82% | 4.42% |
| Scandal Recovery | 15 | 260 | 5.77% | 3.53% | 9.30% |
| Festival Push | 13 | 260 | 5.00% | 2.94% | 8.37% |
| Chaos Tour | 12 | 260 | 4.62% | 2.66% | 7.89% |
| Cult Hypergrowth | 5 | 260 | 1.92% | 0.82% | 4.42% |
| No Social (Fame 0-50) | 9 | 260 | 3.46% | 1.83% | 6.45% |
| High Controversy | 31 | 260 | 11.92% | 8.53% | 16.43% |
| Early Game Probe (Fame 0–50) | 12 | 260 | 4.62% | 2.66% | 7.89% |
| Mid Game Probe (Fame 60–150) | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Insolvenz-Zielkorridore (Designmetrik, nicht blockierend)

Die Sicherheitsobergrenzen in `KPI_TARGETS.bankruptcyMax` beantworten nur, ob ein Szenario grundsätzlich spielbar ist. Nach dem Einkommensschub charakterisieren sie das beobachtete Risiko nicht mehr: fast jede weitere Einnahmenerhöhung besteht sie weiterhin, während das Spiel zunehmend risikofrei wird. Die Korridore hier beschreiben das *beabsichtigte* Risikoband.

Zielkorridore sind Designhypothesen und blockieren nichts. Harte Gates bleiben die Sicherheitsobergrenzen in KPI_TARGETS.bankruptcyMax. `below_target` heißt „sicherer als beabsichtigt“ — ein Hinweis, kein Fehlschlag.

| Szenario | Beobachtet | Zielkorridor | Safety-Max | 95%-Intervall (Wilson) | Intervall vs. Korridor | Kalibrierung | Holdout | Risikoband | Status |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Baseline Touring | 0.38% | 1–5% | 10% | 0.07–2.15% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Bootstrap Struggle | 10.00% | 15–30% | 60% | 6.92–14.25% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Aggressive Marketing | 1.92% | 2–8% | 15% | 0.82–4.42% | straddles_lower | below_target | within_target | unstable_boundary | 🟡 unstable |
| Scandal Recovery | 5.77% | 8–20% | 50% | 3.53–9.30% | straddles_lower | below_target | below_target | stable | 🔵 low_risk |
| Festival Push | 5.00% | 5–15% | 35% | 2.94–8.37% | straddles_lower | within_target | within_target | stable | 🟢 healthy |
| Chaos Tour | 4.62% | 8–20% | 25% | 2.66–7.89% | entirely_below | below_target | below_target | stable | 🔵 low_risk |
| Cult Hypergrowth | 1.92% | 2–10% | 12% | 0.82–4.42% | straddles_lower | below_target | within_target | unstable_boundary | 🟡 unstable |

Das Wilson-Intervall steht bewusst neben dem Punktwert: eine Rate kann im Korridor liegen, während der plausible Bereich darunter hinausreicht — das ist „auf der unteren Designgrenze“, was ein reines Pass/Fail nicht sagen kann.

### Weiche Design-Warnungen

Diese Punkte erscheinen im Report, blockieren aber nichts:

- ⚠️ baseline_touring: Insolvenzrate 0.38% liegt unter dem Zielkorridor 1–5% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ bootstrap_struggle: Insolvenzrate 10% liegt unter dem Zielkorridor 15–30% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ aggressive_marketing: Kalibrierung und Holdout ordnen die Rate 1.92% unterschiedlich zum Korridor 2–8% ein — das Szenario liegt auf einer Korridorgrenze.
- ⚠️ scandal_recovery: Insolvenzrate 5.77% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ chaos_tour: Insolvenzrate 4.62% liegt unter dem Zielkorridor 8–20% — das Szenario ist sicherer als beabsichtigt.
- ⚠️ cult_hypergrowth: Kalibrierung und Holdout ordnen die Rate 1.92% unterschiedlich zum Korridor 2–10% ein — das Szenario liegt auf einer Korridorgrenze.

## Financial-Stress-Profil

Insolvenz ist über zehn Tage ein seltenes Endereignis: ein Run kann dauerhaft unter wirtschaftlichem Druck stehen, ohne formal insolvent zu werden. Die folgenden Werte messen den Druck selbst, gemessen an €500 (knapp) und €250 (kritisch), Geldstand jeweils zu Tagesbeginn. Es sind reine Beobachtungen ohne Zielwerte — Untergrenzen dafür sollten aus gemessenem Verhalten kommen, nicht aus einer Annahme.

| Szenario | Insolvenz | je < €500 | je < €250 | Saldo 0 | Ø Tage < €500 | Drawdown Median | Drawdown P90 | Solventes P10-Endgeld | Median Insolvenztag | Kredit/Grant |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.38% | 4.23% | 1.15% | 0% | 0.06 | 9.86% | 45.89% | €22.438 | 4 | 16.15% |
| Bootstrap Struggle | 10% | 66.54% | 33.85% | 1.92% | 1.17 | 37.97% | 87.2% | €19.739 | 4 | 11.15% |
| Aggressive Marketing | 1.92% | 64.62% | 13.46% | 0% | 0.78 | 29.6% | 66.84% | €21.025 | 4 | 15.77% |
| Scandal Recovery | 5.77% | 67.69% | 30.38% | 1.15% | 1.05 | 34.56% | 72.82% | €20.029 | 4 | 9.23% |
| Festival Push | 5% | 66.54% | 35% | 0.77% | 1.05 | 35.17% | 73.1% | €21.908 | 4 | 14.62% |
| Chaos Tour | 4.62% | 67.69% | 13.08% | 0.77% | 0.87 | 32.71% | 70.48% | €19.749 | 4 | 11.92% |
| Cult Hypergrowth | 1.92% | 64.23% | 16.92% | 0% | 0.79 | 29.6% | 66.01% | €21.926 | 4 | 12.69% |
| No Social (Fame 0-50) | 3.46% | 64.23% | 11.92% | 0.38% | 0.81 | 28.65% | 64.7% | €20.857 | 4 | 6.15% |
| High Controversy | 11.92% | 73.08% | 26.54% | 2.31% | 1.33 | 39.62% | 84.3% | €16.838 | 5 | 4.23% |
| Early Game Probe (Fame 0–50) | 4.62% | 69.23% | 16.54% | 0.77% | 0.95 | 30.8% | 67.9% | €20.817 | 4 | 13.08% |
| Mid Game Probe (Fame 60–150) | 0.38% | 4.62% | 1.92% | 0% | 0.06 | 21.77% | 62.87% | €20.682 | 5 | 12.31% |
| Late Game Probe (Fame 175+) | 0% | 0% | 0% | 0% | 0 | 12.29% | 52.94% | €24.114 | — | 26.15% |

„Kredit/Grant“ zählt Runs, die einen Kredit aufgenommen oder den Notfall-Zuschuss erhalten haben. Das ist *unterstützt*, nicht *ohne diese Option gescheitert* — dafür bräuchte es einen gepaarten Lauf mit entfernter Option.

Zwei Spalten tragen kaum Signal und sagen warum: „je < €500“ sättigt bei 100%, weil der Startstand selbst €500 beträgt und ein einziger Tag ohne Gig darunter führt — aussagekräftig sind hier die Tage-Spalte und die €250-Marke. „Saldo 0“ bleibt bei 0%, weil ein Stand von genau €0 nur überlebt, wenn der Tagesnetto die Pflichten deckt; andernfalls ist derselbe Moment bereits die Insolvenzprüfung. Der Nullstand ist damit praktisch der Insolvenzzeitpunkt selbst und kein eigenständig beobachtbarer Zustand.

## Reale Tourpfade

Die Venue-Wahl läuft über eine echte generierte Karte: ein Knoten verbindet nur auf einen oder zwei Knoten der nächsten Ebene, frühe Ebenen tragen leichte Venues, und das Finale liegt auf Ebene 10. Vorher wurde jede Venue frei aus dem gesamten Katalog gezogen — eine Erreichbarkeit, die das Spiel nicht anbietet.

| Szenario | Gigs | Ankünfte | Ebene erreicht (max 10) | Finale erreicht | Ankünfte ohne Bühne | Sackgassen |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 8.67 | 9.97 | 9.97 | 99.23% | 1.3 | 0 |
| Bootstrap Struggle | 5.90 | 9.3 | 9.3 | 89.62% | 3.4 | 0 |
| Aggressive Marketing | 6.93 | 9.86 | 9.86 | 98.08% | 2.93 | 0 |
| Scandal Recovery | 6.23 | 9.59 | 9.59 | 94.23% | 3.35 | 0 |
| Festival Push | 6.45 | 9.65 | 9.65 | 94.62% | 3.2 | 0 |
| Chaos Tour | 6.66 | 9.67 | 9.67 | 95.38% | 2.99 | 0 |
| Cult Hypergrowth | 6.97 | 9.87 | 9.87 | 97.69% | 2.9 | 0 |
| No Social (Fame 0-50) | 6.88 | 9.76 | 9.76 | 96.54% | 2.88 | 0 |
| High Controversy | 6.41 | 9.24 | 9.24 | 83.85% | 2.83 | 0 |
| Early Game Probe (Fame 0–50) | 6.62 | 9.67 | 9.67 | 95% | 3.05 | 0 |
| Mid Game Probe (Fame 60–150) | 6.72 | 9.98 | 9.98 | 99.62% | 3.25 | 0 |
| Late Game Probe (Fame 175+) | 8.79 | 10 | 10 | 100% | 1.21 | 0 |

Knotentypen über alle Ankünfte: GIG 66.98% · FESTIVAL 10.03% · FINALE 9.95% · REST_STOP 4.94% · SUPPLY_STOP 4.32% · SPECIAL 3.78% (Beispiel Baseline Touring).

**Korrektur einer früheren Schlussfolgerung.** Ein vorheriger Stand dieses Reports las die Ebenenreichweite als Struktureigenschaft der Karte und schloss, nur täglich spielende Bands könnten die Tour beenden. Das war ein Artefakt des Simulators: Nicht-Auftrittstage beendeten den Tag vor jeder Routenbewegung, also reiste eine Band mit Vier-Tage-Kadenz nur zwei Hops weit und zahlte an den übrigen Tagen bloß Kosten. Reisen und Auftreten sind im Spiel unabhängig — `useHandleTravel` prüft Sichtbarkeit, gerichtete Kante und Geld/Treibstoff, nie ob am aktuellen Knoten gespielt wurde. Mit täglicher Fahrt erreichen 12 von 12 Szenarien das Finale (Baseline Touring 99.23%, Bootstrap Struggle 89.62%, Aggressive Marketing 98.08%, Scandal Recovery 94.23%, Festival Push 94.62%, Chaos Tour 95.38%, Cult Hypergrowth 97.69%, No Social (Fame 0-50) 96.54%, High Controversy 83.85%, Early Game Probe (Fame 0–50) 95%, Mid Game Probe (Fame 60–150) 99.62%, Late Game Probe (Fame 175+) 100%), und die Ebenenreichweite ist über alle Kadenzen praktisch gleich. Die Kadenz wirkt nur noch über die Streckenwahl: Ankunft an einem Gig-Knoten startet in Produktion immer die Show, es gibt kein Überspringen, und da rund 70 Prozent der Knoten bespielbar sind kann eine Band ihre Auftrittsdichte nur begrenzt drücken. Ein wirtschaftlicher Vorteil dichter Touren bleibt damit messbar, ist aber weit kleiner als zuvor berichtet — und er ist keine Aussage mehr darüber, wer die Tour überhaupt beenden kann.

Modellgrenzen: Ein Ruhetag ist eine explizite Aktion und verbraucht den Tag am Ort; jeder andere Tag ist eine Fahrt, weil das Spiel keine Warten-Aktion kennt. `gigGapDays` steuert nur die Streckenpräferenz, nicht die Zahl der Hops. Nicht modelliert bleiben Notverkäufe, Kreditentscheidungen an realen Zeitpunkten und die Supply-Stop-Auswahl.

## Kaufpfade und Progression

Am Ende genug Geld zu besitzen ist nicht dasselbe wie während der Tour sinnvoll kaufen zu können. Das Fame-Shop-Audit beantwortet nur die erste Frage; hier steht, *wann* gekauft wird, was erreichbar bleibt und was am Geld scheitert. Katalogumfang: 67 Artikel.

| Szenario | 1. Kauf (Median Tag) | Van erreicht | Van (Median Tag) | HQ erreicht | HQ (Median Tag) | Ø Artikel | Kataloganteil | Erster Kauf typisch | Ø Geld vor Kauf | Ø Restliquidität | Ø verpasste Käufe | Ø Liquiditätsvorbehalt | Unbezahlbar Tag 5 | Bezahlbar Tag 5 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 98.08% | 3 | 93.46% | 3 | 10.65 | 15.9% | MERCH | €6.997,66 | €6.454,28 | 0.76 | 0.2 | 1.92 | 59.27 |
| Bootstrap Struggle | 1 | 90% | 4 | 88.08% | 2 | 9.38 | 14% | MERCH | €4.395,37 | €4.101,32 | 1.45 | 0.36 | 3.35 | 58.19 |
| Aggressive Marketing | 1 | 98.08% | 4 | 92.31% | 2 | 10.38 | 15.49% | MERCH | €6.757,66 | €6.208,29 | 1.25 | 0.3 | 2.06 | 59.25 |
| Scandal Recovery | 1 | 93.08% | 4 | 93.08% | 2 | 9.84 | 14.68% | HQ | €4.763,83 | €4.472,5 | 1.47 | 0.38 | 3.46 | 57.91 |
| Festival Push | 1 | 94.23% | 4 | 91.15% | 2 | 9.85 | 14.7% | MERCH | €6.253,99 | €5.809,83 | 1.35 | 0.36 | 2.9 | 58.57 |
| Chaos Tour | 1 | 93.85% | 4 | 90.77% | 2 | 10.03 | 14.98% | MERCH | €4.948,89 | €4.595,37 | 1.23 | 0.32 | 3.04 | 58.23 |
| Cult Hypergrowth | 1 | 97.69% | 4 | 91.15% | 2 | 10.29 | 15.36% | HQ | €7.083,56 | €6.473,06 | 1.23 | 0.27 | 2.04 | 59.22 |
| No Social (Fame 0-50) | 1 | 96.15% | 3 | 90% | 2 | 10.13 | 15.13% | MERCH | €4.692,99 | €4.447,29 | 1.34 | 0.27 | 2.86 | 58.41 |
| High Controversy | 1 | 91.92% | 4 | 88.85% | 2 | 9.42 | 14.06% | MERCH | €2.873,94 | €2.698,53 | 1.5 | 0.52 | 4.36 | 56.91 |
| Early Game Probe (Fame 0–50) | 1 | 96.15% | 4 | 90.77% | 2 | 10.04 | 14.98% | HQ | €4.732,87 | €4.454,15 | 1.31 | 0.35 | 3.08 | 58.22 |
| Mid Game Probe (Fame 60–150) | 1 | 98.46% | 3 | 90.77% | 3 | 10.5 | 15.68% | INSTRUMENT | €5.657,48 | €5.299,15 | 1.3 | 0.05 | 2.96 | 58.11 |
| Late Game Probe (Fame 175+) | 1 | 98.85% | 2 | 93.85% | 4 | 10.84 | 16.18% | GEAR | €11.387,29 | €10.419,58 | 0.62 | 0.01 | 0.97 | 59.99 |

„Verpasste Käufe“ sind Artikel, die der simulierte Käufer wollte und nicht bezahlen konnte (`insufficient_funds`). „Liquiditätsvorbehalt“ zählt getrennt die Fälle, in denen derselbe Käufer den Artikel bezahlen könnte, aber seine Reserve nicht antasten will — zwei Tage der laufenden Verpflichtungen aus `getTotalDailyObligations`, mindestens €150 für den nächsten Hop. Beide Zahlen beschreiben das Entscheidungsmodell der Simulation, nicht das Verhalten echter Spieler; Kaufreihenfolge und Kaufanteil bleiben Heuristik-Artefakte und sind keine Designbefunde.

## Gig-Frequenz, Reisekosten und Amortisation

Diagnostisch, nicht wertend: ob die Dominanz dichter Touren ein Balancefehler oder eine beabsichtigte Belohnung für aktiveres Spielen ist, wird hier gemessen und nicht entschieden.

| Szenario | Gig-Netto/Kalendertag | Gig-Netto/Gig | Gigs/Kalendertag | Ø Ruhetage | Ruhetaganteil | Reisekosten je Gig | Reisekostenanteil am Netto | Katalog < 1 Gig |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €3.613 | €4.158 | 0.869 | 0 | 0.04% | €89 | 2.13% | 95.35% |
| Bootstrap Struggle | €2.825 | €4.504 | 0.627 | 0 | 0.04% | €107 | 2.38% | 95.35% |
| Aggressive Marketing | €3.505 | €5.000 | 0.701 | 0 | 0% | €107 | 2.15% | 95.35% |
| Scandal Recovery | €2.980 | €4.611 | 0.646 | 0 | 0% | €107 | 2.32% | 95.35% |
| Festival Push | €3.360 | €5.053 | 0.665 | 0 | 0.04% | €110 | 2.18% | 95.35% |
| Chaos Tour | €3.050 | €4.448 | 0.686 | 0 | 0% | €102 | 2.3% | 95.35% |
| Cult Hypergrowth | €3.575 | €5.078 | 0.704 | 0 | 0.04% | €108 | 2.12% | 95.35% |
| No Social (Fame 0-50) | €2.959 | €4.211 | 0.703 | 0 | 0% | €99 | 2.34% | 95.35% |
| High Controversy | €2.366 | €3.476 | 0.681 | 0.05 | 0.53% | €89 | 2.55% | 95.35% |
| Early Game Probe (Fame 0–50) | €2.955 | €4.341 | 0.681 | 0 | 0.04% | €101 | 2.34% | 95.35% |
| Mid Game Probe (Fame 60–150) | €3.039 | €4.511 | 0.674 | 0 | 0% | €109 | 2.42% | 95.35% |
| Late Game Probe (Fame 175+) | €3.800 | €4.324 | 0.879 | 0 | 0% | €102 | 2.35% | 95.35% |

„Katalog < 1 Gig“ ist der Anteil der 43 geldbepreisten Artikel, deren Kosten unter dem Netto eines einzelnen Gigs liegen — die messbare Form von „günstige Upgrades amortisieren sich in weniger als einem Gig“. Eine echte Amortisationszeit ist damit nicht berechnet: dafür bräuchte jeder Artikel ein modelliertes Ertragsdelta, das die Simulation nicht führt.

**Ruhetage sind selten, aber nicht unmöglich — und der Grund hat sich mit der echten Reise verschoben.** Der Auslöser nutzt die Marken, die das Spiel im HUD als niedrig anzeigt (Stamina unter 35, Mood unter 50), und wird inzwischen an jedem Tag geprüft, nicht nur an Auftrittstagen. Über alle Szenarien sinkt die niedrigste Stamina auf 36 und die niedrigste Mood auf 44, die Marken werden also unterschritten. Dass daraus fast keine Ruhetage entstehen, liegt an den Rastplatz-Knoten: bei täglicher Fahrt passiert eine Band im Schnitt rund einen pro Tour und erhält dort die kanonische Erholung (+20 Stamina / +10 Mood, `avgRestStopArrivals`), was die Mitglieder meist über der Pflegeschwelle hält. Messbar geruht wird bislang nur im Szenario mit hoher Controversy. Die Harmony sinkt bis 1 und ist trotzdem kein Ruhegrund, weil Ruhe sie nicht repariert. Ein belastbarer Wert für die Opportunitätskosten einer Pause fehlt damit weiterhin, weil die Stichprobe an Ruhetagen zu klein ist. `foregoneGigNetPerRestDayUpperBound` entspricht bei null Ruhetagen genau dem Gig-Netto und ist deshalb nicht als Spalte geführt.

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €28.913 | 259 / €29.025 | 1 / €0 |
| Bootstrap Struggle | 260 / €22.308 | 234 / €24.787 | 26 / €0 |
| Aggressive Marketing | 260 / €27.788 | 255 / €28.333 | 5 / €0 |
| Scandal Recovery | 260 / €24.222 | 245 / €25.705 | 15 / €0 |
| Festival Push | 260 / €26.937 | 247 / €28.354 | 13 / €0 |
| Chaos Tour | 260 / €24.341 | 248 / €25.519 | 12 / €0 |
| Cult Hypergrowth | 260 / €28.107 | 255 / €28.658 | 5 / €0 |
| No Social (Fame 0-50) | 260 / €24.773 | 251 / €25.661 | 9 / €0 |
| High Controversy | 260 / €19.056 | 229 / €21.636 | 31 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €24.205 | 248 / €25.377 | 12 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €25.791 | 259 / €25.890 | 1 / €0 |
| Late Game Probe (Fame 175+) | 260 / €31.245 | 260 / €31.245 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €5.458 | 0.1888 | 17.15% | 45.89% |
| Bootstrap Struggle | €8.505 | 0.3813 | 44.77% | 87.20% |
| Aggressive Marketing | €7.089 | 0.2551 | 35.86% | 66.84% |
| Scandal Recovery | €7.531 | 0.3109 | 40.94% | 72.82% |
| Festival Push | €8.107 | 0.301 | 41.20% | 73.10% |
| Chaos Tour | €7.124 | 0.2927 | 37.44% | 70.48% |
| Cult Hypergrowth | €6.940 | 0.2469 | 34.69% | 66.01% |
| No Social (Fame 0-50) | €6.271 | 0.2531 | 32.96% | 64.70% |
| High Controversy | €8.383 | 0.4399 | 46.23% | 84.30% |
| Early Game Probe (Fame 0–50) | €6.768 | 0.2796 | 36.79% | 67.90% |
| Mid Game Probe (Fame 60–150) | €4.716 | 0.1829 | 28.11% | 62.87% |
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
| brandDeals | ✅ | 27494 | 134 | 28 |
| postOptions | ✅ | 3534 | 3534 | 25 |
| socialTrends | ✅ | 30323 | 3691 | 5 |
| contraband | ✅ | 30323 | 3347 | 37 |
| minigamesTravel | ✅ | 21639 | 12652 | - |
| minigamesRoadie | ✅ | 7194 | 6398 | - |
| minigamesKabelsalat | ✅ | 7237 | 5052 | - |
| minigamesAmp | ✅ | 7208 | 5064 | - |
| sponsorship | ✅ | 27786 | 109 | - |
| restStops | ✅ | 30323 | 0 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario, kalibriert auf eine vollständige map-gebundene 10-Tage-Tour.

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €14.000 – €46.000 | €28.913 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1636.26 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 10% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €11.000 – €36.000 | €22.308 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1404.7 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €14.000 – €44.000 | €27.788 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1643.08 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 5.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €12.000 – €39.000 | €24.222 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1437.13 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 5% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €13.000 – €43.000 | €26.937 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1650.33 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.62% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €12.000 – €39.000 | €24.341 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1484.75 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €14.000 – €45.000 | €28.107 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1590.42 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €0 | 0 | 0 |
| Bootstrap Struggle | -27.31% | €21.395 | -23.02 | 4.48 |
| Aggressive Marketing | -2.31% | €20.189 | 6.47 | 2.78 |
| Scandal Recovery | -4.61% | €21.435 | -81.13 | 3.69 |
| Festival Push | -2.31% | €22.852 | -4.38 | 3.89 |
| Chaos Tour | 0.39% | €18.723 | -25.84 | 2.47 |
| Cult Hypergrowth | -3.08% | €20.544 | -80.21 | 2.77 |
| No Social (Fame 0-50) | -4.23% | €20.105 | -16.7 | 2.76 |
| High Controversy | -7.7% | €16.768 | -108.41 | 2.54 |
| Early Game Probe (Fame 0–50) | -1.92% | €19.550 | -89.35 | 2.57 |
| Mid Game Probe (Fame 60–150) | -0.77% | €19.889 | 73.91 | 2.53 |
| Late Game Probe (Fame 175+) | 0% | €0 | 0 | 0 |

## Kurzfazit

- Höchstes Risiko: **High Controversy** mit 11.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €31.245 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 2.87 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

### Designrisiko-Zusammenfassung (nicht blockierend)
- Sicherheitsgates: 7/7 Szenarien unter ihrer harten Insolvenzgrenze; 0 ohne Korridorurteil.
- Risikobänder: low_risk 4 · unstable 2 · healthy 1.
- ⚠️ 6 weiche Designwarnung(en) — siehe „Insolvenz-Zielkorridore“. Insolvenz ist damit nicht mehr der primäre Spannungsindikator; die weitere Bewertung läuft über Drawdown, Liquiditätsdruck und Kaufentscheidungen.

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
