# src/data/events - Agent Instructions

## Scope

Applies to `src/data/events/**`.

## Rules

- Events require stable unique IDs, valid trigger/category pairing, namespaced i18n keys, and an `options` array.
- Event conditions must be explicitly typed as `(state: GameState) =>`.
- Keep effect payloads aligned with reducer/action creator contracts.

## Gotchas

- `events/special.js` entries require `category: 'special'`, `events:` i18n keys, and unique IDs.
- Test both truthy and falsy condition branches without relying on random event selection.
