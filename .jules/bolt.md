# Bolt's Journal

## 2025-05-20 - E2E Reliability vs Unit Tests for Rendering Logic

**Learning:** E2E tests (`playwright`) are unreliable for verifying rendering logic (like lane visibility) in this codebase due to frequent audio context crashes/timeouts in the headless environment.
**Action:** Prioritize mocking rendering libraries (PixiJS) in unit tests to verify optimization logic (e.g., ensuring `clear()` is not called) rather than relying on visual verification via E2E scripts.

## 2025-03-02 - React SVG Icons Optimization

**Learning:** Pure UI decoration components (like SVG icons) in heavily re-rendered environments like BrutalistUI.tsx should be wrapped in `React.memo()` to prevent unnecessary re-renders across the app, as their props typically consist only of simple string class names.
**Action:** Always use `React.memo` for static UI decorations, especially when creating custom UI component libraries.

## 2025-05-20 - Single-pass loops vs repeated Array.find()

**Learning:** In hot loops, iterating an array once is faster than issuing multiple `.find()` calls against the same array, since each `.find()` re-walks the array and allocates a callback closure.
**Action:** When looking up several distinct elements from the same array (e.g. resolving multiple band-member traits or merch entries inside a reducer/selector), use one `for` loop that branches per item rather than chained `.find()` calls. For O(1) repeat lookups, prefer the precomputed Maps the project already maintains (e.g. `HQ_ITEMS_BY_MERCH_KEY`, `SONGS_BY_ID`).

## 2025-05-20 - Intl.NumberFormat Instantiation Overhead

**Learning:** Re-instantiating `Intl.NumberFormat` in React functional components (even with `useMemo`) or within render loops (like mapping over quests) adds significant overhead to the JavaScript execution thread in this application. In a test benchmark, repeated instantiation took ~600ms vs ~10ms for a cached instance over 10,000 runs.
**Action:** Always use the module-level caching utilities (`formatNumber` and `formatCurrency` in `src/utils/numberUtils.ts`) instead of `new Intl.NumberFormat` inline. Remember that currency strings baked into toast `options` must be formatted at dispatch time with the active `i18n.language` — see the AGENTS.md note on locale-correct currency for reducers/action creators.

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

**Learning:** In PixiJS `update(dt)` paths, `for (const [key, value] of map.entries())` allocates a fresh `[key, value]` tuple per iteration. Across 60fps frames this becomes measurable GC pressure. (TourbusStageController has since been refactored away from this pattern; the rule still applies to any new stage controller.)
**Action:** In any `update()` / cleanup loop iterating a `Map`, use `for (const key of map.keys())` and only call `map.get(key)` when the branch actually needs the value. Same rule applies to `map.forEach()` in `requestAnimationFrame` callbacks.

## 2026-02-14 - Optimize Virality Check Lookups

**Learning:** Using `Set.has()` instead of `Array.includes()` for checking multiple events in `calculateViralityScore` didn't yield a noticeable performance improvement in benchmarks due to the overhead of dynamically allocating `new Set()` for small arrays. O(1) lookups are mathematically better, but object allocation costs often dominate for N < 5.
**Action:** When converting array lookups to Sets for performance, ensure the Set is either passed in directly from the caller, cached, or that N is large enough to offset the instantiation overhead. We proceeded with the change because it was explicitly requested, but noted the allocation caveat.

## 2026-05-25 - Avoid `.some()` overhead in recursive serializers

**Learning:** Array iteration methods like `.some()` introduce function allocation and call overhead on each tick. When performing sanitization recursively across highly nested objects (e.g., `sanitizeContextValue` walking through thousands of `GameState` keys on error), this overhead adds up quickly compared to a basic `for` loop.
**Action:** Use plain `for` loops instead of array iteration methods inside deeply recursive operations or hot traversal code.

## 2026-04-02 - structuredClone Overhead

**Learning:** `structuredClone` has significant overhead (~660ms vs ~10ms for 100k iterations) when used for duplicating simple nested objects on hot paths, like in `negotiateDeal`.
**Action:** Use manual shallow copying with object spread syntax (`{ ...obj, nested: { ...obj.nested } }`) instead of `structuredClone` when deep cloning is not strictly necessary or when only specific nested objects are mutated.

## 2026-04-20 - Component List Memoization (ShopItem)

**Learning:** Mapping arrays of complex sub-components without `React.memo` (like `ShopItem` inside `src/ui/bandhq/CatalogTab.tsx`) causes O(N) re-renders when parent BandHQ state changes, even when sub-component props are referentially stable primitives.
**Action:** Wrap row components rendered inside high-frequency BandHQ tabs with `React.memo` and stabilize handler props with `useCallback` so virtual-DOM diffing stays shallow. The `useGameSelector(state=>state)` pattern provides no memoization benefit on its own — the child must be memoized.

## 2026-04-20 - Loop Unrolling Tradeoffs

**Learning:** Unrolling loops across configuration objects (e.g., `SOCIAL_PLATFORMS`) provides minor speed improvements but introduces significant maintainability regressions by hardcoding dynamic keys.
**Action:** Never unroll iterations that loop over configuration data or sources of truth. Reserve loop unrolling for pure computational arrays of fixed size.

## 2026-04-20 - Component List Memoization (SongRow)

**Learning:** `SongRow` is implemented twice — once inside `src/ui/bandhq/SetlistTab.tsx` and once inside `src/components/pregig/SetlistBlock.tsx`. Both must stay wrapped in `React.memo` because they are mapped over the full setlist and re-render on every parent state change otherwise.
**Action:** When touching either `SongRow` definition, preserve `React.memo` / `memo(function SongRow…)` and keep `toggleSongInSetlist` (and any other handler props) stable with `useCallback` in the parent. Verify both copies stay in sync if the row prop shape changes.

## 2026-04-09 - Avoid instanceof checks in hot loops

**Learning:** In PixiJS render loops, `instanceof Sprite` walks the prototype chain on every frame. The codebase already tags display objects with an `isSprite: boolean` discriminant in `src/components/stage/CrowdManager.ts` and `src/components/stage/EffectSpritePool.ts` so per-frame branches stay O(1).
**Action:** When adding a new hot-loop branch that needs to distinguish `Sprite` from `Graphics` (or any subclass), tag the object with a boolean flag at construction time and read that flag in the `update()` path. Keep the `isSprite` discriminated-union pattern (`Sprite & { isSprite: true }` vs `Graphics & { isSprite: false }`) intact so TypeScript still narrows correctly.

## 2026-04-20 - Array Allocations in Random Utilities

**Learning:** Using `[...arr]` shallow-copying inside generic random sub-set utility methods like `pickRandomSubset` is highly detrimental for performance and GC when array sizes scale or frequency is high, and had been bottlenecking performance.
**Action:** When implementing generic subset or shuffling algorithms, always prefer direct index lookups (for k=1, k=2) or Sparse Fisher-Yates with Map (for small subsets relative to array length) rather than unconditionally shallow-copying the entire source array.

## 2026-10-27 - Map Iteration Overhead in requestAnimationFrame

**Learning:** Using `map.forEach()` inside high-frequency update loops like `requestAnimationFrame` (e.g., `HecklerOverlay.tsx`) creates unnecessary closure allocations on every frame, which can contribute to garbage collection pauses.
**Action:** Always prefer `for (const key of map.keys())` over `map.forEach()` in hot rendering loops to eliminate function allocation overhead.

## 2026-04-12 - useRhythmGameAudio Infinite Loop and Lock Starvation

**Learning:** `useRhythmGameAudio` suffered from an OOM infinite loop because it passed complex objects (`band`, `gameMap`, `setlist`) into its `useCallback` dependency array, causing `initializeGigState` to recreate on every render. This masked a lock starvation issue where `isInitializingRef` was never released if the setup was aborted. Furthermore, the test suite (`rhythmGameLogicMultiSong.test.js`) relied on repeated re-invocation from this infinite re-render loop, so it failed once the hook was stabilized.
**Action:** Stabilized `useCallback`/`useEffect` dependencies using strictly mapped primitives (`band?.members?.length`, `band?.harmony`, `player?.currentNodeId`, `setlist?.length`, etc.) and wrapped initialization in a `try/finally` block to guarantee lock release.

## 2026-04-12 - Optimization: eventEngine.filterEvents

**Learning:** The callback in Array.prototype.filter has significant overhead when called repeatedly. A standard for-loop with direct condition evaluation is significantly faster (~30-40% improvement in benchmarks).
**Action:** `src/utils/eventEngine.ts` uses a manual `for` loop with `continue` instead of `Array.prototype.filter`. Apply the same pattern in any other hot eligibility/pool filtering path.

## 2026-04-15 - Vitest Project Split (node vs jsdom)

**Learning:** Running pure Node logic tests inside a global `jsdom` environment with heavy browser-API setup adds large per-file overhead, and `isolate: true` re-runs `setupFiles` for every file in the worker. This project keeps two configs: `vitest.config.js` (jsdom, `setupFiles: ['./tests/vitest.setup.js']`) and `vitest.config.node.js` (node env, no DOM setup), with the legacy `node --test` suite also still in use.
**Action:** Route new tests to the lightest viable runner — `node --test` for pure logic (see `AGENTS.md` for the exact command), `vitest.config.node.js` for fast Vitest-style suites that don't need a DOM, and the default `vitest.config.js` only when JSDOM/React-Testing-Library is actually required. Don't add heavy global mocks to `tests/vitest.setup.js` without considering the per-file cost.

## 2026-04-15 - Heckler Overlay Rendering Optimization

**Learning:** In a high-frequency animation loop using `requestAnimationFrame`, modifying DOM properties like `node.style.top` and `node.style.left` causes layout thrashing and triggers layout and paint operations which are slow.
**Action:** Always prefer `node.style.transform` with `translate3d(x, y, 0)` for positional animations as it utilizes hardware acceleration and avoids triggering costly layout recalculations.

## 2026-04-20 - Optimize array map/filter chains in post-gig logic

**Learning:** Chained array methods like `.map().filter()` on array structures during high-frequency simulation steps (e.g., in `postGigUtils.ts`) cause unnecessary intermediate array allocations, adding GC pressure.
**Action:** Replace map/filter chains that iterate over objects like `activeDeals` with a single `for` loop, pushing valid and mapped updates directly to a new array to bypass intermediate array construction and improve efficiency.

## 2026-04-21 - Optimize Map Construction

**Learning:** Replaced the `new Map(array.map(...))` pattern with a manual `for...of` loop using `.set()`. This avoids the allocation of an intermediate tuple array, reducing memory usage and GC overhead during initialization. Applied across `brandDeals.ts`, `contraband.ts`, `songs.ts`, and `useTravelLogic.ts`.
**Action:** Always use `for...of` with `.set()` for Map initialization from large arrays to prevent intermediate tuple array allocations.

## 2026-05-03 - Refactoring high-frequency filter-map chains

**Learning:** Moving `.filter().map()` chains out of render functions into static loops, especially for modules that export static arrays, avoids repeated array allocations on every render. Changing array iteration methods to simple for-loops significantly improves CPU-bound performance.
**Action:** Lift array processing pipelines dependent only on static constants to the top level of the module and utilize basic `for` loops for iteration.

## 2026-05-12 - Optimization: isEmptyObject vs Object.keys().length

**Learning:** `Object.keys(obj).length === 0` allocates an array just to count it. In hot paths that frequently check "is this object empty", `isEmptyObject` (exported from `src/utils/gameStateUtils.ts`) uses a `for…in` short-circuit instead.
**Action:** Import `isEmptyObject` from `src/utils/gameStateUtils.ts` for empty-object checks on hot paths (event delta containers, reducer guards, selector early-outs). Don't reintroduce `Object.keys(x).length === 0` in those contexts.

## 2026-05-25 - Intermediate array allocations with reduce

**Learning:** Accumulating values into intermediate arrays (`push`) only to iterate over them again via `.reduce()` introduces redundant memory allocation and garbage collection overhead on hot paths, severely degrading performance.
**Action:** When computing sums or aggregations from iterations, maintain an accumulator variable and update it directly inside the loop rather than building intermediate collections.

## 2026-05-21 - Array Mapping and Filtering in Reducers and Render Loops

**Learning:** Combining `.map()` and `.filter()` in frequently called reducers (like `bandReducer`'s `applyContrabandEffect`) and render loops (like `BrandDealsTab`) creates intermediate array allocations that add up to significant GC pressure on hot paths.
**Action:** Replaced array iteration method chains with procedural `for` loops to directly construct the filtered/mapped lists in a single pass. Specifically, in `applyContrabandEffect`, avoiding mapping over all members when only one member is updated avoids unnecessary object clones and array allocations. In `BrandDealsTab`, mapping active deals directly to `Set` values avoids intermediate tuple array creation.

## 2025-02-23 - Prevent Redundant Array Allocation in Object Aggregations

**Learning:** Sequential calls to `Object.values(obj).reduce(...)` directly after iterating to build the object create unnecessary intermediate arrays and a second O(N) pass, degrading performance.
**Action:** Always compute running totals concurrently within the same initialization loop that populates the dictionary/object to eliminate redundant passes and memory allocations.

## 2026-05-25 - Prevent Set reallocation overhead in CableList

**Learning:** Recreating objects like Sets inside a functional component body based on props forces the Set to re-allocate and garbage collect on every React render. Object.values(obj).filter() chained with Set creation compound this overhead because it creates multiple intermediate arrays along the way.
**Action:** When a set or collection is derived from props, wrap it in useMemo to prevent reallocation overhead when unrelated props trigger re-renders. Use a for...in loop inside the useMemo to avoid intermediate array allocations.

## 2026-05-26 - Array Mapping and Filtering in Sanitizers

**Learning:** Chaining .map().filter() creates multiple intermediate array allocations that add up to significant GC pressure on hot paths like sanitizers.
**Action:** Replace array iteration method chains with procedural for loops to directly construct the filtered/mapped lists in a single pass.

## 2026-05-26 - Eliminate Callback Iteration Overheads with for loops

**Learning:** Functional array methods like `.reduce()` have significant overhead in hot paths (like audio/MIDI processing) due to continuous callback execution and potential intermediate allocations.
**Action:** Prefer standard `for` loops when processing arrays in high-frequency engine domains. This saves closure invocations and increases overall throughput.

## 2024-05-29 - Array Map/Filter/Reduce in Hot Paths

**Learning:** Replaced chained `.filter().reduce()` and `.filter().forEach()` loops with single-pass `for` loops in hot logic paths like `assetReducer.ts` and `useClinicLogic.ts`. Those methods create intermediate arrays which adds memory pressure and increases GC pause times.
**Action:** Always prefer basic `for` loop iterations with accumulators or early returns over array chaining on heavily used data paths.

## 2024-05-30 - O(N) Set Instantiation Overhead vs O(N) Array Includes

**Learning:** Instantiating a `new Set(arr)` to perform a single membership check is significantly slower in V8 than using `arr.includes(val)`, even for larger arrays (e.g., 100k items). The overhead of memory allocation, hashing, and populating the Set entirely negates the O(1) lookup benefit for a single check, making the operation O(N) with a much larger constant factor than the highly optimized O(N) array traversal with fast-bailout provided by `.includes()`.
**Action:** Do not replace `Array.prototype.includes()` with a Set membership check for one-off operations. Sets should only be used when they can be cached/memoized across multiple lookups, or when performing multiple lookups within the same function execution context.

## 2024-05-31 - Eliminate Set.forEach callback overhead in high-frequency state emissions

**Learning:** `Set.prototype.forEach` creates a callback allocation on every invocation. When this is used within high-frequency loops or state emission paths (e.g., `emitChange` in `AudioManager.ts`), it causes unnecessary GC pressure.
**Action:** Replace `Set.prototype.forEach` with a `for...of` loop in hot paths. This iterates over the collection without allocating an anonymous function, significantly improving performance and reducing memory footprint.

## 2026-06-05 - Avoid intermediate arrays in selector functions

**Learning:** Using `Object.values(obj).reduce(...)` in selector functions (like `getTotalDebt` and `getTotalDailyObligations`) creates intermediate array allocations on every state change, causing GC pressure in hot paths.
**Action:** Replace `Object.values()` chains with single-pass `for...in` loops (guarded by `Object.hasOwn()`) to directly calculate aggregations and avoid intermediate memory allocations.

## 2024-06-12 - Conditional Logging in Dispatch

**Learning:** Unconditional string interpolation in high-frequency hooks (like state reducers) creates unnecessary string allocations even when the underlying logger suppresses output. Additionally, missing property checks on action payloads can cause runtime crashes.
**Action:** Guard string interpolations and logger calls inside development environment checks (`import.meta.env.DEV`), and verify payload objects before logging their properties in hot dispatch paths.

## 2026-06-05 - Avoid intermediate arrays in selectors and reducers

**Learning:** Using `Object.values(obj).reduce(...)` in inline selector functions or asset reducers (like when computing total debt or filtering foreclosed liabilities) creates intermediate array allocations on every invocation, causing significant GC pressure in hot paths.
**Action:** Replace `Object.values()` and chained array methods with single-pass `for...in` loops (guarded by `Object.hasOwn()`) to directly calculate aggregations and filter objects without creating intermediate arrays.

## 2026-06-25 - Replace Array.find with Map in render loop

**Learning:** Using `Array.find` inside a React render function on an array derived from `useMemo` causes an O(N) iteration on every render.
**Action:** Replace `Array.find` lookups inside render loops with a `useMemo` that precomputes a `Map` (or object) for O(1) access, especially when the source array is stable.

## 2024-11-15 - Optimize O(N) Array.find inside a loop

**Learning:** Performing an `Array.find` within a loop creates an O(N\*M) time complexity trap, heavily increasing CPU time in hot reducers when large lists of events and assets interact.
**Action:** Always pre-compute a lookup Map or Set in O(N+M) time before iterating, avoiding nested loops and duplicate `find` iterations for repeated keys.

## 2024-06-25 - Batch Network Requests in High-Frequency Paths

**Learning:** Mapping over an array to create multiple independent HTTP fetch requests for state submission (like per-song leaderboard scores in `submitLeaderboardScores`) causes an N+1 problem. This introduces significant network overhead, backend load, and increased latency as each promise initiates a separate connection.
**Action:** When a high-frequency path or post-action sync requires multiple submissions to the same endpoint, batch the payloads into a single array and send them via one network request.

## 2026-10-24 - Array Map/Filter/Reduce in Hot Paths

**Learning:** Replaced chained `.filter()` loops with single-pass `for...of` loops in hot logic paths like `questLifecycle.ts`. Functional array methods like `.filter()` invoke a callback for every element, which creates intermediate allocations and closure overhead, adding memory pressure and increasing GC pause times.
**Action:** Always prefer basic `for` or `for...of` loop iterations with accumulators or early returns over array chaining and functional array methods on heavily used data paths.

## 2024-05-31 - Replace Array map in recursive functions

**Learning:** Using `value.map()` inside recursive functions like `sanitizeTraversableValue` creates unnecessary closure allocations and intermediate arrays, hurting performance on deep traversals.
**Action:** Replace `Array.prototype.map()` in recursive paths with a pre-allocated procedural `for` loop to avoid closure overhead and array mapping overhead.

## 2024-06-28 - Avoid Array.find overhead in asset reducers

**Learning:** Using `Array.find` introduces closure allocation overhead and adds up to significant GC pressure on hot execution paths in large arrays within reducers, compared to basic looping.
**Action:** Replace `Array.find` lookups inside reducers with a fast procedural loop.

## 2025-02-23 - Optimize map/filter chain in buildSetlistChartDensity

**Learning:** Chained array methods like `.map().filter()` when processing song charts create intermediate array allocations that add up to significant GC pressure on hot paths.
**Action:** Replaced array iteration method chains with procedural `for` loops to directly construct the filtered and mapped lists in a single pass.

## 2024-06-11 - Replace O(N) array includes with Set lookup in filter loops

**Learning:** In `questLifecycle.ts`, using `base.includes(f)` within `merged.startFlags.filter` creates an O(N) lookup for each item in the array, making the operation O(N\*M). When the source arrays are large, this causes significant CPU overhead.
**Action:** When filtering an array based on whether items exist in another array, convert the base array into a `Set` before the loop to ensure O(1) membership lookups.

## 2026-11-04 - Array Methods inside Reducers and Engines

**Learning:** Using `Array.some` or `Array.filter` inside core domain engines (like `questAcceptance.ts` and `questOfferEngine.ts`) forces callback allocations and intermediate array creation. In high-frequency scenarios (such as evaluating conditions and availability), this produces significant GC spikes. Re-evaluating dictionaries with `Object.entries().flatMap()` creates multiple unneeded tuples and arrays before collapsing.
**Action:** Replace `Array.some` and `Array.filter` loops with procedural `for` loops in engine files. Replace `Object.entries().flatMap` pattern with a single-pass `for...in` loop (guarded by `Object.hasOwn`) to reduce multiple intermediate memory allocations.

## 2026-11-04 - Type-Safe Registry Iteration

**Learning:** When replacing `Object.entries(REGISTRY)` with a `for...in` loop to avoid intermediate tuple allocations, TypeScript widens the iteration key to `string`. Attempting to index the registry directly (`REGISTRY[key]`) results in a TS7053 error because the registry lacks a string index signature.
**Action:** When indexing a registry inside a `for...in` loop, explicitly assert the key type: `REGISTRY[key as keyof typeof REGISTRY]` to maintain type safety without allocating intermediate arrays.

## 2026-06-14 - Memoizing Stable Props for React.memo Components

**Learning:** When passing hook-derived functions (like `isConnected` from `useTravelLogic`) to heavily memoized child components (like `OverworldMap`), failing to wrap them in `useCallback` causes them to act as unstable object references. This invalidates `React.memo` and forces expensive downstream `useMemo` recomputations on every parent render.
**Action:** Always wrap functions returned by custom hooks in `useCallback` with proper dependency arrays if they are intended to be passed as props to memoized components.

## 2026-06-15 - Replace Array.map with Targeted Array Indexing in Hot Paths

**Learning:** Using `Array.prototype.map()` to update a single item within an array creates unnecessary iterations and completely new objects/array allocations. In hot update paths like `assetReducer.ts` and `questLifecycle.ts`, this generates excessive GC overhead.
**Action:** When updating a single known item in an array within a reducer or engine logic, use a `for` loop to locate the item's index, then shallow clone the array (`[...arr]`) and update only the targeted index (`arr[index] = newItem`). This avoids iterating and re-allocating objects for unmodified items.

## 2026-06-15 - Validate Module Payload Properties Before Slot Generation

**Learning:** When generating child slots based on a module installation (`handleInstallModule` in `assetReducer.ts`), naively iterating over `payload.newSlotIds` without verifying against the module's actual `addsSlots` configuration introduces a vulnerability where malicious or malformed payloads can generate unauthorized slots.
**Action:** Always validate arrays passed in payloads against the canonical configuration logic (e.g. `moduleInfo.addsSlots`) before executing state updates based on those payload sizes. Use `for` loops to correlate allowed slot types to requested entries to avoid unnecessary iteration and closure allocations on hot paths.

## 2026-06-20 - Replace .map() chains with procedural loops in state reducers

**Learning:** Using `Array.prototype.map()` to transform lists (like band members, active quests, or contraband effects) inside core reducers and state sanitizers creates unnecessary intermediate array allocations and closure overhead on every state change or load sequence, leading to severe GC pressure in hot paths.
**Action:** Replaced `.map()` array iterations with procedural `for` loops in reducers (e.g., `systemReducer.ts`, `clinicReducer.ts`, `minigameReducer.ts`, etc.). Pre-allocate the result array when the length is known (`new Array(source.length)`) to further reduce dynamic reallocation overhead.

## 2026-06-21 - Replace Array.some() with procedural loops in hot paths

**Learning:** Using `Array.prototype.some()` creates inline closure allocations that can cause noticeable garbage collection overhead when invoked inside hot data selectors and core domain logic loops (like module unlocks and quest engine checks). Benchmarks showed that replacing this with procedural `for` loops and `for...in` patterns yields an up to ~82.3x speedup on large collections.
**Action:** Replaced `.some()` loops with explicit `for` or `for...in` loops in frequently called utility files (`checks.ts`, `assetFinancials.ts`, `moduleUnlock.ts`, `questLifecycle.ts`) to avoid callback creation and minimize garbage collection spikes.

## 2026-06-24 - Replace O(N) Array.find with Map in React components

**Learning:** Using `Array.find()` inside a React render function on an array derived from `useMemo` causes an O(N\*M) iteration trap on every render when mapping over another array. This heavily increases CPU time in components with many items.
**Action:** Replace `Array.find` lookups inside render loops with a `useMemo` that precomputes a `Map` for O(1) access. Ensure type safety using explicit type guarding inside the `useMemo` loop before setting Map values.

## 2024-11-20 - Avoid redundant Set allocations in combinatorial loops

**Learning:** Instantiating `new Set()` inside a combinatorial loop (that runs `1 << N` times per render) creates excessive memory allocations and GC pressure, defeating the purpose of an O(1) lookup, especially if N is small (e.g., N=10).
**Action:** For small collections inside hot combinatorial loops, retain simple `Array.includes` lookups or hoist the collection outside the loop to avoid continuous reallocation overhead.

## 2024-11-20 - Array.includes vs Set

**Learning:** Using `Array.includes` inside loops with O(N\*M) time complexity is extremely inefficient in hot paths like the `processLiabilityTick` asset ticks reducer.
**Action:** Replace `Array.includes` in loops with `Set.has()` lookups and refactor iterator allocations (`for...of`) to traditional indexed arrays to significantly boost operations per second.


## 2026-06-28 - Avoid O(N log N) sorting for top N extraction

**Learning:** Using `.sort()` to extract the top N elements (e.g., top 3) from a collection has an O(N log N) time complexity and introduces sorting overhead. This creates unnecessary CPU overhead in hot paths like `generatePostOptions`.
**Action:** Replace `.sort()` with an O(N) procedural single-pass loop that tracks the top N elements directly when N is small.

## 2024-07-02 - Combine Object iteration and Array.filter in hot UI selectors

**Learning:** Using `Object.values()` to extract an array from a registry, and then using `.filter()` on the resulting array to perform domain logic within a selector (like `getModulePoolForAsset`) creates two unnecessary O(N) array allocations. When this selector is used in a React component dependent on frequently changing state (like player money), it generates significant garbage collection overhead.
**Action:** Replace `Object.values().filter()` patterns in hot selectors with a single-pass `for...in` loop (guarded by `Object.hasOwn()`), and push the filtering constraint down into the selector as an argument to avoid intermediate array allocations.
