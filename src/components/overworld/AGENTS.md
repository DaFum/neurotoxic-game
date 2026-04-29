# src/components/overworld — Agent Instructions

## Scope

Applies to `src/components/overworld/**`.

## Agent purpose / limitations / usage

### Agent purpose

- Keep overworld UI flows aligned with canonical action wiring and venue/location identity contracts.

### Limitations

- It cannot infer backend identity drift: preserve legacy action keys and canonical location/venue IDs in UI logic to avoid action-key drift and mislabeled destinations.
- It focuses on UI-layer contracts; API/storage invariants still need reducer/data-layer validation.

### When to use

- Use for overworld action-list/menu regrouping, location/venue selector updates, and any change where action keys or canonical IDs are touched.
- Avoid relying on it alone for persistence/API migrations; pair with reducer/data guidance when backend shapes change.

## Domain Gotchas

- Overworld action lists must preserve legacy entry-point reachability; removing a visible button without removing the backing hook/action creates dead flows.
- Treat location/venue IDs as canonical IDs, not display names; UI comparisons should use normalized IDs.

## Recent Findings (2026-04)

- Menu regrouping regressions usually come from action-key drift rather than rendering bugs; verify each legacy action key still maps to a live handler.
