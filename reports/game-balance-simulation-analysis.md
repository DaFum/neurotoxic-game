# Game Balance Simulation – Analyse

Erstellt am: 2026-07-17T15:12:54.526Z

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
| 70 | 340 | 15 | 45 | 69 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 400 | 13 | 38 | 59 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 460 | 11 | 34 | 51 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

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
| Baseline Touring | €500 | 0 | €77.535 | 56.6% | 0.07 | 3.1% | 2196 | 3 | 60 | 11.48 | 58.61 | 16.11 | 0.38% | €1.948 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €3.358 | 35% | 0.09 | 1.2% | 667 | 1 | 59 | 1.92 | 6.09 | 2.91 | 60% | €1.427 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €27.553 | 50.1% | 0.07 | 3% | 1130 | 2 | 63 | 5.37 | 28.05 | 8.61 | 1.15% | €1.966 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €16.681 | 27.2% | 0.08 | 2.5% | 997 | 2 | 59 | 3.5 | 16.43 | 6.15 | 11.15% | €1.662 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €22.684 | 23.5% | 0.07 | 2.9% | 1142 | 2 | 59 | 4.18 | 18.02 | 6.19 | 3.46% | €1.888 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €25.754 | 37.6% | 0.08 | 2.7% | 1254 | 2 | 62 | 6.59 | 28.05 | 8.95 | 0% | €1.747 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €28.443 | 52.1% | 0.07 | 3% | 1189 | 2 | 61 | 8.51 | 28.22 | 8.51 | 0.77% | €2.029 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €25.303 | 28.3% | 0.08 | 2.3% | 1203 | 2 | 64 | 0 | 28.3 | 8.57 | 0.38% | €1.695 | ✅ Szenario liegt im robusten Simulationskorridor. |
| High Controversy | €500 | 0 | €25.648 | 39.5% | 0.08 | 2% | 1126 | 2 | 61 | 15.57 | 27.34 | 8.86 | 2.31% | €1.684 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €9.696 | 9.4% | 0.07 | 1.8% | 1116 | 2 | 55 | 4.75 | 7.98 | 1.93 | 1.15% | €1.572 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €21.409 | 11% | 0.07 | 1.9% | 1230 | 2 | 59 | 4.71 | 15.37 | 4.63 | 0% | €1.759 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €30.111 | 46.2% | 0.06 | 3.2% | 1957 | 3 | 61 | 10.4 | 24.02 | 5.91 | 0.38% | €2.051 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €78.041 | €496 | €1.948 | 17.07 | 4.39 | 15.07 | 8.68 | 11.66 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €4.697 | €115 | €1.427 | 1.41 | 1.13 | 2.49 | 0.7 | 2.51 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €37.877 | €403 | €1.966 | 10.09 | 3.41 | 9.3 | 4.32 | 7.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €18.091 | €269 | €1.662 | 5.31 | 2.44 | 5.99 | 2.47 | 5.49 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €25.047 | €299 | €1.888 | 6.24 | 2.97 | 7.02 | 2.59 | 5.68 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €33.907 | €398 | €1.747 | 9.94 | 3.45 | 8.93 | 3.98 | 7.56 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €39.022 | €405 | €2.029 | 9.72 | 3.41 | 9.33 | 4.21 | 7.15 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €30.409 | €395 | €1.695 | 0 | 0 | 8.94 | 4.22 | 7.77 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €33.214 | €323 | €1.684 | 9.23 | 3.34 | 8.53 | 4.08 | 7.46 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €9.906 | €389 | €1.572 | 1.25 | 0.75 | 1.78 | 0.96 | 1.86 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €22.288 | €1.363 | €1.759 | 4.36 | 1.82 | 4.42 | 2.25 | 3.95 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €40.484 | €4.875 | €2.051 | 6.28 | 1.77 | 5.95 | 3.37 | 4.28 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €24.874 | €31.210 | €54.892 | €77.535 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €967 | €2.009 | €2.665 | €3.358 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €10.305 | €21.874 | €26.282 | €27.553 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €4.707 | €8.721 | €12.840 | €16.681 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €6.522 | €12.482 | €17.618 | €22.684 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €8.079 | €18.217 | €24.969 | €25.754 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €11.125 | €23.003 | €26.162 | €28.443 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €7.642 | €15.967 | €23.369 | €25.303 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €6.728 | €16.059 | €23.500 | €25.648 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €8.240 | €0 | €0 | €9.696 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €10.651 | €20.275 | €0 | €21.409 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €28.735 | €0 | €0 | €30.111 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €1.948 | €91 | 21.5× | 12.83 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.427 | €59 | 24.2× | 17.52 | 1.05 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €1.966 | €85 | 23.1× | 12.72 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.662 | €75 | 22.3× | 15.04 | 0.9 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €1.888 | €79 | 23.9× | 13.24 | 0.79 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €1.747 | €84 | 20.9× | 14.31 | 0.86 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.029 | €86 | 23.7× | 12.32 | 0.74 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €1.695 | €83 | 20.4× | 14.75 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.684 | €82 | 20.6× | 14.85 | 0.89 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €1.572 | €63 | 24.9× | 15.91 | 0.95 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €1.759 | €81 | 21.7× | 14.21 | 0.85 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.051 | €91 | 22.5× | 12.19 | 0.73 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 61 | 11.4% | 73.8% | 14.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.2 | 58 | 20.5% | 69.8% | 9.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 10.8% | 72.6% | 16.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.1 | 58 | 19.1% | 71.7% | 9.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 67 | 4.2% | 58.5% | 37.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.7 | 61 | 12% | 72.9% | 15.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7 | 59 | 16.2% | 72.4% | 11.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 152 | 7 | 59 | 17% | 71.1% | 11.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 152 | 7.2 | 58 | 20% | 70.9% | 9.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 58 | 22.2% | 67% | 10.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.2 | 58 | 19% | 72.3% | 8.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.8 | 60 | 13.5% | 73.1% | 13.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60 | 16.11 | 3.38 | 1.37 | 8.23 | 10.36 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 2.91 | 0.85 | 0.75 | 4.23 | 1.04 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 63 | 8.61 | 2.58 | 1.6 | 8.23 | 4.97 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 59 | 6.15 | 1.85 | 1.44 | 7.62 | 2.7 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 59 | 6.19 | 2.25 | 1.75 | 7.82 | 3.33 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 62 | 8.95 | 2.74 | 1.72 | 8.45 | 5.11 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 61 | 8.51 | 2.63 | 1.61 | 8.57 | 5.14 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 64 | 8.57 | 0 | 0 | 8.3 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 61 | 8.86 | 2.67 | 1.46 | 8.31 | 4.77 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 55 | 1.93 | 0.58 | 0.24 | 2.05 | 1.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 59 | 4.63 | 1.38 | 0.75 | 4.17 | 2.68 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 61 | 5.91 | 1.42 | 0.47 | 3.44 | 4.32 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.86 | 1.5 | 1.64 | 0.8 | 9.11 | 22.9 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.7 | 1.3 | 1.27 | 0.13 | 4.63 | 5.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.57 | 2.72 | 2.69 | 0.67 | 8.86 | 16.62 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.69 | 3.12 | 3.03 | 0.45 | 7.93 | 12.3 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.98 | 1.73 | 1.66 | 0.26 | 8.57 | 13.95 | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | 2.52 | 4.27 | 4.37 | 1.06 | 8.94 | 16.48 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.41 | 2.37 | 2.37 | 0.64 | 9.06 | 16.79 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.27 | 2.38 | 2.22 | 0.53 | 8.82 | 16.29 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.3 | 2.05 | 2.22 | 0.55 | 8.63 | 15.64 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.21 | 0.34 | 0.4 | 0.1 | 2.2 | 3.38 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.53 | 0.97 | 0.88 | 0.27 | 4.87 | 8.53 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.46 | 0.95 | 0.92 | 0.43 | 3.63 | 9.37 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.61 | 58.61 | 58.61 | 175.83 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 6.09 | 6.09 | 6.09 | 18.27 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.05 | 28.05 | 28.05 | 84.15 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 16.43 | 16.43 | 16.43 | 49.29 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.02 | 18.02 | 18.02 | 54.06 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.05 | 28.05 | 28.05 | 84.15 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.22 | 28.22 | 28.22 | 84.66 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| No Social (Fame 0-50) | 28.3 | 28.3 | 28.3 | 84.9 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| High Controversy | 27.34 | 27.34 | 27.34 | 82.02 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 7.98 | 7.98 | 7.98 | 23.94 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.37 | 15.37 | 15.37 | 46.11 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.02 | 24.02 | 24.02 | 72.06 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €77.535 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 2196 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 60% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €2.051 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €78.041 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.61 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 12.22 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €77.535 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 304.63 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 60% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €3.358 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 250 – 500 | 294.12 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €27.553 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 306.4 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 11.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €16.681 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 294.61 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 3.46% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €22.684 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 332.56 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €25.754 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 304.59 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €28.443 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 297.63 | ✅ | Im Zielband – leicht außermittig. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €673 | -1.83 | -0.08 |
| Bootstrap Struggle | 2.31% | €-498 | 0.03 | -0.17 |
| Aggressive Marketing | -0.39% | €39 | 0.66 | 0.07 |
| Scandal Recovery | 0% | €187 | 0.43 | 0.08 |
| Festival Push | -0.77% | €-185 | 0.96 | 0.17 |
| Chaos Tour | -0.38% | €-805 | 1 | 0.18 |
| Cult Hypergrowth | -0.38% | €294 | -2.28 | -0.02 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | 0.77% | €-324 | 1.19 | -0.24 |
| Early Game Probe (Fame 0–50) | 1.15% | €-252 | 1.23 | -0.1 |
| Mid Game Probe (Fame 60–150) | 0% | €-5 | 0.53 | 0.05 |
| Late Game Probe (Fame 175+) | 0.38% | €306 | 0.94 | -0.05 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 60% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €77.535 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 12.22 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
