# src/components/hud — Agent Instructions

## Scope

Applies to `src/components/hud/**`.

## What / Limitations / When to use

- **What:** Use this agent for HUD display/interaction work (status labels, shortcut actions, grouped HUD menu composition).
- **Limitations:** HUD components are presentation-first: they should not mutate reducer/scene state directly, and bounded values (`money`, `stamina`, `harmony`) must render `0` via explicit nullish-safe checks.
- **When to use:** Attach for HUD shortcut additions, grouped-menu reorganizations, and any action-dispatch-only handler changes where trigger reachability can regress.

## Domain Gotchas

- HUD labels often display live bounded values (money, stamina, harmony); render `0` as valid state and avoid truthy-only guards.
- HUD interactions should dispatch action creators/hooks only; do not mutate scene or reducer state directly from HUD presentation code.

## Recent Findings (2026-04)

- Reachability regressions in grouped menus frequently show up first in HUD shortcuts; preserve every existing trigger path when reorganizing HUD actions.
