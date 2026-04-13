# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T14:43:47.631Z

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
| Baseline Touring | €500 | 0 | €326.145 | 483 | 4 | 46 | 0.56 | 60.98 | 14.02 | 0% | €5.549 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €21.548 | 284 | 2 | 54 | 0.49 | 12.15 | 4.3 | 11.15% | €2.970 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Aggressive Marketing | €500 | 0 | €163.385 | 434 | 4 | 52 | 0.55 | 30.62 | 6.38 | 0% | €5.664 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €52.793 | 352 | 3 | 50 | 0.58 | 19.23 | 5.47 | 1.54% | €3.400 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €104.091 | 477 | 4 | 50 | 0.53 | 19.9 | 4.55 | 2.31% | €5.788 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €125.529 | 435 | 4 | 52 | 0.67 | 29.83 | 6.9 | 0.77% | €4.687 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €154.155 | 396 | 3 | 52 | 0.66 | 30.58 | 6.42 | 0% | €5.323 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €326.209 | €500 | €5.549 | 63.9 | 3.54 | 2 | 10.92 | 12.01 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €22.792 | €226 | €2.970 | 14.66 | 2.4 | 1.89 | 1.82 | 5.08 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €163.595 | €420 | €5.664 | 58.08 | 3.34 | 1.98 | 5.72 | 8 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €52.957 | €331 | €3.400 | 40.31 | 3.24 | 1.97 | 3.56 | 6.2 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Festival Push | €104.206 | €333 | €5.788 | 48.57 | 3.11 | 1.95 | 3.45 | 5.94 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €125.793 | €419 | €4.687 | 54.43 | 3.35 | 1.97 | 5.06 | 7.76 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Cult Hypergrowth | €154.360 | €421 | €5.323 | 57.88 | 3.48 | 1.99 | 5.79 | 7.48 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €52.811 | €138.628 | €241.761 | €326.145 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |
| Bootstrap Struggle | €4.317 | €9.284 | €15.427 | €21.548 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €27.761 | €65.198 | €116.713 | €163.385 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |
| Scandal Recovery | €10.428 | €23.422 | €35.843 | €52.793 | ⚠️ Schnelle Kapitalakkumulation – Daily-Kosten oder Upgrade-Preise prüfen. |
| Festival Push | €14.711 | €36.420 | €67.380 | €104.091 | ⚠️ Schnelle Kapitalakkumulation – Daily-Kosten oder Upgrade-Preise prüfen. |
| Chaos Tour | €20.587 | €46.862 | €86.933 | €125.529 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |
| Cult Hypergrowth | €29.619 | €65.402 | €112.563 | €154.155 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €5.549 | €95 | 58.4× | 0.04 | 0.06 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Bootstrap Struggle | €2.970 | €82 | 36.3× | 0.08 | 0.12 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Aggressive Marketing | €5.664 | €94 | 60.3× | 0.04 | 0.06 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Scandal Recovery | €3.400 | €91 | 37.5× | 0.07 | 0.1 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Festival Push | €5.788 | €93 | 62.3× | 0.04 | 0.06 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Chaos Tour | €4.687 | €94 | 50.1× | 0.05 | 0.07 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Cult Hypergrowth | €5.323 | €94 | 56.8× | 0.05 | 0.07 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 190 | 7 | 59 | 13.7% | 79% | 7.3% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Bootstrap Struggle | 190 | 7.4 | 56 | 24% | 70.1% | 6% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Aggressive Marketing | 190 | 6.9 | 59 | 13.8% | 74.6% | 11.5% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Scandal Recovery | 195 | 7.3 | 57 | 20.6% | 72% | 7.3% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Festival Push | 190 | 5.8 | 66 | 5.2% | 62.7% | 32.1% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Chaos Tour | 190 | 6.9 | 60 | 14.8% | 72.2% | 12.9% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Cult Hypergrowth | 190 | 7.2 | 57 | 20.3% | 72.3% | 7.4% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 46 | 14.02 | 0.42 | 0 | 8.33 | 13.31 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 54 | 4.3 | 0.41 | 0 | 7.77 | 12.58 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 52 | 6.38 | 0.43 | 0 | 8.47 | 13.7 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 50 | 5.47 | 0.43 | 0 | 8.44 | 13.29 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 50 | 4.55 | 0.45 | 0 | 7.6 | 13.35 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 52 | 6.9 | 0.42 | 0 | 8.13 | 13.57 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 52 | 6.42 | 0.43 | 0 | 8.68 | 13.7 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.31 | 1.39 | 1.34 | 0.9 | 9.2 | 14.93 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.41 | 1.85 | 1.79 | 0.2 | 8 | 12.7 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 0.47 | 2.51 | 2.3 | 0.72 | 8.93 | 14.82 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.57 | 3.06 | 2.75 | 0.63 | 8.77 | 14.17 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.3 | 1.7 | 1.47 | 0.3 | 8.72 | 14.25 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 0.75 | 4.02 | 3.67 | 1.16 | 8.72 | 14.8 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.4 | 2.29 | 2.03 | 0.73 | 8.83 | 15.01 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 60.98 | 60.98 | 60.98 | 182.94 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 12.15 | 12.15 | 12.15 | 36.45 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.62 | 30.62 | 30.62 | 91.86 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 19.23 | 19.23 | 19.23 | 57.69 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 19.9 | 19.9 | 19.9 | 59.7 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 29.83 | 29.83 | 29.83 | 89.49 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 30.58 | 30.58 | 30.58 | 91.74 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €326.145 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 483 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 11.15% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €5.788 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €326.209 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.98 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.60 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €326.145 | ✅ | Im Zielband – leicht außermittig. |
| Baseline Touring | Endfame | 200 – 500 | 483 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 20% | 11.15% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €21.548 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Endfame | 120 – 320 | 284 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €163.385 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 434 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €52.793 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Endfame | 150 – 360 | 352 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 10% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €104.091 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Endfame | 200 – 460 | 477 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €125.529 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Endfame | 200 – 430 | 435 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €154.155 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 396 | ❌ | Außerhalb Zielband – Progressionspfad prüfen. |

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
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €326.145 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.60 Event-Impulsen.
- ❌ KPI-Verstöße: Aggressive Marketing (Endfame) · Festival Push (Endfame) · Chaos Tour (Endfame) · Cult Hypergrowth (Endfame)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
