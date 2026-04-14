# Game Balance Simulation – Analyse

Erstellt am: 2026-04-14T09:09:33.151Z

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
| Baseline Touring | €500 | 0 | €168.550 | 357 | 3 | 50 | 0.72 | 57.72 | 17.28 | 0% | €3.401 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €9.440 | 216 | 2 | 57 | 0.55 | 8.76 | 5.52 | 30.38% | €2.742 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €82.251 | 376 | 3 | 53 | 0.5 | 27.24 | 9.4 | 1.15% | €3.534 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €34.502 | 292 | 2 | 55 | 0.4 | 16.12 | 8.06 | 4.23% | €2.896 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €58.130 | 446 | 4 | 54 | 0.5 | 17.01 | 7.47 | 2.31% | €4.098 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €72.528 | 382 | 3 | 54 | 0.61 | 26.83 | 9.78 | 1.15% | €3.286 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €81.471 | 335 | 3 | 54 | 0.58 | 27.45 | 9.42 | 0.38% | €3.439 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €169.360 | €500 | €3.401 | 59.93 | 3.46 | 1.99 | 10.94 | 11.59 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €12.026 | €166 | €2.742 | 7.54 | 2.38 | 1.73 | 1.23 | 3.91 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €82.943 | €401 | €3.534 | 54.98 | 3.21 | 1.98 | 5.25 | 7.48 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Scandal Recovery | €35.023 | €293 | €2.896 | 37.74 | 3.15 | 1.97 | 2.95 | 5.82 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €58.561 | €306 | €4.098 | 48.91 | 3.15 | 1.97 | 3 | 5.65 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €73.174 | €400 | €3.286 | 53.74 | 3.48 | 1.96 | 4.77 | 7.37 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €82.071 | €404 | €3.439 | 54.33 | 3.26 | 1.99 | 5.28 | 7.1 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €39.422 | €84.450 | €131.356 | €168.550 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €1.930 | €4.168 | €6.834 | €9.440 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €16.390 | €37.795 | €61.751 | €82.251 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €7.014 | €14.323 | €23.678 | €34.502 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €9.748 | €21.750 | €37.908 | €58.130 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €13.327 | €31.521 | €53.645 | €72.528 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €16.187 | €38.476 | €61.533 | €81.471 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.401 | €73 | 46.7× | 0.59 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.742 | €61 | 45.1× | 0.73 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.534 | €72 | 48.9× | 0.57 | 0.42 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.896 | €68 | 42.6× | 0.69 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €4.098 | €73 | 56.2× | 0.49 | 0.37 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Chaos Tour | €3.286 | €73 | 45.2× | 0.61 | 0.46 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.439 | €70 | 48.8× | 0.58 | 0.44 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 13.7% | 80.7% | 5.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.5 | 56 | 23.4% | 70.7% | 5.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.8 | 60 | 11.2% | 78.5% | 10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.3 | 57 | 18.5% | 75.8% | 5.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.8 | 66 | 4.6% | 63.7% | 31.7% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 13% | 75.4% | 11.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.2 | 58 | 16.4% | 77.2% | 6.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 50 | 17.28 | 1 | 0 | 8.29 | 13.7 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 57 | 5.52 | 0.54 | 0.28 | 6.63 | 10.91 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 53 | 9.4 | 1 | 0.01 | 8.07 | 12.93 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 55 | 8.06 | 1.04 | 0.11 | 7.85 | 13.22 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 54 | 7.47 | 1.03 | 0.06 | 8.02 | 13.01 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 54 | 9.78 | 0.99 | 0.01 | 8.12 | 13.4 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 9.42 | 1 | 0 | 8.17 | 13.64 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.25 | 1.42 | 1.35 | 0.78 | 9.35 | 15.33 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.38 | 1.58 | 1.57 | 0.15 | 6.9 | 10.28 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.38 | 2.38 | 2.1 | 0.67 | 9.02 | 14.65 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.54 | 3.09 | 2.77 | 0.54 | 8.63 | 13.65 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.31 | 1.72 | 1.36 | 0.2 | 8.94 | 14.22 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.71 | 3.81 | 3.38 | 1 | 8.88 | 14.68 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.45 | 2.42 | 2.18 | 0.59 | 8.81 | 14.76 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 57.72 | 57.72 | 57.72 | 173.16 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 8.76 | 8.76 | 8.76 | 26.28 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.24 | 27.24 | 27.24 | 81.72 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 16.12 | 16.12 | 16.12 | 48.36 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 17.01 | 17.01 | 17.01 | 51.03 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 26.83 | 26.83 | 26.83 | 80.49 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 27.45 | 27.45 | 27.45 | 82.35 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €168.550 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 446 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 30.38% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €4.098 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €169.360 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 57.72 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 8.91 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €168.550 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 357 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 32% | 30.38% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €9.440 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 216 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €82.251 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 376 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €34.502 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Endfame | 150 – 360 | 292 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 10% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €58.130 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 446 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €72.528 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Endfame | 200 – 430 | 382 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €81.471 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 335 | ✅ | Im Zielband – leicht außermittig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 30.38% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €168.550 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 8.91 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
