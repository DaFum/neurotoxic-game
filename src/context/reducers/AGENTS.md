# src/context/reducers - Agent Instructions

## Scope

Applies to `src/context/reducers/**`.

## Rules

- Reducers may receive payloads that were already sanitized by action creators, but they must still protect final state invariants.
- Use canonical clamp helpers from `gameStateUtils` when writing bounded values into state, especially when the reducer computes next state from previous state plus a delta, reward, cost, or functional update.
- Do not remove a reducer clamp merely because the action creator normalizes the incoming payload. Action-creator sanitation protects payload shape; reducer clamps protect stored state.
- Avoid redundant no-op payload normalization in reducers when the action creator can validate the raw field once, but keep terminal state clamps where bounded state is produced.
- Keep exhaustive handling with `assertNever(action)` in default branches.
- Whitelist persisted or loaded payload fields before constructing state.
- Preserve immutability of untouched branches in reducer tests.

## Gotchas

- Loaded save compatibility must cover legacy venue, settings, and unlock formats.
- `sanitizeBand` in `systemReducer.ts` preserves `band.merchPrices` through save/load: it whitelists entries by key, validates values with `Number.isFinite(v) && v >= 0`, and skips prototype-pollution keys. Extend the same pattern for any new per-item numeric map added to `BandState`.
- `cityStates` sanitization uses `Number.isFinite(attentionSpan)` (not `typeof === 'number'`) to reject `NaN` and `Infinity` that would otherwise pass a plain typeof check.
- Reducer typing regressions should fail `pnpm run typecheck`; whole-project issues belong to `pnpm run typecheck:core`.
- `addContrabandHelper` in `bandReducer.ts` is a pure state-update helper (returns a new `GameState`, does not mutate) intentionally exposed as a function rather than a dispatched action. It exists so `minigameReducer` and `tradeReducer` can compose atomic cross-domain updates in a single reducer pass, avoiding stale-state races. Do not convert it to a dispatched action.
- `applySharedBandEffect` in `bandReducer.ts` centralizes additive numeric effect dispatch for equipment and contraband. The equipment apply-on-add path must pass the `EQUIPMENT_APPLY_ON_ADD_EFFECTS` allowlist (luck, stamina_max, guitar_difficulty, crit, crowd_control, affinity, style, tour_success); contraband supports the full `ADDITIVE_BAND_EFFECT_FIELDS` superset. Adding a new effect key to the additive map does not automatically enable it for equipment apply-on-add — extend the allowlist explicitly.
- `questReducer.ts` is only an integration point; quest progress/completion/deadline logic lives in `src/domain/questLifecycle.ts`. Do not move domain logic into the reducer.
