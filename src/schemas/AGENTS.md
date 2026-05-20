# src/schemas - Agent Instructions

## Validation Boundaries

- Treat schemas as strict input validation rules for data crossing JSON, storage, or generated-data boundaries.
- Build accepted output from whitelisted fields only. Drop benign unknown fields; reject hostile prototype keys in validators or strip them only in sanitizers that rebuild whitelisted output.

## Prototype Safety

- Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) must stay rejected or stripped at nested object and array levels; security tests assert this.
- If a nested object or array cannot be safely copied while removing hostile keys, reject that value/input instead of preserving or spreading it.

## Value Preservation

- Optional numeric/string fields must preserve valid `0` and `''` values (use `??`, not `||`).
- Add or update security tests when schema hardening changes accepted input.
