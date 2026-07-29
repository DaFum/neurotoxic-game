# Produktionsvalidierung der First-Income-Kadenz (Phase 5B)

Erzeugt: 2026-07-29T07:39:05.933Z
Runs pro Szenario: 2000
Seed-Namensraum: `#production-cadence-validation-v1`

## Vorab festgelegter Vergleich

- Kontrolle: `gap-aligned`
- Produktionskandidat: `first-income`
- Economy-Tuning: unverändert

| Szenario | Insolvenz Kontrolle | Insolvenz Kandidat | Δ Fame/Gig (spielende Runs) | Δ solventes Endgeld | Δ Finale erreicht | Δ Insolvenz vor erstem Gig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `baseline_touring` | 1.9% | 1.9% | 0% | 0% | 0% | 0% |
| `bootstrap_struggle` | 29.6% | 7.95% | -0.15% | 0.92% | 21.75% | -25.45% |
| `aggressive_marketing` | 13.4% | 2.55% | -0.57% | 3.62% | 10.6% | -11.05% |
| `scandal_recovery` | 27.75% | 6.1% | -1.05% | -0.75% | 21.45% | -24% |
| `festival_push` | 24.2% | 3.85% | 0.93% | -3.3% | 20.15% | -22.25% |
| `chaos_tour` | 13.85% | 3.45% | -2.76% | 3.04% | 10.25% | -10.8% |
| `cult_hypergrowth` | 13.45% | 1.85% | 0.76% | 2.74% | 11.75% | -11.55% |

## Entscheidung

Status: **no-production-cadence-recommendation-validation-failed**

Freigabe für Produktion: **nein**

Fehlgeschlagene Gates: `bootstrap_struggle:bankruptcy-corridor`, `cult_hypergrowth:bankruptcy-corridor`

Die Validierung verändert keine Geldwerte. Ein fehlgeschlagenes Gate führt geschlossen zu keiner Produktionsempfehlung; es wird kein Ersatzkandidat auf diesem Seed-Strom gesucht.
