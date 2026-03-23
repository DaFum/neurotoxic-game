# Game Balance Simulation – Analyse

Erstellt am: 2026-03-23T13:07:28.889Z

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
| Baseline Touring | €500 | 0 | €165.178 | 256 | 2 | 26 | 0.58 | 46.82 | 28.18 | 0% | €3.745 | ⚠️ Harmonie zu instabil – mehr Recovery/Trade-offs in Events einbauen. |
| Bootstrap Struggle | €240 | 0 | €119 | 4 | 0 | 56 | 0.08 | 0.32 | 0.21 | 98.85% | €1.184 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €650 | 20 | €127.067 | 293 | 2 | 48 | 0.5 | 29.95 | 7.05 | 0% | €4.468 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €450 | 30 | €4.505 | 65 | 0 | 49 | 37.84 | 7 | 3.64 | 75.77% | €1.219 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €1.400 | 120 | €85.382 | 333 | 3 | 47 | 0.77 | 19.54 | 4.4 | 4.23% | €4.691 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €380 | 16 | €65.457 | 278 | 2 | 47 | 3.52 | 25.73 | 8.69 | 8.08% | €2.988 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €900 | 70 | €142.895 | 264 | 2 | 48 | 0.44 | 30.23 | 6.77 | 0% | €4.894 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €165.342 | €500 | €3.745 | 63.72 | 3.45 | 2 | 9.07 | 10.05 |
| Bootstrap Struggle | €445 | €48 | €1.184 | 0 | 0.05 | 0.04 | 0.02 | 0.13 |
| Aggressive Marketing | €127.330 | €583 | €4.468 | 58.31 | 3.22 | 1.97 | 5.89 | 7.91 |
| Scandal Recovery | €5.297 | €68 | €1.219 | 1.54 | 0.65 | 0.56 | 0.87 | 2.32 |
| Festival Push | €85.518 | €947 | €4.691 | 53.57 | 3.33 | 1.94 | 3.7 | 5.8 |
| Chaos Tour | €65.803 | €268 | €2.988 | 35.74 | 2.74 | 1.88 | 4.33 | 7 |
| Cult Hypergrowth | €143.120 | €833 | €4.894 | 60.5 | 3.45 | 1.99 | 5.84 | 7.4 |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 26 | 28.18 | 0.45 | 0 | 8.33 | 13.61 |
| Bootstrap Struggle | 56 | 0.21 | 0 | 0 | 0.6 | 0.9 |
| Aggressive Marketing | 48 | 7.05 | 0.39 | 0 | 8.37 | 13.33 |
| Scandal Recovery | 49 | 3.64 | 0.03 | 0 | 3.67 | 5.87 |
| Festival Push | 47 | 4.4 | 0.43 | 0 | 7.9 | 13.02 |
| Chaos Tour | 47 | 8.69 | 0.4 | 0 | 7.55 | 12.73 |
| Cult Hypergrowth | 48 | 6.77 | 0.42 | 0 | 8.27 | 13.31 |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.32 | 1.42 | 1.07 | 0.61 | 9.09 | 15.08 |
| Bootstrap Struggle | 0.03 | 0.14 | 0.15 | 0.01 | 0.57 | 0.16 |
| Aggressive Marketing | 0.47 | 2.48 | 2.4 | 0.71 | 8.96 | 14.66 |
| Scandal Recovery | 0.29 | 1.32 | 1.32 | 0.2 | 3.99 | 2.7 |
| Festival Push | 0.31 | 1.55 | 1.4 | 0.38 | 8.6 | 14.48 |
| Chaos Tour | 0.68 | 3.54 | 3.5 | 0.91 | 8.27 | 12.67 |
| Cult Hypergrowth | 0.45 | 2.28 | 2.13 | 0.68 | 9.14 | 15.22 |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames |
|---|---:|---:|---:|---:|
| Baseline Touring | 46.82 | 46.82 | 46.82 | 140.46 |
| Bootstrap Struggle | 0.32 | 0.32 | 0.32 | 0.96 |
| Aggressive Marketing | 29.95 | 29.95 | 29.95 | 89.85 |
| Scandal Recovery | 7 | 7 | 7 | 21 |
| Festival Push | 19.54 | 19.54 | 19.54 | 58.62 |
| Chaos Tour | 25.73 | 25.73 | 25.73 | 77.19 |
| Cult Hypergrowth | 30.23 | 30.23 | 30.23 | 90.69 |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert |
|---|---|---:|
| Höchstes Ø Endgeld | **Baseline Touring** | €165.178 |
| Höchstes Ø Endfame | **Festival Push** | 333 |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 98.85% |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €4.894 |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €165.342 |
| Meiste Ø Gigs | **Baseline Touring** | 46.82 |
| Meiste Ø Events | **Chaos Tour** | 8.63 |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status |
|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ |
| Baseline Touring | Endgeld | €8.000 – €400.000 | €165.178 | ✅ |
| Baseline Touring | Endfame | 200 – 500 | 256 | ✅ |
| Bootstrap Struggle | Insolvenzrate | ≤ 99% | 98.85% | ✅ |
| Bootstrap Struggle | Endgeld | €0 – €20.000 | €119 | ✅ |
| Bootstrap Struggle | Endfame | 0 – 250 | 4 | ✅ |
| Aggressive Marketing | Insolvenzrate | ≤ 10% | 0% | ✅ |
| Aggressive Marketing | Endgeld | €5.000 – €200.000 | €127.067 | ✅ |
| Aggressive Marketing | Endfame | 200 – 450 | 293 | ✅ |
| Scandal Recovery | Insolvenzrate | ≤ 85% | 75.77% | ✅ |
| Scandal Recovery | Endgeld | €0 – €60.000 | €4.505 | ✅ |
| Scandal Recovery | Endfame | 0 – 350 | 65 | ✅ |
| Festival Push | Insolvenzrate | ≤ 15% | 4.23% | ✅ |
| Festival Push | Endgeld | €10.000 – €200.000 | €85.382 | ✅ |
| Festival Push | Endfame | 250 – 550 | 333 | ✅ |
| Chaos Tour | Insolvenzrate | ≤ 20% | 8.08% | ✅ |
| Chaos Tour | Endgeld | €0 – €150.000 | €65.457 | ✅ |
| Chaos Tour | Endfame | 150 – 450 | 278 | ✅ |
| Cult Hypergrowth | Insolvenzrate | ≤ 10% | 0% | ✅ |
| Cult Hypergrowth | Endgeld | €5.000 – €200.000 | €142.895 | ✅ |
| Cult Hypergrowth | Endfame | 200 – 500 | 264 | ✅ |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 98.85% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €165.178 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 8.63 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
