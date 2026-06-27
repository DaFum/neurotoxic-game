# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T20:42:32.925Z

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
| Baseline Touring | €500 | 0 | €139.980 | 51.4% | 0.04 | 7.4% | 15112 | 8 | 58 | 13.76 | 58.85 | 16.15 | 0% | €3.247 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €12.964 | 21.3% | 0.06 | 4% | 959 | 2 | 58 | 2.25 | 9.44 | 4.22 | 26.15% | €2.514 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €53.714 | 55.1% | 0.04 | 7.3% | 2792 | 3 | 63 | 6.67 | 28.74 | 8.12 | 0.38% | €3.217 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €25.373 | 32.3% | 0.05 | 4.5% | 1708 | 2 | 60 | 3.38 | 18.16 | 6.53 | 1.54% | €2.674 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €27.947 | 40.1% | 0.05 | 6.6% | 2006 | 3 | 64 | 3.98 | 18.44 | 6.22 | 1.54% | €3.005 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €39.608 | 56.3% | 0.05 | 5.6% | 2722 | 3 | 62 | 7.53 | 28.43 | 8.57 | 0% | €2.854 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €55.242 | 55.1% | 0.04 | 6.4% | 2627 | 3 | 61 | 5.71 | 28.55 | 8.32 | 0.38% | €3.265 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €35.252 | 57.9% | 0.05 | 5.1% | 2896 | 3 | 62 | 0 | 28.55 | 8.37 | 0.38% | €2.848 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €37.799 | 55.6% | 0.05 | 4.8% | 2568 | 3 | 63 | 16.3 | 28.21 | 8.65 | 0.38% | €2.781 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €18.040 | 4% | 0.04 | 4.3% | 1986 | 3 | 55 | 4.08 | 8.07 | 1.89 | 0.38% | €2.671 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €28.885 | 23.9% | 0.05 | 4.8% | 2429 | 3 | 60 | 4.87 | 15.37 | 4.55 | 0.38% | €2.905 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €51.390 | 51.6% | 0.04 | 7.1% | 7347 | 6 | 57 | 11.8 | 24.18 | 5.82 | 0% | €3.282 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €140.646 | €499 | €3.247 | 17.79 | 4.63 | 21.81 | 8.38 | 11.69 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.072 | €188 | €2.514 | 2.73 | 1.85 | 6.36 | 0.98 | 4 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €55.660 | €413 | €3.217 | 10.34 | 3.64 | 16.59 | 4.16 | 7.66 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €32.803 | €310 | €2.674 | 6.27 | 2.95 | 11.05 | 2.47 | 6.06 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.511 | €317 | €3.005 | 6.28 | 2.94 | 12.61 | 2.53 | 5.84 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €45.319 | €410 | €2.854 | 10.77 | 3.65 | 16.24 | 3.88 | 7.64 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €56.647 | €412 | €3.265 | 10.17 | 3.52 | 16.06 | 4.22 | 7.21 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.203 | €407 | €2.848 | 0 | 0 | 15.96 | 4.03 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.256 | €362 | €2.781 | 9.5 | 3.48 | 15.86 | 4.06 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.470 | €405 | €2.671 | 1.35 | 0.75 | 3.3 | 0.85 | 1.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.316 | €1.377 | €2.905 | 4.64 | 1.83 | 7.87 | 2.04 | 3.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €53.301 | €4.944 | €3.282 | 6.48 | 1.77 | 9.06 | 3.29 | 4.3 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.860 | €63.880 | €105.989 | €139.980 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.062 | €7.230 | €10.555 | €12.964 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.317 | €27.743 | €36.649 | €53.714 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.129 | €18.614 | €23.180 | €25.373 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.115 | €21.036 | €25.373 | €27.947 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.856 | €27.062 | €29.218 | €39.608 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.744 | €26.843 | €38.414 | €55.242 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.707 | €26.691 | €27.589 | €35.252 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.444 | €26.559 | €27.893 | €37.799 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.893 | €0 | €0 | €18.040 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.731 | €27.626 | €0 | €28.885 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.623 | €0 | €0 | €51.390 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.247 | €96 | 33.7× | 7.7 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.514 | €74 | 33.8× | 9.95 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.217 | €89 | 36× | 7.77 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.674 | €84 | 32× | 9.35 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.005 | €85 | 35.3× | 8.32 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.854 | €89 | 32.2× | 8.76 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.265 | €90 | 36.4× | 7.66 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.848 | €89 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.781 | €88 | 31.7× | 8.99 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.671 | €74 | 36× | 9.36 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.905 | €86 | 33.7× | 8.6 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.282 | €94 | 34.8× | 7.62 | 0.46 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.8% | 73.8% | 14.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 56 | 24.4% | 67.5% | 8.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 62 | 11.7% | 69.3% | 19% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.1 | 58 | 18.7% | 71.7% | 9.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.8% | 56% | 40.1% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.3% | 68.6% | 19.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 14.8% | 71.2% | 14% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.6% | 70.9% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7 | 59 | 18.6% | 68.8% | 12.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 20.9% | 68% | 11.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19% | 72.3% | 8.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 60 | 13.3% | 71.8% | 14.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 16.15 | 3.55 | 1.3 | 8.27 | 10.57 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 4.22 | 1.38 | 1.15 | 6.17 | 1.73 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 8.12 | 2.85 | 1.81 | 8.08 | 5.02 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 60 | 6.53 | 2.29 | 1.63 | 8.37 | 3.26 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 64 | 6.22 | 2.25 | 1.64 | 8.01 | 3.42 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 62 | 8.57 | 2.85 | 1.66 | 8.15 | 5.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.32 | 2.72 | 1.64 | 8.4 | 4.97 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.37 | 0 | 0 | 8.11 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 63 | 8.65 | 2.75 | 1.73 | 8.23 | 5.1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.89 | 0.59 | 0.22 | 2.21 | 1.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 60 | 4.55 | 1.45 | 0.78 | 4.21 | 2.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 57 | 5.82 | 1.45 | 0.51 | 3.18 | 4.54 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.82 | 1.55 | 1.82 | 0.85 | 9.01 | 30.31 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.95 | 1.78 | 1.75 | 0.19 | 6.85 | 11.35 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.52 | 2.75 | 2.86 | 0.65 | 8.89 | 24.52 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.17 | 3.26 | 3.35 | 0.57 | 8.63 | 18.57 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.95 | 1.83 | 1.76 | 0.23 | 8.86 | 20.07 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.37 | 4.4 | 4.16 | 0.98 | 8.87 | 24.31 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.53 | 2.5 | 2.37 | 0.56 | 9.06 | 24.11 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.28 | 2.4 | 2.29 | 0.53 | 9.19 | 23.55 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.31 | 2.24 | 2.18 | 0.55 | 9.17 | 23.65 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.25 | 0.39 | 0.38 | 0.09 | 2.4 | 4.99 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.53 | 0.92 | 0.98 | 0.28 | 4.75 | 12.12 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.49 | 0.93 | 0.89 | 0.47 | 3.72 | 12.55 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.85 | 58.85 | 58.85 | 176.55 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.44 | 9.44 | 9.44 | 28.32 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.74 | 28.74 | 28.74 | 86.22 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.16 | 18.16 | 18.16 | 54.48 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.44 | 18.44 | 18.44 | 55.32 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.43 | 28.43 | 28.43 | 85.29 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.55 | 28.55 | 28.55 | 85.65 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.55 | 28.55 | 28.55 | 85.65 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.21 | 28.21 | 28.21 | 84.63 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.07 | 8.07 | 8.07 | 24.21 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.37 | 15.37 | 15.37 | 46.11 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.18 | 24.18 | 24.18 | 72.54 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €139.980 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15112 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 26.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €3.282 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €140.646 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.85 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.90 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €139.980 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 708.84 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 26.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €12.964 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 669.36 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €53.714 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 719.19 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €25.373 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 684.98 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €27.947 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 786.85 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €39.608 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 720.15 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €55.242 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 703.8 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -0.38% | €8.659 | -2.37 | -0.07 |
| Bootstrap Struggle | -5% | €1.954 | -3.87 | 0.72 |
| Aggressive Marketing | 0% | €11.724 | -1.21 | 0.15 |
| Scandal Recovery | -1.54% | €653 | 4.69 | 0.47 |
| Festival Push | -3.46% | €2.519 | 0.79 | 0.64 |
| Chaos Tour | -1.15% | €4.457 | 7.45 | 0.37 |
| Cult Hypergrowth | -0.39% | €11.853 | 3.99 | 0.14 |
| No Social (Fame 0-50) | 0.38% | €-19.954 | 0.76 | -0.09 |
| High Controversy | -0.77% | €-18.050 | 10.01 | 0.02 |
| Early Game Probe (Fame 0–50) | -0.39% | €903 | 2.76 | 0 |
| Mid Game Probe (Fame 60–150) | 0% | €362 | -2.86 | 0 |
| Late Game Probe (Fame 175+) | 0% | €7.769 | 0.12 | -0.03 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 26.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €139.980 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.90 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
