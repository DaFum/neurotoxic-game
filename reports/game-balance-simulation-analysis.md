# Game Balance Simulation – Analyse

Erstellt am: 2026-03-22T18:17:33.472Z

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
| Baseline Touring | 150896 | 105 | 44 | 0.77 | 25 | 0% | 6319 | 6.52 | 9.31 | 3.15 | 8.17 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | 25628 | 10 | 50 | 0.94 | 18 | 0% | 2039 | 9.61 | 9.07 | 2.9 | 8.14 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | 281424 | 101 | 42 | 0.83 | 37 | 0% | 7963 | 11.38 | 8.67 | 3.38 | 8.37 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | 26990 | 0 | 44 | 16.02 | 25 | 0% | 1541 | 14.38 | 9.03 | 3.21 | 8.34 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | 225496 | 240 | 44 | 0.65 | 25 | 0% | 9205 | 7.25 | 9.12 | 3.5 | 8.24 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | 50424 | 0 | 32 | 3.86 | 36.88 | 0% | 1783 | 17.93 | 8.98 | 3.32 | 8.22 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | 303392 | 108 | 43 | 0.86 | 37 | 0% | 8657 | 9.98 | 9.23 | 3.37 | 8.35 | ✅ Szenario liegt im robusten Simulationskorridor. |

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
- Höchster Kapitalaufbau: **Cult Hypergrowth** mit Ø 303392 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.93 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
