# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T10:25:15.121Z

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
| Bootstrap Struggle | €240 | 0 | €212 | 7 | 0 | 56 | 0.11 | 0.39 | 0.22 | 98.08% | €1.524 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €650 | 0 | €121.365 | 312 | 3 | 51 | 0.74 | 30.47 | 6.53 | 0% | €4.212 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €450 | 0 | €12.022 | 120 | 1 | 56 | 26.57 | 9.32 | 4.17 | 58.85% | €1.898 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €1.400 | 150 | €79.735 | 340 | 3 | 53 | 1.03 | 19.87 | 4.07 | 4.23% | €4.354 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €380 | 0 | €68.154 | 300 | 3 | 52 | 3.62 | 26.64 | 7.89 | 7.69% | €2.996 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €900 | 150 | €140.229 | 289 | 2 | 52 | 0.54 | 30.65 | 6.21 | 0.38% | €4.748 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €217.594 | €500 | €3.740 | 63.43 | 3.53 | 2 | 11.65 | 12.04 |
| Bootstrap Struggle | €528 | €48 | €1.524 | 0.03 | 0.06 | 0.04 | 0.04 | 0.16 |
| Aggressive Marketing | €121.636 | €583 | €4.212 | 57.23 | 3.39 | 1.98 | 5.91 | 7.95 |
| Scandal Recovery | €12.655 | €104 | €1.898 | 6.48 | 1.06 | 0.9 | 1.42 | 3.07 |
| Festival Push | €79.905 | €943 | €4.354 | 52.72 | 3.27 | 1.94 | 3.77 | 5.87 |
| Chaos Tour | €68.591 | €271 | €2.996 | 38.92 | 2.83 | 1.9 | 4.55 | 7.09 |
| Cult Hypergrowth | €140.460 | €816 | €4.748 | 60.57 | 3.32 | 1.98 | 5.91 | 7.5 |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 45 | 14.01 | 0.43 | 0 | 8.19 | 13.4 |
| Bootstrap Struggle | 56 | 0.22 | 0 | 0 | 0.65 | 0.98 |
| Aggressive Marketing | 51 | 6.53 | 0.4 | 0 | 8.67 | 13.19 |
| Scandal Recovery | 56 | 4.17 | 0.19 | 0 | 4.31 | 7.27 |
| Festival Push | 53 | 4.07 | 0.42 | 0 | 8.19 | 13.14 |
| Chaos Tour | 52 | 7.89 | 0.39 | 0 | 7.98 | 12.73 |
| Cult Hypergrowth | 52 | 6.21 | 0.39 | 0 | 8.01 | 13.25 |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.29 | 1.43 | 1.36 | 0.81 | 9.2 | 15.13 |
| Bootstrap Struggle | 0.02 | 0.16 | 0.16 | 0.01 | 0.6 | 0.23 |
| Aggressive Marketing | 0.47 | 2.4 | 2.31 | 0.66 | 8.68 | 14.88 |
| Scandal Recovery | 0.35 | 1.65 | 1.52 | 0.25 | 5.13 | 4.59 |
| Festival Push | 0.35 | 1.57 | 1.43 | 0.38 | 8.5 | 14.28 |
| Chaos Tour | 0.65 | 3.78 | 3.29 | 1.02 | 8.33 | 12.92 |
| Cult Hypergrowth | 0.43 | 2.21 | 2.15 | 0.7 | 9.02 | 15.08 |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames |
|---|---:|---:|---:|---:|
| Baseline Touring | 60.99 | 60.99 | 60.99 | 182.97 |
| Bootstrap Struggle | 0.39 | 0.39 | 0.39 | 1.17 |
| Aggressive Marketing | 30.47 | 30.47 | 30.47 | 91.41 |
| Scandal Recovery | 9.32 | 9.32 | 9.32 | 27.96 |
| Festival Push | 19.87 | 19.87 | 19.87 | 59.61 |
| Chaos Tour | 26.64 | 26.64 | 26.64 | 79.92 |
| Cult Hypergrowth | 30.65 | 30.65 | 30.65 | 91.95 |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert |
|---|---|---:|
| Höchstes Ø Endgeld | **Baseline Touring** | €217.549 |
| Höchstes Ø Endfame | **Festival Push** | 340 |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 98.08% |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €4.748 |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €217.594 |
| Meiste Ø Gigs | **Baseline Touring** | 60.99 |
| Meiste Ø Events | **Chaos Tour** | 8.73 |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status |
|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ |
| Baseline Touring | Endgeld | €8.000 – €350.000 | €217.549 | ✅ |
| Baseline Touring | Endfame | 200 – 500 | 336 | ✅ |
| Bootstrap Struggle | Insolvenzrate | ≤ 99% | 98.08% | ✅ |
| Bootstrap Struggle | Endgeld | €0 – €20.000 | €212 | ✅ |
| Bootstrap Struggle | Endfame | 0 – 250 | 7 | ✅ |
| Aggressive Marketing | Insolvenzrate | ≤ 10% | 0% | ✅ |
| Aggressive Marketing | Endgeld | €5.000 – €200.000 | €121.365 | ✅ |
| Aggressive Marketing | Endfame | 200 – 450 | 312 | ✅ |
| Scandal Recovery | Insolvenzrate | ≤ 70% | 58.85% | ✅ |
| Scandal Recovery | Endgeld | €0 – €50.000 | €12.022 | ✅ |
| Scandal Recovery | Endfame | 0 – 350 | 120 | ✅ |
| Festival Push | Insolvenzrate | ≤ 15% | 4.23% | ✅ |
| Festival Push | Endgeld | €10.000 – €150.000 | €79.735 | ✅ |
| Festival Push | Endfame | 250 – 550 | 340 | ✅ |
| Chaos Tour | Insolvenzrate | ≤ 20% | 7.69% | ✅ |
| Chaos Tour | Endgeld | €0 – €100.000 | €68.154 | ✅ |
| Chaos Tour | Endfame | 150 – 450 | 300 | ✅ |
| Cult Hypergrowth | Insolvenzrate | ≤ 10% | 0.38% | ✅ |
| Cult Hypergrowth | Endgeld | €5.000 – €200.000 | €140.229 | ✅ |
| Cult Hypergrowth | Endfame | 200 – 500 | 289 | ✅ |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 98.08% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €217.549 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 8.73 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
