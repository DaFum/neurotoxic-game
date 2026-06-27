# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T21:05:05.684Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Fame-Gates | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |

## Fame-Shop-Audit

Shop-only kosten **15290 Fame**, mit Legacy-Upgrades **24390 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 70 | 800 | 7 | 19 | 30 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 950 | 6 | 16 | 25 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 1100 | 5 | 14 | 22 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 162 |
| Brand Deals | 54 |
| Post Options | 36 |
| Contraband-Items | 37 |
| Upgrade-Katalog | 67 |
| Social Platforms | 4 |
| Trends | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 26 | travel, random |
| band | 59 | random, post_gig, travel |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 24 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €140.874 | 51.9% | 0.04 | 7.5% | 15442 | 8 | 59 | 14.25 | 58.99 | 16.01 | 0% | €3.230 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €13.748 | 20.8% | 0.06 | 4.2% | 942 | 2 | 58 | 1.55 | 9.47 | 4.23 | 25.77% | €2.564 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €52.936 | 55.1% | 0.04 | 7% | 2690 | 3 | 61 | 7.27 | 28.66 | 8.2 | 0.38% | €3.193 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €25.994 | 31.7% | 0.05 | 5.1% | 1772 | 2 | 60 | 3.87 | 18.02 | 6.49 | 2.31% | €2.687 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €28.309 | 38.7% | 0.05 | 6.1% | 2172 | 3 | 63 | 3.91 | 18.52 | 6.13 | 1.54% | €2.977 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €39.451 | 56.1% | 0.05 | 5.4% | 2826 | 3 | 61 | 7.27 | 28.3 | 8.56 | 0.38% | €2.829 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €56.994 | 54.4% | 0.04 | 6.6% | 2870 | 3 | 61 | 6.18 | 28.65 | 8.21 | 0.38% | €3.297 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €35.252 | 57.9% | 0.05 | 5.1% | 2896 | 3 | 62 | 0 | 28.55 | 8.37 | 0.38% | €2.848 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €38.527 | 56.5% | 0.05 | 4.6% | 2556 | 3 | 62 | 14.2 | 28.17 | 8.7 | 0.38% | €2.781 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €17.631 | 4.7% | 0.04 | 4.2% | 1926 | 3 | 55 | 4.39 | 8.08 | 1.88 | 0.38% | €2.651 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.146 | 23.6% | 0.05 | 4.6% | 2307 | 3 | 60 | 5.33 | 15.39 | 4.53 | 0.38% | €2.904 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €50.969 | 51.2% | 0.04 | 7.1% | 7440 | 6 | 59 | 9.57 | 24.24 | 5.76 | 0% | €3.285 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €141.543 | €499 | €3.230 | 17.77 | 4.47 | 21.67 | 8.31 | 11.78 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.889 | €188 | €2.564 | 2.87 | 1.91 | 6.38 | 0.98 | 4.01 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €54.797 | €413 | €3.193 | 10.02 | 3.56 | 16.76 | 4.15 | 7.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €32.689 | €306 | €2.687 | 6.23 | 2.85 | 10.8 | 2.47 | 6.01 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.796 | €317 | €2.977 | 6.24 | 2.98 | 12.57 | 2.55 | 5.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €44.743 | €409 | €2.829 | 10.23 | 3.53 | 16.01 | 3.89 | 7.55 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €58.469 | €413 | €3.297 | 10.23 | 3.53 | 16.05 | 4.15 | 7.18 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.203 | €407 | €2.848 | 0 | 0 | 15.96 | 4.03 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.103 | €364 | €2.781 | 9.65 | 3.43 | 15.67 | 4.02 | 7.82 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.165 | €405 | €2.651 | 1.39 | 0.76 | 3.39 | 0.87 | 1.89 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.210 | €1.371 | €2.904 | 4.5 | 1.84 | 7.92 | 2.06 | 3.95 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €52.920 | €4.943 | €3.285 | 6.15 | 1.79 | 9.1 | 3.32 | 4.34 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.495 | €63.573 | €106.759 | €140.874 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.132 | €7.327 | €11.015 | €13.748 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.330 | €28.253 | €36.751 | €52.936 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.067 | €18.090 | €23.220 | €25.994 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.205 | €21.532 | €25.684 | €28.309 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.544 | €27.288 | €28.452 | €39.451 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.853 | €27.744 | €39.420 | €56.994 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.707 | €26.691 | €27.589 | €35.252 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.633 | €25.600 | €27.942 | €38.527 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.619 | €0 | €0 | €17.631 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.762 | €27.655 | €0 | €29.146 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €32.602 | €0 | €0 | €50.969 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.230 | €97 | 33.5× | 7.74 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.564 | €75 | 34.2× | 9.75 | 0.59 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.193 | €89 | 35.8× | 7.83 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.687 | €84 | 32.2× | 9.31 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.977 | €85 | 35× | 8.4 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.829 | €89 | 31.9× | 8.84 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.297 | €90 | 36.8× | 7.58 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.848 | €89 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.781 | €88 | 31.7× | 8.99 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.651 | €74 | 35.8× | 9.43 | 0.57 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.904 | €86 | 33.7× | 8.61 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.285 | €94 | 34.8× | 7.61 | 0.46 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.3% | 72.6% | 16.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 57 | 24.1% | 67.8% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.5 | 62 | 11.5% | 70.1% | 18.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 18.6% | 72.4% | 8.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.6% | 56.4% | 40% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.2% | 70.1% | 17.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15% | 71.1% | 13.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.6% | 70.9% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 18.8% | 70% | 11.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 21.7% | 67.4% | 10.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 18.3% | 72.4% | 9.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 61 | 12.9% | 70.8% | 16.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59 | 16.01 | 3.4 | 1.22 | 8.35 | 10.47 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 4.23 | 1.47 | 1.2 | 6.22 | 1.74 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 61 | 8.2 | 2.79 | 1.78 | 8.2 | 5.27 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 6.49 | 2.22 | 1.6 | 8.19 | 3.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 63 | 6.13 | 2.28 | 1.74 | 7.93 | 3.36 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 61 | 8.56 | 2.75 | 1.73 | 8.19 | 4.93 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.21 | 2.71 | 1.59 | 8.38 | 4.94 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.37 | 0 | 0 | 8.11 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 62 | 8.7 | 2.68 | 1.53 | 8 | 5.1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.88 | 0.6 | 0.22 | 2.13 | 1.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 60 | 4.53 | 1.37 | 0.73 | 4.3 | 2.58 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 59 | 5.76 | 1.38 | 0.48 | 3.26 | 4.17 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.82 | 1.53 | 1.64 | 0.9 | 9.2 | 29.92 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.06 | 1.67 | 1.82 | 0.19 | 6.79 | 11.29 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.66 | 2.72 | 2.67 | 0.6 | 9.01 | 24.68 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.15 | 3.48 | 3.3 | 0.57 | 8.66 | 18.26 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.91 | 1.81 | 1.7 | 0.27 | 8.83 | 19.9 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.35 | 4.42 | 4.17 | 1.01 | 9.32 | 23.91 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.65 | 2.57 | 2.32 | 0.57 | 9.13 | 24.02 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.28 | 2.4 | 2.29 | 0.53 | 9.19 | 23.55 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.35 | 2.34 | 2.37 | 0.46 | 9.14 | 23.59 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.37 | 0.37 | 0.09 | 2.4 | 5.09 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.52 | 0.93 | 1 | 0.26 | 4.73 | 12.33 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.55 | 0.86 | 0.88 | 0.51 | 3.61 | 12.77 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.99 | 58.99 | 58.99 | 176.97 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.47 | 9.47 | 9.47 | 28.41 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.66 | 28.66 | 28.66 | 85.98 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.02 | 18.02 | 18.02 | 54.06 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.52 | 18.52 | 18.52 | 55.56 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.3 | 28.3 | 28.3 | 84.9 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.65 | 28.65 | 28.65 | 85.95 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.55 | 28.55 | 28.55 | 85.65 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.17 | 28.17 | 28.17 | 84.51 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.08 | 8.08 | 8.08 | 24.24 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.39 | 15.39 | 15.39 | 46.17 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.24 | 24.24 | 24.24 | 72.72 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €140.874 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15442 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 25.77% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €3.297 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €141.543 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.99 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.95 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €140.874 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 712.61 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 25.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €13.748 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 671.42 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €52.936 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 719.16 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €25.994 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 682.84 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €28.309 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 786.16 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €39.451 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 719.22 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €56.994 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 702.03 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €3.475 | 2.14 | 0.03 |
| Bootstrap Struggle | 0.39% | €41 | 0.82 | 0 |
| Aggressive Marketing | 0% | €473 | -0.63 | -0.03 |
| Scandal Recovery | 0.39% | €-138 | -0.92 | -0.09 |
| Festival Push | 0% | €848 | -0.06 | 0.14 |
| Chaos Tour | -0.39% | €-153 | -0.75 | -0.01 |
| Cult Hypergrowth | 0% | €1.078 | -1.31 | 0.05 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0.38% | €-708 | -6.1 | -0.16 |
| Early Game Probe (Fame 0–50) | -0.77% | €-99 | 0.05 | 0.04 |
| Mid Game Probe (Fame 60–150) | 0% | €16 | -0.11 | -0.02 |
| Late Game Probe (Fame 175+) | 0% | €-362 | 0.02 | 0.02 |

## Feature-Abdeckung in der Simulation

- ✅ daily_updates
- ✅ gig_financials
- ✅ travel_expenses
- ✅ fuel_cost
- ✅ travel_minigame
- ✅ roadie_minigame
- ✅ kabelsalat_minigame
- ✅ gig_modifiers
- ✅ gig_physics
- ✅ world_events
- ✅ events_db
- ✅ brand_deals
- ✅ social_trends
- ✅ social_platforms
- ✅ post_options
- ✅ contraband
- ✅ sponsorship
- ✅ maintenance
- ✅ upgrades

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 25.77% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €140.874 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.95 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
