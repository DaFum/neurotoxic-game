# Game Balance Simulation – Analyse

Erstellt am: 2026-07-27T19:37:02.604Z

## Reproduzierbarkeit

- Report-Version: 12
- Node-Version: v22.22.2
- Basis-Commit: f293f8b016021a2d431a1171a3c0817b325d74f9
- Working Tree Dirty: Nein
- Simulationsskript SHA-256: 988ff7bb80f1e37497b93d8e148a86138eb36a3ceaca4ccffe7b14ec23a03d0c
- Szenariokonfiguration SHA-256: 1983fe0b565a6495c034daf4a180d9173994f60782d9336d84d072c0140bc3fb
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
| 45 | 1150 | 3 | 8 | 12 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 50 | 1250 | 3 | 7 | 11 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 55 | 1350 | 2 | 7 | 10 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 60 | 1450 | 2 | 6 | 10 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 70 | 1650 | 2 | 5 | 8 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 1950 | 2 | 5 | 7 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 2250 | 2 | 5 | 7 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

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
| Baseline Touring | €500 | 0 | €29.500 | 26.23% | 0.03 | 4% | 13264 | 8 | 48 | 6.3 | 9.9 | 0 | 0% | €4.501 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €4.381 | 60.19% | 0.04 | 1.7% | 2147 | 3 | 52 | 1.43 | 1.83 | 0 | 17.31% | €2.652 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €17.794 | 26.88% | 0.03 | 5.3% | 6192 | 5 | 50 | 3.61 | 4.98 | 0 | 0.77% | €4.791 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €9.434 | 38.14% | 0.03 | 2.3% | 3396 | 4 | 51 | 2.02 | 2.98 | 0 | 1.15% | €3.746 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €11.270 | 37.21% | 0.03 | 4.8% | 3689 | 4 | 52 | 2.49 | 2.98 | 0 | 0.77% | €4.352 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €16.392 | 24.49% | 0.04 | 3.4% | 5353 | 5 | 38 | 4.47 | 4.95 | 0 | 0.38% | €4.180 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €19.182 | 27.58% | 0.03 | 4.9% | 6213 | 5 | 52 | 2.91 | 4.98 | 0 | 0.38% | €4.984 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €15.926 | 24.15% | 0.04 | 3.8% | 5839 | 5 | 46 | 0 | 5 | 0 | 0% | €4.030 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €12.362 | 27.63% | 0.05 | 2.3% | 5494 | 5 | 41 | 54.22 | 4.97 | 0.01 | 0.38% | €3.006 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €15.712 | 21.99% | 0.04 | 2.5% | 6079 | 5 | 45 | 2.87 | 4.99 | 0 | 0% | €3.913 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €17.673 | 19.67% | 0.04 | 2.9% | 5815 | 5 | 47 | 2.81 | 4.99 | 0 | 0% | €4.411 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €35.569 | 28.28% | 0.03 | 5.4% | 13768 | 8 | 49 | 7.14 | 9.95 | 0 | 0% | €4.961 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €31.524 | €500 | €4.501 | 0.17 | 0.08 | 3.31 | 1.02 | 1.29 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Bootstrap Struggle | €4.909 | €204 | €2.652 | 0 | 0.01 | 0.77 | 0 | 0.21 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €19.677 | €411 | €4.791 | 0.04 | 0.02 | 2.3 | 0.18 | 0.93 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Scandal Recovery | €10.178 | €316 | €3.746 | 0.03 | 0.03 | 1.54 | 0.01 | 0.53 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €12.005 | €319 | €4.352 | 0.02 | 0.02 | 1.86 | 0.01 | 0.53 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €17.444 | €412 | €4.180 | 0.05 | 0.05 | 2.35 | 0.11 | 0.78 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Cult Hypergrowth | €20.911 | €411 | €4.984 | 0.02 | 0.02 | 2.43 | 0.15 | 0.81 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| No Social (Fame 0-50) | €17.052 | €413 | €4.030 | 0 | 0 | 2.18 | 0.13 | 0.82 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| High Controversy | €12.853 | €380 | €3.006 | 0.04 | 0.03 | 2.03 | 0.17 | 0.85 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €16.420 | €412 | €3.913 | 0.05 | 0.03 | 2.17 | 0.15 | 0.89 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €19.035 | €1.390 | €4.411 | 0.05 | 0.03 | 2.49 | 0.21 | 0.93 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Late Game Probe (Fame 175+) | €36.953 | €4.999 | €4.961 | 0.14 | 0.07 | 3.6 | 1.08 | 1.21 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 3 | Ø Geld Tag 5 | Ø Geld Tag 7 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €7.530 | €16.432 | €20.987 | €29.500 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €327 | €938 | €676 | €4.381 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €1.671 | €8.448 | €13.199 | €17.794 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €327 | €1.091 | €6.457 | €9.434 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €327 | €1.448 | €7.800 | €11.270 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €1.349 | €6.904 | €10.867 | €16.392 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €1.694 | €8.518 | €13.380 | €19.182 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €1.127 | €6.319 | €10.596 | €15.926 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €683 | €3.916 | €7.031 | €12.362 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €1.207 | €6.695 | €10.373 | €15.712 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €3.742 | €9.075 | €13.112 | €17.673 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €14.179 | €21.695 | €24.896 | €35.569 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.501 | €87 | 51.8× | 2.78 | 0.18 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |
| Bootstrap Struggle | €2.652 | €47 | 61.4× | 4.71 | 0.31 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Aggressive Marketing | €4.791 | €74 | 64.5× | 2.61 | 0.17 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €3.746 | €57 | 66.4× | 3.34 | 0.22 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Festival Push | €4.352 | €59 | 74.2× | 2.87 | 0.19 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Chaos Tour | €4.180 | €71 | 58.8× | 2.99 | 0.19 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Cult Hypergrowth | €4.984 | €74 | 67.2× | 2.51 | 0.16 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| No Social (Fame 0-50) | €4.030 | €71 | 57.1× | 3.1 | 0.2 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| High Controversy | €3.006 | €65 | 46.7× | 4.16 | 0.27 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €3.913 | €71 | 55.1× | 3.19 | 0.21 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Mid Game Probe (Fame 60–150) | €4.411 | €78 | 56.7× | 2.83 | 0.18 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Late Game Probe (Fame 175+) | €4.961 | €94 | 52.9× | 2.52 | 0.16 | ⚠️ Van-Upgrade zu günstig – Preis anpassen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.8 | 60 | 17% | 65.3% | 17.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.1 | 58 | 19.6% | 70.1% | 10.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 12.9% | 68.3% | 18.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 6.8 | 60 | 17.1% | 67.3% | 15.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.8 | 66 | 4.3% | 65.1% | 30.7% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 7.6 | 55 | 33.4% | 56.3% | 10.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.6 | 61 | 12.4% | 70.3% | 17.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7.3 | 57 | 22.8% | 65.9% | 11.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.7 | 55 | 31.6% | 60.1% | 8.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.3 | 57 | 25.4% | 61.2% | 13.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19.6% | 70% | 10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.4 | 62 | 11.5% | 66.1% | 22.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 48 | 0 | 0.06 | 0 | 1.04 | 1.73 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Bootstrap Struggle | 52 | 0 | 0.01 | 0 | 1.12 | 0.39 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 50 | 0 | 0.02 | 0 | 1.2 | 0.81 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 0 | 0.03 | 0 | 1.11 | 0.53 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 52 | 0 | 0.02 | 0 | 1.12 | 0.56 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 38 | 0 | 0.03 | 0.01 | 1.1 | 0.96 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 52 | 0 | 0.01 | 0 | 1.12 | 0.8 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 46 | 0 | 0 | 0 | 1.09 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 41 | 0.01 | 0.03 | 0 | 1.07 | 0.85 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Early Game Probe (Fame 0–50) | 45 | 0 | 0.03 | 0.01 | 1.1 | 0.98 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Mid Game Probe (Fame 60–150) | 47 | 0 | 0.02 | 0 | 1.07 | 0.88 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 49 | 0 | 0.06 | 0 | 1.09 | 1.74 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.12 | 0.21 | 0.23 | 0.11 | 0.64 | 1.25 | 4.31 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Bootstrap Struggle | 0.21 | 0.3 | 0.19 | 0.03 | 0.18 | 1.12 | 1.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.24 | 0.33 | 0.39 | 0.1 | 0.67 | 1.12 | 3.16 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Scandal Recovery | 0.22 | 0.45 | 0.43 | 0.09 | 0.38 | 1.19 | 2.25 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push | 0.13 | 0.26 | 0.24 | 0.02 | 0.23 | 1.18 | 2.55 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.33 | 0.63 | 0.58 | 0.19 | 1 | 1.21 | 3.2 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Cult Hypergrowth | 0.19 | 0.35 | 0.29 | 0.12 | 0.53 | 1.27 | 3.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| No Social (Fame 0-50) | 0.2 | 0.3 | 0.32 | 0.13 | 0.49 | 1.14 | 3.11 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| High Controversy | 0.16 | 0.32 | 0.3 | 0.14 | 0.51 | 1.18 | 2.81 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Early Game Probe (Fame 0–50) | 0.1 | 0.19 | 0.21 | 0.03 | 0.3 | 1.3 | 3.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.11 | 0.25 | 0.24 | 0.08 | 0.33 | 1.14 | 3.76 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.2 | 0.28 | 0.3 | 0.23 | 0.92 | 1.13 | 4.83 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 9.9 | 3.24 | 3.33 | 3.33 | 19.8 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | 1.83 | 0.63 | 0.63 | 0.56 | 3.65 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 4.98 | 1.72 | 1.68 | 1.58 | 9.96 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | 2.98 | 0.99 | 1.01 | 0.97 | 5.95 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 2.98 | 1.06 | 0.95 | 0.98 | 5.97 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 4.95 | 1.65 | 1.68 | 1.62 | 9.9 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | 4.98 | 1.63 | 1.67 | 1.68 | 9.96 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | 5 | 1.65 | 1.61 | 1.75 | 10.01 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | 4.97 | 1.65 | 1.68 | 1.64 | 9.94 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | 4.99 | 1.62 | 1.59 | 1.78 | 9.98 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 4.99 | 1.64 | 1.67 | 1.69 | 9.99 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 9.95 | 3.3 | 3.36 | 3.3 | 19.91 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.61 | 0.13 | 0.34 | 0.33 | 0.61 | 1.84 | €0 | 0 | 100% |
| Bootstrap Struggle | 0.03 | 0.01 | 0 | 0.38 | 0.03 | 0.6 | €0 | 0 | 67.3% |
| Aggressive Marketing | 0.45 | 0.13 | 0.18 | 0.34 | 0.45 | 0.91 | €0 | 0 | 98.5% |
| Scandal Recovery | 0.18 | 0.09 | 0.07 | 0.35 | 0.18 | 0.75 | €0 | 0 | 89.2% |
| Festival Push | 0.25 | 0.14 | 0.06 | 0.32 | 0.25 | 0.43 | €0 | 0 | 98.1% |
| Chaos Tour | 0.4 | 0.15 | 0.12 | 0.33 | 0.4 | 1.13 | €0 | 0 | 88.8% |
| Cult Hypergrowth | 0.48 | 0.2 | 0.22 | 0.33 | 0.48 | 1.29 | €0 | 0 | 99.2% |
| No Social (Fame 0-50) | 0.38 | 0.15 | 0.14 | 0.31 | 0.38 | 0.88 | €0 | 0 | 95% |
| High Controversy | 0.18 | 0.1 | 0.07 | 0.29 | 0.18 | 1.1 | €4 | 0 | 88.5% |
| Early Game Probe (Fame 0–50) | 0.33 | 0.11 | 0.11 | 0.3 | 0.33 | 1.14 | €0 | 0 | 93.5% |
| Mid Game Probe (Fame 60–150) | 0.5 | 0.18 | 0.18 | 0.33 | 0.5 | 1.22 | €0 | 0 | 96.2% |
| Late Game Probe (Fame 175+) | 0.9 | 0.16 | 0.53 | 0.3 | 0.9 | 2.02 | €1 | 0 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €35.569 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 13768 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 17.31% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €4.984 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €36.953 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Late Game Probe (Fame 175+)** | 9.95 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 2.73 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 15125 | 1860 | 0 | 1860 | 1 | 0 | 260/260 |
| Bootstrap Struggle | 2674 | 527 | 0 | 527 | 0 | 0 | 260/260 |
| Aggressive Marketing | 7586 | 1393 | 0 | 1393 | 0 | 0 | 260/260 |
| Scandal Recovery | 4375 | 978 | 0 | 978 | 1 | 0 | 260/260 |
| Festival Push | 4870 | 1180 | 0 | 1180 | 0 | 0 | 260/260 |
| Chaos Tour | 6935 | 1581 | 0 | 1581 | 1 | 0 | 260/260 |
| Cult Hypergrowth | 7823 | 1610 | 0 | 1610 | 0 | 0 | 260/260 |
| No Social (Fame 0-50) | 7324 | 1484 | 0 | 1484 | 1 | 0 | 260/260 |
| High Controversy | 6858 | 1362 | 0 | 1362 | 1 | 0 | 260/260 |
| Early Game Probe (Fame 0–50) | 7504 | 1425 | 0 | 1425 | 0 | 0 | 260/260 |
| Mid Game Probe (Fame 60–150) | 7336 | 1581 | 0 | 1581 | 1 | 0 | 260/260 |
| Late Game Probe (Fame 175+) | 15546 | 1952 | 0 | 1952 | 1 | 0 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*

| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €29.500 | €28.884 | €9.321 | €18.091 | €42.036 |
| Bootstrap Struggle | €4.381 | €3.873 | €3.323 | €0 | €8.086 |
| Aggressive Marketing | €17.794 | €17.468 | €5.044 | €12.212 | €24.348 |
| Scandal Recovery | €9.434 | €9.008 | €3.735 | €5.551 | €14.300 |
| Festival Push | €11.270 | €10.635 | €3.831 | €7.024 | €17.454 |
| Chaos Tour | €16.392 | €15.382 | €5.409 | €10.343 | €23.825 |
| Cult Hypergrowth | €19.182 | €19.019 | €5.653 | €12.750 | €26.395 |
| No Social (Fame 0-50) | €15.926 | €15.467 | €5.021 | €10.101 | €23.066 |
| High Controversy | €12.362 | €11.538 | €5.578 | €6.415 | €19.568 |
| Early Game Probe (Fame 0–50) | €15.712 | €15.314 | €4.554 | €10.278 | €21.811 |
| Mid Game Probe (Fame 60–150) | €17.673 | €17.354 | €5.287 | €11.304 | €25.275 |
| Late Game Probe (Fame 175+) | €35.569 | €35.625 | €9.771 | €23.622 | €48.969 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 45 | 260 | 17.31% | 13.19% | 22.37% |
| Aggressive Marketing | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Scandal Recovery | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Festival Push | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Chaos Tour | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Cult Hypergrowth | 1 | 260 | 0.38% | 0.07% | 2.15% |
| No Social (Fame 0-50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| High Controversy | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Early Game Probe (Fame 0–50) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Mid Game Probe (Fame 60–150) | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €29.500 | 260 / €29.500 | 0 / €0 |
| Bootstrap Struggle | 260 / €4.381 | 215 / €5.298 | 45 / €0 |
| Aggressive Marketing | 260 / €17.794 | 258 / €17.932 | 2 / €0 |
| Scandal Recovery | 260 / €9.434 | 257 / €9.544 | 3 / €0 |
| Festival Push | 260 / €11.270 | 258 / €11.357 | 2 / €0 |
| Chaos Tour | 260 / €16.392 | 259 / €16.455 | 1 / €0 |
| Cult Hypergrowth | 260 / €19.182 | 259 / €19.256 | 1 / €0 |
| No Social (Fame 0-50) | 260 / €15.926 | 260 / €15.926 | 0 / €0 |
| High Controversy | 260 / €12.362 | 259 / €12.410 | 1 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €15.712 | 260 / €15.712 | 0 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €17.673 | 260 / €17.673 | 0 / €0 |
| Late Game Probe (Fame 175+) | 260 / €35.569 | 260 / €35.569 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €9.321 | 0.316 | 26.23% | 47.79% |
| Bootstrap Struggle | €3.323 | 0.7585 | 60.19% | 82.44% |
| Aggressive Marketing | €5.044 | 0.2835 | 26.88% | 55.88% |
| Scandal Recovery | €3.735 | 0.3959 | 38.14% | 47.68% |
| Festival Push | €3.831 | 0.3399 | 37.21% | 45.03% |
| Chaos Tour | €5.409 | 0.33 | 24.49% | 42.64% |
| Cult Hypergrowth | €5.653 | 0.2947 | 27.58% | 58.43% |
| No Social (Fame 0-50) | €5.021 | 0.3153 | 24.15% | 45.74% |
| High Controversy | €5.578 | 0.4512 | 27.63% | 51.35% |
| Early Game Probe (Fame 0–50) | €4.554 | 0.2898 | 21.99% | 34.06% |
| Mid Game Probe (Fame 60–150) | €5.287 | 0.2992 | 19.67% | 52.89% |
| Late Game Probe (Fame 175+) | €9.771 | 0.2747 | 28.28% | 47.01% |

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
| brandDeals | ✅ | 28191 | 98 | 23 |
| postOptions | ✅ | 2660 | 2660 | 25 |
| socialTrends | ✅ | 30989 | 3703 | 5 |
| contraband | ✅ | 30989 | 3439 | 37 |
| minigamesTravel | ✅ | 16253 | 9590 | - |
| minigamesRoadie | ✅ | 5404 | 4904 | - |
| minigamesKabelsalat | ✅ | 5425 | 3732 | - |
| minigamesAmp | ✅ | 5424 | 3952 | - |
| sponsorship | ✅ | 28389 | 81 | - |
| restStops | ✅ | 16310 | 0 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €15.000 – €47.000 | €29.500 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 1000 – 2200 | 1525.91 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 17.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €2.000 – €7.000 | €4.381 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 1000 – 2200 | 1465.5 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €9.000 – €28.000 | €17.794 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 1000 – 2200 | 1521.65 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €4.500 – €15.000 | €9.434 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 1000 – 2200 | 1471.51 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €5.500 – €18.000 | €11.270 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 1000 – 2200 | 1631.94 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €8.000 – €26.000 | €16.392 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 1000 – 2200 | 1400.12 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €9.500 – €31.000 | €19.182 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 1000 – 2200 | 1572.01 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-19.154 | 735.17 | -50.28 |
| Bootstrap Struggle | -43.07% | €2.731 | 633.88 | -6.01 |
| Aggressive Marketing | 0% | €-5.792 | 577.95 | -24.8 |
| Scandal Recovery | -18.08% | €2.219 | 552.38 | -12 |
| Festival Push | -12.69% | €-171 | 527.66 | -12.89 |
| Chaos Tour | -2.31% | €-1.004 | 513.16 | -22.09 |
| Cult Hypergrowth | -0.39% | €-5.564 | 608.42 | -24.89 |
| No Social (Fame 0-50) | -0.77% | €-1.333 | 530.96 | -23.82 |
| High Controversy | -3.47% | €-4.827 | 519.47 | -22.31 |
| Early Game Probe (Fame 0–50) | 0% | €3.663 | 672.27 | -4.14 |
| Mid Game Probe (Fame 60–150) | -0.77% | €2.080 | 592.95 | -10.81 |
| Late Game Probe (Fame 175+) | 0% | €4.850 | 755.37 | -16.04 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 17.31% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €35.569 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 2.73 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 7
- Fehlgeschlagen: 0
- Nicht bewertet: 5

- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
