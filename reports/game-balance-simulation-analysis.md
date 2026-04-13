# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T10:36:15.767Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €40 |
| Modifier-Kosten | Catering €20, Promo €30, Merch €30, Soundcheck €50, Guestlist €60 |
| Venue-Fame-Gates | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |
| Fame-Level-Skala | Level = floor(fame / 100) |

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 121 |
| Brand Deals | 4 |
| Post Options | 32 |
| Contraband-Items | 27 |
| Upgrade-Katalog | 60 |
| Social Platforms | 4 |
| Trends | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 22 | travel |
| band | 40 | random, post_gig, travel |
| gig | 19 | gig_mid, gig_intro |
| financial | 27 | random, post_gig |
| special | 13 | special_location, travel, post_gig, random |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €217.549 | 336 | 3 | 45 | 0.63 | 60.99 | 14.01 | 0% | €3.740 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €18.134 | 222 | 2 | 54 | 0.6 | 12.66 | 4.45 | 6.92% | €2.542 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €122.625 | 308 | 3 | 51 | 0.63 | 30.48 | 6.52 | 0% | €4.255 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €48.505 | 257 | 2 | 51 | 0.66 | 19.07 | 5.57 | 1.54% | €3.107 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €72.199 | 341 | 3 | 51 | 0.4 | 19.72 | 4.83 | 1.92% | €4.077 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €94.444 | 312 | 3 | 51 | 0.57 | 29.9 | 6.96 | 0.38% | €3.518 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €124.484 | 284 | 2 | 52 | 0.54 | 30.41 | 6.45 | 0.38% | €4.292 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €217.594 | €500 | €3.740 | 63.43 | 3.53 | 2 | 11.65 | 12.04 |
| Bootstrap Struggle | €19.628 | €278 | €2.542 | 7.78 | 2.53 | 1.94 | 1.93 | 5.35 |
| Aggressive Marketing | €122.852 | €435 | €4.255 | 57.05 | 3.4 | 1.98 | 5.93 | 7.88 |
| Scandal Recovery | €48.675 | €362 | €3.107 | 36.52 | 3.1 | 1.96 | 3.47 | 6.13 |
| Festival Push | €72.423 | €364 | €4.077 | 48.33 | 2.97 | 1.96 | 3.7 | 5.93 |
| Chaos Tour | €94.728 | €434 | €3.518 | 54.67 | 3.41 | 1.98 | 5.25 | 7.76 |
| Cult Hypergrowth | €124.645 | €435 | €4.292 | 56.65 | 3.27 | 1.98 | 5.89 | 7.46 |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 45 | 14.01 | 0.43 | 0 | 8.19 | 13.4 |
| Bootstrap Struggle | 54 | 4.45 | 0.27 | 0 | 8.02 | 12.98 |
| Aggressive Marketing | 51 | 6.52 | 0.41 | 0 | 8.31 | 13.44 |
| Scandal Recovery | 51 | 5.57 | 0.48 | 0 | 8.27 | 13.3 |
| Festival Push | 51 | 4.83 | 0.44 | 0 | 8.05 | 13.42 |
| Chaos Tour | 51 | 6.96 | 0.43 | 0 | 8.38 | 13.24 |
| Cult Hypergrowth | 52 | 6.45 | 0.43 | 0 | 8.73 | 13.96 |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.29 | 1.43 | 1.36 | 0.81 | 9.2 | 15.13 |
| Bootstrap Struggle | 0.43 | 1.99 | 1.74 | 0.28 | 8.25 | 12.79 |
| Aggressive Marketing | 0.46 | 2.47 | 2.37 | 0.69 | 8.85 | 14.72 |
| Scandal Recovery | 0.62 | 2.95 | 2.8 | 0.55 | 8.96 | 14.13 |
| Festival Push | 0.36 | 1.68 | 1.43 | 0.25 | 8.87 | 14.18 |
| Chaos Tour | 0.65 | 4 | 3.68 | 1.04 | 8.81 | 14.64 |
| Cult Hypergrowth | 0.45 | 2.31 | 2.04 | 0.64 | 9.17 | 14.69 |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames |
|---|---:|---:|---:|---:|
| Baseline Touring | 60.99 | 60.99 | 60.99 | 182.97 |
| Bootstrap Struggle | 12.66 | 12.66 | 12.66 | 37.98 |
| Aggressive Marketing | 30.48 | 30.48 | 30.48 | 91.44 |
| Scandal Recovery | 19.07 | 19.07 | 19.07 | 57.21 |
| Festival Push | 19.72 | 19.72 | 19.72 | 59.16 |
| Chaos Tour | 29.9 | 29.9 | 29.9 | 89.7 |
| Cult Hypergrowth | 30.41 | 30.41 | 30.41 | 91.23 |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert |
|---|---|---:|
| Höchstes Ø Endgeld | **Baseline Touring** | €217.549 |
| Höchstes Ø Endfame | **Festival Push** | 341 |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 6.92% |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €4.292 |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €217.594 |
| Meiste Ø Gigs | **Baseline Touring** | 60.99 |
| Meiste Ø Events | **Chaos Tour** | 9.38 |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status |
|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €217.549 | ✅ |
| Baseline Touring | Endfame | 200 – 500 | 336 | ✅ |
| Bootstrap Struggle | Insolvenzrate | ≤ 20% | 6.92% | ✅ |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €18.134 | ✅ |
| Bootstrap Struggle | Endfame | 120 – 320 | 222 | ✅ |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0% | ✅ |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €122.625 | ✅ |
| Aggressive Marketing | Endfame | 200 – 430 | 308 | ✅ |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 1.54% | ✅ |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €48.505 | ✅ |
| Scandal Recovery | Endfame | 150 – 360 | 257 | ✅ |
| Festival Push | Insolvenzrate | ≤ 10% | 1.92% | ✅ |
| Festival Push | Endgeld | €20.000 – €150.000 | €72.199 | ✅ |
| Festival Push | Endfame | 200 – 460 | 341 | ✅ |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.38% | ✅ |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €94.444 | ✅ |
| Chaos Tour | Endfame | 200 – 430 | 312 | ✅ |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.38% | ✅ |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €124.484 | ✅ |
| Cult Hypergrowth | Endfame | 200 – 380 | 284 | ✅ |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 6.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €217.549 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.38 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
