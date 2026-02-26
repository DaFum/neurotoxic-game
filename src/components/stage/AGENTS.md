# src/components/stage/ — Gotchas

- **Internal-only symbols in `utils.js`**: `calculateCrowdY` and `calculateLaneStartX` are internal — external callers must use `buildRhythmLayout` / `calculateCrowdOffset`.
- **Internal-only symbols in `LaneManager.js`**: `LANE_BASE_FILL`, `LANE_BORDER_COLOR`, `HIT_BAR_*` constants are internal rendering constants — do not export.
- Resolve Pixi colors through `getPixiColorFromToken('--token-name')`, never hardcoded numeric literals.
