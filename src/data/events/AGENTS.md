# src/data/events - Agent Instructions

## Purpose and Limitations

Event-data agents author declarative event definitions: stable IDs, trigger/category pairing, namespaced i18n keys, typed conditions, and reducer-aligned options. They must not perform side effects, mutate runtime state, do IO, dispatch reducers, or rely on randomness. Use them for static event metadata only, and test both truthy/falsy condition branches while respecting special rules such as `category: 'special'` and `events:` i18n keys.

## Scope

Applies to `src/data/events/**`.

## Rules

- Events require stable unique IDs, valid trigger/category pairing, namespaced i18n keys, and an `options` array.
- Event conditions must be explicitly typed as `(state: GameState) =>`.
- Keep effect payloads aligned with reducer/action creator contracts.

## Gotchas

- `events/special.js` entries require `category: 'special'`, `events:` i18n keys, and unique IDs.
- Test both truthy and falsy condition branches without relying on random event selection.
