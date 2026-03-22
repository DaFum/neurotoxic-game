# Game Balance Simulation – Analyse

Erstellt am: 2026-03-22T19:04:59.434Z

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

| Szenario | Ø Endgeld | Ø Endfame | Ø Harmony | Ø Kontroverse | Ø Gigs | Insolvenzrate | Ø Gig-Netto | Ø Events (viral/cash/band) | Ø Trend | Ø Brand Deals | Ø Contraband | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 155240 | 107 | 44 | 0.57 | 25 | 0% | 6266 | 3.05 | 9.25 | 3.22 | 8.36 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | 24372 | 10 | 50 | 0.55 | 18 | 0% | 1991 | 4.47 | 8.63 | 2.7 | 8.14 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | 295805 | 98 | 44 | 0.48 | 37 | 0% | 7909 | 5.34 | 9.21 | 3.54 | 8.56 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | 29141 | 0 | 44 | 7.13 | 25 | 0% | 1561 | 6.63 | 8.95 | 3.02 | 8.33 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | 233529 | 240 | 44 | 0.63 | 25 | 0% | 9248 | 3.46 | 8.94 | 3.33 | 8.23 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | 56068 | 0 | 38 | 0.88 | 36.98 | 0% | 1768 | 8.34 | 9.21 | 3.36 | 8.44 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | 325046 | 108 | 46 | 0.66 | 37 | 0% | 8651 | 4.91 | 8.98 | 3.5 | 8.1 | ✅ Szenario liegt im robusten Simulationskorridor. |

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
- Höchster Kapitalaufbau: **Cult Hypergrowth** mit Ø 325046 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 8.34 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
