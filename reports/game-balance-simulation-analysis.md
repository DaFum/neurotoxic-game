# Game Balance Simulation – Analyse

Erstellt am: 2026-04-13T15:03:15.907Z

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
| Baseline Touring | €500 | 0 | €274.796 | 383 | 3 | 45 | 0.66 | 61.02 | 13.98 | 0% | €4.182 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €20.880 | 229 | 2 | 54 | 0.34 | 10.93 | 3.73 | 22.69% | €2.771 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €161.969 | 354 | 3 | 51 | 0.39 | 30.59 | 6.41 | 0% | €4.738 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €62.047 | 297 | 2 | 50 | 0.41 | 19.16 | 5.54 | 1.54% | €3.188 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €122.361 | 443 | 4 | 51 | 0.56 | 19.87 | 4.61 | 2.31% | €5.310 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €129.049 | 363 | 3 | 51 | 0.67 | 30 | 6.86 | 0.38% | €3.940 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €154.763 | 310 | 3 | 52 | 0.69 | 30.47 | 6.39 | 0.38% | €4.606 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €274.810 | €500 | €4.182 | 63.88 | 3.73 | 2 | 11.43 | 12.03 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €22.083 | €173 | €2.771 | 12.19 | 2.27 | 1.69 | 1.6 | 4.5 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €162.062 | €403 | €4.738 | 57.6 | 3.37 | 1.98 | 5.89 | 7.98 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |
| Scandal Recovery | €62.213 | €299 | €3.188 | 39.63 | 3.12 | 1.96 | 3.53 | 6.15 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €122.443 | €302 | €5.310 | 49.64 | 2.99 | 1.97 | 3.53 | 5.93 | ✅ Hohe Gig-Monetarisierung – Modifier-Setup trägt Früchte. |
| Chaos Tour | €129.173 | €404 | €3.940 | 54.79 | 3.31 | 1.99 | 5.24 | 7.83 | ✅ Sponsoring als stabiler Einkommensanker etabliert. |
| Cult Hypergrowth | €154.892 | €404 | €4.606 | 57.24 | 3.37 | 1.98 | 5.9 | 7.49 | ✅ Starke Doppel-Einnahmen: Gig-Netto + Sponsoring-Basis. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €53.492 | €122.072 | €204.705 | €274.796 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |
| Bootstrap Struggle | €3.910 | €8.508 | €14.520 | €20.880 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €28.199 | €69.250 | €119.047 | €161.969 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |
| Scandal Recovery | €9.691 | €23.767 | €41.164 | €62.047 | ⚠️ Schnelle Kapitalakkumulation – Daily-Kosten oder Upgrade-Preise prüfen. |
| Festival Push | €15.743 | €43.824 | €81.217 | €122.361 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |
| Chaos Tour | €21.139 | €53.570 | €93.788 | €129.049 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |
| Cult Hypergrowth | €29.607 | €69.930 | €115.863 | €154.763 | ⚠️ Sehr hohe Frühakkumulation – Sink-Kosten drastisch erhöhen. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €4.182 | €94 | 44.5× | 0.14 | 0.08 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Bootstrap Struggle | €2.771 | €79 | 34.9× | 0.22 | 0.13 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Aggressive Marketing | €4.738 | €92 | 51.2× | 0.13 | 0.07 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Scandal Recovery | €3.188 | €88 | 36.2× | 0.19 | 0.11 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Festival Push | €5.310 | €93 | 57× | 0.11 | 0.07 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Chaos Tour | €3.940 | €92 | 42.7× | 0.15 | 0.09 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |
| Cult Hypergrowth | €4.606 | €91 | 50.4× | 0.13 | 0.08 | ⚠️ Reisekosten irrelevant – Kostendruck fehlt vollständig. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 190 | 7 | 59 | 13.2% | 79.5% | 7.3% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Bootstrap Struggle | 190 | 7.5 | 56 | 23.8% | 69.7% | 6.6% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Aggressive Marketing | 190 | 7 | 59 | 14.3% | 74.5% | 11.2% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Scandal Recovery | 195 | 7.3 | 57 | 21% | 71.8% | 7.2% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Festival Push | 190 | 5.9 | 65 | 5.5% | 63% | 31.4% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Chaos Tour | 190 | 6.9 | 59 | 14.9% | 72.6% | 12.5% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |
| Cult Hypergrowth | 190 | 7.2 | 57 | 19.9% | 72.2% | 7.9% | ⚠️ Hit-Window >180ms – Rhythmusmechanik zu zugänglich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 45 | 13.98 | 0.4 | 0 | 8.31 | 13.75 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 54 | 3.73 | 0.35 | 0 | 6.59 | 11.03 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 51 | 6.41 | 0.41 | 0 | 8.34 | 13.55 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 50 | 5.54 | 0.43 | 0 | 8.22 | 13.06 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 51 | 4.61 | 0.49 | 0 | 7.89 | 13.09 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 51 | 6.86 | 0.47 | 0 | 8.34 | 13.74 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 52 | 6.39 | 0.42 | 0 | 8.77 | 13.56 | ✅ Bandgesundheit im akzeptablen Bereich. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.31 | 1.38 | 1.33 | 0.88 | 8.82 | 14.88 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.32 | 1.8 | 1.67 | 0.16 | 7.43 | 10.83 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 0.45 | 2.48 | 2.37 | 0.78 | 8.85 | 14.77 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 0.62 | 2.99 | 2.77 | 0.57 | 9.05 | 14.12 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.32 | 1.64 | 1.57 | 0.25 | 8.89 | 13.93 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Chaos Tour | 0.64 | 4.05 | 3.57 | 1.14 | 8.8 | 14.84 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Cult Hypergrowth | 0.32 | 2.27 | 2.09 | 0.68 | 8.9 | 14.78 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 61.02 | 61.02 | 61.02 | 183.06 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 10.93 | 10.93 | 10.93 | 32.79 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 30.59 | 30.59 | 30.59 | 91.77 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 19.16 | 19.16 | 19.16 | 57.48 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 19.87 | 19.87 | 19.87 | 59.61 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 30 | 30 | 30 | 90 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 30.47 | 30.47 | 30.47 | 91.41 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €274.796 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Festival Push** | 443 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 22.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Festival Push** | €5.310 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €274.810 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 61.02 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 9.40 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld, Endfame pro Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €80.000 – €400.000 | €274.796 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Endfame | 200 – 500 | 383 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 25% | 22.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Bootstrap Struggle | Endgeld | €3.000 – €50.000 | €20.880 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Bootstrap Struggle | Endfame | 120 – 320 | 229 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 5% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €50.000 – €200.000 | €161.969 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Endfame | 200 – 430 | 354 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 15% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €10.000 – €120.000 | €62.047 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Scandal Recovery | Endfame | 150 – 360 | 297 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 10% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €20.000 – €150.000 | €122.361 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Endfame | 200 – 460 | 443 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €30.000 – €200.000 | €129.049 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Chaos Tour | Endfame | 200 – 430 | 363 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 5% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €50.000 – €200.000 | €154.763 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Endfame | 200 – 380 | 310 | ✅ | Zentral im Zielband – Fame-Kurve stimmig. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 22.69% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €274.796 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 9.40 Event-Impulsen.
- ✅ Alle KPI-Zielkorridore eingehalten.
- Empfehlung: Szenarien weiter gegeneinander testen und Ziel-KPI-Bänder verfeinern.
