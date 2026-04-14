# Game Balance Simulation – Analyse

Erstellt am: 2026-04-14T04:51:15.160Z

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
| Baseline Touring | €500 | 0 | €155.339 | 316 | 3 | 46 | 0.58 | 60.92 | 14.08 | 0% | €2.968 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €9.076 | 178 | 1 | 55 | 0.49 | 10.35 | 3.52 | 31.15% | €2.099 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €96.693 | 302 | 3 | 51 | 0.56 | 30.51 | 6.49 | 0% | €3.628 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €29.417 | 248 | 2 | 52 | 0.45 | 18.19 | 5.56 | 7.69% | €2.330 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €68.941 | 405 | 4 | 51 | 0.57 | 19.79 | 4.77 | 1.92% | €4.099 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €76.185 | 321 | 3 | 52 | 0.47 | 29.8 | 7.06 | 0.38% | €3.079 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €92.717 | 256 | 2 | 52 | 0.6 | 30.35 | 6.51 | 0.38% | €3.490 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €156.068 | €500 | €2.968 | 58.26 | 3.59 | 1.99 | 11.54 | 12.1 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €11.198 | €158 | €2.099 | 6.12 | 2 | 1.63 | 1.48 | 4.23 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €97.401 | €405 | €3.628 | 54.22 | 3.42 | 1.99 | 5.98 | 7.91 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Scandal Recovery | €30.172 | €284 | €2.330 | 25.86 | 2.99 | 1.94 | 3.29 | 5.92 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €69.229 | €302 | €4.099 | 44.3 | 3.16 | 1.95 | 3.59 | 5.97 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €77.089 | €403 | €3.079 | 50.22 | 3.3 | 1.99 | 5.15 | 7.9 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €93.446 | €403 | €3.490 | 52.6 | 3.21 | 1.99 | 5.73 | 7.41 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €38.070 | €79.925 | €121.555 | €155.339 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.504 | €5.036 | €7.191 | €9.076 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €20.617 | €45.806 | €74.205 | €96.693 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €6.254 | €12.374 | €19.272 | €29.417 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €12.007 | €27.229 | €45.732 | €68.941 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €15.980 | €34.095 | €56.894 | €76.185 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €21.328 | €45.249 | €71.891 | €92.717 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.968 | €91 | 32.5× | 0.2 | 0.12 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.099 | €77 | 27.2× | 0.29 | 0.17 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.628 | €91 | 39.9× | 0.17 | 0.1 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.330 | €85 | 27.4× | 0.26 | 0.15 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €4.099 | €92 | 44.5× | 0.15 | 0.09 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €3.079 | €90 | 34.2× | 0.19 | 0.11 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.490 | €87 | 39.9× | 0.17 | 0.1 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.4 | 56 | 20.3% | 75.8% | 3.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.8 | 54 | 31.5% | 64.3% | 4.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 7.3 | 57 | 22% | 70.6% | 7.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.6 | 55 | 26.4% | 68.9% | 4.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 6.3 | 63 | 8.8% | 67.8% | 23.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 152 | 7.3 | 57 | 21.8% | 69.9% | 8.2% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.6 | 55 | 27.6% | 67.7% | 4.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 46 | 14.08 | 1 | 0 | 8.12 | 13.63 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 55 | 3.52 | 0.45 | 0.19 | 6.56 | 10.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 51 | 6.49 | 1 | 0 | 8.32 | 13.38 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 52 | 5.56 | 0.92 | 0.11 | 8.15 | 12.67 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 51 | 4.77 | 1.03 | 0.05 | 7.98 | 13.46 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 52 | 7.06 | 0.99 | 0 | 8.19 | 13.68 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 52 | 6.51 | 1 | 0 | 8.18 | 13.6 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.28 | 1.51 | 1.44 | 0.9 | 8.97 | 15.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.36 | 1.52 | 1.54 | 0.21 | 7.02 | 9.5 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.43 | 2.4 | 2.3 | 0.82 | 9.02 | 14.91 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.6 | 2.83 | 2.76 | 0.45 | 8.78 | 13.01 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.34 | 1.6 | 1.48 | 0.34 | 8.85 | 13.92 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.72 | 3.82 | 3.48 | 1.05 | 9.07 | 14.65 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.38 | 2.11 | 2.04 | 0.64 | 8.75 | 14.65 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 60.92 | 60.92 | 60.92 | 182.76 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 10.35 | 10.35 | 10.35 | 31.05 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.51 | 30.51 | 30.51 | 91.53 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.19 | 18.19 | 18.19 | 54.57 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 19.79 | 19.79 | 19.79 | 59.37 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 29.8 | 29.8 | 29.8 | 89.4 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 30.35 | 30.35 | 30.35 | 91.05 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €155.339 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 405 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 31.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €4.099 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €156.068 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.92 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.08 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €155.339 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 316 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 32% | 31.15% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €9.076 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 178 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €96.693 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 302 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 7.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €29.417 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Endfame | 150 – 360 | 248 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €68.941 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Endfame | 200 – 460 | 405 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €76.185 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Endfame | 200 – 430 | 321 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €92.717 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 256 | ✅ | Im Zielband – leicht außermittig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 31.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €155.339 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.08 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
