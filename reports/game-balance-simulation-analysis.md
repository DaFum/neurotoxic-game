# Game Balance Simulation – Analyse

Erstellt am: 2026-03-18T19:40:34.132Z

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
| Baseline Touring | 29033 | 0 | 40 | 0.81 | 25 | 0% | 1889 | 6.91 | 9.19 | 3.3 | 8.42 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Bootstrap Struggle | 10217 | 0 | 49 | 0.85 | 18 | 0% | 1628 | 9.34 | 9.28 | 2.98 | 8.21 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | 74524 | 0 | 8 | 0.83 | 37 | 0% | 2431 | 11.31 | 9.12 | 3.55 | 8.14 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Scandal Recovery | 18028 | 0 | 22 | 15.19 | 25 | 0% | 1452 | 14.46 | 9.25 | 3.05 | 8.19 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Festival Push | 134450 | 63 | 41 | 0.77 | 25 | 0% | 5838 | 7.41 | 9.05 | 3.35 | 8.43 | ⚠️ Geldwachstum entkoppelt von Fame – Reputations- und Monetarisierungs-Kurve angleichen. |
| Chaos Tour | 40292 | 0 | 5 | 3.6 | 37 | 0% | 1654 | 17.62 | 9.12 | 3.26 | 8.55 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Cult Hypergrowth | 127604 | 0 | 7 | 0.93 | 37 | 0% | 3822 | 10.42 | 8.87 | 3.44 | 8.36 | ⚠️ Geldwachstum entkoppelt von Fame – Reputations- und Monetarisierungs-Kurve angleichen. |

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

- Höchstes Risiko: **Baseline Touring** mit 0% Insolvenzrate.
- Höchster Kapitalaufbau: **Festival Push** mit Ø 134450 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 17.62 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
