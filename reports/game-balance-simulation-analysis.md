# Game Balance Simulation – Analyse

Erstellt am: 2026-03-22T22:47:44.341Z

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
| Baseline Touring | €500 | 0 | €308.769 | 358 | 3 | 52 | 0.45 | 61.6 | 13.4 | 0% | €5.138 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €240 | 0 | €1.244 | 11 | 0 | 56 | 0.17 | 0.58 | 0.23 | 95.77% | €3.107 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €650 | 20 | €170.445 | 316 | 3 | 53 | 0.48 | 31.1 | 5.9 | 0% | €5.671 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €450 | 30 | €45.500 | 230 | 2 | 54 | 13.03 | 16.76 | 5.58 | 13.08% | €3.317 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €1.400 | 120 | €115.597 | 349 | 3 | 52 | 0.71 | 21.18 | 3.25 | 2.31% | €5.722 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €380 | 16 | €118.475 | 309 | 3 | 55 | 1.77 | 28.75 | 7.31 | 2.69% | €4.503 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €900 | 70 | €189.886 | 295 | 2 | 54 | 0.58 | 31.18 | 5.82 | 0% | €6.200 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | €308.831 | €500 | €5.138 | 65.21 | 3.56 | 2 | 11.64 | 12.17 |
| Bootstrap Struggle | €1.525 | €50 | €3.107 | 0.5 | 0.13 | 0.1 | 0.08 | 0.23 |
| Aggressive Marketing | €170.701 | €586 | €5.671 | 61.2 | 3.3 | 1.99 | 5.95 | 8.05 |
| Scandal Recovery | €45.930 | €249 | €3.317 | 24.02 | 2.58 | 1.83 | 3.07 | 5.47 |
| Festival Push | €115.724 | €997 | €5.722 | 56.7 | 3.38 | 1.96 | 3.93 | 6.12 |
| Chaos Tour | €118.774 | €306 | €4.503 | 48 | 3.17 | 1.95 | 5.02 | 7.51 |
| Cult Hypergrowth | €190.069 | €833 | €6.200 | 63.12 | 3.36 | 1.98 | 5.99 | 7.55 |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 52 | 13.4 | 0.37 | 0 | 8.28 | 13.58 |
| Bootstrap Struggle | 56 | 0.23 | 0.02 | 0 | 0.7 | 1.19 |
| Aggressive Marketing | 53 | 5.9 | 0.45 | 0 | 8.34 | 13.32 |
| Scandal Recovery | 54 | 5.58 | 0.33 | 0 | 7.45 | 12.13 |
| Festival Push | 52 | 3.25 | 0.35 | 0 | 8.09 | 13.27 |
| Chaos Tour | 55 | 7.31 | 0.41 | 0 | 7.93 | 12.91 |
| Cult Hypergrowth | 54 | 5.82 | 0.45 | 0 | 8.3 | 13.6 |

## Events & Social im Detail

| Szenario | Ø Viral-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0.32 | 1.51 | 1.25 | 1.05 | 9.18 | 15.15 |
| Bootstrap Struggle | 0.03 | 0.17 | 0.16 | 0.1 | 0.79 | 0.6 |
| Aggressive Marketing | 0.44 | 2.73 | 2.2 | 1.77 | 8.73 | 14.96 |
| Scandal Recovery | 0.51 | 2.66 | 2.44 | 1.96 | 7.94 | 12.14 |
| Festival Push | 0.32 | 1.64 | 1.39 | 1.11 | 8.83 | 14.86 |
| Chaos Tour | 0.73 | 3.83 | 3.29 | 2.84 | 8.62 | 14.42 |
| Cult Hypergrowth | 0.45 | 2.2 | 1.92 | 1.68 | 9.18 | 14.9 |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames |
|---|---:|---:|---:|---:|
| Baseline Touring | 61.6 | 61.6 | 61.6 | 184.8 |
| Bootstrap Struggle | 0.58 | 0.58 | 0.58 | 1.74 |
| Aggressive Marketing | 31.1 | 31.1 | 31.1 | 93.3 |
| Scandal Recovery | 16.76 | 16.76 | 16.76 | 50.28 |
| Festival Push | 21.18 | 21.18 | 21.18 | 63.54 |
| Chaos Tour | 28.75 | 28.75 | 28.75 | 86.25 |
| Cult Hypergrowth | 31.18 | 31.18 | 31.18 | 93.54 |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert |
|---|---|---:|
| Höchstes Ø Endgeld | **Baseline Touring** | €308.769 |
| Höchstes Ø Endfame | **Baseline Touring** | 358 |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 95.77% |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €6.200 |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €308.831 |
| Meiste Ø Gigs | **Baseline Touring** | 61.6 |
| Meiste Ø Events | **Chaos Tour** | 7.85 |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status |
|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ |
| Baseline Touring | Endgeld | €8.000 – €80.000 | €308.769 | ❌ |
| Baseline Touring | Endfame | 200 – 500 | 358 | ✅ |
| Bootstrap Struggle | Insolvenzrate | ≤ 80% | 95.77% | ❌ |
| Bootstrap Struggle | Endgeld | €0 – €20.000 | €1.244 | ✅ |
| Bootstrap Struggle | Endfame | 50 – 250 | 11 | ❌ |
| Aggressive Marketing | Insolvenzrate | ≤ 10% | 0% | ✅ |
| Aggressive Marketing | Endgeld | €5.000 – €60.000 | €170.445 | ❌ |
| Aggressive Marketing | Endfame | 200 – 450 | 316 | ✅ |
| Scandal Recovery | Insolvenzrate | ≤ 30% | 13.08% | ✅ |
| Scandal Recovery | Endgeld | €0 – €30.000 | €45.500 | ❌ |
| Scandal Recovery | Endfame | 100 – 350 | 230 | ✅ |
| Festival Push | Insolvenzrate | ≤ 10% | 2.31% | ✅ |
| Festival Push | Endgeld | €10.000 – €100.000 | €115.597 | ❌ |
| Festival Push | Endfame | 250 – 550 | 349 | ✅ |
| Chaos Tour | Insolvenzrate | ≤ 20% | 2.69% | ✅ |
| Chaos Tour | Endgeld | €0 – €50.000 | €118.475 | ❌ |
| Chaos Tour | Endfame | 150 – 450 | 309 | ✅ |
| Cult Hypergrowth | Insolvenzrate | ≤ 10% | 0% | ✅ |
| Cult Hypergrowth | Endgeld | €5.000 – €70.000 | €189.886 | ❌ |
| Cult Hypergrowth | Endfame | 200 – 500 | 295 | ✅ |

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
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €308.769 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 7.85 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endfame) · Aggressive Marketing (Endgeld) · Scandal Recovery (Endgeld) · Festival Push (Endgeld) · Chaos Tour (Endgeld) · Cult Hypergrowth (Endgeld)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
