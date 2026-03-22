# Game Balance Simulation – Analyse

Erstellt am: 2026-03-22T08:45:51.318Z

## Simulationseinstellungen

- Runs je Szenario: 260
- Tage je Run: 75
- Basis-Tageskosten: 40
- PreGig-Kostenreferenz: {"catering":20,"promo":30,"merch":30,"soundcheck":50,"guestlist":60}

## Feature-Snapshot der App (analysiert)

- Venues: 45
- Event-Kategorien: 5
- Events gesamt: 121
- Brand Deals: 4
- Post Options: 32
- Contraband-Items: 27
- Upgrade-Katalog: 60

## Ergebnis-Matrix

| Szenario             | Ø Endgeld | Ø Endfame | Ø Harmony | Ø Kontroverse | Ø Gigs | Insolvenzrate | Ø Gig-Netto | Ø Events (viral/cash/band) | Ø Trend | Ø Brand Deals | Ø Contraband | Bewertung                                          |
| -------------------- | --------: | --------: | --------: | ------------: | -----: | ------------: | ----------: | -------------------------: | ------: | ------------: | -----------: | -------------------------------------------------- |
| Baseline Touring     |    151936 |       106 |        44 |           0.7 |     25 |            0% |        6370 |                       6.49 |    9.32 |          3.18 |         8.19 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle   |     28427 |        14 |        50 |          0.92 |     18 |            0% |        2224 |                       9.68 |    9.05 |          2.88 |         8.42 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing |    267120 |        89 |        42 |          0.85 |     37 |            0% |        7575 |                      11.41 |    8.78 |          3.37 |         8.29 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery     |     26975 |         0 |        44 |         16.05 |     25 |            0% |        1532 |                      14.23 |    9.11 |          3.22 |         8.41 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push        |    202092 |       156 |        44 |           0.8 |     25 |            0% |        8358 |                       7.27 |    9.24 |          3.53 |         8.18 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour           |     47560 |         0 |        32 |          3.53 |  36.88 |            0% |        1710 |                      17.78 |    8.98 |          3.27 |         8.33 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth     |    302835 |       109 |        43 |          0.86 |     37 |            0% |        8685 |                       9.97 |    9.24 |          3.39 |         8.35 | ✅ Szenario liegt im robusten Simulationskorridor. |

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
- ⚪ events_db
- ✅ brand_deals
- ✅ social_trends
- ✅ social_platforms
- ✅ post_options
- ✅ contraband
- ✅ sponsorship
- ✅ maintenance
- ✅ upgrades

## Kurzfazit

- Kein Szenario mit Insolvenzfällen beobachtet.
- Höchster Kapitalaufbau: **Cult Hypergrowth** mit Ø 302835 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.78 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
