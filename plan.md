1. **[STABILITY / PERFORMANCE] Garbage Collection & Array Iteration**:
   - Refactor allocating methods in `src/utils/balanceTuning.ts`:
     - `Object.entries(overrides.earlyGame ?? {})` to `for...in` loop.
     - `earlyGame.obligationStages = value.map` to pre-allocated `for` loop.
     - `Object.keys(stage).filter` to a simple procedural loop tracking unknown keys.
     - `Object.entries(overrides.touring ?? {})` to `for...in` loop.
     - `Object.entries(overrides.recovery ?? {})` to `for...in` loop.
   - Refactor allocating methods in `src/utils/mapValidation.ts`:
     - `Object.values(nodes)` (for `nodeList` and `startNodes`) to `for...in` loop.
     - `[...outDegree.values()].filter` to a procedural loop over `outDegree.values()`.
     - `Object.keys(nodes).filter` to a procedural `for...in` loop.

2. **[QUALITY / ARCHITECTURE] Audio Callback Strictness**:
   - In `src/utils/rhythmGameLoopUtils.ts`, update `handleOverlayResume` and `handleOverlayPause` to explicitly test `res === false` instead of using truthiness/`res.catch` logic on returned values. This avoids falsely treating `void` or `undefined` as a failure.

3. **[SECURITY / STATE] Explicit Sentinels for String Keys**:
   - Update `src/utils/travelUtils.ts:94` `const key = location || venueId || 'Unknown'` to check explicit undefined/null:
     `let key = 'Unknown';`
     `if (location !== undefined && location !== null) { key = location }`
     `else if (venueId !== undefined && venueId !== null) { key = venueId }`

4. **[BALANCE / SAFETY] Unbounded Accumulative State Persistence**:
   - `clampLuck` already un-bounds the upper limit properly. Check if anything else needs adjusting. (No other changes identified as strictly necessary based on memory).

5. **[QUALITY / BUILD] Vite Chunking Optimization**:
   - The Vite config already does not bundle lazy components into manual chunks.

6. **Testing**:
   - Run tests `pnpm run test:node:quick && pnpm run typecheck:core`
7. Pre-commit check
8. Submit
