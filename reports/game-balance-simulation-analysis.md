# Game Balance Simulation – Analyse

Erstellt am: 2026-06-27T06:46:54.732Z

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Fame-Gates | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |

## Fame-Shop-Audit

Shop-only kosten **15290 Fame**, mit Legacy-Upgrades **24390 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 70 | 800 | 7 | 19 | 30 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |
| 85 | 950 | 6 | 16 | 25 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |
| 100 | 1100 | 5 | 14 | 22 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 23.730 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 162 |
| Brand Deals | 54 |
| Post Options | 36 |
| Contraband-Items | 37 |
| Upgrade-Katalog | 67 |
| Social Platforms | 4 |
| Trends | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 26 | travel, random |
| band | 59 | random, post_gig, travel |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 24 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €153.485 | 50% | 0.04 | 9.3% | 15681 | 8 | 59 | 0.56 | 58.97 | 16.03 | 0% | €3.450 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €14.833 | 20.2% | 0.05 | 5.8% | 971 | 2 | 59 | 0.05 | 9.5 | 4.26 | 25.77% | €2.715 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €57.234 | 55% | 0.04 | 8.5% | 2594 | 3 | 61 | 0.12 | 28.72 | 8.28 | 0% | €3.309 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €28.373 | 37% | 0.05 | 7.1% | 1777 | 2 | 63 | 0.33 | 18.43 | 6.39 | 0.77% | €2.936 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €29.215 | 42.7% | 0.05 | 7.5% | 2099 | 3 | 64 | 0.01 | 18.54 | 6.06 | 1.92% | €3.161 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €45.286 | 56.8% | 0.05 | 7.2% | 2796 | 3 | 61 | -0.39 | 28.33 | 8.67 | 0% | €3.054 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €60.403 | 54% | 0.04 | 8.4% | 2645 | 3 | 62 | -0.13 | 28.71 | 8.1 | 0.77% | €3.372 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €20.147 | 3.6% | 0.04 | 7.7% | 1967 | 3 | 56 | 0.45 | 8.1 | 1.88 | 0.38% | €2.924 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.135 | 32.1% | 0.04 | 7.5% | 2295 | 3 | 64 | 0.65 | 15.54 | 4.46 | 0% | €3.173 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €54.732 | 50.9% | 0.04 | 9.1% | 7194 | 5 | 59 | 0.57 | 24.18 | 5.82 | 0% | €3.421 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €154.056 | €500 | €3.450 | 19 | 4.63 | 21.23 | 8.54 | 11.75 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €17.359 | €190 | €2.715 | 2.81 | 1.82 | 6.46 | 1 | 3.97 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €58.816 | €413 | €3.309 | 10.19 | 3.42 | 16.48 | 4.16 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €36.127 | €312 | €2.936 | 6.52 | 3 | 11.26 | 2.5 | 6.17 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €38.399 | €317 | €3.161 | 6.84 | 2.88 | 12.48 | 2.54 | 5.87 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €48.781 | €411 | €3.054 | 9.9 | 3.52 | 16.22 | 3.84 | 7.6 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €61.554 | €410 | €3.372 | 10.05 | 3.58 | 16.11 | 4.12 | 7.18 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €20.560 | €406 | €2.924 | 1.63 | 0.85 | 3.21 | 0.87 | 1.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €38.131 | €1.374 | €3.173 | 4.73 | 1.9 | 8.46 | 2.1 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €56.067 | €4.979 | €3.421 | 6.14 | 1.77 | 9.17 | 3.3 | 4.37 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €32.546 | €69.395 | €115.862 | €153.485 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.260 | €8.393 | €12.465 | €14.833 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €19.149 | €27.774 | €40.019 | €57.234 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €11.136 | €20.402 | €24.687 | €28.373 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.830 | €23.075 | €25.827 | €29.215 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €16.651 | €28.125 | €31.497 | €45.286 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €20.225 | €29.096 | €41.480 | €60.403 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €17.953 | €0 | €0 | €20.147 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €19.640 | €28.006 | €0 | €29.135 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €33.372 | €0 | €0 | €54.732 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.450 | €97 | 35.7× | 7.25 | 0.43 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.715 | €76 | 35.6× | 9.21 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.309 | €89 | 37× | 7.56 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.936 | €84 | 34.8× | 8.51 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.161 | €86 | 37× | 7.91 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €3.054 | €89 | 34.4× | 8.19 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.372 | €89 | 37.7× | 7.41 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.924 | €76 | 38.7× | 8.55 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €3.173 | €87 | 36.4× | 7.88 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.421 | €94 | 36.3× | 7.31 | 0.44 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.7 | 60 | 11.7% | 74.5% | 13.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.3 | 57 | 23.8% | 67.4% | 8.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 12% | 70% | 18.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.1 | 58 | 20% | 70.3% | 9.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 3.9% | 56.6% | 39.5% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.5 | 62 | 11.7% | 69.4% | 19% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.5% | 71.2% | 13.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 23.6% | 66.9% | 9.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.1 | 58 | 19.3% | 71.1% | 9.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 61 | 12.9% | 70.7% | 16.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 59 | 16.03 | 3.63 | 1.19 | 8.48 | 13.34 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 4.26 | 1.4 | 1.18 | 6.25 | 10.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 61 | 8.28 | 2.65 | 1.65 | 8.29 | 13.15 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 63 | 6.39 | 2.29 | 1.73 | 8.01 | 13.7 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 64 | 6.06 | 2.3 | 1.55 | 8.23 | 13.4 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 61 | 8.67 | 2.74 | 1.64 | 8.41 | 13.75 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 62 | 8.1 | 2.72 | 1.7 | 8.16 | 13.52 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 56 | 1.88 | 0.67 | 0.23 | 2.18 | 3.4 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 64 | 4.46 | 1.43 | 0.81 | 4.36 | 7.32 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 59 | 5.82 | 1.42 | 0.48 | 3.3 | 5.46 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.94 | 1.52 | 1.63 | 0.77 | 8.93 | 29.53 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.88 | 1.66 | 1.82 | 0.2 | 7.12 | 11.4 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.59 | 2.77 | 2.82 | 0.71 | 9.24 | 24.27 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.74 | 3.26 | 3.49 | 0.52 | 8.92 | 18.73 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.07 | 1.85 | 1.78 | 0.3 | 8.85 | 19.88 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.28 | 4.28 | 4.16 | 1.02 | 8.81 | 24.09 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.31 | 2.44 | 2.41 | 0.59 | 8.97 | 23.99 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.17 | 0.36 | 0.33 | 0.07 | 2.54 | 5.13 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.7 | 0.95 | 0.88 | 0.27 | 4.85 | 12.82 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.58 | 0.93 | 0.9 | 0.55 | 3.83 | 12.78 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.97 | 58.97 | 58.97 | 176.91 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.5 | 9.5 | 9.5 | 28.5 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.72 | 28.72 | 28.72 | 86.16 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.43 | 18.43 | 18.43 | 55.29 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.54 | 18.54 | 18.54 | 55.62 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.33 | 28.33 | 28.33 | 84.99 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.71 | 28.71 | 28.71 | 86.13 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.1 | 8.1 | 8.1 | 24.3 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.54 | 15.54 | 15.54 | 46.62 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.18 | 24.18 | 24.18 | 72.54 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €153.485 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15681 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 25.77% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Baseline Touring** | €3.450 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €154.056 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.97 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.73 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €153.485 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 707.26 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 25.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €14.833 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 674.45 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €57.234 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 717.46 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €28.373 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 682.52 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €29.215 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 784.53 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €45.286 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 721.98 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €60.403 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 699.82 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0% | €0 | 0 | 0 |
| Bootstrap Struggle | 0% | €0 | 0 | 0 |
| Aggressive Marketing | 0% | €0 | 0 | 0 |
| Scandal Recovery | 0% | €0 | 0 | 0 |
| Festival Push | 0% | €0 | 0 | 0 |
| Chaos Tour | 0% | €0 | 0 | 0 |
| Cult Hypergrowth | 0% | €0 | 0 | 0 |
| Early Game Probe (Fame 0–50) | 0% | €0 | 0 | 0 |
| Mid Game Probe (Fame 60–150) | 0% | €0 | 0 | 0 |
| Late Game Probe (Fame 175+) | 0% | €0 | 0 | 0 |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 25.77% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €153.485 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.73 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
