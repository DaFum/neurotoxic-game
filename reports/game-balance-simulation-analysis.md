# Game Balance Simulation – Analyse

## Table of Contents
- [Simulationseinstellungen](#simulationseinstellungen)
- [Fame-Shop-Audit](#fame-shop-audit)
- [Feature-Snapshot der App](#feature-snapshot-der-app)
- [Ergebnis-Matrix](#ergebnis-matrix)
- [Wirtschaft im Detail](#wirtschaft-im-detail)
- [Kapital-Progressionskurve](#kapital-progressionskurve)
- [Einkommensstruktur & Sink-Analyse](#einkommensstruktur-sink-analyse)
- [Gig-Performance-Kalibrierung](#gig-performance-kalibrierung)
- [Bandgesundheit im Detail](#bandgesundheit-im-detail)
- [Events & Social im Detail](#events--social-im-detail)
- [Minigame-Abdeckung im Detail](#minigame-abdeckung-im-detail)
- [Cross-Szenario-Vergleich (Höchstwerte)](#cross-szenario-vergleich-höchstwerte)
- [KPI-Zielkorridore (Health Check)](#kpi-zielkorridore-health-check)
- [Rebalance-Regressionsvergleich (Alt vs Neu)](#rebalance-regressionsvergleich-alt-vs-neu)
- [Feature-Abdeckung in der Simulation](#feature-abdeckung-in-der-simulation)
- [Kurzfazit](#kurzfazit)


Erstellt am: 2026-04-16T09:49:42.256Z

## Simulationseinstellungen

| Parameter         | Wert                                                                |
| ----------------- | ------------------------------------------------------------------- |
| Runs je Szenario  | 260                                                                 |
| Tage je Run       | 75                                                                  |
| Basis-Tageskosten | €62                                                                 |
| Modifier-Kosten   | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50   |
| Venue-Fame-Gates  | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |
| Fame-Level-Skala  | Level = floor(fame / 100)                                           |

## Fame-Shop-Audit

Shop-only kosten **14630 Fame**, mit Legacy-Upgrades **23730 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung                                                               |
| --------: | -----------: | ------------------: | -----------------------: | --------------------: | ----------------------------------------------------------------------- |
|        70 |          800 |                   7 |                       19 |                    29 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |
|        85 |          950 |                   6 |                       16 |                    24 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |
|       100 |         1100 |                   5 |                       14 |                    21 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie        | Anzahl |
| ---------------- | -----: |
| Venues (gesamt)  |     45 |
| Event-Kategorien |      5 |
| Events gesamt    |    122 |
| Brand Deals      |     54 |
| Post Options     |     32 |
| Contraband-Items |     27 |
| Upgrade-Katalog  |     60 |
| Social Platforms |      4 |
| Trends           |      5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen                              |
| --------- | -----: | ------------------------------------------ |
| transport |     23 | travel                                     |
| band      |     40 | random, post_gig, travel                   |
| gig       |     19 | gig_mid, gig_intro                         |
| financial |     27 | random, post_gig                           |
| special   |     13 | special_location, travel, post_gig, random |

## Ergebnis-Matrix

| Szenario                     | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung                                                                     |
| ---------------------------- | -----------: | --------: | --------: | --------: | --------: | -------: | --------: | ---------: | --------: | ------------: | -----: | -------: | --------: | ----------: | ----------------------------------------------------------------------------- |
| Baseline Touring             |         €500 |         0 |   €54.146 |     64.5% |      0.06 |       8% |      3449 |         34 |        60 |          1.63 |  53.81 |    14.42 |    23.85% |      €2.952 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Bootstrap Struggle           |         €500 |         0 |       €67 |      9.6% |      0.12 |       0% |       752 |          7 |        62 |           0.1 |   1.15 |     0.06 |    99.62% |        €631 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing         |         €500 |         0 |   €15.807 |     36.6% |      0.06 |     7.1% |      1636 |         16 |        63 |          0.25 |  19.84 |     5.75 |    38.08% |      €2.765 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Scandal Recovery             |         €500 |         0 |    €2.212 |       10% |      0.08 |     3.9% |       826 |          8 |        63 |          0.31 |   3.67 |     1.04 |    86.92% |      €1.930 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push                |         €500 |         0 |    €2.711 |     12.9% |      0.06 |     6.4% |      1241 |         12 |        65 |          0.35 |   4.87 |     1.29 |       85% |      €2.546 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour                   |         €500 |         0 |   €12.647 |     33.6% |      0.07 |     5.6% |      1522 |         15 |        62 |          0.53 |  17.97 |     5.46 |       45% |      €2.508 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Cult Hypergrowth             |         €500 |         0 |   €23.099 |     41.4% |      0.06 |     7.5% |      1119 |         11 |        61 |          0.01 |  24.47 |     7.11 |    17.31% |      €2.806 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) |         €500 |         0 |    €6.808 |       10% |      0.06 |     5.7% |       863 |          8 |        60 |          0.59 |   5.17 |     1.08 |    42.69% |      €2.245 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Mid Game Probe (Fame 60–150) |       €1.500 |        60 |   €20.818 |     19.4% |      0.07 |     5.9% |      1155 |         11 |        57 |          1.13 |  15.24 |     4.53 |     1.54% |      €2.592 | ✅ Szenario liegt im robusten Simulationskorridor.                            |
| Late Game Probe (Fame 175+)  |       €5.000 |       175 |   €28.792 |     46.2% |      0.06 |       7% |      2583 |         25 |        60 |          0.89 |  24.12 |     5.83 |     1.15% |      €2.945 | ✅ Szenario liegt im robusten Simulationskorridor.                            |

## Wirtschaft im Detail

| Szenario                     | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung                                                             |
| ---------------------------- | ----------: | -----------: | ----------: | ----------------: | ------------: | ------------------: | --------: | --------: | --------------------------------------------------------------------- |
| Baseline Touring             |     €66.661 |         €498 |      €2.952 |             16.73 |          4.15 |               13.69 |      9.28 |     10.68 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle           |        €765 |         €148 |        €631 |              0.02 |          0.02 |                0.11 |      0.02 |      0.07 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen.               |
| Aggressive Marketing         |     €25.051 |         €370 |      €2.765 |              6.94 |          2.45 |                6.73 |      3.53 |      5.23 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil.                            |
| Scandal Recovery             |      €3.503 |         €197 |      €1.930 |              0.89 |          0.47 |                0.96 |      0.52 |      0.95 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen.               |
| Festival Push                |      €5.273 |         €244 |      €2.546 |              1.26 |          0.62 |                2.01 |      0.68 |       1.3 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen.               |
| Chaos Tour                   |     €19.005 |         €346 |      €2.508 |               5.9 |          2.17 |                5.89 |      2.93 |      4.68 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil.                            |
| Cult Hypergrowth             |     €32.651 |         €389 |      €2.806 |               8.7 |             3 |                7.68 |      4.33 |      6.13 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil.                            |
| Early Game Probe (Fame 0–50) |      €7.546 |         €334 |      €2.245 |              0.82 |          0.45 |                1.01 |       0.7 |      1.11 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil.                            |
| Mid Game Probe (Fame 60–150) |     €23.318 |       €1.353 |      €2.592 |              4.13 |          1.73 |                4.11 |      2.74 |      3.91 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil.                            |
| Late Game Probe (Fame 175+)  |     €40.476 |       €4.940 |      €2.945 |              6.08 |          1.77 |                6.13 |      4.08 |      4.33 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil.                            |

## Kapital-Progressionskurve

| Szenario                     | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung                                                      |
| ---------------------------- | ------------: | ------------: | ------------: | --------: | -------------------------------------------------------------- |
| Baseline Touring             |       €26.652 |       €28.692 |       €41.103 |   €54.146 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Bootstrap Struggle           |           €36 |           €55 |           €55 |       €67 | ⚠️ Liquiditätsprobleme in Frühphase – Einstiegspuffer erhöhen. |
| Aggressive Marketing         |        €7.889 |       €14.116 |       €15.460 |   €15.807 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Scandal Recovery             |        €1.160 |        €1.729 |        €1.854 |    €2.212 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Festival Push                |        €1.884 |        €2.274 |        €2.417 |    €2.711 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Chaos Tour                   |        €6.170 |        €9.823 |       €12.489 |   €12.647 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Cult Hypergrowth             |       €11.041 |       €19.139 |       €22.212 |   €23.099 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Early Game Probe (Fame 0–50) |        €5.856 |            €0 |            €0 |    €6.808 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Mid Game Probe (Fame 60–150) |       €12.036 |       €19.770 |            €0 |   €20.818 | ✅ Kapitalaufbau im erwarteten Korridor.                       |
| Late Game Probe (Fame 175+)  |       €29.164 |            €0 |            €0 |   €28.792 | ✅ Kapitalaufbau im erwarteten Korridor.                       |

## Einkommensstruktur & Sink-Analyse

| Szenario                     | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung                         |
| ---------------------------- | ----------: | ----------------: | ----------------: | -----------------: | ------------------: | --------------------------------- |
| Baseline Touring             |      €2.952 |              €140 |             21.1× |               8.47 |                0.51 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle           |        €631 |               €68 |              9.3× |              39.62 |                2.38 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing         |      €2.765 |              €123 |             22.5× |               9.04 |                0.54 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery             |      €1.930 |              €102 |               19× |              12.95 |                0.78 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push                |      €2.546 |              €105 |             24.1× |               9.82 |                0.59 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour                   |      €2.508 |              €120 |             20.9× |               9.97 |                 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth             |      €2.806 |              €124 |             22.7× |               8.91 |                0.53 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) |      €2.245 |              €102 |               22× |              11.13 |                0.67 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) |      €2.592 |              €120 |             21.6× |               9.64 |                0.58 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+)  |      €2.945 |              €138 |             21.4× |               8.49 |                0.51 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario                     | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung                                              |
| ---------------------------- | ----------------: | -----------: | ------: | ---------: | -----------: | ---------: | ------------------------------------------------------ |
| Baseline Touring             |               152 |          6.8 |      60 |      11.9% |        75.6% |      12.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle           |               152 |          5.6 |      67 |         4% |        59.1% |      36.9% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Aggressive Marketing         |               152 |          6.7 |      61 |      11.5% |        73.5% |        15% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery             |               157 |          6.8 |      60 |      15.2% |        68.8% |      15.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push                |               152 |          5.4 |      68 |       4.3% |        54.8% |      40.8% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour                   |               152 |          6.7 |      60 |      13.1% |        72.2% |      14.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth             |               152 |            7 |      59 |      16.6% |          73% |      10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) |               152 |          7.1 |      58 |      22.1% |        63.8% |      14.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) |               157 |          7.2 |      58 |      19.3% |        72.7% |         8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+)  |               157 |          6.8 |      60 |      13.2% |        73.9% |        13% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario                     | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung                                                     |
| ---------------------------- | -----------: | ---------------: | -----------------: | --------------: | -----------------: | ------------: | ------------------------------------------------------------- |
| Baseline Touring             |           60 |            14.42 |               3.27 |            1.09 |               7.45 |         12.27 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle           |           62 |             0.06 |               0.02 |               0 |               0.77 |          1.07 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |
| Aggressive Marketing         |           63 |             5.75 |               1.89 |            1.15 |                5.7 |          9.38 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |
| Scandal Recovery             |           63 |             1.04 |               0.37 |            0.25 |               1.72 |          2.72 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |
| Festival Push                |           65 |             1.29 |               0.46 |             0.3 |               2.31 |          3.49 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |
| Chaos Tour                   |           62 |             5.46 |               1.66 |            0.99 |               5.25 |          8.61 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |
| Cult Hypergrowth             |           61 |             7.11 |               2.37 |             1.4 |               7.32 |         11.64 | ✅ Bandgesundheit im akzeptablen Bereich.                     |
| Early Game Probe (Fame 0–50) |           60 |             1.08 |               0.37 |            0.16 |               1.45 |          2.25 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |
| Mid Game Probe (Fame 60–150) |           57 |             4.53 |               1.29 |            0.68 |               4.05 |           7.1 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |
| Late Game Probe (Fame 175+)  |           60 |             5.83 |               1.35 |             0.4 |               3.33 |          5.45 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf.      |

## Events & Social im Detail

| Szenario                     | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung                                                          |
| ---------------------------- | ---------------: | ------------: | ------------: | -----------------: | -------------: | -----------------: | ------------------------------------------------------------------ |
| Baseline Touring             |             0.23 |          1.35 |          1.19 |               0.79 |           8.17 |              20.27 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil.  |
| Bootstrap Struggle           |             0.05 |          0.18 |          0.17 |               0.03 |           0.67 |               0.13 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing         |             0.36 |          1.73 |          1.44 |               0.48 |           6.14 |              11.13 | ✅ Gesunde Event-Verteilung.                                       |
| Scandal Recovery             |             0.13 |          0.69 |          0.57 |               0.12 |           1.98 |               1.87 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Festival Push                |              0.1 |          0.48 |          0.38 |               0.08 |           2.42 |               3.38 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour                   |             0.41 |          2.38 |          2.22 |                0.7 |           5.73 |               9.72 | ✅ Gesunde Event-Verteilung.                                       |
| Cult Hypergrowth             |             0.41 |          1.81 |          1.65 |               0.51 |            7.9 |              13.22 | ✅ Gesunde Event-Verteilung.                                       |
| Early Game Probe (Fame 0–50) |             0.03 |          0.21 |          0.18 |               0.07 |           1.57 |               1.88 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) |             0.17 |          0.87 |          0.72 |                0.2 |           4.95 |               7.77 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+)  |             0.14 |           0.9 |          0.63 |               0.56 |           3.69 |               9.27 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario                     | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung                                                                |
| ---------------------------- | -------------: | -------------: | -----------------: | ---------------: | ------------------------------------------------------------------------ |
| Baseline Touring             |          53.81 |          53.81 |              53.81 |           161.43 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal.               |
| Bootstrap Struggle           |           1.15 |           1.15 |               1.15 |             3.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing         |          19.84 |          19.84 |              19.84 |            59.52 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität.         |
| Scandal Recovery             |           3.67 |           3.67 |               3.67 |            11.01 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push                |           4.87 |           4.87 |               4.87 |            14.61 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour                   |          17.97 |          17.97 |              17.97 |            53.91 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität.         |
| Cult Hypergrowth             |          24.47 |          24.47 |              24.47 |            73.41 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität.         |
| Early Game Probe (Fame 0–50) |           5.17 |           5.17 |               5.17 |            15.51 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) |          15.24 |          15.24 |              15.24 |            45.72 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität.         |
| Late Game Probe (Fame 175+)  |          24.12 |          24.12 |              24.12 |            72.36 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität.         |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik                | Gewinner               |    Wert | Bewertung                                                              |
| --------------------- | ---------------------- | ------: | ---------------------------------------------------------------------- |
| Höchstes Ø Endgeld    | **Baseline Touring**   | €54.146 | Tägliches Gigging dominiert als Einnahmestrategie.                     |
| Höchstes Ø Endfame    | **Baseline Touring**   |    3449 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen.           |
| Höchste Insolvenzrate | **Bootstrap Struggle** |  99.62% | Erwartetes Risikoprofil für ressourcenarme Spielweisen.                |
| Höchster Ø Gig-Netto  | **Baseline Touring**   |  €2.952 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag.             |
| Höchstes Ø Peak-Geld  | **Baseline Touring**   | €66.661 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin.            |
| Meiste Ø Gigs         | **Baseline Touring**   |   53.81 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events       | **Chaos Tour**         |    5.71 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse.    |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario             | KPI                  | Ziel              | Ist-Wert | Status | Bewertung                                               |
| -------------------- | -------------------- | ----------------- | -------- | ------ | ------------------------------------------------------- |
| Baseline Touring     | Insolvenzrate        | ≤ 10%             | 23.85%   | ❌     | Außerhalb Toleranz – Rebalancing nötig.                 |
| Baseline Touring     | Endgeld              | €25.000 – €80.000 | €54.146  | ✅     | Zentral im Zielband – sehr gute Balance.                |
| Baseline Touring     | Fame-Fortschritt/Gig | 250 – 420         | 325.25   | ✅     | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Bootstrap Struggle   | Insolvenzrate        | ≤ 85%             | 99.62%   | ❌     | Außerhalb Toleranz – Rebalancing nötig.                 |
| Bootstrap Struggle   | Endgeld              | €1.000 – €5.000   | €67      | ❌     | Außerhalb Zielband – Einnahmenpfad prüfen.              |
| Bootstrap Struggle   | Fame-Fortschritt/Gig | 450 – 800         | 678.63   | ✅     | Im Zielband – leicht außermittig.                       |
| Aggressive Marketing | Insolvenzrate        | ≤ 15%             | 38.08%   | ❌     | Außerhalb Toleranz – Rebalancing nötig.                 |
| Aggressive Marketing | Endgeld              | €15.000 – €50.000 | €15.807  | ✅     | Im Zielband – leicht außermittig.                       |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520         | 353.66   | ✅     | Im Zielband – leicht außermittig.                       |
| Scandal Recovery     | Insolvenzrate        | ≤ 45%             | 86.92%   | ❌     | Außerhalb Toleranz – Rebalancing nötig.                 |
| Scandal Recovery     | Endgeld              | €5.000 – €30.000  | €2.212   | ❌     | Außerhalb Zielband – Einnahmenpfad prüfen.              |
| Scandal Recovery     | Fame-Fortschritt/Gig | 220 – 420         | 362.7    | ✅     | Im Zielband – leicht außermittig.                       |
| Festival Push        | Insolvenzrate        | ≤ 35%             | 85%      | ❌     | Außerhalb Toleranz – Rebalancing nötig.                 |
| Festival Push        | Endgeld              | €10.000 – €50.000 | €2.711   | ❌     | Außerhalb Zielband – Einnahmenpfad prüfen.              |
| Festival Push        | Fame-Fortschritt/Gig | 250 – 500         | 600      | ❌     | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen.   |
| Chaos Tour           | Insolvenzrate        | ≤ 25%             | 45%      | ❌     | Außerhalb Toleranz – Rebalancing nötig.                 |
| Chaos Tour           | Endgeld              | €10.000 – €60.000 | €12.647  | ✅     | Im Zielband – leicht außermittig.                       |
| Chaos Tour           | Fame-Fortschritt/Gig | 260 – 500         | 354.99   | ✅     | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Cult Hypergrowth     | Insolvenzrate        | ≤ 12%             | 17.31%   | ❌     | Außerhalb Toleranz – Rebalancing nötig.                 |
| Cult Hypergrowth     | Endgeld              | €15.000 – €50.000 | €23.099  | ✅     | Im Zielband – leicht außermittig.                       |
| Cult Hypergrowth     | Fame-Fortschritt/Gig | 260 – 520         | 282.34   | ✅     | Im Zielband – leicht außermittig.                       |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario                     | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
| ---------------------------- | --------------: | --------: | ---------: | -----: |
| Baseline Touring             |           6.54% |   €-8.033 |      37.35 |  -0.91 |
| Bootstrap Struggle           |              0% |       €15 |       1.93 |  -0.02 |
| Aggressive Marketing         |          -1.15% |     €-106 |       7.08 |   0.72 |
| Scandal Recovery             |          -3.08% |      €391 |     -30.28 |   0.52 |
| Festival Push                |          -3.08% |      €515 |     -15.04 |   0.68 |
| Chaos Tour                   |             -5% |      €941 |       4.32 |   0.98 |
| Cult Hypergrowth             |          -2.69% |      €227 |      10.79 |   0.62 |
| Early Game Probe (Fame 0–50) |          -3.08% |      €502 |       2.54 |   0.24 |
| Mid Game Probe (Fame 60–150) |          -0.38% |    €1.072 |      14.79 |  -0.02 |
| Late Game Probe (Fame 175+)  |          -0.77% |      €721 |      29.98 |   0.14 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 99.62% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €54.146 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 5.71 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Insolvenzrate) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Insolvenzrate) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Festival Push (Insolvenzrate) · Festival Push (Endgeld) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Insolvenzrate) · Cult Hypergrowth (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
