# src/data/events - Agent Instructions

## Registry

- `index.ts` is the single declarative source of truth that aggregates and validates `EVENTS_DB`. Add new events to the raw category arrays (`TRANSPORT_EVENTS`, `BAND_EVENTS`, etc.); never merge arrays manually elsewhere.
- Invalid or malformed raw events are logged and skipped during the `index.ts` validation pass; fix the source entry rather than relying on runtime filtering.
- Event ID uniqueness is asserted by `tests/utils/architecture.test.jsx` against `ALL_RAW_EVENTS` (pre-dedup), not the deduplicated `EVENTS_DB`. Duplicate IDs are logged/skipped at runtime but still fail CI.

## Special Events

- `events/special.js` entries require `category: 'special'`, `events:` i18n keys, and unique IDs.

## Tests

- For each new or changed `condition`, test one state that returns truthy (`true` or a context object) and one state that returns `false`; call the condition directly instead of relying on random event selection.
