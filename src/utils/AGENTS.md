# src/utils/ — Gotchas

- `economyEngine.js` exports `MODIFIER_COSTS` as the single source of truth for PreGig modifier costs. Travel only consumes fuel liters and food money — gas station refuel is the only monetary fuel cost.
- `mapGenerator.js` assigns `FESTIVAL` type for venues with capacity >= 1000.
- `gigStats.js` exports `calculateAccuracy(perfectHits, misses)` and `buildGigStatsSnapshot` (includes `accuracy` 0–100). Tests in `tests/gigStats.test.js` verify this.
- `simulationUtils.js` `calculateGigPhysics` returns modifiers consumed by audio/scoring hooks — these are the authoritative source for gig-time band-trait bonuses.
- `socialEngine.js` `resolvePost` can impact Band/Player/Social state with wide-ranging side effects (shadowban, loyalty, egoFocus, harmony/mood).
- Audio asset URLs are unified through `buildAssetUrlMap` — avoid reintroducing wrapper-only APIs like `buildMidiUrlMap`.
