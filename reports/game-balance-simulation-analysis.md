# Game Balance Simulation – Analyse

Erstellt am: 2026-04-14T07:49:28.292Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €70 |
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
| Baseline Touring | €500 | 0 | €176.842 | 354 | 3 | 50 | 0.45 | 57.76 | 17.24 | 0% | €3.504 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €4.487 | 181 | 1 | 58 | 0.35 | 6.27 | 3.72 | 60.38% | €2.200 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €96.350 | 380 | 3 | 54 | 0.53 | 27.31 | 9.46 | 0.77% | €4.055 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €28.841 | 277 | 2 | 55 | 0.52 | 14.82 | 7.08 | 15.77% | €2.726 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €65.499 | 436 | 4 | 54 | 0.65 | 16.33 | 7.12 | 6.92% | €4.762 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €79.370 | 386 | 3 | 53 | 0.64 | 27.13 | 9.73 | 0.38% | €3.501 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €84.897 | 334 | 3 | 54 | 0.63 | 27.33 | 9.39 | 0.77% | €3.609 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €177.892 | €500 | €3.504 | 61.7 | 3.34 | 1.99 | 10.87 | 11.54 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €6.674 | €113 | €2.200 | 3.51 | 1.46 | 1.19 | 0.83 | 2.68 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €97.126 | €399 | €4.055 | 55.3 | 3.32 | 1.99 | 5.29 | 7.51 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €29.628 | €250 | €2.726 | 30.12 | 2.58 | 1.82 | 2.66 | 5.25 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €65.967 | €289 | €4.762 | 43.08 | 3.1 | 1.89 | 2.95 | 5.43 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €80.086 | €396 | €3.501 | 53.6 | 3.48 | 1.98 | 4.8 | 7.43 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €85.655 | €401 | €3.609 | 54.23 | 3.19 | 1.96 | 5.18 | 7.07 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €37.751 | €84.789 | €137.183 | €176.842 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.082 | €2.019 | €3.143 | €4.487 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €15.898 | €39.851 | €68.523 | €96.350 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €4.962 | €10.557 | €18.798 | €28.841 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.833 | €20.597 | €39.437 | €65.499 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €13.109 | €32.536 | €56.429 | €79.370 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €15.615 | €37.937 | €63.301 | €84.897 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.504 | €73 | 48.2× | 0.57 | 0.43 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.200 | €60 | 36.7× | 0.91 | 0.68 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €4.055 | €73 | 55.7× | 0.49 | 0.37 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €2.726 | €68 | 39.9× | 0.73 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €4.762 | €74 | 64.5× | 0.42 | 0.31 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Chaos Tour | €3.501 | €72 | 48.4× | 0.57 | 0.43 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.609 | €70 | 51.2× | 0.55 | 0.42 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 13.9% | 80.6% | 5.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 56 | 25% | 67.2% | 7.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.9 | 60 | 11.4% | 78.2% | 10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.3 | 57 | 18.9% | 75% | 6.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.8 | 66 | 5% | 62.8% | 32.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 152 | 6.9 | 60 | 12.9% | 75.8% | 11.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.1 | 58 | 16.1% | 77.2% | 6.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 50 | 17.24 | 1 | 0 | 8.35 | 13.66 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 58 | 3.72 | 0.23 | 0.11 | 4.73 | 7.75 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 9.46 | 0.99 | 0 | 8.19 | 13.24 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 55 | 7.08 | 0.93 | 0.13 | 7.39 | 11.8 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 54 | 7.12 | 1.02 | 0.1 | 7.86 | 12.63 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 53 | 9.73 | 1 | 0 | 8.27 | 13.32 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 9.39 | 0.99 | 0 | 8.26 | 13.69 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.27 | 1.36 | 1.4 | 0.78 | 9.22 | 15.01 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.23 | 1.07 | 1.02 | 0.13 | 4.89 | 5.72 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.47 | 2.48 | 2.28 | 0.66 | 9.24 | 14.96 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.56 | 2.89 | 2.56 | 0.45 | 7.88 | 11.82 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.33 | 1.68 | 1.33 | 0.33 | 8.5 | 13.27 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.77 | 4.13 | 3.58 | 1.06 | 8.92 | 14.43 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.49 | 2.29 | 2.01 | 0.64 | 9.11 | 14.78 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 57.76 | 57.76 | 57.76 | 173.28 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 6.27 | 6.27 | 6.27 | 18.81 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.31 | 27.31 | 27.31 | 81.93 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 14.82 | 14.82 | 14.82 | 44.46 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 16.33 | 16.33 | 16.33 | 48.99 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 27.13 | 27.13 | 27.13 | 81.39 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 27.33 | 27.33 | 27.33 | 81.99 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €176.842 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 436 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 60.38% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €4.762 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €177.892 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 57.76 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.54 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €176.842 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 354 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 32% | 60.38% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €4.487 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 181 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €96.350 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 380 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 15.77% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €28.841 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Endfame | 150 – 360 | 277 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 6.92% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €20.000 – €150.000 | €65.499 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 436 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €79.370 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Endfame | 200 – 430 | 386 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €84.897 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 334 | ✅ | Im Zielband – leicht außermittig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 60.38% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €176.842 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.54 Event-Impulsen.
- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate) · Scandal Recovery (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
