# src/data/events - Agent Instructions

## Registry

- `index.ts` is the single declarative source of truth that aggregates and validates `EVENTS_DB`. Add new events to the raw category arrays (`TRANSPORT_EVENTS`, `BAND_EVENTS`, etc.); never merge arrays manually elsewhere.
- Invalid or malformed raw events are logged and skipped during the `index.ts` validation pass; fix the source entry rather than relying on runtime filtering.
- Event ID uniqueness is asserted by `tests/utils/architecture.test.jsx` against `ALL_RAW_EVENTS` (pre-dedup), not the deduplicated `EVENTS_DB`. Duplicate IDs are logged/skipped at runtime but still fail CI.

- A saved active event is rehydrated from this registry on load (`rehydrateRegistryEvent` in `stateSanitizers.ts`): options, composite effects, conditions and `tags` are restored only when the saved option list still matches by length and per-index `id` and `label`. Reordering or relabelling options of an existing event makes saves in flight fall back to the sanitized (lossy) copy, so change them deliberately.
- Option `condition`s run against a state whose `player.money` is only the spendable cash during an active run (`withExpeditionSpendableCash`), so a money gate like `money >= 45` already respects protected cash. Options with a direct money cost but no such condition are covered by `isOptionAffordable`; see `src/utils/eventEngine/AGENTS.md`.
- Event-level `condition` and functional `chance` are deliberately evaluated by `selectEvent` against raw `player.money`, not the spendable view: they decide whether an event happens, not what the player may spend. Put any money gate on the option `condition`, which does see spendable cash.

## Special Events

- `special.ts` entries require `category: 'special'`, `events:` i18n keys, and unique IDs.

## Tests

- `tests/events/paidOptionsProtectedCash.test.js` walks the whole registry against the protected-cash rule (`isOptionAffordable`): no event may lose its last choosable option, a paid option is refused while a free choosable sibling exists, and every paid option stays payable when the whole balance is spendable. A new event needs no extra test for this, but a `disabled` flag, a changed sibling `condition` or an all-paid event shows up there by event id.
- For each new or changed `condition`, test one state that returns truthy (`true` or a context object) and one state that returns `false`; call the condition directly instead of relying on random event selection.

## Probability

- State-derived event probability belongs in a functional `chance`; conditions only decide eligibility. Never draw entropy inside a condition, because `selectEvent` owns the injected RNG used for every probability roll.
