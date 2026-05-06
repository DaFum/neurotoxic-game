# src/schemas - Agent Instructions

## Scope

Applies to `src/schemas/**`.

## Rules

- Schemas are boundary contracts. Keep runtime validation and TypeScript types aligned.
- Reject unknown or hostile fields by whitelist, not by spreading parsed records.
- Use `unknown` inputs and narrow before constructing typed objects.
- Add or update security tests when schema hardening changes accepted input.

## Gotchas

- Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) must stay stripped at nested object/array levels.
- Optional numeric/string fields must preserve valid `0` and `''` values.
