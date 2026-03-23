# Game Balance Simulation – Analyse

Erstellt am: 2026-03-23T13:50:19.264Z

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
| Baseline Touring | €500 | 0 | €235.642 | 338 | 3 | 45 | 0.67 | 61.03 | 13.97 | 0% | €4.033 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €240 | 0 | €331 | 8 | 0 | 56 | 0.08 | 0.48 | 0.27 | 96.92% | €1.770 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €650 | 20 | €134.005 | 310 | 3 | 52 | 0.47 | 30.59 | 6.41 | 0% | €4.598 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €450 | 30 | €10.945 | 115 | 1 | 54 | 33.48 | 8.83 | 3.97 | 60.77% | €1.839 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €1.400 | 120 | €85.554 | 340 | 3 | 51 | 0.87 | 19.98 | 3.97 | 4.23% | €4.626 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €380 | 16 | €75.184 | 301 | 3 | 52 | 2.98 | 27.17 | 7.95 | 5.77% | €3.203 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €900 | 70 | €149.188 | 286 | 2 | 52 | 0.52 | 30.8 | 6.2 | 0% | €4.999 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €235.703 | €500 | €4.033 | 63.8 | 3.36 | 2 | 11.62 | 12.12 |
| Bootstrap Struggle | €630 | €49 | €1.770 | 0.06 | 0.05 | 0.06 | 0.06 | 0.2 |
| Aggressive Marketing | €134.148 | €583 | €4.598 | 58.5 | 3.37 | 1.97 | 5.93 | 8.02 |
| Scandal Recovery | €11.525 | €93 | €1.839 | 5.75 | 0.97 | 0.81 | 1.28 | 2.85 |
| Festival Push | €85.688 | €947 | €4.626 | 53.36 | 3.15 | 1.94 | 3.77 | 5.88 |
| Chaos Tour | €75.495 | €281 | €3.203 | 40 | 2.75 | 1.9 | 4.71 | 7.23 |
| Cult Hypergrowth | €149.363 | €833 | €4.999 | 60.48 | 3.5 | 1.99 | 5.9 | 7.53 |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 45 | 13.97 | 0.45 | 0 | 8.3 | 13.4 |
| Bootstrap Struggle | 56 | 0.27 | 0.01 | 0 | 0.68 | 1.07 |
| Aggressive Marketing | 52 | 6.41 | 0.4 | 0 | 8.27 | 13.31 |
| Scandal Recovery | 54 | 3.97 | 0.14 | 0 | 4.21 | 6.8 |
| Festival Push | 51 | 3.97 | 0.43 | 0 | 7.97 | 13.12 |
| Chaos Tour | 52 | 7.95 | 0.38 | 0 | 8.03 | 13.08 |
| Cult Hypergrowth | 52 | 6.2 | 0.41 | 0 | 8.02 | 13.22 |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.28 | 1.46 | 1.38 | 0.85 | 9.17 | 15.17 |
| Bootstrap Struggle | 0.02 | 0.16 | 0.16 | 0.02 | 0.64 | 0.37 |
| Aggressive Marketing | 0.54 | 2.52 | 2.2 | 0.65 | 8.92 | 14.7 |
| Scandal Recovery | 0.36 | 1.62 | 1.42 | 0.24 | 4.66 | 4.13 |
| Festival Push | 0.33 | 1.62 | 1.42 | 0.34 | 8.38 | 14.68 |
| Chaos Tour | 0.74 | 3.94 | 3.48 | 1 | 8.27 | 13.18 |
| Cult Hypergrowth | 0.48 | 2.32 | 2.21 | 0.69 | 9.32 | 15.08 |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames |
|---|---:|---:|---:|---:|
| Baseline Touring | 61.03 | 61.03 | 61.03 | 183.09 |
| Bootstrap Struggle | 0.48 | 0.48 | 0.48 | 1.44 |
| Aggressive Marketing | 30.59 | 30.59 | 30.59 | 91.77 |
| Scandal Recovery | 8.83 | 8.83 | 8.83 | 26.49 |
| Festival Push | 19.98 | 19.98 | 19.98 | 59.94 |
| Chaos Tour | 27.17 | 27.17 | 27.17 | 81.51 |
| Cult Hypergrowth | 30.8 | 30.8 | 30.8 | 92.4 |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert |
|---|---|---:|
| Höchstes Ø Endgeld | **Baseline Touring** | €235.642 |
| Höchstes Ø Endfame | **Festival Push** | 340 |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 96.92% |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €4.999 |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €235.703 |
| Meiste Ø Gigs | **Baseline Touring** | 61.03 |
| Meiste Ø Events | **Chaos Tour** | 9.16 |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status |
|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ |
| Baseline Touring | Endgeld | €8.000 – €350.000 | €235.642 | ✅ |
| Baseline Touring | Endfame | 200 – 500 | 338 | ✅ |
| Bootstrap Struggle | Insolvenzrate | ≤ 99% | 96.92% | ✅ |
| Bootstrap Struggle | Endgeld | €0 – €20.000 | €331 | ✅ |
| Bootstrap Struggle | Endfame | 0 – 250 | 8 | ✅ |
| Aggressive Marketing | Insolvenzrate | ≤ 10% | 0% | ✅ |
| Aggressive Marketing | Endgeld | €5.000 – €200.000 | €134.005 | ✅ |
| Aggressive Marketing | Endfame | 200 – 450 | 310 | ✅ |
| Scandal Recovery | Insolvenzrate | ≤ 70% | 60.77% | ✅ |
| Scandal Recovery | Endgeld | €0 – €50.000 | €10.945 | ✅ |
| Scandal Recovery | Endfame | 0 – 350 | 115 | ✅ |
| Festival Push | Insolvenzrate | ≤ 15% | 4.23% | ✅ |
| Festival Push | Endgeld | €10.000 – €150.000 | €85.554 | ✅ |
| Festival Push | Endfame | 250 – 550 | 340 | ✅ |
| Chaos Tour | Insolvenzrate | ≤ 20% | 5.77% | ✅ |
| Chaos Tour | Endgeld | €0 – €100.000 | €75.184 | ✅ |
| Chaos Tour | Endfame | 150 – 450 | 301 | ✅ |
| Cult Hypergrowth | Insolvenzrate | ≤ 10% | 0% | ✅ |
| Cult Hypergrowth | Endgeld | €5.000 – €200.000 | €149.188 | ✅ |
| Cult Hypergrowth | Endfame | 200 – 500 | 286 | ✅ |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 96.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €235.642 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.16 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
