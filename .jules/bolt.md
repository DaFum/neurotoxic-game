## 2025-05-20 - E2E Reliability vs Unit Tests for Rendering Logic

**Learning:** E2E tests (`playwright`) are unreliable for verifying rendering logic (like lane visibility) in this codebase due to frequent audio context crashes/timeouts in the headless environment.
**Action:** Prioritize mocking rendering libraries (PixiJS) in unit tests to verify optimization logic (e.g., ensuring `clear()` is not called) rather than relying on visual verification via E2E scripts.

## 2025-03-02 - React SVG Icons Optimization

**Learning:** Pure UI decoration components (like SVG icons) in heavily re-rendered environments like BrutalistUI.jsx should be wrapped in `React.memo()` to prevent unnecessary re-renders across the app, as their props typically consist only of simple string class names.
**Action:** Always use `React.memo` for static UI decorations, especially when creating custom UI component libraries.

## 2025-05-20 - Object.keys vs Object.entries

**Learning:** In hot loops, iterating over an array once is faster than using multiple `.find()` calls to retrieve distinct elements from the same array.
**Action:** Always favor a single `for` loop pass when looking up multiple distinct elements from the same array to reduce overhead.

## 2025-05-20 - Intl.NumberFormat Instantiation Overhead

**Learning:** Re-instantiating `Intl.NumberFormat` in React functional components (even with `useMemo`) or within render loops (like mapping over quests) adds significant overhead to the JavaScript execution thread in this application. In a test benchmark, repeated instantiation took ~600ms vs ~10ms for a cached instance over 10,000 runs.
**Action:** Always use the module-level caching utilities (`formatNumber` and `formatCurrency` in `src/utils/numberUtils.js`) instead of calling `new Intl.NumberFormat` inline to ensure predictable performance during frequent re-renders.

## 2026-03-18 - CSS Token Lookup Overhead in PixiJS

**Learning:** Calling `getPixiColorFromToken` (which fetches computed CSS variables from the DOM) repeatedly inside a high-frequency `update(dt)` loop in PixiJS stage controllers causes severe frame drops and overhead. The utility caches internally, but the map lookup and repeated function calls are still too slow for 60fps game loops.
**Action:** When working with PixiJS controllers, always cache CSS token color values to class instance properties (e.g., `this.colors = { ... }`) in the `constructor` or `setup` method, and read from those properties during the `update` phase to eliminate lookup overhead.

## 2026-05-24 - Avoid monkey patching JS native objects for performance tricks

**Learning:** Monkey-patching `Set.prototype.includes = Set.prototype.has` was used as a workaround to provide O(1) performance to consumer functions expecting Arrays. While performant, this is an anti-pattern. Passing Sets inside `optimizedState` directly and using a `hasStateItem` utility to route `has` vs `includes` preserves the exact same performance profile but keeps data structures pure.
**Action:** Use polymorphic helpers like `hasStateItem(collection, item)` instead of mutating instance methods on built-in types when dealing with optimized state objects that may temporarily convert underlying representations for lookup speed.

## 2026-05-24 - Avoiding Array Allocation for Nullable State

**Learning:** In PixiJS and similar mutable rendering contexts, actively tearing down collections (like filters or graphics modifiers) by re-assigning empty arrays (`[]`) triggers internal tracking, dirty checks, and GC overhead. Replacing it with `null` entirely bypasses these internal systems with zero allocations.
**Action:** Use `null` instead of `[]` when clearing optional property collections on rendering objects.

## 2026-05-24 - Redundant child removal before destroy() in PixiJS

**Learning:** Calling `container.removeChild(sprite)` before `sprite.destroy()` is redundant because PixiJS automatically removes a destroyed display object from its parent.
**Action:** Simply call `sprite.destroy()` directly when cleaning up entities in PixiJS update loops.

## 2026-05-24 - Avoid `Map.entries()` in High-Frequency Game Loops

**Learning:** In high-frequency paths like the PIXI.js update loop (e.g., `TourbusStageController.js`), using `for (const [key, value] of map.entries())` causes continuous per-iteration memory allocation for the `[key, value]` array. This puts pressure on the garbage collector and can cause frame drops.
**Action:** Replace `map.entries()` iteration in `update()` or `_cleanupObstacles()` loops with `for (const key of map.keys())`. Retrieve the associated value using `map.get(key)` only if the condition necessitates it (e.g., when deleting an item).

## 2026-02-14 - Optimize Virality Check Lookups

**Learning:** Using `Set.has()` instead of `Array.includes()` for checking multiple events in `calculateViralityScore` didn't yield a noticeable performance improvement in benchmarks due to the overhead of dynamically allocating `new Set()` for small arrays. O(1) lookups are mathematically better, but object allocation costs often dominate for N < 5.
**Action:** When converting array lookups to Sets for performance, ensure the Set is either passed in directly from the caller, cached, or that N is large enough to offset the instantiation overhead. We proceeded with the change because it was explicitly requested, but noted the allocation caveat.

## 2026-05-25 - Avoid `.some()` overhead in recursive serializers

**Learning:** Array iteration methods like `.some()` introduce function allocation and call overhead on each tick. When performing sanitization recursively across highly nested objects (e.g., `sanitizeContextValue` walking through thousands of `GameState` keys on error), this overhead adds up quickly compared to a basic `for` loop.
**Action:** Use plain `for` loops instead of array iteration methods inside deeply recursive operations or hot traversal code.

## 2026-04-02 - structuredClone Overhead

**Learning:** `structuredClone` has significant overhead (~660ms vs ~10ms for 100k iterations) when used for duplicating simple nested objects on hot paths, like in `negotiateDeal`.
**Action:** Use manual shallow copying with object spread syntax (`{ ...obj, nested: { ...obj.nested } }`) instead of `structuredClone` when deep cloning is not strictly necessary or when only specific nested objects are mutated.

## 2026-05-28 - Component List Memoization

**Learning:** Mapping arrays of complex sub-components without `React.memo` (like `ShopItem` inside `ShopTab`) causes O(N) re-renders when parent states change, even if the sub-component props are referentially stable or primitives.
**Action:** Always wrap mapping children inside high-frequency parent components with `React.memo` and ensure the passed functions use `useCallback` to prevent deep virtual DOM diffing.

## 2026-05-28 - Loop Unrolling Tradeoffs

**Learning:** Unrolling loops across configuration objects (e.g., `SOCIAL_PLATFORMS`) provides minor speed improvements but introduces significant maintainability regressions by hardcoding dynamic keys.
**Action:** Never unroll iterations that loop over configuration data or sources of truth. Reserve loop unrolling for pure computational arrays of fixed size.

## 2026-05-28 - Component List Memoization

**Learning:** Mapping arrays of complex sub-components without `React.memo` (like `SongRow` inside `SetlistTab`) causes O(N) re-renders when parent states change, even if the sub-component props are referentially stable or primitives.
**Action:** Always wrap mapping children inside high-frequency parent components with `React.memo` and ensure the passed functions use `useCallback` to prevent deep virtual DOM diffing.

## 2026-04-09 - Avoid instanceof checks in hot loops

**Learning:** In high-frequency paths like PixiJS render loops (e.g., `RoadieStageController.js`, `EffectManager.js`), using `instanceof Sprite` checks introduces significant overhead due to prototype chain traversal.
**Action:** Replace `instanceof` checks with direct boolean property lookups by assigning `.isSprite = true` upon object instantiation.

## 2026-05-28 - Array Allocations in Random Utilities

**Learning:** Using `[...arr]` shallow-copying inside generic random sub-set utility methods like `pickRandomSubset` is highly detrimental for performance and GC when array sizes scale or frequency is high, and had been bottlenecking performance.
**Action:** When implementing generic subset or shuffling algorithms, always prefer direct index lookups (for k=1, k=2) or Sparse Fisher-Yates with Map (for small subsets relative to array length) rather than unconditionally shallow-copying the entire source array.

## 2026-10-27 - Map Iteration Overhead in requestAnimationFrame

**Learning:** Using `map.forEach()` inside high-frequency update loops like `requestAnimationFrame` (e.g., `HecklerOverlay.jsx`) creates unnecessary closure allocations on every frame, which can contribute to garbage collection pauses.
**Action:** Always prefer `for (const key of map.keys())` over `map.forEach()` in hot rendering loops to eliminate function allocation overhead.
## 2025-02-23 - [useRhythmGameAudio Infinite Loop and Lock Starvation]
**Learning:** `useRhythmGameAudio` suffered from an OOM infinite loop because it passed complex objects (`band`, `gameMap`, `setlist`) into its `useCallback` dependency array, causing `initializeGigState` to recreate on every render. This masked a lock starvation issue where `isInitializingRef` was never released if the setup was aborted. Furthermore, the test suite (`rhythmGameLogicMultiSong.test.js`) advanced due to repeated re-invocation from this infinite re-render loop, so it failed once the hook was stabilized.
**Action:** Stabilized `useCallback`/`useEffect` dependencies using strictly mapped primitives (`band?.members?.length`, `band?.harmony`, `player?.currentNodeId`, `setlist?.length`, etc.) and wrapped initialization in a `try/finally` block to guarantee lock release.
