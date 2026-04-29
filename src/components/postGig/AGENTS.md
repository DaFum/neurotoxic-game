# src/components/postGig - Agent Instructions

## Scope

Applies to `src/components/postGig/**`.

## Rules

- Post-gig summaries must derive displayed score, misses, accuracy, combo, health, and overload from shared gig stats contracts.
- Toasts and rewards must show actually applied deltas after clamps.
- Keep scene exit routing explicit through provided callbacks.

## Gotchas

- `GameState.lastGigStats` and `SET_LAST_GIG_STATS` payload fields must stay aligned; do not patch consumers with `any`.
