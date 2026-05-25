# src/context/reducers - Agent Instructions

## Load Sanitization

- `sanitizeBand` in `systemReducer.ts` preserves `band.merchPrices` through save/load: whitelist entries by key, validate values with `Number.isFinite(v) && v >= 0`, skip prototype-pollution keys. Extend this pattern for any new per-item numeric map on `BandState`.
- Malformed loaded values should follow existing sanitizer behavior: fall back to defaults or skip invalid entries, never copy untrusted objects wholesale.
- `cityStates` sanitization uses `Number.isFinite(attentionSpan)` (not `typeof === 'number'`) to reject `NaN` and `Infinity`.
- `for...in` over default-shape constants (e.g. `DEFAULT_BAND_STATE.inventory` in `sanitizeBandInventory`) must guard each key with `if (!Object.hasOwn(defaults, key)) continue`. Without the guard, hostile `Object.prototype` additions leak into the sanitized save result.
- Prototype-pollution rejection in reducers must return the **identical memory reference** (`nextState === baseState`), not just a deep-equal copy. `{ ...state }` "safe copy" still fails `tests/node/reducerInvariants.test.js` and `tests/node/bandReducer.security.test.js` — the forbidden-key branch must short-circuit before any state copy.

## Band Effects

- `addContrabandHelper` in `bandReducer.ts` is a pure state-update helper (returns new `GameState`, does not mutate). It is intentionally a function, not a dispatched action, so `minigameReducer` and `tradeReducer` can compose atomic cross-domain updates in a single reducer pass. Do not convert it to a dispatched action.
- `applySharedBandEffect` in `bandReducer.ts` centralizes additive numeric effect dispatch. The equipment apply-on-add path must pass the `EQUIPMENT_APPLY_ON_ADD_EFFECTS` allowlist (luck, stamina_max, guitar_difficulty, crit, crowd_control, affinity, style, tour_success); contraband uses the full `ADDITIVE_BAND_EFFECT_FIELDS` superset. Adding a new effect key to the additive map does NOT automatically enable it for equipment apply-on-add. To enable it there, explicitly extend `EQUIPMENT_APPLY_ON_ADD_EFFECTS`.

## Reducer Flow

- `questReducer.ts` is only an integration point; quest progress/completion/deadline logic lives in `src/domain/questLifecycle.ts`. Do not move domain logic into the reducer.
- Reducer typing regressions fail `pnpm run typecheck`; whole-project issues belong to `pnpm run typecheck:core`.
- `gameReducer`'s default branch logs the malformed action, then uses `assertNever(action as never)` as a **runtime** trap, not a compile-time exhaustiveness check. The `as never` cast is intentional — `Object.hasOwn` guards already filter known action types, so the branch is a defense-in-depth net against malformed dispatches. Removing the cast (or "fixing" the assertNever pattern) re-introduces compile errors and removes the runtime guard.
- Every minigame completion handler must preserve `state.currentScene`: `handleCompleteTravelMinigame`, `handleCompleteAmpCalibration`, `handleCompleteKabelsalatMinigame`, `handleCompleteRoadieMinigame`. The overlay's CONTINUE button (via `useArrivalLogic` for travel, scene callbacks otherwise) owns scene transitions. Asserted across `tests/node/minigameReducer.test.js`.

## Long-Term Assets

- `assetReducer.ts` handlers are pure: no RNG calls, no UUID generation, no side effects. `*_FAILED` actions (`PURCHASE_CHASSIS_FAILED`, `INSTALL_MODULE_FAILED`, `SELL_CHASSIS_FAILED`) are reducer no-ops; toast dispatching belongs in a middleware/UI layer.
- `handlePurchaseChassis`: loan-mode payload without a valid `loanProfileId` returns state unchanged (defense against free-chassis exploits via malformed dispatch).
- `handleInstallModule`: tracks an `installed` flag so cost is deducted only when a slot actually transitioned from `null` to the new module — stale replays no longer charge the player for non-ops.
- `handleUpgradeChassisTier` / `handleRepairChassis`: early-return state when the target `assetId` doesn't match an existing asset.
- `handleAdvanceDay` composes `processAssetTick → processLiabilityTick → processCrowdfundTick → rollAssetRiskEvents` and surfaces risk-event descriptors to deduplicated toasts (`assets:risk.event.<type>`).
- `condition < 20` → aggregated boni neutralized via selectors. `condition === 0` → `ASSET_FORECLOSED` dispatched by tick orchestrator.
- `assetSanitizers.ts` enforces referential integrity: orphan liabilities and orphan `addedByModuleId` slots are dropped on load. The `VALID_SLOT_TYPES` allow-list mirrors the `SlotType` union (TS erases it at runtime) and is validated before any cast.
- `sanitizeRngSeed` returns an unsigned 32-bit integer (`>>> 0`) so `mulberry32` sees a valid UInt32 seed even on saves from a build that wrote signed values.
- `BASE_STATE` (Playwright fixture) must mirror `createInitialState` including `assets`, `liabilities`, `crowdfundCampaigns`, and `rngSeed`.
