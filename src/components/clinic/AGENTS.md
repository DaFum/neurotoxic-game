# src/components/clinic — Agent Instructions

## Scope

Applies to `src/components/clinic/**`.

## Domain Gotchas

- Clinic outcomes must communicate actual applied deltas after clamps (not requested values), especially when money/harmony/stamina are bounded.
- Validation for treatment payloads should reject non-finite numeric values before rendering or dispatching purchase/effect actions.

## Recent Findings (2026-04)

- Clinic UI regressions often come from mismatched affordability checks between UI and action creators; keep checks aligned with economy helpers.
