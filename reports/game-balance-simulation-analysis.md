# Game Balance Simulation – Analyse

Erstellt am: 2026-06-26T18:10:41.625Z

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
| Baseline Touring | €500 | 0 | €151.746 | 50.1% | 0.05 | 9.4% | 15571 | 8 | 58 | 0.43 | 58.92 | 16.08 | 0% | €3.446 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €14.612 | 21.4% | 0.06 | 5.9% | 983 | 2 | 59 | 0.15 | 9.38 | 4.17 | 26.54% | €2.722 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €56.964 | 54.8% | 0.05 | 8.4% | 2647 | 3 | 60 | 0.73 | 28.63 | 8.25 | 0.38% | €3.317 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €28.198 | 36.6% | 0.06 | 7.2% | 1685 | 2 | 63 | 0.4 | 18.31 | 6.33 | 1.54% | €2.944 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Festival Push | €500 | 0 | €29.662 | 42.1% | 0.05 | 7.7% | 2128 | 3 | 64 | -0.09 | 18.49 | 6.01 | 2.31% | €3.172 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Chaos Tour | €500 | 0 | €45.028 | 57.1% | 0.05 | 7.3% | 2793 | 3 | 60 | -0.5 | 28.36 | 8.64 | 0% | €3.059 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €59.348 | 53.6% | 0.05 | 8.4% | 2525 | 3 | 62 | 0.03 | 28.54 | 8.05 | 1.15% | €3.366 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €19.960 | 4% | 0.05 | 7.8% | 1960 | 3 | 56 | 0.51 | 8.1 | 1.88 | 0.38% | €2.923 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €29.456 | 31.2% | 0.05 | 7.6% | 2310 | 3 | 64 | 0.47 | 15.53 | 4.47 | 0% | €3.184 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €54.239 | 50.9% | 0.05 | 9.1% | 7331 | 6 | 59 | 0.64 | 24.18 | 5.82 | 0% | €3.421 | ✅ Szenario liegt im robusten Simulationskorridor. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €152.320 | €500 | €3.446 | 18.67 | 4.6 | 21.35 | 8.52 | 11.73 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €17.055 | €191 | €2.722 | 2.72 | 1.8 | 6.33 | 1.01 | 3.91 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €58.614 | €412 | €3.317 | 10.43 | 3.38 | 16.33 | 4.14 | 7.71 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €35.775 | €309 | €2.944 | 6.47 | 2.98 | 11.22 | 2.49 | 6.12 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €38.243 | €316 | €3.172 | 6.76 | 2.86 | 12.33 | 2.54 | 5.84 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €48.682 | €410 | €3.059 | 9.97 | 3.5 | 16.29 | 3.85 | 7.62 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €60.289 | €410 | €3.366 | 10.15 | 3.58 | 16.18 | 4.1 | 7.13 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €20.373 | €403 | €2.923 | 1.63 | 0.84 | 3.21 | 0.87 | 1.93 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €38.088 | €1.372 | €3.184 | 4.8 | 1.93 | 8.41 | 2.1 | 3.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €55.716 | €4.977 | €3.421 | 6 | 1.77 | 9.11 | 3.31 | 4.38 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €32.507 | €68.854 | €114.545 | €151.746 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €4.080 | €8.023 | €12.157 | €14.612 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €19.009 | €27.422 | €39.622 | €56.964 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €10.960 | €20.439 | €24.334 | €28.198 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €11.649 | €22.931 | €25.607 | €29.662 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €16.489 | €28.253 | €31.348 | €45.028 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €19.934 | €28.595 | €40.496 | €59.348 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €17.749 | €0 | €0 | €19.960 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €19.510 | €28.565 | €0 | €29.456 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €33.538 | €0 | €0 | €54.239 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.446 | €118 | 29.3× | 7.25 | 0.44 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €2.722 | €95 | 28.7× | 9.18 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €3.317 | €110 | 30.1× | 7.54 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €2.944 | €106 | 27.8× | 8.49 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €3.172 | €107 | 29.6× | 7.88 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €3.059 | €110 | 27.8× | 8.17 | 0.49 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €3.366 | €110 | 30.5× | 7.43 | 0.45 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.923 | €97 | 30.1× | 8.55 | 0.51 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €3.184 | €109 | 29.2× | 7.85 | 0.47 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €3.421 | €116 | 29.5× | 7.31 | 0.44 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 152 | 6.8 | 60 | 11.8% | 74.7% | 13.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 7.4 | 57 | 24.5% | 67.1% | 8.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 152 | 6.6 | 61 | 12.2% | 69.9% | 18% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 157 | 7.1 | 58 | 20% | 69.9% | 10.1% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 152 | 5.5 | 68 | 4% | 56.6% | 39.5% | ⚠️ Kaum schlechte Gigs – Fame-Verlust-Druck zu gering. |
| Chaos Tour | 152 | 6.5 | 62 | 11.8% | 69.4% | 18.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 152 | 6.8 | 60 | 15.3% | 71.2% | 13.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 7.2 | 57 | 23.7% | 66.7% | 9.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 157 | 7.1 | 58 | 19.1% | 71.1% | 9.8% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 157 | 6.7 | 61 | 13% | 70.6% | 16.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 58 | 16.08 | 3.58 | 1.18 | 8.38 | 13.17 | ⚠️ Überdurchschnittlich viele Klinikbesuche – Burnout-Risiko. |
| Bootstrap Struggle | 59 | 4.17 | 1.38 | 1.18 | 6.12 | 10.36 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 60 | 8.25 | 2.65 | 1.59 | 8.2 | 13.2 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 63 | 6.33 | 2.27 | 1.73 | 7.92 | 13.47 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 64 | 6.01 | 2.31 | 1.57 | 8.28 | 13.29 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 60 | 8.64 | 2.72 | 1.63 | 8.4 | 13.87 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Cult Hypergrowth | 62 | 8.05 | 2.78 | 1.72 | 8.1 | 13.49 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 56 | 1.88 | 0.67 | 0.23 | 2.19 | 3.41 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Mid Game Probe (Fame 60–150) | 64 | 4.47 | 1.46 | 0.82 | 4.32 | 7.28 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Late Game Probe (Fame 175+) | 59 | 5.82 | 1.4 | 0.49 | 3.3 | 5.43 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0.93 | 1.48 | 1.66 | 0.75 | 8.95 | 29.7 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.87 | 1.63 | 1.8 | 0.2 | 7.08 | 11.24 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 1.52 | 2.75 | 2.85 | 0.7 | 9.46 | 24.16 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.75 | 3.28 | 3.43 | 0.53 | 8.73 | 18.63 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 1.04 | 1.85 | 1.78 | 0.29 | 8.81 | 19.69 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.31 | 4.34 | 4.1 | 1.02 | 8.87 | 24.09 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.3 | 2.45 | 2.42 | 0.6 | 8.82 | 24.07 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.17 | 0.35 | 0.33 | 0.08 | 2.54 | 5.12 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.67 | 0.95 | 0.88 | 0.25 | 4.91 | 12.86 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.59 | 0.93 | 0.92 | 0.52 | 3.79 | 12.76 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | 58.92 | 58.92 | 58.92 | 176.76 | ✅ Sehr hohe Minigame-Abdeckung – Tour-Intensität optimal. |
| Bootstrap Struggle | 9.38 | 9.38 | 9.38 | 28.14 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 28.63 | 28.63 | 28.63 | 85.89 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Scandal Recovery | 18.31 | 18.31 | 18.31 | 54.93 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Festival Push | 18.49 | 18.49 | 18.49 | 55.47 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Chaos Tour | 28.36 | 28.36 | 28.36 | 85.08 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Cult Hypergrowth | 28.54 | 28.54 | 28.54 | 85.62 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Early Game Probe (Fame 0–50) | 8.1 | 8.1 | 8.1 | 24.3 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.53 | 15.53 | 15.53 | 46.59 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Late Game Probe (Fame 175+) | 24.18 | 24.18 | 24.18 | 72.54 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €151.746 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 15571 | Festival-Fokus priorisiert Fame über kurzfristige Einnahmen. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 26.54% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Baseline Touring** | €3.446 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €152.320 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 58.92 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 11.77 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €151.746 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 250 – 420 | 706.07 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 85% | 26.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Bootstrap Struggle | Endgeld | €1.000 – €5.000 | €14.612 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 450 – 800 | 671.9 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €56.964 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 280 – 520 | 717.61 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 45% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Scandal Recovery | Endgeld | €5.000 – €30.000 | €28.198 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 220 – 420 | 683.13 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Festival Push | Endgeld | €10.000 – €50.000 | €29.662 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Festival Push | Fame-Fortschritt/Gig | 250 – 500 | 784.27 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €45.028 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 260 – 500 | 722.12 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €59.348 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 260 – 520 | 700.51 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |

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

- Höchstes Risiko: **Bootstrap Struggle** mit 26.54% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €151.746 Endgeld.
- Höchste Volatilität: **Chaos Tour** mit Ø 11.77 Event-Impulsen.
- ❌ KPI-Verstöße: Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Endgeld) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
