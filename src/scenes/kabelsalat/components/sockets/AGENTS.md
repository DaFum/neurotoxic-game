# src/scenes/kabelsalat/components/sockets - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/sockets/**`.

## Rules

- Preserve literal socket ID/order types with `as const`.
- Keep socket state transitions aligned with the parent kabelsalat hook contract.

## Gotchas

- Socket order widening to `string[]` breaks downstream type narrowing.
