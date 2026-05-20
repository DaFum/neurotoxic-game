# src/components/postGig - Agent Instructions

- Post-gig summaries derive score, misses, accuracy, combo, health, and overload from shared gig stats contracts in `src/types/**`.
- `GameState.lastGigStats`, `PostGigSummary`, and the `SET_LAST_GIG_STATS` payload must use the same field names and types for shared gig stats. Update the shared type/action creator instead of patching consumers with `any`.
