# src/ui/bandhq/hooks - Agent Instructions

- Fame-currency ownership patches must use the resolved effect, not the raw validation payload.
- `processingItemId` must clean up in `finally`, including in the validation-failure path before effects run.
- Use `?? null` (nullish), not `|| null`, when assigning processing-lock IDs so legitimate falsy IDs aren't collapsed.
- Toast content must reflect sanitized, actually-applied changes (not the requested delta).
