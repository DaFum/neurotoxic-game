# src/components/postGig - Agent Instructions

- Post-gig summaries derive score, misses, accuracy, combo, health, and overload from shared gig stats contracts in `src/types/**`.
- `GameState.lastGigStats` and the `SET_LAST_GIG_STATS` payload fields must stay aligned; do not patch consumers with `any`.
