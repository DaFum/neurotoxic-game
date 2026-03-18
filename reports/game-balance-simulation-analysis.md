# Game Balance Simulation – Analyse

Erstellt am: 2026-03-18T20:29:23.252Z

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
| Baseline Touring | 40096 | 0 | 41 | 0.73 | 25 | 0% | 1887 | 6.64 | 9.3 | 3.22 | 8.25 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Bootstrap Struggle | 19419 | 0 | 49 | 0.97 | 18 | 0% | 1644 | 9.52 | 9.1 | 2.95 | 8.13 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | 86122 | 0 | 8 | 0.85 | 37 | 0% | 2430 | 11.36 | 9.1 | 3.57 | 8.13 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Scandal Recovery | 27457 | 0 | 23 | 15.79 | 25 | 0% | 1461 | 14.27 | 9.04 | 3.1 | 8.13 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Festival Push | 146094 | 63 | 41 | 0.79 | 25 | 0% | 5839 | 7.42 | 9.06 | 3.35 | 8.4 | ⚠️ Geldwachstum entkoppelt von Fame – Reputations- und Monetarisierungs-Kurve angleichen. |
| Chaos Tour | 51885 | 0 | 5 | 3.63 | 37 | 0% | 1655 | 17.7 | 9.1 | 3.23 | 8.53 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Cult Hypergrowth | 139420 | 0 | 7 | 0.93 | 37 | 0% | 3822 | 10.43 | 8.87 | 3.46 | 8.34 | ⚠️ Geldwachstum entkoppelt von Fame – Reputations- und Monetarisierungs-Kurve angleichen. |

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
- Höchster Kapitalaufbau: **Festival Push** mit Ø 146094 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.70 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
