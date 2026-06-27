# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T20:48:33.736Z

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
| Baseline Touring | €500 | 0 | €137.211 | 52.1% | 0.04 | 7% | 15680 | 8 | 61 | 14.14 | 59.02 | 15.98 | 0% | €3.204 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €13.566 | 20.7% | 0.06 | 3.8% | 1014 | 2 | 57 | 1.49 | 9.53 | 4.19 | 25.38% | €2.572 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €51.747 | 54.6% | 0.04 | 7.1% | 2781 | 3 | 60 | 5.65 | 28.6 | 8.27 | 0.38% | €3.210 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €26.044 | 31.6% | 0.05 | 4.9% | 1761 | 2 | 59 | 4.55 | 18.26 | 6.43 | 1.54% | €2.692 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Festival Push | €500 | 0 | €27.983 | 40.6% | 0.05 | 6.4% | 2066 | 3 | 63 | 2.93 | 18.3 | 6.22 | 2.31% | €2.999 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Chaos Tour | €500 | 0 | €39.682 | 56.1% | 0.05 | 5.4% | 2857 | 3 | 62 | 7.14 | 28.41 | 8.59 | 0% | €2.825 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €56.112 | 55.5% | 0.04 | 6.1% | 2660 | 3 | 61 | 6.02 | 28.62 | 8.25 | 0.38% | €3.264 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €35.252 | 57.9% | 0.05 | 5.1% | 2896 | 3 | 62 | 0 | 28.55 | 8.37 | 0.38% | €2.848 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €38.527 | 55.8% | 0.05 | 4.7% | 2570 | 3 | 62 | 14.09 | 28.19 | 8.67 | 0.38% | €2.798 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €17.839 | 4.2% | 0.04 | 4.8% | 1975 | 3 | 55 | 4.66 | 8.03 | 1.9 | 0.77% | €2.672 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.518 | 23.6% | 0.05 | 4.8% | 2499 | 3 | 61 | 4.98 | 15.4 | 4.52 | 0.38% | €2.913 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €51.408 | 52% | 0.04 | 7.1% | 7362 | 6 | 58 | 9.73 | 24.26 | 5.74 | 0% | €3.292 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €137.983 | €500 | €3.204 | 17.73 | 4.67 | 21.56 | 8.47 | 11.73 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.696 | €188 | €2.572 | 2.81 | 1.82 | 6.48 | 1.01 | 4.03 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €54.028 | €413 | €3.210 | 10.62 | 3.54 | 16.3 | 4.22 | 7.65 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €33.104 | €309 | €2.692 | 6.32 | 2.88 | 10.99 | 2.53 | 6.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €36.376 | €315 | €2.999 | 5.92 | 2.91 | 12.21 | 2.49 | 5.81 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €45.512 | €409 | €2.825 | 10.32 | 3.62 | 16.07 | 3.92 | 7.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €57.412 | €412 | €3.264 | 10.11 | 3.58 | 16.28 | 4.2 | 7.25 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €43.203 | €407 | €2.848 | 0 | 0 | 15.96 | 4.03 | 7.74 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €44.339 | €363 | €2.798 | 9.78 | 3.38 | 15.84 | 4.04 | 7.78 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €18.259 | €404 | €2.672 | 1.3 | 0.74 | 3.32 | 0.86 | 1.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €35.593 | €1.377 | €2.913 | 4.53 | 1.83 | 7.82 | 2.05 | 3.96 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €53.261 | €4.949 | €3.292 | 6.51 | 1.83 | 9.2 | 3.27 | 4.39 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €31.538 | €61.969 | €104.865 | €137.211 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.010 | €7.341 | €10.820 | €13.566 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €18.452 | €27.626 | €36.100 | €51.747 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.027 | €18.385 | €23.489 | €26.044 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.111 | €21.105 | €25.613 | €27.983 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.814 | €27.181 | €29.414 | €39.682 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.817 | €26.735 | €38.720 | €56.112 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €15.707 | €26.691 | €27.589 | €35.252 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €13.378 | €26.741 | €27.772 | €38.527 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €15.886 | €0 | €0 | €17.839 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €17.735 | €28.069 | €0 | €29.518 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €31.410 | €0 | €0 | €51.408 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.204 | €97 | 33.2× | 7.8 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.572 | €75 | 34.4× | 9.72 | 0.58 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.210 | €89 | 35.9× | 7.79 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.692 | €84 | 32.2× | 9.29 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.999 | €85 | 35.3× | 8.34 | 0.5 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.825 | €89 | 31.8× | 8.85 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.264 | €90 | 36.4× | 7.66 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.848 | €89 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.798 | €88 | 31.9× | 8.93 | 0.54 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.672 | €74 | 36× | 9.35 | 0.56 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.913 | €86 | 33.8× | 8.58 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.292 | €94 | 34.9× | 7.59 | 0.46 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.6 | 61 | 11.6% | 72.2% | 16.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 57 | 24.1% | 68% | 7.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 12.3% | 70.4% | 17.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 58 | 19.6% | 71.2% | 9.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.4 | 68 | 3.6% | 57.7% | 38.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.6 | 61 | 12.3% | 69.5% | 18.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.3% | 70.3% | 14.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 6.9 | 59 | 15.6% | 70.9% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.1 | 58 | 19.2% | 69.3% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 21.3% | 67.7% | 11% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19% | 71.8% | 9.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.6 | 61 | 13% | 70.4% | 16.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 61 | 15.98 | 3.5 | 1.27 | 8.3 | 10.54 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 57 | 4.19 | 1.37 | 1.08 | 6.2 | 1.78 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 60 | 8.27 | 2.78 | 1.69 | 7.93 | 5.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.43 | 2.25 | 1.62 | 8.29 | 3.12 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 63 | 6.22 | 2.19 | 1.65 | 8.1 | 3.29 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 62 | 8.59 | 2.86 | 1.77 | 8.18 | 4.87 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.25 | 2.8 | 1.68 | 8.4 | 5.18 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 62 | 8.37 | 0 | 0 | 8.11 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 62 | 8.67 | 2.68 | 1.53 | 8.32 | 5.1 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.9 | 0.57 | 0.23 | 2.12 | 1.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 61 | 4.52 | 1.4 | 0.75 | 4.22 | 2.54 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 58 | 5.74 | 1.44 | 0.5 | 3.05 | 4.36 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.85 | 1.6 | 1.66 | 0.77 | 9.32 | 30.23 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 1.03 | 1.84 | 1.79 | 0.19 | 6.97 | 11.58 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.6 | 2.66 | 2.68 | 0.66 | 9.16 | 24.4 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 2.18 | 3.35 | 3.28 | 0.58 | 8.98 | 18.37 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.94 | 1.85 | 1.72 | 0.23 | 9.1 | 19.53 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.39 | 4.45 | 4.2 | 1.05 | 9.17 | 24.25 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.48 | 2.56 | 2.35 | 0.59 | 8.78 | 24.06 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.28 | 2.4 | 2.29 | 0.53 | 9.19 | 23.55 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.41 | 2.18 | 2.31 | 0.52 | 9.12 | 23.5 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.38 | 0.37 | 0.07 | 2.32 | 5.1 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.55 | 1.01 | 1 | 0.27 | 4.73 | 12.26 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.52 | 0.94 | 0.94 | 0.52 | 3.78 | 12.88 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 59.02 | 59.02 | 59.02 | 177.06 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.53 | 9.53 | 9.53 | 28.59 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.6 | 28.6 | 28.6 | 85.8 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.26 | 18.26 | 18.26 | 54.78 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.3 | 18.3 | 18.3 | 54.9 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.41 | 28.41 | 28.41 | 85.23 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.62 | 28.62 | 28.62 | 85.86 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.55 | 28.55 | 28.55 | 85.65 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 28.19 | 28.19 | 28.19 | 84.57 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.03 | 8.03 | 8.03 | 24.09 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.4 | 15.4 | 15.4 | 46.2 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.26 | 24.26 | 24.26 | 72.78 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €137.211 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15680 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 25.38% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €3.292 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €137.983 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 59.02 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.09 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €137.211 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 712.48 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 25.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €13.566 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 671.83 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €51.747 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 715.94 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €26.044 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 682.86 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €27.983 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 784.07 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €39.682 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 718.36 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €56.112 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 704.2 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €-2.769 | 3.64 | 0.17 |
| Bootstrap Struggle | -0.77% | €602 | 2.47 | 0.09 |
| Aggressive Marketing | 0% | €-1.967 | -3.25 | -0.14 |
| Scandal Recovery | 0% | €671 | -2.12 | 0.1 |
| Festival Push | 0.77% | €36 | -2.78 | -0.14 |
| Chaos Tour | 0% | €74 | -1.79 | -0.02 |
| Cult Hypergrowth | 0% | €870 | 0.4 | 0.07 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0% | €728 | -2.89 | -0.02 |
| Early Game Probe (Fame 0–50) | 0.39% | €-201 | 1.9 | -0.04 |
| Mid Game Probe (Fame 60–150) | 0% | €633 | 2.84 | 0.03 |
| Late Game Probe (Fame 175+) | 0% | €18 | 3.42 | 0.08 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 25.38% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €137.211 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.09 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
