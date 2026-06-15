# src/ui/bandhq/hooks - Agent Instructions

## Purchase effects

- Fame-currency ownership patches must use the resolved effect (`validation.effect ?? getPrimaryEffect(item)` after validation), not the raw validation payload.
- Toast content must reflect sanitized, actually-applied changes: values after validation, clamping, normalization, and effect processing, not the requested delta.

## Processing locks

- `processingItemId` must clean up in `finally`, including in the validation-failure path before effects run.
- Use `?? null` (nullish), not `|| null`, when assigning processing-lock IDs so legitimate non-nullish falsy IDs (`0`, `''`) are not collapsed before stringification/storage.
- Shop surfaces that run purchases (Band HQ, `SupplyStopModal`, etc.) must guard against duplicate purchases from double-clicks using the shared `processingItemId` + ref-guard pattern (e.g. `usePurchaseLock` or `useBandHQLogic.handleBuyWithLock`) and forwarding `processingItemId` to `ShopItem`; do not call the raw `handleBuy` without a lock. The lock is async so a second click fired before the disabled state re-renders is dropped by the ref guard.
