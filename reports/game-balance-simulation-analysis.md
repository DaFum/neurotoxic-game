# Game Balance Simulation – Analyse

Erstellt am: 2026-07-26T21:28:35.356Z

## Reproduzierbarkeit

- Report-Version: 11
- Node-Version: v22.22.2
- Basis-Commit: 7aaf9aabb97ca3a2ecb3cb503ec18e65a06302e7
- Working Tree Dirty: Ja
- Simulationsskript SHA-256: 45fd941286f64d33838fad21214a7258590d64a338d8746542f90e3d614288de
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
| Baseline Touring | €500 | 0 | €55.977 | 61.87% | 0.1 | 2.8% | 22397 | 10 | 39 | 12.7 | 60.04 | 6.55 | 0.38% | €2.504 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Bootstrap Struggle | €500 | 0 | €582 | 91.23% | 0.25 | 1.4% | 1155 | 2 | 56 | 1.47 | 4.19 | 2.49 | 87.69% | €1.142 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Aggressive Marketing | €500 | 0 | €23.793 | 59.02% | 0.11 | 3.5% | 9840 | 7 | 55 | 6.19 | 29.3 | 5.88 | 1.92% | €2.737 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Scandal Recovery | €500 | 0 | €6.071 | 82.54% | 0.17 | 2% | 3179 | 3 | 54 | 2.28 | 13.38 | 4.47 | 38.08% | €1.957 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Festival Push | €500 | 0 | €9.046 | 78.21% | 0.14 | 3.5% | 4160 | 4 | 55 | 1.83 | 14.57 | 4.77 | 29.23% | €2.400 | ⚠️ Deutliches Insolvenzrisiko – Early-Game-Puffer oder Kostenstruktur prüfen. |
| Chaos Tour | €500 | 0 | €16.726 | 62.47% | 0.14 | 2.1% | 5944 | 5 | 42 | 3.58 | 26.44 | 5.74 | 6.92% | €2.289 | ✅ Szenario liegt im robusten Simulationskorridor. |
| Cult Hypergrowth | €500 | 0 | €25.261 | 59.59% | 0.1 | 4% | 8412 | 6 | 54 | 5.29 | 29.53 | 5.79 | 1.15% | €2.846 | ✅ Szenario liegt im robusten Simulationskorridor. |
| No Social (Fame 0-50) | €500 | 0 | €16.129 | 61.49% | 0.14 | 1.5% | 8843 | 6 | 50 | 0 | 27.87 | 5.51 | 5% | €2.138 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| High Controversy | €500 | 0 | €15.570 | 64.62% | 0.14 | 1.7% | 6256 | 5 | 52 | 14.05 | 25.99 | 5.23 | 9.23% | €1.976 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Early Game Probe (Fame 0–50) | €500 | 0 | €10.998 | 31.86% | 0.13 | 1.5% | 3149 | 3 | 42 | 5.35 | 9.09 | 2.49 | 0.77% | €2.045 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Mid Game Probe (Fame 60–150) | €1.500 | 60 | €13.945 | 47.24% | 0.15 | 1.8% | 4285 | 4 | 48 | 4.57 | 15.68 | 5.01 | 1.15% | €2.287 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |
| Late Game Probe (Fame 175+) | €5.000 | 175 | €29.898 | 47.76% | 0.1 | 3% | 10661 | 7 | 38 | 11.33 | 25.86 | 5.18 | 0% | €2.664 | ⚪ Szenario besitzt keine KPI-Zieldefinition. |

## Wirtschaft im Detail

| Szenario | Ø Peak-Geld | Ø Tiefstkurs | Ø Gig-Netto | Ø Sponsor-Payouts | Ø Brand Deals | Ø Upgrades (HQ+Van) | Ø Refuels | Ø Repairs | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | €59.158 | €498 | €2.504 | 6.9 | 2.27 | 21.19 | 7.97 | 11.78 | ⚠️ Hohe Wartungskosten – Van-Disziplin und Modifier-Effizienz prüfen. |
| Bootstrap Struggle | €3.957 | €83 | €1.142 | 0.14 | 0.13 | 2.61 | 0.3 | 1.64 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Aggressive Marketing | €31.367 | €401 | €2.737 | 3 | 1.3 | 16.54 | 4.19 | 7.73 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Scandal Recovery | €10.931 | €224 | €1.957 | 0.86 | 0.47 | 8.87 | 1.73 | 4.79 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Festival Push | €14.585 | €250 | €2.400 | 0.88 | 0.45 | 10.48 | 1.94 | 4.94 | ⚠️ Kritische Liquiditätslücken – Kostenreserve erhöhen. |
| Chaos Tour | €22.340 | €385 | €2.289 | 2.38 | 1.04 | 14.11 | 3.49 | 7.28 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Cult Hypergrowth | €33.156 | €408 | €2.846 | 2.92 | 1.21 | 17.28 | 4.14 | 7.35 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| No Social (Fame 0-50) | €21.811 | €379 | €2.138 | 0 | 0 | 15.13 | 3.89 | 7.56 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| High Controversy | €20.196 | €310 | €1.976 | 2.32 | 1.08 | 13.97 | 3.66 | 7.05 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Early Game Probe (Fame 0–50) | €12.680 | €398 | €2.045 | 0.33 | 0.19 | 3.86 | 1.02 | 1.97 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Mid Game Probe (Fame 60–150) | €18.057 | €1.343 | €2.287 | 0.8 | 0.4 | 8.09 | 2.12 | 3.96 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |
| Late Game Probe (Fame 175+) | €39.239 | €4.982 | €2.664 | 1.5 | 0.52 | 8.8 | 3.57 | 4.63 | ✅ Ausgewogenes Einnahmen-Ausgaben-Profil. |

## Kapital-Progressionskurve

| Szenario | Ø Geld Tag 20 | Ø Geld Tag 40 | Ø Geld Tag 60 | Ø Endgeld | Bewertung |
|---|---:|---:|---:|---:|---|
| Baseline Touring | €25.037 | €29.240 | €40.398 | €55.977 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Bootstrap Struggle | €2.458 | €956 | €639 | €582 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Aggressive Marketing | €12.898 | €15.988 | €20.165 | €23.793 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Scandal Recovery | €5.993 | €4.910 | €4.737 | €6.071 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Festival Push | €8.379 | €6.952 | €7.004 | €9.046 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Chaos Tour | €9.811 | €11.364 | €14.195 | €16.726 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Cult Hypergrowth | €13.976 | €18.124 | €21.102 | €25.261 | ✅ Kapitalaufbau im erwarteten Korridor. |
| No Social (Fame 0-50) | €10.233 | €11.236 | €13.816 | €16.129 | ✅ Kapitalaufbau im erwarteten Korridor. |
| High Controversy | €7.030 | €9.366 | €12.789 | €15.570 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Early Game Probe (Fame 0–50) | €9.759 | — | — | €10.998 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Mid Game Probe (Fame 60–150) | €11.792 | €13.027 | — | €13.945 | ✅ Kapitalaufbau im erwarteten Korridor. |
| Late Game Probe (Fame 175+) | €27.125 | — | — | €29.898 | ✅ Kapitalaufbau im erwarteten Korridor. |

## Einkommensstruktur & Sink-Analyse

| Szenario | Ø Gig-Netto | Ø Reisekosten/Gig | Netto/Reise-Ratio | Gigs f. HQ-Upgrade | Gigs f. Van-Upgrade | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | €2.504 | €98 | 25.8× | 9.98 | 0.6 | ✅ Einkommensstruktur akzeptabel. |
| Bootstrap Struggle | €1.142 | €56 | 31.8× | 21.89 | 1.31 | ✅ Einkommensstruktur akzeptabel. |
| Aggressive Marketing | €2.737 | €89 | 31× | 9.13 | 0.55 | ✅ Einkommensstruktur akzeptabel. |
| Scandal Recovery | €1.957 | €69 | 30.6× | 12.77 | 0.77 | ✅ Einkommensstruktur akzeptabel. |
| Festival Push | €2.400 | €75 | 34.1× | 10.42 | 0.63 | ✅ Einkommensstruktur akzeptabel. |
| Chaos Tour | €2.289 | €83 | 27.8× | 10.92 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Cult Hypergrowth | €2.846 | €89 | 32.2× | 8.78 | 0.53 | ✅ Einkommensstruktur akzeptabel. |
| No Social (Fame 0-50) | €2.138 | €84 | 25.5× | 11.69 | 0.7 | ✅ Einkommensstruktur akzeptabel. |
| High Controversy | €1.976 | €80 | 26.1× | 12.65 | 0.76 | ✅ Einkommensstruktur akzeptabel. |
| Early Game Probe (Fame 0–50) | €2.045 | €72 | 28.5× | 12.22 | 0.73 | ✅ Einkommensstruktur akzeptabel. |
| Mid Game Probe (Fame 60–150) | €2.287 | €83 | 27.6× | 10.93 | 0.66 | ✅ Einkommensstruktur akzeptabel. |
| Late Game Probe (Fame 175+) | €2.664 | €96 | 27.9× | 9.38 | 0.56 | ✅ Einkommensstruktur akzeptabel. |

## Gig-Performance-Kalibrierung

| Szenario | Ø Hit-Window (ms) | Ø Misses/Gig | Ø Score | Score <50% | Score 50–70% | Score >70% | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 153 | 8.5 | 50 | 51.3% | 43% | 5.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Bootstrap Struggle | 152 | 8.5 | 54 | 49.5% | 42.9% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Aggressive Marketing | 153 | 7.9 | 53 | 38.8% | 51.6% | 9.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Scandal Recovery | 158 | 8.2 | 52 | 46.4% | 45% | 8.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Festival Push | 153 | 7.2 | 57 | 27.7% | 56.4% | 15.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Chaos Tour | 153 | 9.2 | 46 | 64.1% | 32.7% | 3.3% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Cult Hypergrowth | 153 | 7.9 | 53 | 38.3% | 54.3% | 7.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| No Social (Fame 0-50) | 153 | 8.7 | 49 | 54.3% | 40.8% | 4.9% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| High Controversy | 153 | 8.6 | 50 | 54.1% | 40.3% | 5.7% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Early Game Probe (Fame 0–50) | 152 | 8.4 | 51 | 48.2% | 44.4% | 7.5% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Mid Game Probe (Fame 60–150) | 158 | 8.6 | 50 | 48.7% | 46.9% | 4.4% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |
| Late Game Probe (Fame 175+) | 158 | 8.3 | 51 | 48.2% | 44.2% | 7.6% | ✅ Gig-Performance im erwarteten Kalibrierungsbereich. |

## Bandgesundheit im Detail

| Szenario | Ø Endharmony | Ø Clinic-Besuche | Ø Sponsor-Signings | Ø Sponsor-Drops | Ø Kontraband-Drops | Ø Post Pulses | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 39 | 6.55 | 1.78 | 0.6 | 8.23 | 11.06 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Bootstrap Struggle | 56 | 2.49 | 0.1 | 0.08 | 3.26 | 0.83 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Aggressive Marketing | 55 | 5.88 | 1.03 | 0.53 | 8.15 | 5.35 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Scandal Recovery | 54 | 4.47 | 0.4 | 0.27 | 7.15 | 2.56 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Festival Push | 55 | 4.77 | 0.36 | 0.22 | 7.26 | 2.53 | ✅ Stabile Bandgesundheit mit niedrigem Erholungsbedarf. |
| Chaos Tour | 42 | 5.74 | 0.83 | 0.42 | 8.3 | 4.54 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Cult Hypergrowth | 54 | 5.79 | 0.95 | 0.42 | 8.5 | 5.21 | ✅ Bandgesundheit im akzeptablen Bereich. |
| No Social (Fame 0-50) | 50 | 5.51 | 0 | 0 | 8.23 | 0 | ✅ Bandgesundheit im akzeptablen Bereich. |
| High Controversy | 52 | 5.23 | 0.84 | 0.47 | 7.71 | 4.48 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Early Game Probe (Fame 0–50) | 42 | 2.49 | 0.16 | 0.03 | 2.1 | 1.68 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |
| Mid Game Probe (Fame 60–150) | 48 | 5.01 | 0.34 | 0.16 | 4.37 | 2.72 | ✅ Bandgesundheit im akzeptablen Bereich. |
| Late Game Probe (Fame 175+) | 38 | 5.18 | 0.45 | 0.08 | 3.26 | 4.48 | ⚠️ Harmonie unter Sollwert – Recovery-Events stärken. |

## Events & Social im Detail

| Szenario | Ø Special-Events | Ø Cash-Events | Ø Band-Events | Ø Equipment-Events | Ø Gig-Events | Ø Trend-Shifts | Ø Katalog-Upgrades | Bewertung |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Baseline Touring | 1.05 | 1.58 | 1.47 | 0.9 | 4.1 | 8.86 | 29.63 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Bootstrap Struggle | 0.55 | 0.91 | 0.8 | 0.08 | 0.36 | 3.5 | 4.66 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Aggressive Marketing | 1.82 | 2.75 | 2.79 | 0.68 | 3.41 | 8.92 | 24.33 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Scandal Recovery | 1.67 | 3 | 2.79 | 0.43 | 1.98 | 7.44 | 14.49 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Festival Push | 0.97 | 1.68 | 1.52 | 0.18 | 1 | 8.1 | 16.83 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Chaos Tour | 2.7 | 4.35 | 4.34 | 1.05 | 4.86 | 8.74 | 21.68 | ⚠️ Hohe Event-Dichte – Chaos-Faktor vs. Spielkontrolle abwägen. |
| Cult Hypergrowth | 1.65 | 2.42 | 2.4 | 0.61 | 2.98 | 8.84 | 25.18 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| No Social (Fame 0-50) | 1.37 | 2.1 | 2.25 | 0.53 | 2.49 | 9.03 | 22.97 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| High Controversy | 1.4 | 2.27 | 2.07 | 0.43 | 2.67 | 8.11 | 21 | ✅ Gute Upgrade-Progression – wirtschaftliche Entwicklung stabil. |
| Early Game Probe (Fame 0–50) | 0.23 | 0.4 | 0.43 | 0.09 | 0.58 | 2.35 | 5.68 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Mid Game Probe (Fame 60–150) | 0.59 | 1.02 | 1.01 | 0.26 | 1.14 | 4.71 | 12.48 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |
| Late Game Probe (Fame 175+) | 0.62 | 0.86 | 0.91 | 0.6 | 2.53 | 3.45 | 12.35 | ⚠️ Geringe Event-Dichte – Spielwelt wirkt möglicherweise statisch. |

## Minigame-Abdeckung im Detail

| Szenario | Ø Travel-Games | Ø Roadie-Games | Ø Kabelsalat-Games | Ø Amp-Calibration | Gesamt Minigames | Bewertung |
|---|---:|---:|---:|---:|---:|---|
| Baseline Touring | 60.04 | 19.77 | 20.22 | 20.06 | 120.09 | ✅ Gute Minigame-Frequenz – ausreichend Spielinteraktion. |
| Bootstrap Struggle | 4.19 | 1.4 | 1.44 | 1.35 | 8.38 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Aggressive Marketing | 29.3 | 9.58 | 9.88 | 9.85 | 58.61 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Scandal Recovery | 13.38 | 4.46 | 4.41 | 4.51 | 26.76 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Festival Push | 14.57 | 5.01 | 4.83 | 4.73 | 29.14 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Chaos Tour | 26.44 | 8.71 | 8.91 | 8.82 | 52.88 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Cult Hypergrowth | 29.53 | 9.82 | 9.92 | 9.79 | 59.06 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| No Social (Fame 0-50) | 27.87 | 9.07 | 9.45 | 9.36 | 55.75 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| High Controversy | 25.99 | 8.55 | 8.76 | 8.68 | 51.98 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |
| Early Game Probe (Fame 0–50) | 9.09 | 3.05 | 2.95 | 3.09 | 18.18 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Mid Game Probe (Fame 60–150) | 15.68 | 5.14 | 5.34 | 5.2 | 31.36 | ⚠️ Geringe Minigame-Aktivität – Spieltiefe möglicherweise eingeschränkt. |
| Late Game Probe (Fame 175+) | 25.86 | 8.68 | 8.47 | 8.72 | 51.73 | ✅ Moderate Minigame-Nutzung – entsprechend Szenario-Intensität. |

## Assets & Progression

| Szenario | Ø Chassis-Käufe | Ø Kredite | Ø Module | Ø Crowdfunds | Ø End-Assets | Ø Trait-Unlocks | Ø Klinik-Ausgaben | Ø Rest-Stops | Region-Rep-Runs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 3.04 | 0.33 | 6.77 | 0.91 | 3.66 | 4.85 | €3.319 | 6.43 | 100% |
| Bootstrap Struggle | 0.26 | 0.16 | 0.56 | 0.81 | 0.53 | 0.96 | €1.020 | 2.02 | 65.4% |
| Aggressive Marketing | 2.78 | 0.73 | 6.23 | 1.04 | 3.43 | 2.98 | €2.870 | 5.6 | 100% |
| Scandal Recovery | 1.13 | 0.61 | 2.99 | 1.42 | 1.92 | 2.4 | €1.862 | 6.25 | 93.5% |
| Festival Push | 1.65 | 0.8 | 4.13 | 1.28 | 2.37 | 1.5 | €2.045 | 6.2 | 98.5% |
| Chaos Tour | 2.4 | 0.9 | 5.8 | 1.15 | 3.14 | 3.14 | €2.689 | 7.08 | 96.9% |
| Cult Hypergrowth | 2.75 | 0.58 | 6.25 | 1.12 | 3.44 | 3.79 | €2.850 | 5.68 | 100% |
| No Social (Fame 0-50) | 2.31 | 0.9 | 5.44 | 1.31 | 3.11 | 2.68 | €2.548 | 6.97 | 98.1% |
| High Controversy | 2.07 | 0.82 | 4.83 | 1.2 | 2.82 | 3.38 | €2.382 | 7.15 | 97.7% |
| Early Game Probe (Fame 0–50) | 0.68 | 0.32 | 0.57 | 0.52 | 0.82 | 1.63 | €847 | 0.01 | 93.5% |
| Mid Game Probe (Fame 60–150) | 1.83 | 0.63 | 2.68 | 0.89 | 2.33 | 2.33 | €2.244 | 2.91 | 96.5% |
| Late Game Probe (Fame 175+) | 2.16 | 0.27 | 2.66 | 0.6 | 2.48 | 2.79 | €2.500 | 0.72 | 100% |

## Cross-Szenario-Vergleich (Höchstwerte)

| Metrik | Gewinner | Wert | Bewertung |
|---|---|---:|---|
| Höchstes Ø Endgeld | **Baseline Touring** | €55.977 | Tägliches Gigging dominiert als Einnahmestrategie. |
| Höchstes Ø Endfame | **Baseline Touring** | 22397 | Fokus auf Touring und Performance maximiert den Fame-Aufbau. |
| Höchste Insolvenzrate | **Bootstrap Struggle** | 87.69% | Erwartetes Risikoprofil für ressourcenarme Spielweisen. |
| Höchster Ø Gig-Netto | **Cult Hypergrowth** | €2.846 | Promo-fokussierte Builds maximieren den Einzel-Gig-Ertrag. |
| Höchstes Ø Peak-Geld | **Baseline Touring** | €59.158 | Liquiditätsmaximierung durch hohe Gig-Dichte und Disziplin. |
| Meiste Ø Gigs | **Baseline Touring** | 60.04 | Gig-Frequenz ist direkt mit dem Tourstil verknüpft – korrektes Pacing. |
| Meiste Ø Events | **Chaos Tour** | 17.30 | Chaotische Spielweisen triggern signifikant mehr Zufallsereignisse. |

## Fame-Bilanz

| Szenario | Verdient | Brutto Ausgegeben | Rückerstattet | Netto Ausgegeben | Verloren | Clamp-Anpassung | Reconciled Runs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline Touring | 48112 | 25902 | 0 | 25902 | 45 | 231.55 | 260/260 |
| Bootstrap Struggle | 3343 | 2196 | 0 | 2196 | 8 | 15.73 | 260/260 |
| Aggressive Marketing | 29133 | 19498 | 0 | 19498 | 17 | 221.38 | 260/260 |
| Scandal Recovery | 11933 | 8802 | 0 | 8802 | 17 | 65.7 | 260/260 |
| Festival Push | 15142 | 11077 | 0 | 11077 | 10 | 104.95 | 260/260 |
| Chaos Tour | 21773 | 15945 | 0 | 15945 | 45 | 160.91 | 260/260 |
| Cult Hypergrowth | 28249 | 19961 | 0 | 19961 | 17 | 141.35 | 260/260 |
| No Social (Fame 0-50) | 26295 | 17572 | 0 | 17572 | 32 | 151.98 | 260/260 |
| High Controversy | 22078 | 15946 | 0 | 15946 | 28 | 151.32 | 260/260 |
| Early Game Probe (Fame 0–50) | 7510 | 4393 | 0 | 4393 | 9 | 40.73 | 260/260 |
| Mid Game Probe (Fame 60–150) | 13440 | 9299 | 0 | 9299 | 15 | 98.91 | 260/260 |
| Late Game Probe (Fame 175+) | 20563 | 10160 | 0 | 10160 | 19 | 101.12 | 260/260 |

## Ergebnisverteilungen

*(Zeigt Mittelwert, Median, StdDev, P10, P90 für Endgeld über alle Runs)*
| Szenario | Mean | Median | StdDev | P10 | P90 |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | €55.977 | €56.040 | €19.565 | €31.992 | €81.949 |
| Bootstrap Struggle | €582 | €0 | €2.041 | €0 | €1.323 |
| Aggressive Marketing | €23.793 | €23.387 | €9.776 | €10.727 | €36.289 |
| Scandal Recovery | €6.071 | €3.663 | €6.964 | €0 | €16.869 |
| Festival Push | €9.046 | €7.671 | €8.829 | €0 | €21.500 |
| Chaos Tour | €16.726 | €16.774 | €9.414 | €3.886 | €29.346 |
| Cult Hypergrowth | €25.261 | €24.830 | €9.755 | €12.914 | €36.200 |
| No Social (Fame 0-50) | €16.129 | €15.021 | €8.569 | €5.131 | €27.560 |
| High Controversy | €15.570 | €15.385 | €9.585 | €1.375 | €28.539 |
| Early Game Probe (Fame 0–50) | €10.998 | €10.341 | €4.628 | €5.647 | €17.241 |
| Mid Game Probe (Fame 60–150) | €13.945 | €13.405 | €6.790 | €5.423 | €22.730 |
| Late Game Probe (Fame 175+) | €29.898 | €29.226 | €9.582 | €18.235 | €40.877 |

## Insolvenzrisiko

| Szenario | Insolvenzfälle | Stichprobe | Rate | Lower 95% (Wilson) | Upper 95% (Wilson) |
|---|---:|---:|---:|---:|---:|
| Baseline Touring | 1 | 260 | 0.38% | 0.07% | 2.15% |
| Bootstrap Struggle | 228 | 260 | 87.69% | 83.14% | 91.15% |
| Aggressive Marketing | 5 | 260 | 1.92% | 0.82% | 4.42% |
| Scandal Recovery | 99 | 260 | 38.08% | 32.39% | 44.11% |
| Festival Push | 76 | 260 | 29.23% | 24.04% | 35.03% |
| Chaos Tour | 18 | 260 | 6.92% | 4.42% | 10.68% |
| Cult Hypergrowth | 3 | 260 | 1.15% | 0.39% | 3.34% |
| No Social (Fame 0-50) | 13 | 260 | 5.00% | 2.94% | 8.37% |
| High Controversy | 24 | 260 | 9.23% | 6.28% | 13.37% |
| Early Game Probe (Fame 0–50) | 2 | 260 | 0.77% | 0.21% | 2.76% |
| Mid Game Probe (Fame 60–150) | 3 | 260 | 1.15% | 0.39% | 3.34% |
| Late Game Probe (Fame 175+) | 0 | 260 | 0.00% | 0.00% | 1.46% |

## Populationen

| Szenario | Alle Runs (Size / Endgeld Mean) | Solvente Runs (Size / Endgeld Mean) | Insolvente Runs (Size / Endgeld Mean) |
|---|---|---|---|
| Baseline Touring | 260 / €55.977 | 259 / €56.193 | 1 / €0 |
| Bootstrap Struggle | 260 / €582 | 32 / €4.733 | 228 / €0 |
| Aggressive Marketing | 260 / €23.793 | 255 / €24.259 | 5 / €0 |
| Scandal Recovery | 260 / €6.071 | 161 / €9.804 | 99 / €0 |
| Festival Push | 260 / €9.046 | 184 / €12.782 | 76 / €0 |
| Chaos Tour | 260 / €16.726 | 242 / €17.970 | 18 / €0 |
| Cult Hypergrowth | 260 / €25.261 | 257 / €25.556 | 3 / €0 |
| No Social (Fame 0-50) | 260 / €16.129 | 247 / €16.978 | 13 / €0 |
| High Controversy | 260 / €15.570 | 236 / €17.153 | 24 / €0 |
| Early Game Probe (Fame 0–50) | 260 / €10.998 | 258 / €11.083 | 2 / €0 |
| Mid Game Probe (Fame 60–150) | 260 / €13.945 | 257 / €14.107 | 3 / €0 |
| Late Game Probe (Fame 175+) | 260 / €29.898 | 260 / €29.898 | 0 / €0 |

## Volatilität

| Szenario | Endgeld StdDev | CV (Endgeld) | Max Drawdown Mean | Max Drawdown P90 |
|---|---:|---:|---:|---:|
| Baseline Touring | €19.565 | 0.3495 | 61.87% | 75.92% |
| Bootstrap Struggle | €2.041 | 3.5069 | 91.23% | 99.45% |
| Aggressive Marketing | €9.776 | 0.4109 | 59.02% | 84.75% |
| Scandal Recovery | €6.964 | 1.1471 | 82.54% | 99.11% |
| Festival Push | €8.829 | 0.976 | 78.21% | 99.34% |
| Chaos Tour | €9.414 | 0.5628 | 62.47% | 93.54% |
| Cult Hypergrowth | €9.755 | 0.3862 | 59.59% | 83.05% |
| No Social (Fame 0-50) | €8.569 | 0.5313 | 61.49% | 88.95% |
| High Controversy | €9.585 | 0.6156 | 64.62% | 90.53% |
| Early Game Probe (Fame 0–50) | €4.628 | 0.4208 | 31.86% | 52.03% |
| Mid Game Probe (Fame 60–150) | €6.790 | 0.4869 | 47.24% | 75.45% |
| Late Game Probe (Fame 175+) | €9.582 | 0.3205 | 47.76% | 67.67% |

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
| assetChassisAvailable | 24 |
| assetModulesAvailable | 63 |
| loanProfilesAvailable | 5 |

## Ausführungsabdeckung (Coverage)

| Feature | Covered | Evaluations / Attempts | Activations / Completions | Unique IDs Seen |
|---|---|---:|---:|---:|
| brandDeals | ✅ | 143879 | 2359 | 53 |
| postOptions | ✅ | 11815 | 11815 | 28 |
| socialTrends | ✅ | 178610 | 21334 | 5 |
| contraband | ✅ | 178610 | 19895 | 37 |
| minigamesTravel | ✅ | 73308 | 73308 | - |
| minigamesRoadie | ✅ | 24239 | 24239 | - |
| minigamesKabelsalat | ✅ | 24590 | 24590 | - |
| minigamesAmp | ✅ | 24479 | 24479 | - |
| sponsorship | ✅ | 159546 | 1885 | - |
| restStops | ✅ | 94603 | 14822 | - |

## KPI-Zielkorridore (Health Check)

Zieldefinition: Insolvenz, Endgeld und Fame-Fortschritt pro Gig je Szenario (kalibriert auf 75-Tage-Lauf).

| Szenario | KPI | Ziel | Ist-Wert | Status | Bewertung |
|---|---|---|---|---|---|
| Baseline Touring | Insolvenzrate | ≤ 10% | 0.38% | ✅ | Solide – deutlich unter Risikogrenze. |
| Baseline Touring | Endgeld | €25.000 – €80.000 | €55.977 | ✅ | Zentral im Zielband – sehr gute Balance. |
| Baseline Touring | Fame-Fortschritt/Gig | 600 – 1300 | 798.88 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Insolvenzrate | ≤ 60% | 87.69% | ❌ | Außerhalb Toleranz – Rebalancing nötig. |
| Bootstrap Struggle | Endgeld | €400 – €5.000 | €582 | ✅ | Im Zielband – leicht außermittig. |
| Bootstrap Struggle | Fame-Fortschritt/Gig | 600 – 1300 | 821.27 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Insolvenzrate | ≤ 15% | 1.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Aggressive Marketing | Endgeld | €15.000 – €50.000 | €23.793 | ✅ | Im Zielband – leicht außermittig. |
| Aggressive Marketing | Fame-Fortschritt/Gig | 600 – 1300 | 992.87 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Scandal Recovery | Insolvenzrate | ≤ 50% | 38.08% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Scandal Recovery | Endgeld | €4.500 – €30.000 | €6.071 | ✅ | Im Zielband – leicht außermittig. |
| Scandal Recovery | Fame-Fortschritt/Gig | 600 – 1300 | 883.63 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Festival Push | Insolvenzrate | ≤ 35% | 29.23% | ✅ | Akzeptabel – innerhalb Toleranz. |
| Festival Push | Endgeld | €8.500 – €50.000 | €9.046 | ✅ | Im Zielband – leicht außermittig. |
| Festival Push | Fame-Fortschritt/Gig | 600 – 1300 | 1028.65 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| Chaos Tour | Insolvenzrate | ≤ 25% | 6.92% | ✅ | Solide – deutlich unter Risikogrenze. |
| Chaos Tour | Endgeld | €10.000 – €60.000 | €16.726 | ✅ | Im Zielband – leicht außermittig. |
| Chaos Tour | Fame-Fortschritt/Gig | 600 – 1300 | 826.07 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Insolvenzrate | ≤ 12% | 1.15% | ✅ | Solide – deutlich unter Risikogrenze. |
| Cult Hypergrowth | Endgeld | €15.000 – €50.000 | €25.261 | ✅ | Im Zielband – leicht außermittig. |
| Cult Hypergrowth | Fame-Fortschritt/Gig | 600 – 1300 | 958.65 | ✅ | Zentral im Zielband – Fame-Fortschritt pro Gig stimmig. |
| No Social (Fame 0-50) | — | — | — | ⚪ Nicht bewertet | — |
| High Controversy | — | — | — | ⚪ Nicht bewertet | — |
| Early Game Probe (Fame 0–50) | — | — | — | ⚪ Nicht bewertet | — |
| Mid Game Probe (Fame 60–150) | — | — | — | ⚪ Nicht bewertet | — |
| Late Game Probe (Fame 175+) | — | — | — | ⚪ Nicht bewertet | — |

## Rebalance-Regressionsvergleich (Alt vs Neu)

| Szenario | Δ Insolvenzrate | Δ Endgeld | Δ Fame/Gig | Δ Gigs |
|---|---:|---:|---:|---:|
| Baseline Touring | -0.77% | €-1.108 | 69.49 | -0.08 |
| Bootstrap Struggle | 1.92% | €-281 | 120.04 | -0.54 |
| Aggressive Marketing | -0.39% | €110 | 203.59 | -0.31 |
| Scandal Recovery | -0.77% | €-103 | 121.23 | 0.48 |
| Festival Push | 7.31% | €-1.557 | 193.37 | -0.9 |
| Chaos Tour | 1.54% | €-777 | 157.22 | -0.33 |
| Cult Hypergrowth | -0.39% | €-1.072 | 165.99 | 0.02 |
| No Social (Fame 0-50) | 1.54% | €144 | 235.4 | 0.26 |
| High Controversy | 4.23% | €-1.044 | 151.82 | -1.07 |
| Early Game Probe (Fame 0–50) | -0.77% | €387 | 94.96 | 0.02 |
| Mid Game Probe (Fame 60–150) | 0% | €-840 | 130.29 | -0.2 |
| Late Game Probe (Fame 175+) | 0% | €264 | 48.91 | -0.16 |

## Kurzfazit

- Höchstes Risiko: **Bootstrap Struggle** mit 87.69% Insolvenzrate.
- Höchster Kapitalaufbau: **Baseline Touring** mit Ø €55.977 Endgeld.
- Ereignisdichte: **Chaos Tour** mit Ø 17.30 Event-Impulsen (inkl. Gig-Events).

### KPI-Zusammenfassung
- Bestanden: 6
- Fehlgeschlagen: 1
- Nicht bewertet: 5

- ❌ KPI-Verstöße: Bootstrap Struggle (Insolvenzrate)
- Empfehlung: Balance-Lever für betroffene Szenarien anpassen, dann Simulation erneut ausführen.
