# Game Balance Simulation – Analyse

Erstellt am: 2026-03-22T21:01:03.037Z

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

| Szenario | Ø Endgeld | Ø Endfame | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenzrate | Ø Gig-Netto | Ø Events (viral/cash/band) | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 532962 | 357 | 50 | 0.56 | 61.81 | 13.19 | 0% | 8583 | 3.28 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | 71231 | 222 | 53 | 0.58 | 13.67 | 4.33 | 0% | 5764 | 4.42 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | 304923 | 310 | 55 | 0.49 | 31.27 | 5.73 | 0% | 9698 | 5.42 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | 113371 | 254 | 52 | 7.04 | 19.49 | 5.51 | 0% | 6152 | 6.49 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | 215505 | 363 | 52 | 0.6 | 22.08 | 2.92 | 0% | 9695 | 3.43 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | 236019 | 314 | 53 | 0.7 | 29.86 | 7.14 | 0% | 8062 | 8.29 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | 328614 | 290 | 56 | 0.5 | 31.36 | 5.64 | 0% | 10358 | 4.72 | ✅ Szenario liegt im robusten Simulationskorridor. |

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

- Kein Szenario mit Insolvenzfällen beobachtet.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø 532962 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 8.29 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
