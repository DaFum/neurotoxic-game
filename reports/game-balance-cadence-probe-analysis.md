# Produktionsvalidierung der First-Income-Kadenz (Phase 5B)

Erzeugt: 2026-07-29T21:31:07.060Z
Runs pro Szenario: 2000
Seed-Namensraum: `#production-cadence-validation-v2`

## Vorab festgelegter Vergleich

- Kontrolle: `gap-aligned`
- Produktionskandidat: `first-income`
- Economy-Tuning: unverändert

## Szenarioabdeckung

- Erwartet: `baseline_touring`, `bootstrap_struggle`, `aggressive_marketing`, `scandal_recovery`, `festival_push`, `chaos_tour`, `cult_hypergrowth`
- Ausgewertet: `baseline_touring`, `bootstrap_struggle`, `aggressive_marketing`, `scandal_recovery`, `festival_push`, `chaos_tour`, `cult_hypergrowth`
- Fehlend: keine

| Szenario               | Insolvenz Kontrolle | Insolvenz Kandidat | gepaartes Δ Fame/Gig (n) | gepaartes Δ solventes Endgeld (n) | Δ Finale erreicht | Δ Finale abgeschlossen | Δ blockierte Reise vor erstem Gig | Δ Insolvenz vor erstem Gig |
| ---------------------- | ------------------: | -----------------: | -----------------------: | --------------------------------: | ----------------: | ---------------------: | --------------------------------: | -------------------------: |
| `baseline_touring`     |               1.65% |              1.65% |                0% (1987) |                         0% (1967) |                0% |                     0% |                                0% |                         0% |
| `bootstrap_struggle`   |               30.1% |               8.9% |            -0.09% (1477) |                      0.35% (1344) |            21.05% |                 20.75% |                           -25.25% |                     -25.6% |
| `aggressive_marketing` |              13.45% |              2.55% |               -1% (1765) |                       4.1% (1705) |             10.5% |                  10.5% |                           -10.95% |                     -11.1% |
| `scandal_recovery`     |              27.25% |              8.85% |            -0.74% (1532) |                     -2.41% (1374) |             17.5% |                 17.45% |                           -22.65% |                     -22.9% |
| `festival_push`        |               24.5% |              4.15% |            -1.72% (1543) |                     -0.49% (1473) |             20.4% |                 20.35% |                           -22.05% |                    -22.15% |
| `chaos_tour`           |               15.7% |               3.5% |            -2.24% (1744) |                      2.96% (1659) |            11.95% |                  11.6% |                            -11.8% |                     -11.9% |
| `cult_hypergrowth`     |               13.5% |               2.6% |            -0.38% (1746) |                      3.39% (1709) |            10.85% |                  10.9% |                            -11.4% |                    -11.65% |

## Nicht blockierende Designhinweise

Die Korridore aus `RISK_TARGETS` bleiben Designhypothesen. Sie werden vollständig aus der Live-Konfiguration abgeleitet und blockieren diese Freigabe nicht.

- `baseline_touring`: 1.65% gegenüber 1–5% — **inside**
- `bootstrap_struggle`: 8.9% gegenüber 15–30% — **below**
- `aggressive_marketing`: 2.55% gegenüber 2–8% — **inside**
- `scandal_recovery`: 8.85% gegenüber 8–20% — **inside**
- `festival_push`: 4.15% gegenüber 5–15% — **below**
- `chaos_tour`: 3.5% gegenüber 8–20% — **below**
- `cult_hypergrowth`: 2.6% gegenüber 2–10% — **inside**

## Entscheidung

Status: **production-cadence-validation-passed**

Freigabe für Produktion: **ja**

Fehlgeschlagene Gates: keine

Die Validierung verändert keine Geldwerte. Ein fehlgeschlagenes Gate führt geschlossen zu keiner Produktionsempfehlung; es wird kein Ersatzkandidat auf diesem Seed-Strom gesucht.
