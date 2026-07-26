# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T21:44:31.222Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.1
- Basis-Commit: fae1be4ea76cb3301b1e5ecaa0189b34c86fa6c8
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 5845c8fa9f95663f75fe057f246f9bd7b367d9187e1662a6f5bb58802f1623f3
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
| Baseline Touring | €500 | 0 | €54.490 | 63.18% | undefined | undefined% | 22038 | 10 | 38 | undefined | 60.2 | 6.42 | 0.77% | €2.478 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €593 | 91.33% | undefined | undefined% | 1071 | 2 | 55 | undefined | 4.15 | 2.45 | 88.08% | €1.125 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €24.340 | 59.58% | undefined | undefined% | 8766 | 6 | 55 | undefined | 29.78 | 5.74 | 2.31% | €2.745 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €5.970 | 81.74% | undefined | undefined% | 3263 | 4 | 54 | undefined | 13.48 | 4.5 | 37.69% | €1.950 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.268 | 78.29% | undefined | undefined% | 4306 | 4 | 55 | undefined | 14.45 | 4.7 | 27.69% | €2.373 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.481 | 61.19% | undefined | undefined% | 5566 | 5 | 41 | undefined | 26.28 | 5.73 | 7.69% | €2.238 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €25.512 | 58.64% | undefined | undefined% | 8975 | 6 | 54 | undefined | 29.52 | 5.86 | 0.77% | €2.813 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €16.129 | 61.49% | undefined | undefined% | 8843 | 6 | 50 | undefined | 27.87 | 5.51 | 5% | €2.138 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €15.843 | 63.23% | undefined | undefined% | 6387 | 5 | 50 | undefined | 26.27 | 5.41 | 7.69% | €2.019 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €11.173 | 30.37% | undefined | undefined% | 3080 | 3 | 41 | undefined | 9.06 | 2.45 | 0.77% | €2.056 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €14.064 | 47.36% | undefined | undefined% | 4265 | 4 | 48 | undefined | 15.68 | 5 | 3.08% | €2.286 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.066 | 49.09% | undefined | undefined% | 10362 | 7 | 40 | undefined | 26.06 | 5.2 | 0% | €2.666 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €58.463 | €0 | €2.478 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Bootstrap Struggle | €3.923 | €0 | €1.125 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Aggressive Marketing | €31.972 | €0 | €2.745 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €10.995 | €0 | €1.950 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Festival Push | €14.443 | €0 | €2.373 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Chaos Tour | €22.297 | €0 | €2.238 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.078 | €0 | €2.813 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €21.811 | €0 | €2.138 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.448 | €0 | €2.019 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.742 | €0 | €2.056 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.133 | €0 | €2.286 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.612 | €0 | €2.666 | 0 | 0 | 0 | 0 | 0 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | — | — | — | €54.490 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | — | — | — | €593 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | — | — | — | €24.340 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | — | — | — | €5.970 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | — | — | — | €9.268 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | — | — | — | €16.481 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | — | — | — | €25.512 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | — | — | — | €16.129 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | — | — | — | €15.843 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | — | — | — | €11.173 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | — | — | — | €14.064 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | — | — | — | €29.066 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.478 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.125 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.745 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.950 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.373 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.238 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.813 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.138 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €2.019 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.056 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.286 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.666 | €0 | undefined× | undefined | undefined | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | undefined | undefined | 49 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | undefined | undefined | 54 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | undefined | undefined | 53 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | undefined | undefined | 52 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | undefined | undefined | 57 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | undefined | undefined | 46 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | undefined | undefined | 53 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | undefined | undefined | 49 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | undefined | undefined | 49 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | undefined | undefined | 51 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | undefined | undefined | 50 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | undefined | undefined | 51 | undefined% | undefined% | undefined% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 38 | 6.42 | 0 | 0 | 0 | 0 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 55 | 2.45 | 0 | 0 | 0 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 55 | 5.74 | 0 | 0 | 0 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 54 | 4.5 | 0 | 0 | 0 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 4.7 | 0 | 0 | 0 | 0 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 41 | 5.73 | 0 | 0 | 0 | 0 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 54 | 5.86 | 0 | 0 | 0 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.51 | 0 | 0 | 0 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 50 | 5.41 | 0 | 0 | 0 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 41 | 2.45 | 0 | 0 | 0 | 0 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 5 | 0 | 0 | 0 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 40 | 5.2 | 0 | 0 | 0 | 0 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 0 | 0 | 0 | 0 | 4.15 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Bootstrap Struggle | 0 | 0 | 0 | 0 | 0.35 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Aggressive Marketing | 0 | 0 | 0 | 0 | 3.39 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Scandal Recovery | 0 | 0 | 0 | 0 | 1.91 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Festival Push | 0 | 0 | 0 | 0 | 1 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Chaos Tour | 0 | 0 | 0 | 0 | 4.88 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Cult Hypergrowth | 0 | 0 | 0 | 0 | 3.05 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| No Social (Fame 0-50) | 0 | 0 | 0 | 0 | 2.49 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| High Controversy | 0 | 0 | 0 | 0 | 2.58 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Early Game Probe (Fame 0–50) | 0 | 0 | 0 | 0 | 0.57 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Mid Game Probe (Fame 60–150) | 0 | 0 | 0 | 0 | 1.16 | 0 | 0 | ✅ Gesunde Event-Verteilung. |
| Late Game Probe (Fame 175+) | 0 | 0 | 0 | 0 | 2.46 | 0 | 0 | ✅ Gesunde Event-Verteilung. |

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
| Höchstes Ø Endgeld | **Baseline Touring** | €54.490 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 22038 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 88.08% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.813 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €58.463 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.2 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.24 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Verworfen/Clamped |
|---|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 48206 | 26397 | 0 | 26397 | 0 | 0 |
| Bootstrap Struggle | 3213 | 2153 | 0 | 2153 | 0 | 0 |
| Aggressive Marketing | 28442 | 19900 | 0 | 19900 | 0 | 0 |
| Scandal Recovery | 12266 | 9082 | 0 | 9082 | 0 | 0 |
| Festival Push | 15163 | 10980 | 0 | 10980 | 0 | 0 |
| Chaos Tour | 21249 | 15808 | 0 | 15808 | 0 | 0 |
| Cult Hypergrowth | 28334 | 19507 | 0 | 19507 | 0 | 0 |
| No Social (Fame 0-50) | 26268 | 17572 | 0 | 17572 | 0 | 0 |
| High Controversy | 22867 | 16619 | 0 | 16619 | 0 | 0 |
| Early Game Probe (Fame 0–50) | 7461 | 4425 | 0 | 4425 | 0 | 0 |
| Mid Game Probe (Fame 60–150) | 13458 | 9361 | 0 | 9361 | 0 | 0 |
| Late Game Probe (Fame 175+) | 20557 | 10489 | 0 | 10489 | 0 | 0 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*
| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €54.490 | €53.551 | €21.442 | €28.963 | €79.929 |
| Bootstrap Struggle | €593 | €0 | €2.648 | €0 | €1.267 |
| Aggressive Marketing | €24.340 | €24.264 | €10.023 | €11.960 | €36.892 |
| Scandal Recovery | €5.970 | €3.207 | €7.223 | €0 | €16.293 |
| Festival Push | €9.268 | €6.775 | €9.369 | €0 | €22.805 |
| Chaos Tour | €16.481 | €16.544 | €9.465 | €3.061 | €29.026 |
| Cult Hypergrowth | €25.512 | €25.576 | €9.723 | €14.199 | €36.252 |
| No Social (Fame 0-50) | €16.129 | €15.021 | €8.569 | €5.131 | €27.560 |
| High Controversy | €15.843 | €15.000 | €9.362 | €4.348 | €28.151 |
| Early Game Probe (Fame 0–50) | €11.173 | €10.378 | €4.632 | €5.696 | €17.385 |
| Mid Game Probe (Fame 60–150) | €14.064 | €13.696 | €7.135 | €5.226 | €22.224 |
| Late Game Probe (Fame 175+) | €29.066 | €29.026 | €9.552 | €16.640 | €40.084 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Bootstrap Struggle | 229 | 260 | 88.08% | 83.57% | 91.47% |
| Aggressive Marketing | 6 | 260 | 2.31% | 1.06% | 4.94% |
| Scandal Recovery | 98 | 260 | 37.69% | 32.02% | 43.72% |
| Festival Push | 72 | 260 | 27.69% | 22.61% | 33.43% |
| Chaos Tour | 20 | 260 | 7.69% | 5.03% | 11.58% |
| Cult Hypergrowth | 2 | 260 | 0.77% | 0.21% | 2.76% |
| No Social (Fame 0-50) | 13 | 260 | 5.00% | 2.94% | 8.37% |
| High Controversy | 20 | 260 | 7.69% | 5.03% | 11.58% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 8 | 260 | 3.08% | 1.57% | 5.95% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €54.490 | 258 / €54.912 | 2 / €0 |
| Bootstrap Struggle | 260 / €593 | 31 / €4.975 | 229 / €0 |
| Aggressive Marketing | 260 / €24.340 | 254 / €24.915 | 6 / €0 |
| Scandal Recovery | 260 / €5.970 | 162 / €9.581 | 98 / €0 |
| Festival Push | 260 / €9.268 | 188 / €12.817 | 72 / €0 |
| Chaos Tour | 260 / €16.481 | 240 / €17.855 | 20 / €0 |
| Cult Hypergrowth | 260 / €25.512 | 258 / €25.710 | 2 / €0 |
| No Social (Fame 0-50) | 260 / €16.129 | 247 / €16.978 | 13 / €0 |
| High Controversy | 260 / €15.843 | 240 / €17.163 | 20 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €11.173 | 258 / €11.260 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €14.064 | 252 / €14.511 | 8 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.066 | 260 / €29.066 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €21.442 | 0.3935 | 63.18% | 80.71% |
| Bootstrap Struggle | €2.648 | 4.4654 | 91.33% | 99.49% |
| Aggressive Marketing | €10.023 | 0.4118 | 59.58% | 79.64% |
| Scandal Recovery | €7.223 | 1.2099 | 81.74% | 99.35% |
| Festival Push | €9.369 | 1.0109 | 78.29% | 99.10% |
| Chaos Tour | €9.465 | 0.5743 | 61.19% | 93.97% |
| Cult Hypergrowth | €9.723 | 0.3811 | 58.64% | 84.78% |
| No Social (Fame 0-50) | €8.569 | 0.5313 | 61.49% | 88.95% |
| High Controversy | €9.362 | 0.5909 | 63.23% | 90.87% |
| Early Game Probe (Fame 0–50) | €4.632 | 0.4146 | 30.37% | 50.14% |
| Mid Game Probe (Fame 60–150) | €7.135 | 0.5073 | 47.36% | 78.12% |
| Late Game Probe (Fame 175+) | €9.552 | 0.3286 | 49.09% | 68.69% |

## Feature-Inventar

| Feature | Anzahl Verfügbar |
|---|---:|
| venuesAvailable | 45 |
| eventsAvailable | 164 |
| brandDealsAvailable | 54 |
| postOptionsAvailable | 36 |
| contrabandItemsAvailable | 37 |
| upgradesAvailable | 67 |
| socialPlatformsAvailable | 4 |
| trendsAvailable | 5 |
| songsAvailable | 7 |
| questsAvailable | 32 |
| assetChassisAvailable | 8 |
| assetModulesAvailable | 63 |
| loanProfilesAvailable | 5 |

## Ausführungsabdeckung (Coverage)

| Feature | Covered | Evaluations / Attempts | Activations / Successes | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 143757 | 2313 | 51 |
| postOptions | ❌ | 0 | 0 | 0 |
| socialTrends | ✅ | 178575 | 21286 | 5 |
| contraband | ✅ | 178575 | 19670 | 37 |
| minigamesTravel | ✅ | 0 | 73531 | - |
| minigamesRoadie | ✅ | 0 | 24386 | - |
| minigamesKabelsalat | ✅ | 0 | 24570 | - |
| minigamesAmp | ✅ | 0 | 24575 | - |
| sponsorship | ❌ | 0 | 0 | - |
| restStops | ✅ | 0 | 14605 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €54.490 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 799.13 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 88.08% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €593 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 814.43 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 2.31% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €24.340 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 955.62 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 37.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €5.970 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 893.53 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 27.69% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.268 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1031.16 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 7.69% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.481 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 808.14 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 0.77% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €25.512 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 963.49 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | 0.39% | €-1.464 | 10.68 | 0.52 |
| Bootstrap Struggle | 0.39% | €-58 | -2.41 | -0.03 |
| Aggressive Marketing | 0.77% | €911 | -15.71 | 0.43 |
| Scandal Recovery | -0.39% | €-378 | 15.11 | 0 |
| Festival Push | 1.92% | €-9 | 16.49 | -0.07 |
| Chaos Tour | 2.31% | €-60 | -8.55 | -0.2 |
| Cult Hypergrowth | -0.38% | €-436 | 17.84 | -0.04 |
| No Social (Fame 0-50) | 0% | €0 | 0 | 0 |
| High Controversy | -1.16% | €-315 | 2.05 | -0.25 |
| Early Game Probe (Fame 0–50) | 0% | €197 | -3.99 | 0 |
| Mid Game Probe (Fame 60–150) | 1.16% | €79 | -10.65 | -0.1 |
| Late Game Probe (Fame 175+) | 0% | €45 | -6.36 | 0.13 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 88.08% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €54.490 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.24 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
