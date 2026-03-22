# Game Balance Simulation – Analyse

Erstellt am: 2026-03-22T22:07:09.815Z

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
| Baseline Touring | 531984 | 355 | 50 | 0.42 | 61.81 | 13.19 | 0% | 8556 | 3.15 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | 70177 | 216 | 53 | 0.59 | 13.65 | 4.35 | 0% | 5670 | 4.39 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | 304255 | 309 | 55 | 0.55 | 31.27 | 5.73 | 0% | 9676 | 5.16 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | 111239 | 249 | 51 | 6.9 | 19.55 | 5.45 | 0% | 6035 | 6.7 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | 217875 | 364 | 52 | 0.45 | 22.12 | 2.88 | 0% | 9772 | 3.79 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | 235050 | 315 | 53 | 0.8 | 29.93 | 7.07 | 0% | 8006 | 8.42 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | 329874 | 289 | 55 | 0.55 | 31.38 | 5.62 | 0% | 10388 | 4.95 | ✅ Szenario liegt im robusten Simulationskorridor. |

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
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø 531984 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 8.42 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
