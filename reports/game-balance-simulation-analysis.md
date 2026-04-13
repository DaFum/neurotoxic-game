# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T16:05:45.609Z

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
| Baseline Touring | €500 | 0 | €212.755 | 316 | 3 | 45 | 0.56 | 60.93 | 14.07 | 0% | €3.515 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €13.291 | 179 | 1 | 55 | 0.41 | 10.12 | 3.55 | 30% | €2.443 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €134.003 | 297 | 2 | 51 | 0.56 | 30.19 | 6.4 | 1.15% | €4.332 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €48.666 | 252 | 2 | 51 | 0.57 | 18.63 | 5.59 | 3.85% | €2.854 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €105.688 | 412 | 4 | 50 | 0.48 | 20.11 | 4.81 | 0.38% | €4.807 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €105.490 | 310 | 3 | 51 | 0.55 | 29.87 | 6.99 | 0.38% | €3.516 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €127.269 | 259 | 2 | 52 | 0.68 | 30.26 | 6.48 | 0.77% | €4.185 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €212.933 | €500 | €3.515 | 62.28 | 3.39 | 1.99 | 11.58 | 12.02 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.478 | €162 | €2.443 | 6.51 | 2.13 | 1.65 | 1.48 | 4.19 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €134.506 | €399 | €4.332 | 55.98 | 3.15 | 1.97 | 5.77 | 7.89 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €49.002 | €297 | €2.854 | 34.33 | 3.14 | 1.97 | 3.42 | 6.03 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €105.754 | €306 | €4.807 | 49.93 | 3.33 | 1.98 | 3.64 | 6.03 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €105.818 | €402 | €3.516 | 53.5 | 3.21 | 1.98 | 5.23 | 7.88 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €127.781 | €400 | €4.185 | 56.58 | 3.5 | 1.98 | 5.84 | 7.38 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €46.555 | €104.263 | €164.928 | €212.755 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.002 | €6.152 | €9.857 | €13.291 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €26.966 | €61.325 | €101.069 | €134.003 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.632 | €19.196 | €32.571 | €48.666 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €15.432 | €39.851 | €70.709 | €105.688 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €18.694 | €44.852 | €77.558 | €105.490 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €26.943 | €60.654 | €98.103 | €127.269 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.515 | €92 | 38.3× | 0.17 | 0.1 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Bootstrap Struggle | €2.443 | €78 | 31.5× | 0.25 | 0.14 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Aggressive Marketing | €4.332 | €90 | 48.2× | 0.14 | 0.08 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Scandal Recovery | €2.854 | €86 | 33.2× | 0.21 | 0.12 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Festival Push | €4.807 | €93 | 51.8× | 0.12 | 0.07 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Chaos Tour | €3.516 | €90 | 39.2× | 0.17 | 0.1 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Cult Hypergrowth | €4.185 | €88 | 47.6× | 0.14 | 0.08 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.4 | 56 | 20.3% | 76% | 3.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.7 | 55 | 31% | 63.9% | 5.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 7.3 | 57 | 22.4% | 70.4% | 7.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.6 | 55 | 26.3% | 69.5% | 4.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 6.3 | 63 | 8.7% | 67.7% | 23.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 152 | 7.3 | 57 | 22.1% | 70.2% | 7.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.7 | 55 | 28.4% | 67.5% | 4.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 45 | 14.07 | 0.38 | 0 | 8.16 | 13.53 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 55 | 3.55 | 0.2 | 0 | 6.18 | 10.08 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 51 | 6.4 | 0.42 | 0 | 8.33 | 13.52 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 5.59 | 0.38 | 0 | 7.83 | 12.81 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 50 | 4.81 | 0.47 | 0 | 8.26 | 13.46 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 51 | 6.99 | 0.47 | 0 | 8.27 | 13.36 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 52 | 6.48 | 0.42 | 0 | 8.1 | 13.57 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.37 | 1.56 | 1.27 | 0.8 | 9.34 | 15.01 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.24 | 1.58 | 1.48 | 0.22 | 6.76 | 9.74 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.51 | 2.62 | 2.4 | 0.67 | 9.17 | 14.27 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.54 | 3.01 | 2.95 | 0.53 | 8.77 | 13.49 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.28 | 1.6 | 1.48 | 0.32 | 9.33 | 14.44 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.75 | 4.09 | 3.7 | 1.15 | 9.15 | 14.8 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.44 | 2.28 | 2 | 0.65 | 9.16 | 14.78 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 60.93 | 60.93 | 60.93 | 182.79 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 10.12 | 10.12 | 10.12 | 30.36 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.19 | 30.19 | 30.19 | 90.57 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.63 | 18.63 | 18.63 | 55.89 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 20.11 | 20.11 | 20.11 | 60.33 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 29.87 | 29.87 | 29.87 | 89.61 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 30.26 | 30.26 | 30.26 | 90.78 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €212.755 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 412 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 30% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €4.807 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €212.933 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.93 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.68 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €212.755 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Endfame | 200 – 500 | 316 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 32% | 30% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €13.291 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 179 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €134.003 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Endfame | 200 – 430 | 297 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 3.85% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €48.666 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Endfame | 150 – 360 | 252 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €105.688 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 412 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €105.490 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Endfame | 200 – 430 | 310 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €127.269 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Endfame | 200 – 380 | 259 | ✅ | Im Zielband – leicht außermittig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 30% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €212.755 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.68 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
