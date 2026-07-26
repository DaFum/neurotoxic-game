# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T16:17:24.756Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.1
- Basis-Commit: 7a943d32d241b6bc4905d67af5515b368d979cc7
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 078c77a619fb4d3f7bbfd1e36c451f20fb6fc4f75a7db7998dacc3004463f7df
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
| Baseline Touring | €500 | 0 | €57.746 | undefined% | undefined | undefined% | 16892 | 9 | 37 | undefined | 60.07 | undefined | 0% | €2.490 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Bootstrap Struggle | €500 | 0 | €825 | undefined% | undefined | undefined% | 923 | 2 | 55 | undefined | 4.2 | undefined | 87.31% | €1.161 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €23.960 | undefined% | undefined | undefined% | 4234 | 4 | 55 | undefined | 29.14 | undefined | 1.92% | €2.710 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Scandal Recovery | €500 | 0 | €6.074 | undefined% | undefined | undefined% | 1733 | 2 | 53 | undefined | 13.45 | undefined | 35.38% | €1.934 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.796 | undefined% | undefined | undefined% | 1995 | 3 | 56 | undefined | 14.86 | undefined | 23.08% | €2.367 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €17.339 | undefined% | undefined | undefined% | 2446 | 3 | 43 | undefined | 26.57 | undefined | 4.23% | €2.235 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| Cult Hypergrowth | €500 | 0 | €26.136 | undefined% | undefined | undefined% | 3760 | 4 | 53 | undefined | 30.02 | undefined | 0.77% | €2.823 | ⚠️ KPI-Verstöße vorhanden – siehe Health Check. |
| No Social (Fame 0-50) | €500 | 0 | €17.271 | undefined% | undefined | undefined% | 3311 | 4 | 50 | undefined | 28.15 | undefined | 3.46% | €2.119 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €16.433 | undefined% | undefined | undefined% | 3111 | 3 | 50 | undefined | 26.07 | undefined | 6.92% | €2.016 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €10.974 | undefined% | undefined | undefined% | 2353 | 3 | 42 | undefined | 9.06 | undefined | 0.77% | €2.047 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €14.603 | undefined% | undefined | undefined% | 2507 | 3 | 48 | undefined | 15.78 | undefined | 1.54% | €2.274 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.779 | undefined% | undefined | undefined% | 9521 | 6 | 41 | undefined | 26.17 | undefined | 0% | €2.647 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €0 | €0 | €2.490 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €0 | €0 | €1.161 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Aggressive Marketing | €0 | €0 | €2.710 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €0 | €0 | €1.934 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €0 | €0 | €2.367 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €0 | €0 | €2.235 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €0 | €0 | €2.823 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €0 | €0 | €2.119 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €0 | €0 | €2.016 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €0 | €0 | €2.047 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €0 | €0 | €2.274 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €0 | €0 | €2.647 | undefined | undefined | NaN | undefined | undefined | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | — | — | — | €57.746 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | — | — | — | €825 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | — | — | — | €23.960 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | — | — | — | €6.074 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | — | — | — | €9.796 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | — | — | — | €17.339 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | — | — | — | €26.136 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | — | — | — | €17.271 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | — | — | — | €16.433 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | — | — | — | €10.974 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | — | — | — | €14.603 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | — | — | — | €29.779 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.490 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.161 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.710 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.934 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.367 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.235 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.823 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.119 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.016 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.047 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.274 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.647 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | 49 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | undefined | undefined | 54 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | undefined | undefined | 54 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | undefined | undefined | 52 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | undefined | undefined | 57 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | undefined | undefined | 46 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | undefined | undefined | 52 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | undefined | undefined | 49 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | undefined | undefined | 49 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | undefined | undefined | 51 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | 50 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | undefined | undefined | 51 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 37 | undefined | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 55 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Aggressive Marketing | 55 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Scandal Recovery | 53 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 56 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Chaos Tour | 43 | undefined | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 53 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | undefined | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | undefined | undefined | undefined | undefined | undefined | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 41 | undefined | undefined | undefined | undefined | undefined | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | undefined | undefined | 4.27 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Bootstrap Struggle | undefined | undefined | undefined | undefined | 0.39 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | undefined | undefined | undefined | undefined | 3.35 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Scandal Recovery | undefined | undefined | undefined | undefined | 1.98 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Festival Push | undefined | undefined | undefined | undefined | 1.03 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | undefined | undefined | undefined | undefined | 4.98 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | undefined | undefined | undefined | undefined | 3.05 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| No Social (Fame 0-50) | undefined | undefined | undefined | undefined | 2.5 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| High Controversy | undefined | undefined | undefined | undefined | 2.44 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Early Game Probe (Fame 0–50) | undefined | undefined | undefined | undefined | 0.59 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | undefined | undefined | 1.23 | undefined | undefined | ✅ Gesunde Event-Verteilung. |
| Late Game Probe (Fame 175+) | undefined | undefined | undefined | undefined | 2.53 | undefined | undefined | ✅ Gesunde Event-Verteilung. |

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
| Höchstes Ø Endgeld | **Baseline Touring** | €57.746 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 16892 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 87.31% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.823 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €0 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.07 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.14 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Verworfen/Clamped |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 26543 | 0 | 26543 | 1 | 0 |
| Bootstrap Struggle | 0 | 2102 | 0 | 2102 | 0 | 0 |
| Aggressive Marketing | 0 | 18847 | 0 | 18847 | 0 | 0 |
| Scandal Recovery | 0 | 8358 | 0 | 8358 | 0 | 0 |
| Festival Push | 0 | 10420 | 0 | 10420 | 0 | 0 |
| Chaos Tour | 0 | 15193 | 0 | 15193 | 0 | 0 |
| Cult Hypergrowth | 0 | 19422 | 0 | 19422 | 0 | 0 |
| No Social (Fame 0-50) | 0 | 16743 | 0 | 16743 | 0 | 0 |
| High Controversy | 0 | 15306 | 0 | 15306 | 0 | 0 |
| Early Game Probe (Fame 0–50) | 0 | 4283 | 0 | 4283 | 0 | 0 |
| Mid Game Probe (Fame 60–150) | 0 | 9122 | 0 | 9122 | 0 | 0 |
| Late Game Probe (Fame 175+) | 0 | 10250 | 0 | 10250 | 0 | 0 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*
| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €57.746 | €56.473 | €19.492 | €34.376 | €82.292 |
| Bootstrap Struggle | €825 | €0 | €3.075 | €0 | €2.223 |
| Aggressive Marketing | €23.960 | €23.318 | €10.150 | €11.413 | €36.376 |
| Scandal Recovery | €6.074 | €4.033 | €7.149 | €0 | €15.693 |
| Festival Push | €9.796 | €9.144 | €9.096 | €0 | €22.114 |
| Chaos Tour | €17.339 | €17.836 | €8.290 | €5.394 | €28.281 |
| Cult Hypergrowth | €26.136 | €25.850 | €9.936 | €14.650 | €37.516 |
| No Social (Fame 0-50) | €17.271 | €16.750 | €8.776 | €6.302 | €29.511 |
| High Controversy | €16.433 | €15.058 | €9.495 | €4.952 | €28.589 |
| Early Game Probe (Fame 0–50) | €10.974 | €10.346 | €4.609 | €5.668 | €17.204 |
| Mid Game Probe (Fame 60–150) | €14.603 | €14.120 | €7.174 | €5.946 | €25.304 |
| Late Game Probe (Fame 175+) | €29.779 | €29.256 | €9.034 | €19.020 | €39.866 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 0 | 260 | 0.00% | 0.00% | 1.46% |
| Bootstrap Struggle | 227 | 260 | 87.31% | 82.71% | 90.82% |
| Aggressive Marketing | 5 | 260 | 1.92% | 0.82% | 4.42% |
| Scandal Recovery | 92 | 260 | 35.38% | 29.82% | 41.37% |
| Festival Push | 60 | 260 | 23.08% | 18.37% | 28.57% |
| Chaos Tour | 11 | 260 | 4.23% | 2.38% | 7.42% |
| Cult Hypergrowth | 2 | 260 | 0.77% | 0.21% | 2.76% |
| No Social (Fame 0-50) | 9 | 260 | 3.46% | 1.83% | 6.45% |
| High Controversy | 18 | 260 | 6.92% | 4.42% | 10.68% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 4 | 260 | 1.54% | 0.60% | 3.89% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €57.746 | 260 / €57.746 | 0 / €0 |
| Bootstrap Struggle | 260 / €825 | 33 / €6.501 | 227 / €0 |
| Aggressive Marketing | 260 / €23.960 | 255 / €24.430 | 5 / €0 |
| Scandal Recovery | 260 / €6.074 | 168 / €9.400 | 92 / €0 |
| Festival Push | 260 / €9.796 | 200 / €12.735 | 60 / €0 |
| Chaos Tour | 260 / €17.339 | 249 / €18.105 | 11 / €0 |
| Cult Hypergrowth | 260 / €26.136 | 258 / €26.338 | 2 / €0 |
| No Social (Fame 0-50) | 260 / €17.271 | 251 / €17.890 | 9 / €0 |
| High Controversy | 260 / €16.433 | 242 / €17.655 | 18 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €10.974 | 258 / €11.059 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €14.603 | 256 / €14.832 | 4 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.779 | 260 / €29.779 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €19.492 | 0.3375 | 61.55% | 74.21% |
| Bootstrap Struggle | €3.075 | 3.7273 | 91.02% | 99.45% |
| Aggressive Marketing | €10.150 | 0.4236 | 59.96% | 84.71% |
| Scandal Recovery | €7.149 | 1.177 | 81.16% | 99.24% |
| Festival Push | €9.096 | 0.9285 | 77.88% | 98.88% |
| Chaos Tour | €8.290 | 0.4781 | 57.85% | 88.06% |
| Cult Hypergrowth | €9.936 | 0.3802 | 58.92% | 78.47% |
| No Social (Fame 0-50) | €8.776 | 0.5081 | 60.76% | 87.42% |
| High Controversy | €9.495 | 0.5778 | 62.96% | 89.13% |
| Early Game Probe (Fame 0–50) | €4.609 | 0.42 | 31.55% | 52.97% |
| Mid Game Probe (Fame 60–150) | €7.174 | 0.4913 | 45.64% | 72.62% |
| Late Game Probe (Fame 175+) | €9.034 | 0.3034 | 48.69% | 67.82% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 5 |
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
| brandDeals | ✅ | 144176 | 2359 | 51 |
| postOptions | ❌ | 0 | 0 | 0 |
| socialTrends | ✅ | 179385 | 21519 | 5 |
| contraband | ✅ | 179385 | 19657 | 37 |
| minigamesTravel | ✅ | 0 | 73720 | - |
| minigamesRoadie | ✅ | 0 | 24399 | - |
| minigamesKabelsalat | ✅ | 0 | 24738 | - |
| minigamesAmp | ✅ | 0 | 24583 | - |
| sponsorship | ✅ | 0 | 1861 | - |
| restStops | ✅ | 0 | 14769 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0% | ✅ | Risikofrei – kein Insolvenzfall beobachtet. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €57.746 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 0 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 87.31% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €825 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 0 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €23.960 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 0 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 35.38% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €6.074 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 0 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Festival Push | Insolvenzrate | ≤ 35% | 23.08% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.796 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 0 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 4.23% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €17.339 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 0 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €26.136 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 0 | ❌ | Außerhalb Zielband – Fame-Fortschritt pro Gig prüfen. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -1.15% | €135 | -730.74 | -0.36 |
| Bootstrap Struggle | 0% | €150 | -713.48 | -0.06 |
| Aggressive Marketing | 0% | €-757 | -791.2 | -0.43 |
| Scandal Recovery | 0.76% | €-347 | -750.85 | -0.09 |
| Festival Push | -1.15% | €-415 | -832.84 | 0.08 |
| Chaos Tour | 0% | €254 | -662.9 | 0.34 |
| Cult Hypergrowth | 0.39% | €564 | -774.06 | 0.37 |
| No Social (Fame 0-50) | 0% | €0 | -712.31 | 0 |
| High Controversy | -0.77% | €107 | -708.01 | -0.14 |
| Early Game Probe (Fame 0–50) | 0% | €-20 | -726.04 | -0.05 |
| Mid Game Probe (Fame 60–150) | -0.38% | €484 | -732.86 | 0.1 |
| Late Game Probe (Fame 175+) | 0% | €-347 | -745.53 | 0.1 |

## Feature-Abdeckung in der Simulation

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 87.31% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €57.746 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.14 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 0
- Fehlgeschlagen: 7
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Baseline Touring (Fame-Fortschritt/Gig) · Bootstrap Struggle (Insolvenzrate) · Bootstrap Struggle (Fame-Fortschritt/Gig) · Aggressive Marketing (Fame-Fortschritt/Gig) · Scandal Recovery (Fame-Fortschritt/Gig) · Festival Push (Fame-Fortschritt/Gig) · Chaos Tour (Fame-Fortschritt/Gig) · Cult Hypergrowth (Fame-Fortschritt/Gig)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
