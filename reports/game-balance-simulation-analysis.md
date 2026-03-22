# Game Balance Simulation – Analyse

Erstellt am: 2026-03-22T22:36:54.289Z

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
| Baseline Touring | 312259 | 359 | 51 | 0.5 | 61.64 | 13.36 | 0% | 5195 | 3.03 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | 1220 | 10 | 56 | 0.13 | 0.58 | 0.22 | 95.77% | 2989 | 0.36 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | 173404 | 310 | 54 | 0.52 | 31.1 | 5.9 | 0% | 5737 | 5.43 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | 42623 | 223 | 55 | 14.29 | 16.22 | 5.42 | 16.54% | 3225 | 5.6 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | 115455 | 349 | 53 | 0.68 | 21.07 | 3.27 | 2.69% | 5746 | 3.45 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | 117030 | 311 | 54 | 2.17 | 28.65 | 7.28 | 3.08% | 4460 | 7.96 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | 189661 | 292 | 54 | 0.57 | 31.18 | 5.82 | 0% | 6185 | 4.77 | ✅ Szenario liegt im robusten Simulationskorridor. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 95.77% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø 312259 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 7.96 Event-Impulsen.
- Empfehlung: Extreme Szenarien priorisiert gegeneinander testen und Ziel-KPI-Bänder definieren.
