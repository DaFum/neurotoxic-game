# src/components/overworld — Agent Instructions

## Scope

Applies to `src/components/overworld/**`.

## Domain Gotchas

- Overworld action lists must preserve legacy entry-point reachability; removing a visible button without removing the backing hook/action creates dead flows.
- Treat location/venue IDs as canonical IDs, not display names; UI comparisons should use normalized IDs.

## Recent Findings (2026-04)

- Menu regrouping regressions usually come from action-key drift rather than rendering bugs; verify each legacy action key still maps to a live handler.
