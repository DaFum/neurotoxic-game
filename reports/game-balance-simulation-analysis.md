# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T17:17:26.483Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.1
- Basis-Commit: 506de7e5ed0906b3a069c55597c6f03feaec293e
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 8540589e559332b40bb9b6d2b440cbebf9ba933e74686f95ef593bd10e02b8be
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
| Baseline Touring | €500 | 0 | €1.882 | NaN% | undefined | undefined% | 0 | 0 | 34 | undefined | 44 | 0 | 40% | €292 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Bootstrap Struggle | €500 | 0 | €0 | NaN% | undefined | undefined% | 0 | 0 | 51 | undefined | 2.76 | 0 | 100% | €351 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €194 | NaN% | undefined | undefined% | 0 | 0 | 48 | undefined | 13.79 | 0 | 88.08% | €434 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Scandal Recovery | €500 | 0 | €0 | NaN% | undefined | undefined% | 0 | 0 | 49 | undefined | 4.89 | 0 | 100% | €345 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €4 | NaN% | undefined | undefined% | 0 | 0 | 50 | undefined | 6.25 | 0 | 99.62% | €447 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €4 | NaN% | undefined | undefined% | 0 | 0 | 41 | undefined | 9.03 | 0 | 99.62% | €353 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Cult Hypergrowth | €500 | 0 | €349 | NaN% | undefined | undefined% | 0 | 0 | 49 | undefined | 16.18 | 0 | 76.92% | €442 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| No Social (Fame 0-50) | €500 | 0 | €0 | NaN% | undefined | undefined% | 0 | 0 | 46 | undefined | 8.29 | 0 | 100% | €260 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| High Controversy | €500 | 0 | €0 | NaN% | undefined | undefined% | 0 | 0 | 43 | undefined | 5.23 | 0 | 100% | €155 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €177 | NaN% | undefined | undefined% | 0 | 0 | 44 | undefined | 7.79 | 0 | 57.69% | €280 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €249 | NaN% | undefined | undefined% | 1 | 0 | 47 | undefined | 12.04 | 0 | 72.69% | €424 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €5.745 | NaN% | undefined | undefined% | 3 | 0 | 35 | undefined | 25.06 | 0 | 4.23% | €687 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €3.833,696 | €0 | €292 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €721,973 | €0 | €351 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Aggressive Marketing | €2.422,462 | €0 | €434 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €985,765 | €0 | €345 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €1.602,165 | €0 | €447 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €1.392,885 | €0 | €353 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €2.751,569 | €0 | €442 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €1.000,058 | €0 | €260 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €598,619 | €0 | €155 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €1.096,719 | €0 | €280 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €3.303,8 | €0 | €424 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €12.813,388 | €0 | €687 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | — | — | — | €1.882 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | — | — | — | €0 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | — | — | — | €194 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | — | — | — | €0 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | — | — | — | €4 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | — | — | — | €4 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | — | — | — | €349 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | — | — | — | €0 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | — | — | — | €0 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | — | — | — | €177 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | — | — | — | €249 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | — | — | — | €5.745 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €292 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €351 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €434 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €345 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €447 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €353 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €442 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €260 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €155 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €280 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €424 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €687 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | 48 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | undefined | undefined | 54 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | undefined | undefined | 52 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | undefined | undefined | 54 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | undefined | undefined | 58 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | undefined | undefined | 48 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | undefined | undefined | 52 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | undefined | undefined | 51 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | undefined | undefined | 54 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | undefined | undefined | 52 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | 50 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | undefined | undefined | 50 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 34 | 0 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 51 | 0 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 48 | 0 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 49 | 0 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 50 | 0 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 41 | 0 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 49 | 0 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 46 | 0 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 43 | 0 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Early Game Probe (Fame 0–50) | 44 | 0 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 47 | 0 | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 35 | 0 | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | undefined | undefined | 2.98 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Bootstrap Struggle | undefined | undefined | undefined | undefined | 0.25 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | undefined | undefined | undefined | undefined | 1.64 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Scandal Recovery | undefined | undefined | undefined | undefined | 0.68 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Festival Push | undefined | undefined | undefined | undefined | 0.45 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | undefined | undefined | undefined | undefined | 1.75 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | undefined | undefined | undefined | undefined | 1.62 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| No Social (Fame 0-50) | undefined | undefined | undefined | undefined | 0.82 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| High Controversy | undefined | undefined | undefined | undefined | 0.52 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Early Game Probe (Fame 0–50) | undefined | undefined | undefined | undefined | 0.42 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | undefined | undefined | 0.93 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Late Game Probe (Fame 175+) | undefined | undefined | undefined | undefined | 2.35 | undefined | undefined | ✅ Gesunde Event-Verteilung. |

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
| Höchstes Ø Endgeld | **Late Game Probe (Fame 175+)** | €5.745 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Late Game Probe (Fame 175+)** | 3 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 100% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Late Game Probe (Fame 175+)** | €687 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Late Game Probe (Fame 175+)** | €12.813,388 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 44 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Baseline Touring** | 6.70 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Verworfen/Clamped |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 0 | 0 | 0 | 0 | 0 |
| Bootstrap Struggle | 0 | 0 | 0 | 0 | 0 | 0 |
| Aggressive Marketing | 0 | 0 | 0 | 0 | 0 | 0 |
| Scandal Recovery | 0 | 0 | 0 | 0 | 0 | 0 |
| Festival Push | 0 | 0 | 0 | 0 | 0 | 0 |
| Chaos Tour | 0 | 0 | 0 | 0 | 0 | 0 |
| Cult Hypergrowth | 0 | 0 | 0 | 0 | 0 | 0 |
| No Social (Fame 0-50) | 0 | 0 | 0 | 0 | 0 | 0 |
| High Controversy | 0 | 0 | 0 | 0 | 0 | 0 |
| Early Game Probe (Fame 0–50) | 0 | 0 | 0 | 0 | 0 | 0 |
| Mid Game Probe (Fame 60–150) | 0 | 1 | 0 | 1 | 0 | 0 |
| Late Game Probe (Fame 175+) | 0 | 9 | 0 | 9 | 0 | 0 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*
| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €1.882 | €1.327 | €2.412 | €0 | €4.927 |
| Bootstrap Struggle | €0 | €0 | €0 | €0 | €0 |
| Aggressive Marketing | €194 | €0 | €697 | €0 | €553 |
| Scandal Recovery | €0 | €0 | €0 | €0 | €0 |
| Festival Push | €4 | €0 | €72 | €0 | €0 |
| Chaos Tour | €4 | €0 | €62 | €0 | €0 |
| Cult Hypergrowth | €349 | €0 | €960 | €0 | €1.297 |
| No Social (Fame 0-50) | €0 | €0 | €0 | €0 | €0 |
| High Controversy | €0 | €0 | €0 | €0 | €0 |
| Early Game Probe (Fame 0–50) | €177 | €0 | €425 | €0 | €507 |
| Mid Game Probe (Fame 60–150) | €249 | €0 | €582 | €0 | €1.003 |
| Late Game Probe (Fame 175+) | €5.745 | €5.577 | €3.435 | €1.553 | €10.601 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 104 | 260 | 40.00% | 34.23% | 46.06% |
| Bootstrap Struggle | 260 | 260 | 100.00% | 98.54% | 100.00% |
| Aggressive Marketing | 229 | 260 | 88.08% | 83.57% | 91.47% |
| Scandal Recovery | 260 | 260 | 100.00% | 98.54% | 100.00% |
| Festival Push | 259 | 260 | 99.62% | 97.85% | 99.93% |
| Chaos Tour | 259 | 260 | 99.62% | 97.85% | 99.93% |
| Cult Hypergrowth | 200 | 260 | 76.92% | 71.43% | 81.63% |
| No Social (Fame 0-50) | 260 | 260 | 100.00% | 98.54% | 100.00% |
| High Controversy | 260 | 260 | 100.00% | 98.54% | 100.00% |
| Early Game Probe (Fame 0–50) | 150 | 260 | 57.69% | 51.62% | 63.54% |
| Mid Game Probe (Fame 60–150) | 189 | 260 | 72.69% | 66.98% | 77.75% |
| Late Game Probe (Fame 175+) | 11 | 260 | 4.23% | 2.38% | 7.42% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €1.882 | 156 / €3.137 | 104 / €0 |
| Bootstrap Struggle | 260 / €0 | 0 / €0 | 260 / €0 |
| Aggressive Marketing | 260 / €194 | 31 / €1.623 | 229 / €0 |
| Scandal Recovery | 260 / €0 | 0 / €0 | 260 / €0 |
| Festival Push | 260 / €4 | 1 / €1.158 | 259 / €0 |
| Chaos Tour | 260 / €4 | 1 / €1.006 | 259 / €0 |
| Cult Hypergrowth | 260 / €349 | 60 / €1.512 | 200 / €0 |
| No Social (Fame 0-50) | 260 / €0 | 0 / €0 | 260 / €0 |
| High Controversy | 260 / €0 | 0 / €0 | 260 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €177 | 110 / €419 | 150 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €249 | 71 / €913 | 189 / €0 |
| Late Game Probe (Fame 175+) | 260 / €5.745 | 249 / €5.999 | 11 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €2.412 | 1.2816 | 87.21% | 98.91% |
| Bootstrap Struggle | €0 | null | 92.96% | 98.15% |
| Aggressive Marketing | €697 | 3.5928 | 96.29% | 99.62% |
| Scandal Recovery | €0 | null | 94.89% | 99.08% |
| Festival Push | €72 | 18 | 96.74% | 99.26% |
| Chaos Tour | €62 | 15.5 | 96.06% | 99.08% |
| Cult Hypergrowth | €960 | 2.7507 | 94.95% | 99.26% |
| No Social (Fame 0-50) | €0 | null | 95.01% | 98.91% |
| High Controversy | €0 | null | 91.85% | 98.03% |
| Early Game Probe (Fame 0–50) | €425 | 2.4011 | 86.97% | 97.78% |
| Mid Game Probe (Fame 60–150) | €582 | 2.3373 | 94.71% | 99.58% |
| Late Game Probe (Fame 175+) | €3.435 | 0.5979 | 56.93% | 87.74% |

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
| brandDeals | ✅ | 74835 | 996 | 47 |
| postOptions | ❌ | 0 | 0 | 0 |
| socialTrends | ✅ | 85834 | 10313 | 5 |
| contraband | ✅ | 85834 | 9534 | 37 |
| minigamesTravel | ✅ | 0 | 40384 | - |
| minigamesRoadie | ✅ | 0 | 13436 | - |
| minigamesKabelsalat | ✅ | 0 | 13498 | - |
| minigamesAmp | ✅ | 0 | 13450 | - |
| sponsorship | ❌ | 0 | 0 | - |
| restStops | ✅ | 0 | 7573 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 40% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €1.882 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | NaN | ❌ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 100% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €0 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | NaN | ❌ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 88.08% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €194 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | NaN | ❌ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 100% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €0 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | NaN | ❌ | Im Zielband – leicht außermittig. |
| Festival Push | Insolvenzrate | ≤ 35% | 99.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Festival Push | Endgeld | €8.500 – €50.000 | €4 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | NaN | ❌ | Im Zielband – leicht außermittig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 99.62% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €4 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | NaN | ❌ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 76.92% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €349 | ❌ | Außerhalb Zielband – Einnahmenpfad prüfen. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | NaN | ❌ | Im Zielband – leicht außermittig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 40% | €-55.864 | NaN | -16.07 |
| Bootstrap Struggle | 12.69% | €-825 | NaN | -1.44 |
| Aggressive Marketing | 86.16% | €-23.766 | NaN | -15.35 |
| Scandal Recovery | 64.62% | €-6.074 | NaN | -8.56 |
| Festival Push | 76.54% | €-9.792 | NaN | -8.61 |
| Chaos Tour | 95.39% | €-17.335 | NaN | -17.54 |
| Cult Hypergrowth | 76.15% | €-25.787 | NaN | -13.84 |
| No Social (Fame 0-50) | 96.54% | €-17.271 | NaN | -19.86 |
| High Controversy | 93.08% | €-16.433 | NaN | -20.84 |
| Early Game Probe (Fame 0–50) | 56.92% | €-10.797 | NaN | -1.27 |
| Mid Game Probe (Fame 60–150) | 71.15% | €-14.354 | NaN | -3.74 |
| Late Game Probe (Fame 175+) | 4.23% | €-24.034 | NaN | -1.11 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 100% Insolvenzrate.
- Höchster Kapitalaufbau: **Late Game Probe (Fame 175+)** mit Ø €5.745 Endgeld.
- Ereignisdichte: **Baseline Touring** mit Ø 6.70 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 0
- Fehlgeschlagen: 7
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Baseline Touring (Insolvenzrate) · Baseline Touring (Endgeld) · Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Endgeld) · Bootstrap Struggle (Fame-Fortschritt/Gig) · Aggressive Marketing (Insolvenzrate) · Aggressive Marketing (Endgeld) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Insolvenzrate) · Scandal Recovery (Endgeld) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Insolvenzrate) · Festival Push (Endgeld) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Insolvenzrate) · Chaos Tour (Endgeld) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Insolvenzrate) · Cult Hypergrowth (Endgeld) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
