# src/scenes/kabelsalat/components - Agent Instructions

## Contracts

- Keep plug/socket props aligned with `KabelsalatState`: `connections` stays `Partial<Record<SocketId, CableId>>`, `socketOrder` stays `SocketId[]`, and `onAdvance` stays `(isPowered: boolean) => void`.
- Do not paper over prop/state contract mismatches in components; fix the parent hook or shared type instead.

## Copy

- Visible labels and overlay text require i18n keys.

## IDs / Tests

- Avoid widening socket or plug IDs from `SocketId`/`CableId` to plain `string` or `string[]`.

- Component-only tests are insufficient for end flow; preserve scene-routing coverage when changing controls.
