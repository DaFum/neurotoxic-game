# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T20:24:51.923Z

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
| Baseline Touring | €500 | 0 | €234.118 | 310 | 3 | 45 | 0.67 | 60.88 | 14.12 | 0% | €3.515 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €16.231 | 176 | 1 | 55 | 0.27 | 10.37 | 3.62 | 29.23% | €2.410 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €155.201 | 295 | 2 | 52 | 0.6 | 30.29 | 6.43 | 0.77% | €4.310 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €59.804 | 253 | 2 | 50 | 0.55 | 18.61 | 5.58 | 4.62% | €2.836 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €134.919 | 409 | 4 | 50 | 0.63 | 20.2 | 4.8 | 0% | €4.897 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €129.260 | 314 | 3 | 52 | 0.61 | 29.76 | 7.11 | 0.38% | €3.554 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €145.312 | 266 | 2 | 52 | 0.39 | 30.27 | 6.59 | 0.38% | €4.131 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €234.642 | €500 | €3.515 | 62.44 | 3.46 | 1.99 | 11.64 | 12.05 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €18.397 | €168 | €2.410 | 7.8 | 2.22 | 1.65 | 1.5 | 4.3 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €155.872 | €400 | €4.310 | 57.3 | 3.17 | 1.97 | 5.85 | 7.9 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €60.223 | €293 | €2.836 | 32.69 | 2.98 | 1.96 | 3.35 | 6.05 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €135.119 | €307 | €4.897 | 49.47 | 3.23 | 1.98 | 3.62 | 6.07 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €129.840 | €401 | €3.554 | 53.72 | 3.31 | 1.99 | 5.13 | 7.82 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €146.247 | €400 | €4.131 | 56.62 | 3.26 | 1.99 | 5.78 | 7.45 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €50.466 | €115.979 | €182.262 | €234.118 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.193 | €6.742 | €11.503 | €16.231 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €28.288 | €71.228 | €118.107 | €155.201 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €8.322 | €20.968 | €38.753 | €59.804 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €15.724 | €48.383 | €91.759 | €134.919 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €20.041 | €53.669 | €95.498 | €129.260 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €27.044 | €66.849 | €111.400 | €145.312 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.515 | €91 | 38.5× | 0.17 | 0.1 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.410 | €78 | 31× | 0.25 | 0.15 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €4.310 | €90 | 47.6× | 0.14 | 0.08 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.836 | €85 | 33.5× | 0.21 | 0.12 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €4.897 | €92 | 53.1× | 0.12 | 0.07 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €3.554 | €90 | 39.7× | 0.17 | 0.1 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €4.131 | €88 | 47× | 0.15 | 0.08 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.4 | 56 | 20.2% | 75.9% | 3.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.8 | 54 | 31.3% | 63.9% | 4.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 7.4 | 57 | 22.9% | 70% | 7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.6 | 55 | 26.9% | 68.7% | 4.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 6.3 | 63 | 9% | 68% | 23% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 152 | 7.3 | 57 | 21.7% | 70.5% | 7.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.6 | 55 | 27.8% | 67.5% | 4.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 45 | 14.12 | 0.43 | 0 | 8.23 | 13.66 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 55 | 3.62 | 0.22 | 0 | 6.28 | 10.54 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 52 | 6.43 | 0.41 | 0 | 8.45 | 13.33 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 50 | 5.58 | 0.38 | 0 | 8.02 | 13.23 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 50 | 4.8 | 0.42 | 0 | 8.28 | 13.73 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 52 | 7.11 | 0.45 | 0 | 8.02 | 13.41 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 52 | 6.59 | 0.45 | 0 | 8.21 | 14.07 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.29 | 1.28 | 1.35 | 0.91 | 8.93 | 15.22 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.27 | 1.68 | 1.48 | 0.2 | 7.09 | 9.86 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.45 | 2.47 | 2.27 | 0.75 | 8.75 | 14.28 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.59 | 3.11 | 2.79 | 0.65 | 8.69 | 13.94 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.35 | 1.64 | 1.35 | 0.28 | 8.87 | 14.44 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.8 | 3.82 | 3.54 | 1.13 | 9.12 | 14.59 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.42 | 2.33 | 2.08 | 0.7 | 9.27 | 14.83 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 60.88 | 60.88 | 60.88 | 182.64 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 10.37 | 10.37 | 10.37 | 31.11 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.29 | 30.29 | 30.29 | 90.87 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.61 | 18.61 | 18.61 | 55.83 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 20.2 | 20.2 | 20.2 | 60.6 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 29.76 | 29.76 | 29.76 | 89.28 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 30.27 | 30.27 | 30.27 | 90.81 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €234.118 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 409 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 29.23% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €4.897 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €234.642 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.88 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.29 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €234.118 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Endfame | 200 – 500 | 310 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 32% | 29.23% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €16.231 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 176 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €155.201 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 295 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 4.62% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €59.804 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Endfame | 150 – 360 | 253 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Festival Push | Endgeld | €20.000 – €150.000 | €134.919 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 409 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €129.260 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Endfame | 200 – 430 | 314 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €145.312 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Endfame | 200 – 380 | 266 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 29.23% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €234.118 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.29 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
