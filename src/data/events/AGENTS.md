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
- `index.ts` is the single declarative source of truth that aggregates and validates `EVENTS_DB`. Add new events to the raw category arrays (`TRANSPORT_EVENTS`, `BAND_EVENTS`, etc.); never merge arrays manually elsewhere.
- Event ID uniqueness is asserted by `tests/utils/architecture.test.jsx` against `ALL_RAW_EVENTS` (pre-dedup), not the deduplicated `EVENTS_DB`. Two events with the same ID will fail CI even though runtime dedup hides them.
