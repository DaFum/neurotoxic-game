# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T20:38:51.760Z

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
| Baseline Touring | €500 | 0 | €212.470 | 312 | 3 | 47 | 0.62 | 60.9 | 14.1 | 0% | €3.529 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €13.318 | 176 | 1 | 54 | 0.45 | 10.51 | 3.61 | 26.92% | €2.398 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €134.454 | 298 | 2 | 52 | 0.48 | 30.44 | 6.56 | 0% | €4.328 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €42.822 | 243 | 2 | 51 | 0.53 | 18.44 | 5.58 | 5% | €2.758 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €100.935 | 410 | 4 | 51 | 0.47 | 19.85 | 4.78 | 1.54% | €4.797 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €106.730 | 313 | 3 | 52 | 0.58 | 29.96 | 7.04 | 0% | €3.569 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €125.642 | 258 | 2 | 52 | 0.73 | 30.12 | 6.47 | 1.15% | €4.173 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €212.835 | €500 | €3.529 | 58.72 | 3.48 | 1.99 | 11.59 | 12.04 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €15.363 | €167 | €2.398 | 6.46 | 2.17 | 1.64 | 1.52 | 4.29 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €134.870 | €405 | €4.328 | 53.87 | 3.38 | 1.99 | 5.85 | 7.91 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €43.372 | €288 | €2.758 | 27.41 | 2.87 | 1.94 | 3.32 | 5.96 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €101.127 | €303 | €4.797 | 43.6 | 3.13 | 1.97 | 3.68 | 5.97 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €107.057 | €404 | €3.569 | 50.66 | 3.3 | 1.99 | 5.18 | 7.87 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €126.165 | €401 | €4.173 | 51.76 | 3.33 | 1.97 | 5.8 | 7.42 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €47.634 | €105.238 | €164.420 | €212.470 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €3.080 | €6.956 | €10.195 | €13.318 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €25.929 | €60.801 | €101.843 | €134.454 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €7.746 | €16.642 | €28.341 | €42.822 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €14.427 | €36.506 | €66.712 | €100.935 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €19.968 | €45.574 | €78.234 | €106.730 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €26.279 | €58.181 | €95.749 | €125.642 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.529 | €92 | 38.5× | 0.17 | 0.1 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.398 | €78 | 30.9× | 0.25 | 0.15 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €4.328 | €89 | 48.4× | 0.14 | 0.08 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.758 | €85 | 32.4× | 0.22 | 0.13 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €4.797 | €94 | 51.1× | 0.13 | 0.07 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €3.569 | €89 | 39.9× | 0.17 | 0.1 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €4.173 | €88 | 47.3× | 0.14 | 0.08 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.4 | 56 | 20.4% | 75.7% | 3.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.8 | 54 | 30.9% | 65% | 4.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 7.4 | 57 | 22.7% | 70.5% | 6.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.6 | 55 | 26.4% | 68.9% | 4.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 6.3 | 63 | 8.5% | 67.7% | 23.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 152 | 7.3 | 57 | 21.9% | 70.2% | 7.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.6 | 55 | 26.9% | 68.4% | 4.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 47 | 14.1 | 1 | 0 | 8.11 | 13.5 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 54 | 3.61 | 0.45 | 0.19 | 6.57 | 10.82 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 52 | 6.56 | 1.01 | 0.01 | 8.22 | 13.54 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 51 | 5.58 | 0.92 | 0.11 | 7.83 | 12.82 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 51 | 4.78 | 1 | 0.02 | 8.2 | 13.06 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 52 | 7.04 | 1 | 0 | 7.93 | 13.43 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 52 | 6.47 | 0.99 | 0 | 8.42 | 13.61 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.29 | 1.43 | 1.43 | 0.89 | 9 | 14.98 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.35 | 1.59 | 1.51 | 0.24 | 7.13 | 10.18 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.45 | 2.58 | 2.15 | 0.73 | 9.1 | 15 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.7 | 3.08 | 2.75 | 0.55 | 8.92 | 13.4 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.35 | 1.65 | 1.55 | 0.33 | 8.89 | 14.37 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.7 | 4.13 | 3.63 | 1.03 | 8.9 | 14.7 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.4 | 2.2 | 2.07 | 0.7 | 8.8 | 14.61 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 60.9 | 60.9 | 60.9 | 182.7 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 10.51 | 10.51 | 10.51 | 31.53 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.44 | 30.44 | 30.44 | 91.32 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.44 | 18.44 | 18.44 | 55.32 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 19.85 | 19.85 | 19.85 | 59.55 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 29.96 | 29.96 | 29.96 | 89.88 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 30.12 | 30.12 | 30.12 | 90.36 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €212.470 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 410 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 26.92% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €4.797 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €212.835 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.9 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.49 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €212.470 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Endfame | 200 – 500 | 312 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 32% | 26.92% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €13.318 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 176 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €134.454 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Endfame | 200 – 430 | 298 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 5% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €42.822 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Endfame | 150 – 360 | 243 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Festival Push | Insolvenzrate | ≤ 10% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €100.935 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Endfame | 200 – 460 | 410 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €106.730 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Endfame | 200 – 430 | 313 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €125.642 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Cult Hypergrowth | Endfame | 200 – 380 | 258 | ✅ | Im Zielband – leicht außermittig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 26.92% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €212.470 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.49 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
