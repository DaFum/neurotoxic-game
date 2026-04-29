# src/components/hud — Agent Instructions

## Scope

Applies to `src/components/hud/**`.

## Domain Gotchas

- HUD labels often display live bounded values (money, stamina, harmony); render `0` as valid state and avoid truthy-only guards.
- HUD interactions should dispatch action creators/hooks only; do not mutate scene or reducer state directly from HUD presentation code.

## Recent Findings (2026-04)

- Reachability regressions in grouped menus frequently show up first in HUD shortcuts; preserve every existing trigger path when reorganizing HUD actions.
