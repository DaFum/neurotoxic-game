# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T13:45:43.918Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €55 |
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
| Baseline Touring | €500 | 0 | €361.975 | 487 | 4 | 45 | 0.56 | 61.02 | 13.98 | 0% | €6.116 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €21.548 | 284 | 2 | 54 | 0.49 | 12.15 | 4.3 | 11.15% | €2.970 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €176.062 | 434 | 4 | 52 | 0.5 | 30.67 | 6.33 | 0% | €6.044 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €60.424 | 356 | 3 | 50 | 0.43 | 19.5 | 5.41 | 0.38% | €3.717 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €114.408 | 477 | 4 | 50 | 0.48 | 19.98 | 4.47 | 2.31% | €6.265 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €130.396 | 435 | 4 | 52 | 0.6 | 29.83 | 6.9 | 0.77% | €4.824 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €160.564 | 393 | 3 | 53 | 0.47 | 30.56 | 6.31 | 0.38% | €5.546 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €362.031 | €500 | €6.116 | 63.87 | 3.63 | 2 | 10.9 | 12.05 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €22.792 | €226 | €2.970 | 14.66 | 2.4 | 1.89 | 1.82 | 5.08 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €176.292 | €422 | €6.044 | 59.07 | 3.44 | 1.98 | 5.71 | 7.95 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €60.591 | €333 | €3.717 | 42.87 | 3.34 | 1.98 | 3.57 | 6.22 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Festival Push | €114.541 | €333 | €6.265 | 50.19 | 3.08 | 1.95 | 3.56 | 5.94 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Chaos Tour | €130.688 | €419 | €4.824 | 55.5 | 3.53 | 1.97 | 5.06 | 7.75 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Cult Hypergrowth | €160.843 | €419 | €5.546 | 58.22 | 3.45 | 1.98 | 5.78 | 7.43 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 45 | 13.98 | 0.44 | 0 | 8.22 | 13.56 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 54 | 4.3 | 0.41 | 0 | 7.77 | 12.58 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 52 | 6.33 | 0.4 | 0 | 8.29 | 13.61 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 50 | 5.41 | 0.43 | 0 | 8.37 | 13.46 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 50 | 4.47 | 0.47 | 0 | 7.73 | 13.25 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 52 | 6.9 | 0.44 | 0 | 8.07 | 13.53 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 53 | 6.31 | 0.43 | 0 | 8.73 | 13.54 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.25 | 1.53 | 1.41 | 0.86 | 9.15 | 14.83 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.41 | 1.85 | 1.79 | 0.2 | 8 | 12.7 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 0.53 | 2.48 | 2.2 | 0.74 | 8.96 | 14.87 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.62 | 3.06 | 2.84 | 0.57 | 8.88 | 14.12 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.31 | 1.69 | 1.51 | 0.25 | 8.94 | 14.31 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.7 | 3.83 | 3.55 | 1.08 | 8.91 | 14.71 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.45 | 2.22 | 2.02 | 0.69 | 9.1 | 15.1 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 61.02 | 61.02 | 61.02 | 183.06 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 12.15 | 12.15 | 12.15 | 36.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.67 | 30.67 | 30.67 | 92.01 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 19.5 | 19.5 | 19.5 | 58.5 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 19.98 | 19.98 | 19.98 | 59.94 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 29.83 | 29.83 | 29.83 | 89.49 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 30.56 | 30.56 | 30.56 | 91.68 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €361.975 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 487 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 11.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €6.265 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €362.031 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 61.02 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.15 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €361.975 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 487 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 20% | 11.15% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €21.548 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Endfame | 120 – 320 | 284 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €176.062 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 434 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €60.424 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Endfame | 150 – 360 | 356 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 10% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €114.408 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 477 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €130.396 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Endfame | 200 – 430 | 435 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €160.564 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 393 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 11.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €361.975 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.15 Event-Impulsen.
- ❌ KPI-Verstöße: Aggressive Marketing (Endfame) · Festival Push (Endfame) · Chaos Tour (Endfame) · Cult Hypergrowth (Endfame)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
