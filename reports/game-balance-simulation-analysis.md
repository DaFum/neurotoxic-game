# Game Balance Simulation – Analyse

Erstellt am: 2026-03-19T12:39:39.027Z

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
| Baseline Touring | 38233 | 0 | 44 | 0.72 | 25 | 0% | 1900 | 6.67 | 9.22 | 3.18 | 8.32 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | 17853 | 0 | 50 | 0.8 | 18 | 0% | 1646 | 9.54 | 9.04 | 2.85 | 8.13 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | 81679 | 0 | 41 | 0.79 | 37 | 0% | 2516 | 11.6 | 9.1 | 3.51 | 8.18 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | 26658 | 0 | 44 | 16.03 | 25 | 0% | 1518 | 14.25 | 9.1 | 3.24 | 8.39 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | 116807 | 45 | 44 | 0.91 | 25 | 0% | 4997 | 7.24 | 8.78 | 3.2 | 8.82 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | 47560 | 0 | 32 | 3.53 | 36.88 | 0% | 1710 | 17.78 | 8.98 | 3.27 | 8.33 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | 125642 | 0 | 44 | 0.86 | 37 | 0% | 3731 | 10.21 | 9.17 | 3.44 | 8.51 | ⚠️ Geldwachstum entkoppelt von Fame – Reputations- und Monetarisierungs-Kurve angleichen. |

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
- Höchster Kapitalaufbau: **Cult Hypergrowth** mit Ø 125642 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.78 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
