# src/scenes/kabelsalat/components/sockets - Agent Instructions

## IDs

- Preserve literal socket ID/order types with `as const`.
- Socket ID/order mismatches are contract bugs; narrow at the parent hook boundary instead of defaulting inside socket components.

## State Contract

- Keep socket state transitions aligned with `useKabelsalatState`: clicks are active only for unconnected sockets with a selected cable and no game-over state, and `connections` stays `Partial<Record<SocketId, CableId>>`.
- Socket order widening to `string[]` breaks downstream type narrowing.
