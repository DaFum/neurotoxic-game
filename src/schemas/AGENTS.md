# src/schemas - Agent Instructions

## Scope

Applies to `src/schemas/**`.

## What agents do / Limitations

Schema agents maintain boundary validators and typed schema contracts using whitelist-only fields, prototype-pollution stripping, and preservation of valid `0`/`''` values. They must not perform privileged operations, use network access unless explicitly allowed, or log sensitive inputs while narrowing unknown data. Use an agent when hardening a persisted/API payload schema; use a simple function or library helper for local, trusted transformations.

## Rules

- Schemas are boundary contracts. Keep runtime validation and TypeScript types aligned.
- Reject unknown or hostile fields by whitelist, not by spreading parsed records.
- Use `unknown` inputs and narrow before constructing typed objects.
- Add or update security tests when schema hardening changes accepted input.

## Gotchas

- Prototype-pollution keys (`__proto__`, `constructor`, `prototype`) must stay stripped at nested object/array levels.
- Optional numeric/string fields must preserve valid `0` and `''` values.
