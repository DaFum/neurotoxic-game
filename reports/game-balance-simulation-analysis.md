# Game Balance Simulation – Analyse

Erstellt am: 2026-04-14T05:59:00.810Z

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
| Baseline Touring | €500 | 0 | €205.799 | 356 | 3 | 50 | 0.56 | 57.61 | 17.39 | 0% | €4.136 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €10.189 | 208 | 2 | 57 | 0.53 | 8.93 | 5.63 | 31.15% | €2.871 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €119.195 | 376 | 3 | 54 | 0.43 | 27.41 | 9.45 | 0.38% | €5.019 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €38.161 | 291 | 2 | 55 | 0.73 | 15.83 | 8.11 | 5.38% | €3.334 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €83.558 | 447 | 4 | 55 | 0.48 | 16.86 | 7.59 | 2.69% | €5.876 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €95.314 | 383 | 3 | 53 | 0.63 | 26.97 | 9.77 | 0.77% | €4.259 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €108.582 | 335 | 3 | 54 | 0.51 | 27.26 | 9.34 | 1.15% | €4.602 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €206.993 | €500 | €4.136 | 60.66 | 3.48 | 1.99 | 10.94 | 11.64 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €12.868 | €166 | €2.871 | 5.15 | 2.25 | 1.75 | 1.25 | 4.03 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €120.186 | €405 | €5.019 | 54.66 | 3.23 | 1.98 | 5.28 | 7.56 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €38.849 | €294 | €3.334 | 32.96 | 3.06 | 1.95 | 2.88 | 5.7 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €84.064 | €306 | €5.876 | 44.67 | 3.21 | 1.97 | 3.03 | 5.67 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €96.431 | €403 | €4.259 | 51.31 | 3.32 | 1.97 | 4.83 | 7.37 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Cult Hypergrowth | €109.589 | €401 | €4.602 | 53.55 | 3.25 | 1.98 | 5.23 | 7.02 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €46.125 | €102.274 | €160.636 | €205.799 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.054 | €4.459 | €7.545 | €10.189 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €22.322 | €50.742 | €86.660 | €119.195 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €7.630 | €16.023 | €26.004 | €38.161 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €12.323 | €27.915 | €51.316 | €83.558 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €16.604 | €38.507 | €67.588 | €95.314 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €21.507 | €49.499 | €81.054 | €108.582 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.136 | €73 | 56.6× | 0.48 | 0.36 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Bootstrap Struggle | €2.871 | €61 | 47.3× | 0.7 | 0.52 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €5.019 | €72 | 69.3× | 0.4 | 0.3 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Scandal Recovery | €3.334 | €68 | 49× | 0.6 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €5.876 | €74 | 79.9× | 0.34 | 0.26 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Chaos Tour | €4.259 | €73 | 58.3× | 0.47 | 0.35 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |
| Cult Hypergrowth | €4.602 | €71 | 65.2× | 0.43 | 0.33 | ⚠️ Reisekosten zu gering – Travel-Kostendruck erhöhen. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 7.1 | 58 | 13.5% | 81% | 5.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.5 | 56 | 22.6% | 71.1% | 6.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.9 | 60 | 11.4% | 78.2% | 10.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.2 | 57 | 18.2% | 76.1% | 5.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.7 | 66 | 4.4% | 63.3% | 32.3% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.8 | 60 | 13% | 75.3% | 11.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 7.2 | 58 | 15.4% | 78.1% | 6.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 50 | 17.39 | 1 | 0 | 8.31 | 13.39 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 57 | 5.63 | 0.44 | 0.23 | 6.62 | 10.98 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 9.45 | 1 | 0 | 8.28 | 13.63 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 55 | 8.11 | 1 | 0.1 | 8.05 | 13.05 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 7.59 | 1.03 | 0.06 | 8.11 | 13.2 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 53 | 9.77 | 0.99 | 0 | 8.09 | 13.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 54 | 9.34 | 1 | 0.01 | 8.19 | 13.58 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.2 | 1.44 | 1.3 | 0.92 | 8.83 | 15.29 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.32 | 1.7 | 1.47 | 0.18 | 7.04 | 9.97 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.42 | 2.44 | 2.28 | 0.62 | 8.88 | 14.7 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.6 | 3.02 | 2.56 | 0.45 | 8.49 | 13.82 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0.24 | 1.57 | 1.42 | 0.23 | 8.82 | 14.57 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.72 | 3.74 | 3.43 | 1.05 | 9.12 | 14.64 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.5 | 2.48 | 2 | 0.6 | 8.83 | 14.79 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 57.61 | 57.61 | 57.61 | 172.83 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 8.93 | 8.93 | 8.93 | 26.79 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 27.41 | 27.41 | 27.41 | 82.23 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 15.83 | 15.83 | 15.83 | 47.49 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 16.86 | 16.86 | 16.86 | 50.58 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 26.97 | 26.97 | 26.97 | 80.91 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 27.26 | 27.26 | 27.26 | 81.78 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €205.799 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 447 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 31.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €5.876 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €206.993 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 57.61 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 8.94 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €205.799 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Endfame | 200 – 500 | 356 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 32% | 31.15% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €10.189 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Endfame | 120 – 320 | 208 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €119.195 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Aggressive Marketing | Endfame | 200 – 430 | 376 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 5.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €38.161 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Endfame | 150 – 360 | 291 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 10% | 2.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €83.558 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Endfame | 200 – 460 | 447 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €95.314 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Endfame | 200 – 430 | 383 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €108.582 | ✅ | Zentral im Zielband – sehr gute Balance. |
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

- Höchstes Risiko: **Bootstrap Struggle** mit 31.15% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €205.799 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 8.94 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
