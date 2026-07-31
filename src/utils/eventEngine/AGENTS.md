# Event Engine — Agent Instructions

## Selection

- `selectEvent` is the sole RNG boundary for shuffle and chance rolls. A functional `chance` may derive probability from the optimized state but must not consume randomness itself.
- Template venue context reads canonical `player.location`; `currentLocation` is not part of persisted player state.
