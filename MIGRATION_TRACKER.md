# TypeScript Migration Tracker (`@ts-nocheck` Burn-down)

_Last updated: 2026-04-16 (UTC)_

## Baseline (Phase 0)

### Commands and outcomes
- `pnpm run typecheck` → ✅ pass.
- `pnpm run test:all` → ✅ pass.

### Current debt (`src/**/*.{ts,tsx,js,jsx}`)
- `nocheck_count`: **299**
- Guardrail budget (`.ci/ts-nocheck-budget.json`): **299** (must not increase)

## Domain breakdown (baseline)

| Domain | `@ts-nocheck` files |
|---|---:|
| `src/components/**` | 61 |
| `src/ui/**` | 45 |
| `src/utils/**` (excluding audio) | 44 |
| `src/scenes/kabelsalat/**` | 31 |
| `src/scenes/**` (excluding kabelsalat) | 27 |
| `src/data/**` | 25 |
| `src/hooks/**` (excluding rhythm/minigames) | 20 |
| `src/utils/audio/**` | 19 |
| `src/context/**` | 15 |
| `src/hooks/rhythmGame/**` | 5 |
| `src/hooks/minigames/**` | 4 |
| `src/*` root files | 3 |
| **Total** | **299** |

## Burn-down targets by phase

| Phase | Focus | Target max `nocheck_count` | Expected delta |
|---|---|---:|---:|
| Phase 0 | Baseline + tracker + guardrail | 299 | 0 |
| Phase 1 | Shared types/contracts (`src/types`) | 285 | -14 |
| Phase 2 | State layer (`src/context`) | 250 | -35 |
| Phase 3 | Utils + audio | 200 | -50 |
| Phase 4 | Hooks + UI/components | 110 | -90 |
| Phase 5 | Scenes + entry points | 20 | -90 |
| Phase 6 | Enforcement/exit (`src` at zero) | 0 | -20 |

## Guardrail policy

- CI runs `pnpm run guard:nocheck` on PR/push in `.github/workflows/test.yml`.
- `guard:nocheck` fails when `@ts-nocheck` count in `src` exceeds the configured budget.
- Each migration PR must reduce `.ci/ts-nocheck-budget.json` `max` by at least the number of removed files in that PR.
