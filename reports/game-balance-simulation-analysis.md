# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T17:44:39.063Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.1
- Basis-Commit: 8febc998728286b905d3c54f07bedcd3ad29f0e5
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 17c72b62d458522b1325114c7a4807c6d3ff6b8841c7d28bb6e173587212c12a
- Szenariokonfiguration SHA-256: e2f97ba93da6a842fa33908edf7acf33b2404c753b18903421f900c04aa7c6c0
- KPI-Zielkonfiguration SHA-256: 7e243b1d2ee21d2c19e764cba96afa604f633f210757fa6e9eb8843aa226cfa7
- Seed-Strategie: scenario-id-plus-run-index

## Simulationseinstellungen

| Parameter | Wert |
|---|---|
| Runs je Szenario | 260 |
| Tage je Run | 75 |
| Basis-Tageskosten | €62 |
| Modifier-Kosten | Catering €18, Promo €26, Merch €26, Soundcheck €42, Guestlist €50 |
| Venue-Auswahl (Sim-Heuristik) | diff-2: fame 0–59 · diff-3: 60–199 · diff-4: 200–399 · diff-5: 400+ (im Spiel steuert die Map-Layer-Progression die Venue-Schwierigkeit) |
| Fame-Level-Skala | Level = floor(sqrt(fame / 200)) |
| Klinik-Heilung | €280 × 1.2^Besuche · +30 Stamina / +10 Mood |

## Fame-Shop-Audit

Shop-only kosten **15290 Fame**, mit Legacy-Upgrades **24390 Fame**.
Das teuerste einzelne Fame-Item kostet **5000 Fame**.

| PerfScore | Roh-Fame/Gig | Gigs bis 5.000 Fame | Gigs fuer Fame-Shop-only | Gigs fuer Shop+Legacy | Bewertung |
|---:|---:|---:|---:|---:|---|
| 45 | 690 | 8 | 23 | 34 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 50 | 750 | 7 | 21 | 32 | Fame-Gewinn ist zu niedrig fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |
| 55 | 810 | 7 | 19 | 29 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 60 | 870 | 6 | 18 | 27 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 70 | 990 | 6 | 16 | 24 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 85 | 1170 | 5 | 13 | 20 | Fame-Gewinn liegt im Zielkorridor von 20-30 guten Gigs bis 24.390 Fame. |
| 100 | 1350 | 4 | 12 | 18 | Fame-Gewinn ist zu hoch fuer das Ziel von 20-30 guten Gigs bis 24.390 Fame. |

Hinweis: Mathematisch ist alles kaufbar, weil gute Gigs mindestens 1 Fame geben. Praktisch entscheidet die noetige Gig-Anzahl ueber die Balance.

## Feature-Snapshot der App

| Kategorie | Anzahl |
|---|---:|
| Venues (gesamt) | 45 |
| Event-Kategorien | 5 |
| Events gesamt | 164 |
| Brand Deals | 54 |
| Post Options | 36 |
| Contraband-Items | 37 |
| Upgrade-Katalog | 67 |
| Social Platforms | 4 |
| Trends | 5 |
| Songs | 7 |
| Quests (Registry) | 32 |
| Asset-Chassis-Arten | 4 |
| Asset-Module | 63 |
| Kredit-Profile | 5 |

### Event-Katalog nach Kategorie

| Kategorie | Events | Trigger-Typen |
|---|---:|---|
| transport | 26 | travel, random |
| band | 59 | random, post_gig, travel |
| gig | 22 | gig_mid, gig_intro, random |
| financial | 31 | random, post_gig |
| special | 26 | special_location, random, travel, post_gig |

## Ergebnis-Matrix

| Szenario | Startkapital | Startfame | Ø Endgeld | Peak-Drop | S2I-Ratio | Cap-Hits | Ø Endfame | Ø Fame-Lv. | Ø Harmony | Ø Kontroverse | Ø Gigs | Ø Clinic | Insolvenz | Ø Gig-Netto | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €500 | 0 | €56.580 | 62.28% | undefined | undefined% | 22405 | 10 | 38 | undefined | 60.17 | 6.58 | 0.38% | €2.514 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €542 | 91.57% | undefined | undefined% | 1030 | 2 | 56 | undefined | 4.11 | 2.45 | 88.85% | €1.136 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €24.361 | 59.55% | undefined | undefined% | 8395 | 6 | 54 | undefined | 29.32 | 5.9 | 1.15% | €2.740 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €6.217 | 80.79% | undefined | undefined% | 2890 | 3 | 52 | undefined | 13.43 | 4.47 | 33.85% | €1.961 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.460 | 76.99% | undefined | undefined% | 4404 | 4 | 55 | undefined | 14.6 | 4.65 | 26.54% | €2.381 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.516 | 62.91% | undefined | undefined% | 6266 | 5 | 43 | undefined | 26.3 | 5.71 | 7.69% | €2.248 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €25.032 | 59.19% | undefined | undefined% | 8520 | 6 | 54 | undefined | 29.65 | 5.78 | 1.54% | €2.844 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €16.129 | 61.49% | undefined | undefined% | 8843 | 6 | 50 | undefined | 27.87 | 5.51 | 5% | €2.138 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.190 | 63.81% | undefined | undefined% | 6493 | 5 | 52 | undefined | 26.1 | 5.4 | 7.31% | €1.995 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €10.786 | 31.7% | undefined | undefined% | 3167 | 3 | 42 | undefined | 9.05 | 2.5 | 0.77% | €2.039 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €13.974 | 48.61% | undefined | undefined% | 4587 | 4 | 49 | undefined | 15.64 | 4.93 | 2.31% | €2.288 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.272 | 47.48% | undefined | undefined% | 10618 | 7 | 39 | undefined | 25.75 | 5.17 | 0% | €2.652 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €59.806 | €0 | €2.514 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €3.891 | €0 | €1.136 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Aggressive Marketing | €31.593 | €0 | €2.740 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €11.061 | €0 | €1.961 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €14.547 | €0 | €2.381 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €22.629 | €0 | €2.248 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.481 | €0 | €2.844 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €21.811 | €0 | €2.138 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.083 | €0 | €1.995 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.580 | €0 | €2.039 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.061 | €0 | €2.288 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.281 | €0 | €2.652 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | — | — | — | €56.580 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | — | — | — | €542 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | — | — | — | €24.361 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | — | — | — | €6.217 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | — | — | — | €9.460 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | — | — | — | €16.516 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | — | — | — | €25.032 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | — | — | — | €16.129 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | — | — | — | €16.190 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | — | — | — | €10.786 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | — | — | — | €13.974 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | — | — | — | €29.272 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.514 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.136 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.740 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.961 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.381 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.248 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.844 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.138 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.995 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.039 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.288 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.652 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | 50 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | undefined | undefined | 54 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | undefined | undefined | 53 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | undefined | undefined | 52 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | undefined | undefined | 58 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | undefined | undefined | 46 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | undefined | undefined | 53 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | undefined | undefined | 49 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | undefined | undefined | 50 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | undefined | undefined | 51 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | 50 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | undefined | undefined | 51 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 38 | 6.58 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 56 | 2.45 | undefined | undefined | undefined | undefined | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 54 | 5.9 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 52 | 4.47 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 4.65 | undefined | undefined | undefined | undefined | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 43 | 5.71 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 54 | 5.78 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.51 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 52 | 5.4 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.5 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 49 | 4.93 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 39 | 5.17 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | undefined | undefined | 4.22 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Bootstrap Struggle | undefined | undefined | undefined | undefined | 0.37 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | undefined | undefined | undefined | undefined | 3.48 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Scandal Recovery | undefined | undefined | undefined | undefined | 1.92 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Festival Push | undefined | undefined | undefined | undefined | 1.03 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | undefined | undefined | undefined | undefined | 4.93 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | undefined | undefined | undefined | undefined | 2.95 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| No Social (Fame 0-50) | undefined | undefined | undefined | undefined | 2.49 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| High Controversy | undefined | undefined | undefined | undefined | 2.36 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Early Game Probe (Fame 0–50) | undefined | undefined | undefined | undefined | 0.55 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | undefined | undefined | 1.21 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Late Game Probe (Fame 175+) | undefined | undefined | undefined | undefined | 2.52 | undefined | undefined | ✅ Gesunde Event-Verteilung. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Bootstrap Struggle | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Scandal Recovery | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Cult Hypergrowth | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| No Social (Fame 0-50) | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| High Controversy | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Early Game Probe (Fame 0–50) | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | undefined | undefined | undefined | undefined | NaN | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Bootstrap Struggle | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Aggressive Marketing | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Scandal Recovery | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Festival Push | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Chaos Tour | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Cult Hypergrowth | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| No Social (Fame 0-50) | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| High Controversy | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Early Game Probe (Fame 0–50) | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Mid Game Probe (Fame 60–150) | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |
| Late Game Probe (Fame 175+) | undefined | undefined | undefined | undefined | undefined | undefined | €0 | undefined | undefined% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €56.580 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 22405 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 88.85% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.844 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €59.806 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.17 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.00 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Verworfen/Clamped |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 48121 | 25929 | 0 | 25929 | 0 | 0 |
| Bootstrap Struggle | 3169 | 2152 | 0 | 2152 | 0 | 0 |
| Aggressive Marketing | 27832 | 19681 | 0 | 19681 | 0 | 0 |
| Scandal Recovery | 11845 | 9033 | 0 | 9033 | 0 | 0 |
| Festival Push | 15541 | 11259 | 0 | 11259 | 0 | 0 |
| Chaos Tour | 22025 | 15890 | 0 | 15890 | 0 | 0 |
| Cult Hypergrowth | 28044 | 19703 | 0 | 19703 | 0 | 0 |
| No Social (Fame 0-50) | 26268 | 17572 | 0 | 17572 | 0 | 0 |
| High Controversy | 22654 | 16318 | 0 | 16318 | 0 | 0 |
| Early Game Probe (Fame 0–50) | 7483 | 4358 | 0 | 4358 | 0 | 0 |
| Mid Game Probe (Fame 60–150) | 13707 | 9285 | 0 | 9285 | 0 | 0 |
| Late Game Probe (Fame 175+) | 20729 | 10398 | 0 | 10398 | 0 | 0 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*
| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €56.580 | €55.084 | €19.313 | €31.941 | €82.346 |
| Bootstrap Struggle | €542 | €0 | €2.178 | €0 | €1.031 |
| Aggressive Marketing | €24.361 | €23.576 | €9.919 | €12.480 | €35.849 |
| Scandal Recovery | €6.217 | €4.013 | €7.167 | €0 | €16.642 |
| Festival Push | €9.460 | €7.593 | €9.183 | €0 | €21.956 |
| Chaos Tour | €16.516 | €16.258 | €9.853 | €2.820 | €30.539 |
| Cult Hypergrowth | €25.032 | €25.448 | €9.837 | €13.896 | €37.020 |
| No Social (Fame 0-50) | €16.129 | €15.021 | €8.569 | €5.131 | €27.560 |
| High Controversy | €16.190 | €15.100 | €9.429 | €3.861 | €29.486 |
| Early Game Probe (Fame 0–50) | €10.786 | €10.249 | €4.618 | €5.178 | €16.774 |
| Mid Game Probe (Fame 60–150) | €13.974 | €13.483 | €7.196 | €5.479 | €22.928 |
| Late Game Probe (Fame 175+) | €29.272 | €28.908 | €9.149 | €18.283 | €40.961 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 231 | 260 | 88.85% | 84.44% | 92.12% |
| Aggressive Marketing | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Scandal Recovery | 88 | 260 | 33.85% | 28.37% | 39.80% |
| Festival Push | 69 | 260 | 26.54% | 21.54% | 32.22% |
| Chaos Tour | 20 | 260 | 7.69% | 5.03% | 11.58% |
| Cult Hypergrowth | 4 | 260 | 1.54% | 0.60% | 3.89% |
| No Social (Fame 0-50) | 13 | 260 | 5.00% | 2.94% | 8.37% |
| High Controversy | 19 | 260 | 7.31% | 4.73% | 11.13% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €56.580 | 259 / €56.799 | 1 / €0 |
| Bootstrap Struggle | 260 / €542 | 29 / €4.856 | 231 / €0 |
| Aggressive Marketing | 260 / €24.361 | 257 / €24.645 | 3 / €0 |
| Scandal Recovery | 260 / €6.217 | 172 / €9.397 | 88 / €0 |
| Festival Push | 260 / €9.460 | 191 / €12.878 | 69 / €0 |
| Chaos Tour | 260 / €16.516 | 240 / €17.892 | 20 / €0 |
| Cult Hypergrowth | 260 / €25.032 | 256 / €25.423 | 4 / €0 |
| No Social (Fame 0-50) | 260 / €16.129 | 247 / €16.978 | 13 / €0 |
| High Controversy | 260 / €16.190 | 241 / €17.467 | 19 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €10.786 | 258 / €10.869 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €13.974 | 254 / €14.304 | 6 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.272 | 260 / €29.272 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €19.313 | 0.3413 | 62.28% | 78.57% |
| Bootstrap Struggle | €2.178 | 4.0185 | 91.57% | 99.41% |
| Aggressive Marketing | €9.919 | 0.4072 | 59.55% | 84.10% |
| Scandal Recovery | €7.167 | 1.1528 | 80.79% | 99.15% |
| Festival Push | €9.183 | 0.9707 | 76.99% | 98.94% |
| Chaos Tour | €9.853 | 0.5966 | 62.91% | 95.11% |
| Cult Hypergrowth | €9.837 | 0.393 | 59.19% | 83.29% |
| No Social (Fame 0-50) | €8.569 | 0.5313 | 61.49% | 88.95% |
| High Controversy | €9.429 | 0.5824 | 63.81% | 88.80% |
| Early Game Probe (Fame 0–50) | €4.618 | 0.4281 | 31.70% | 51.86% |
| Mid Game Probe (Fame 60–150) | €7.196 | 0.515 | 48.61% | 81.09% |
| Late Game Probe (Fame 175+) | €9.149 | 0.3126 | 47.48% | 67.37% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 164 |
| brandDealsAvailable | 54 |
| postOptionsAvailable | 36 |
| contrabandItemsAvailable | 37 |
| upgradesAvailable | 67 |
| socialPlatformsAvailable | undefined |
| trendsAvailable | 5 |
| songsAvailable | 7 |
| questsAvailable | undefined |
| assetChassisAvailable | 8 |
| assetModulesAvailable | undefined |
| loanProfilesAvailable | undefined |

## Ausführungsabdeckung (Coverage)

| Feature | Covered | Evaluations / Attempts | Activations / Successes | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 144099 | 2311 | 51 |
| postOptions | ❌ | 0 | 0 | 0 |
| socialTrends | ✅ | 178659 | 21394 | 5 |
| contraband | ✅ | 178659 | 19722 | 37 |
| minigamesTravel | ✅ | 0 | 73316 | - |
| minigamesRoadie | ✅ | 0 | 24330 | - |
| minigamesKabelsalat | ✅ | 0 | 24626 | - |
| minigamesAmp | ✅ | 0 | 24360 | - |
| sponsorship | ❌ | 0 | 0 | - |
| restStops | ✅ | 0 | 14819 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €56.580 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 797.1 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 88.85% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €542 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 809.81 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €24.361 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 950.39 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 33.85% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €6.217 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 881.19 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 26.54% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.460 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1050.29 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 7.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.516 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 839.21 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.54% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €25.032 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 949.96 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -39.62% | €54.698 | 797.1 | 16.17 |
| Bootstrap Struggle | -11.15% | €542 | 809.81 | 1.35 |
| Aggressive Marketing | -86.93% | €24.167 | 950.39 | 15.53 |
| Scandal Recovery | -66.15% | €6.217 | 881.19 | 8.54 |
| Festival Push | -73.08% | €9.456 | 1050.29 | 8.35 |
| Chaos Tour | -91.93% | €16.512 | 839.21 | 17.27 |
| Cult Hypergrowth | -75.38% | €24.683 | 949.96 | 13.47 |
| No Social (Fame 0-50) | -95% | €16.129 | 945.3 | 19.58 |
| High Controversy | -92.69% | €16.190 | 865.65 | 20.87 |
| Early Game Probe (Fame 0–50) | -56.92% | €10.609 | 827.42 | 1.26 |
| Mid Game Probe (Fame 60–150) | -70.38% | €13.725 | 876.09 | 3.6 |
| Late Game Probe (Fame 175+) | -4.23% | €23.527 | 802.18 | 0.69 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 88.85% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €56.580 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.00 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
