# Game Balance Simulation – Analyse

Erstellt am: 2026-07-23T04:11:25.054Z

## Reproduzierbarkeit

- Report-Version: 10
- Node-Version: v22.22.1
- Commit: f033aee6b61e7c2c96c66b022705395013cc8978
- Simulationsskript SHA-256: 2c8c78a04ee653cad060556d3222cf54835fa200c6f026ae0ccf5c2017690a2a
- Szenariokonfiguration SHA-256: e2f97ba93da6a842fa33908edf7acf33b2404c753b18903421f900c04aa7c6c0
- Seed-Strategie: scenario-id-plus-run-index

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |
| Klinik-Heilung | €280 × 1.2^Besuche · +30 Stamina / +10 Mood |

## Fame-Shop-Audit

Shop-only kosten **15290 Fame**, mit Legacy-Upgrades **24390 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 45 | 690 | 8 | 23 | 34 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 50 | 750 | 7 | 21 | 32 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 55 | 810 | 7 | 19 | 29 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 60 | 870 | 6 | 18 | 27 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 70 | 990 | 6 | 16 | 24 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 1170 | 5 | 13 | 20 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 1350 | 4 | 12 | 18 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

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
| Baseline Touring | €500 | 0 | €57.478 | 60.3% | 0.1 | 2.7% | 17301 | 9 | 39 | 12.05 | 60.04 | 6.52 | 0% | €2.505 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €682 | 37% | 0.24 | 1.3% | 912 | 2 | 56 | 1.06 | 4.28 | 2.47 | 86.15% | €1.816 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €25.407 | 50.8% | 0.11 | 3.7% | 4176 | 4 | 54 | 4.28 | 29.96 | 5.88 | 0.38% | €2.740 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €5.917 | 55.4% | 0.17 | 1.8% | 1829 | 3 | 53 | 2.45 | 13.32 | 4.46 | 35.77% | €2.098 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €10.394 | 52.9% | 0.14 | 3.7% | 1995 | 3 | 56 | 2.52 | 14.94 | 4.82 | 21.92% | €2.535 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €18.014 | 46.2% | 0.14 | 1.8% | 2461 | 3 | 44 | 4.04 | 26.61 | 5.68 | 3.46% | €2.255 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €26.071 | 50.7% | 0.1 | 4.1% | 3852 | 4 | 52 | 5.04 | 29.51 | 5.82 | 1.92% | €2.840 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €17.271 | 49.6% | 0.14 | 1.6% | 3311 | 4 | 50 | 0 | 28.15 | 5.48 | 3.46% | €2.134 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| High Controversy | €500 | 0 | €16.457 | 49% | 0.14 | 1.6% | 3075 | 3 | 51 | 13.71 | 26.48 | 5.38 | 6.15% | €2.066 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €11.025 | 16.5% | 0.13 | 1.7% | 2377 | 3 | 42 | 4.83 | 9.09 | 2.49 | 0.38% | €2.049 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €14.188 | 35.3% | 0.15 | 1.7% | 2630 | 3 | 48 | 4.48 | 15.71 | 4.96 | 3.08% | €2.282 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.426 | 47.5% | 0.1 | 3.1% | 9131 | 6 | 40 | 10.99 | 25.93 | 5.17 | 0% | €2.674 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €60.679 | €499 | €2.505 | 6.12 | 2.04 | 21.55 | 7.96 | 11.81 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €4.090 | €87 | €1.816 | 0.26 | 0.19 | 2.58 | 0.3 | 1.71 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €32.218 | €406 | €2.740 | 2.81 | 1.18 | 16.84 | 4.24 | 7.81 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €10.824 | €226 | €2.098 | 0.92 | 0.49 | 8.34 | 1.77 | 4.77 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €15.171 | €267 | €2.535 | 0.88 | 0.45 | 10.25 | 1.96 | 5.01 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €22.681 | €389 | €2.255 | 2.81 | 1.22 | 13.76 | 3.52 | 7.26 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.431 | €406 | €2.840 | 3.12 | 1.31 | 16.52 | 4.13 | 7.27 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €22.446 | €383 | €2.134 | 0 | 0 | 14.64 | 3.95 | 7.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.440 | €318 | €2.066 | 2.5 | 1.15 | 13.82 | 3.77 | 7.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.759 | €399 | €2.049 | 0.25 | 0.14 | 3.83 | 1.03 | 1.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.187 | €1.325 | €2.282 | 0.83 | 0.4 | 7.9 | 2.15 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.372 | €4.959 | €2.674 | 1.54 | 0.54 | 8.86 | 3.6 | 4.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.284 | €28.718 | €40.640 | €57.478 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.503 | €980 | €767 | €682 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €12.900 | €16.298 | €20.884 | €25.407 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.887 | €5.104 | €4.935 | €5.917 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.313 | €7.240 | €7.488 | €10.394 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €9.611 | €11.364 | €15.184 | €18.014 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €14.369 | €17.845 | €21.724 | €26.071 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.254 | €11.185 | €14.128 | €17.271 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.231 | €9.453 | €13.194 | €16.457 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.916 | — | — | €11.025 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.893 | €13.418 | — | €14.188 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.789 | — | — | €29.426 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.505 | €97 | 25.9× | 9.98 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.816 | €57 | 31.9× | 13.76 | 0.83 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.740 | €88 | 31.1× | 9.12 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.098 | €69 | 30.3× | 11.92 | 0.71 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.535 | €75 | 34× | 9.86 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.255 | €83 | 27.1× | 11.09 | 0.67 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.840 | €88 | 32.1× | 8.8 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.134 | €84 | 25.5× | 11.71 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.066 | €80 | 25.8× | 12.1 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.049 | €72 | 28.6× | 12.2 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.282 | €83 | 27.5× | 10.96 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.674 | €95 | 28× | 9.35 | 0.56 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 50.8% | 43.6% | 5.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.5 | 50 | 49.4% | 43.3% | 7.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 54 | 38.6% | 52% | 9.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.2 | 52 | 46.8% | 45% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.2 | 57 | 27.9% | 56.7% | 15.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.1 | 46 | 63.8% | 32.5% | 3.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 8 | 53 | 40.2% | 53% | 6.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54% | 41.2% | 4.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.7 | 49 | 55.2% | 39.4% | 5.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 48.1% | 44.3% | 7.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.5 | 50 | 48.9% | 46.9% | 4.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 47.3% | 45.2% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.52 | 1.55 | 0.44 | 8.58 | 10.88 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 56 | 2.47 | 0.14 | 0.08 | 3.09 | 0.84 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 5.88 | 0.94 | 0.43 | 7.99 | 5.43 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 53 | 4.46 | 0.4 | 0.22 | 7.22 | 2.58 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 56 | 4.82 | 0.36 | 0.21 | 7.27 | 2.62 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 44 | 5.68 | 0.97 | 0.45 | 8.35 | 4.54 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 52 | 5.82 | 1.04 | 0.52 | 8.27 | 5.38 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.48 | 0 | 0 | 8.24 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 51 | 5.38 | 0.88 | 0.46 | 7.87 | 4.75 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.49 | 0.12 | 0.02 | 2.03 | 1.7 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 4.96 | 0.32 | 0.11 | 4.3 | 2.74 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 5.17 | 0.45 | 0.07 | 3.42 | 4.55 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.02 | 1.51 | 1.54 | 0.88 | 4.08 | 8.84 | 29.75 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.62 | 0.97 | 0.84 | 0.09 | 0.39 | 3.65 | 4.68 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.89 | 2.81 | 2.81 | 0.8 | 3.43 | 9.13 | 24.92 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.6 | 3.15 | 2.7 | 0.43 | 1.9 | 7.43 | 13.99 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.94 | 1.55 | 1.69 | 0.19 | 0.99 | 8.15 | 16.68 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.73 | 4.27 | 4.1 | 1.15 | 4.88 | 8.57 | 21.33 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.67 | 2.38 | 2.39 | 0.65 | 2.97 | 8.74 | 24.38 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.38 | 2.08 | 2.27 | 0.55 | 2.5 | 9.11 | 22.57 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.13 | 2.3 | 2.2 | 0.48 | 2.59 | 8.36 | 20.95 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.21 | 0.4 | 0.4 | 0.1 | 0.55 | 2.32 | 5.65 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.62 | 0.96 | 1.07 | 0.25 | 1.22 | 4.68 | 12.19 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.63 | 0.91 | 0.96 | 0.58 | 2.58 | 3.47 | 12.48 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.04 | 19.93 | 20.18 | 19.93 | 120.08 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 4.28 | 1.45 | 1.43 | 1.39 | 8.55 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.96 | 9.93 | 10.07 | 9.95 | 59.91 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 13.32 | 4.47 | 4.37 | 4.48 | 26.64 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.94 | 5.08 | 4.97 | 4.9 | 29.89 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.61 | 8.79 | 8.98 | 8.83 | 53.21 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.51 | 9.73 | 9.79 | 9.99 | 59.02 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 28.15 | 9.07 | 9.6 | 9.48 | 56.3 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 26.48 | 8.77 | 8.92 | 8.78 | 52.95 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.09 | 3.06 | 2.97 | 3.07 | 18.19 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.71 | 5.1 | 5.39 | 5.22 | 31.42 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 25.93 | 8.72 | 8.59 | 8.62 | 51.86 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 2.89 | 0.34 | 6.75 | 1.06 | 3.64 | 4.73 | €3.308 | 6.8 | 100% |
| Bootstrap Struggle | 0.27 | 0.18 | 0.64 | 0.8 | 0.56 | 1.01 | €1.011 | 2.05 | 66.2% |
| Aggressive Marketing | 2.8 | 0.7 | 6.5 | 1.03 | 3.47 | 3.05 | €2.878 | 5.3 | 100% |
| Scandal Recovery | 1.14 | 0.61 | 3.14 | 1.44 | 1.96 | 2.48 | €1.863 | 6.44 | 93.1% |
| Festival Push | 1.68 | 0.77 | 4.19 | 1.33 | 2.47 | 1.57 | €2.081 | 6.33 | 98.5% |
| Chaos Tour | 2.51 | 0.89 | 5.77 | 1.16 | 3.22 | 3.13 | €2.678 | 7.01 | 95% |
| Cult Hypergrowth | 2.82 | 0.58 | 6.22 | 1.09 | 3.52 | 3.73 | €2.869 | 5.39 | 99.6% |
| No Social (Fame 0-50) | 2.39 | 0.92 | 5.62 | 1.31 | 3.18 | 2.69 | €2.530 | 6.98 | 98.5% |
| High Controversy | 2.21 | 0.9 | 5.15 | 1.22 | 2.98 | 3.37 | €2.455 | 7.3 | 96.2% |
| Early Game Probe (Fame 0–50) | 0.73 | 0.37 | 0.57 | 0.51 | 0.86 | 1.58 | €853 | 0.02 | 93.8% |
| Mid Game Probe (Fame 60–150) | 1.84 | 0.63 | 2.77 | 0.89 | 2.35 | 2.3 | €2.221 | 2.81 | 96.5% |
| Late Game Probe (Fame 175+) | 2.17 | 0.26 | 2.68 | 0.55 | 2.47 | 2.81 | €2.467 | 0.68 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €57.478 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 17301 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 86.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.840 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €60.679 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.04 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.13 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €57.478 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 728.81 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 86.15% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €682 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 717.28 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €25.407 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 790.35 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 35.77% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €5.917 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 755.14 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 21.92% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €10.394 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 839.03 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 3.46% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €18.014 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 662.97 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.071 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 774.99 | ✅ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-48.757 | 136.67 | -1.14 |
| Bootstrap Struggle | 8.46% | €-954 | 162.83 | -1.22 |
| Aggressive Marketing | 0% | €-7.862 | 166.44 | -0.17 |
| Scandal Recovery | 18.46% | €-6.108 | 163.15 | -2.17 |
| Festival Push | 7.69% | €-4.784 | 166.32 | -1.28 |
| Chaos Tour | 1.15% | €-5.170 | 133.53 | -0.44 |
| Cult Hypergrowth | 0.77% | €-8.186 | 132.29 | -0.21 |
| No Social (Fame 0-50) | 2.31% | €-8.381 | 143.83 | -1.46 |
| High Controversy | 3.84% | €-8.276 | 136.6 | -1.89 |
| Early Game Probe (Fame 0–50) | 0.38% | €-4.496 | 138.89 | -0.05 |
| Mid Game Probe (Fame 60–150) | 2.31% | €-7.017 | 150.66 | -0.34 |
| Late Game Probe (Fame 175+) | 0% | €-11.552 | 144.96 | -0.23 |

## Feature-Abdeckung in der Simulation

- ✅ daily_updates
- ✅ gig_financials
- ✅ travel_expenses
- ✅ fuel_cost
- ✅ travel_minigame
- ✅ roadie_minigame
- ✅ kabelsalat_minigame
- ✅ amp_calibration_minigame
- ✅ gig_modifiers
- ✅ gig_physics
- ✅ world_events
- ✅ gig_events
- ✅ events_db
- ✅ brand_deals
- ✅ social_trends
- ✅ social_platforms
- ✅ post_options
- ✅ contraband
- ✅ sponsorship
- ✅ maintenance
- ✅ upgrades
- ✅ clinic
- ✅ rest_stops
- ✅ songs
- ✅ trait_unlocks
- ✅ region_reputation
- ✅ quest_events
- ✅ asset_acquisition
- ✅ asset_modules
- ✅ crowdfunding

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 86.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €57.478 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.13 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
