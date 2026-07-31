# Game-state Utilities — Agent Instructions

Follow the parent utility rules; the invariants below are specific to persisted game-state helpers.

## Numeric invariants

- Event deltas are applied to persisted state. Normalize the stored addend with `finiteNumberOr` before arithmetic, then clamp the computed result; clamping only the base can still persist a negative result.
- `player.day` is a positive integer. Both ordinary day ticks and event-day deltas must recover malformed persisted values before adding or flooring.
- `isStashEntry` mirrors hydration: stack counts are either `null` for non-stackable items or positive integers for stackable items.
