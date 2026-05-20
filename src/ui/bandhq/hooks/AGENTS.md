# src/ui/bandhq/hooks - Agent Instructions

## Purchase effects

- Fame-currency ownership patches must use the resolved effect (`validation.effect ?? getPrimaryEffect(item)` after validation), not the raw validation payload.
- Toast content must reflect sanitized, actually-applied changes: values after validation, clamping, normalization, and effect processing, not the requested delta.

## Processing locks

- `processingItemId` must clean up in `finally`, including in the validation-failure path before effects run.
- Use `?? null` (nullish), not `|| null`, when assigning processing-lock IDs so legitimate non-nullish falsy IDs (`0`, `''`) are not collapsed before stringification/storage.
