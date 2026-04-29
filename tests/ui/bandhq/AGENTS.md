# tests/ui/bandhq — Agent Instructions

## Scope

Applies to `tests/ui/bandhq/**` except deeper nested scopes.

## Domain Gotchas

- Band HQ UI tests should assert reachable user flows (open tab, perform action, see feedback), not only isolated component render snapshots.
- Mock affordability/ownership/effect payloads with finite numeric values and explicit IDs to mirror runtime sanitization expectations.

## Recent Findings (2026-04)

- Regressions frequently hide in category menu wiring; include assertions that legacy HQ actions remain reachable after navigation refactors.
