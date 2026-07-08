# Bolt's Journal

> **2026-07-01 consolidation pass:** ~25 near-duplicate entries that all restated
> the same lesson ("replace `.map/.filter/.reduce/.some/.find/.forEach` chains with
> single-pass procedural loops on hot paths") were merged into the single canonical
> entry below, per this folder's rule (`.jules/AGENTS.md`: log only critical
> app-specific discoveries, not routine/repeated tips). Distinct learnings are kept
> verbatim. A stale `src/utils/eventEngine.ts` path was corrected to
> `src/utils/eventEngine/filterEvents.ts` (the module is now a directory). Several
> entries carried impossible future timestamps (2026-08…2026-11); those were folded
> into the canonical entry or re-dated to this pass.

## 2026-07-01 - Prefer single-pass procedural loops over array-method chains on hot paths (canonical)

**Learning:** Across reducers, sanitizers, selectors, domain engines, audio/MIDI processing, and PixiJS update loops, `.map()/.filter()/.reduce()/.some()/.find()/.forEach()` — plus `Object.entries()/values().<method>` and `map.entries()` — allocate intermediate arrays/tuples and a fresh closure per element. On this project's hot paths that is measurable GC pressure; a single-pass `for`/`for...of`/`for...in` loop that builds the result directly is consistently faster (a `.some()` → `for` swap benchmarked up to ~82x on large collections). Verified across `systemReducer`, `clinicReducer`, `minigameReducer`, `assetReducer`, `bandReducer` (`applyContrabandEffect`), `questLifecycle`, `questAcceptance`, `questOfferEngine`, `eventEngine/filterEvents.ts`, `postGigUtils`, `assetTicks` (`processLiabilityTick`), `assetSelectors`/`assetFinancials` (`getTotalDebt`, `getTotalDailyObligations`), `getModulePoolForAsset`, `buildSetlistChartDensity`, the recursive sanitizers, and `AudioManager.emitChange`.
**Action:**

- Replace array-method chains with one `for`/`for...of`/`for...in` loop; guard `for...in` with `Object.hasOwn()`. When the length is known, pre-allocate `new Array(source.length)`.
- To update ONE known element of an array, `for`-scan for the index, shallow-clone (`[...arr]`), then assign that index — don't `.map()` the whole array.
- For repeated lookups, precompute a `Map`/object once (inside `useMemo` on render paths) instead of repeated `Array.find()` (which is O(N·M) inside a loop). Prefer the project's existing precomputed Maps (`SONGS_BY_ID`, `HQ_ITEMS_BY_MERCH_KEY`).
- `Set.has()` beats `Array.includes()` ONLY when the Set is cached/reused across many lookups. Instantiating `new Set()` for a single or small-N (N < ~5) membership check is _slower_ than `.includes()` and adds allocation — don't convert one-off or combinatorial-loop checks; hoist or cache the Set instead.
- Iterating a `Map` in an `update()`/`requestAnimationFrame` loop: use `for (const key of map.keys())` and call `map.get(key)` only in the branch that needs the value; avoid `map.entries()`/`map.forEach()` tuple/closure allocations.
- Building a `Map` from an array: `for...of` + `.set()` rather than `new Map(array.map(...))` (skips the intermediate tuple array).
- When a `for...in` over a typed registry must index it, assert the key: `REGISTRY[key as keyof typeof REGISTRY]` — avoids TS7053 without allocating `Object.entries`.
- Compute sums/aggregations with an accumulator variable inside the populating loop; don't build an intermediate array only to `.reduce()` it in a second pass.

## 2025-03-02 - React memo for static UI decorations

**Learning:** Pure UI decoration components (like SVG icons) in heavily re-rendered environments like BrutalistUI.tsx should be wrapped in `React.memo()` to prevent unnecessary re-renders across the app, as their props typically consist only of simple string class names.
**Action:** Always use `React.memo` for static UI decorations, especially when creating custom UI component libraries.

## 2025-05-20 - E2E reliability vs unit tests for rendering logic

**Learning:** E2E tests (`playwright`) are unreliable for verifying rendering logic (like lane visibility) in this codebase due to frequent audio-context crashes/timeouts in the headless environment.
**Action:** Prioritize mocking rendering libraries (PixiJS) in unit tests to verify optimization logic (e.g., ensuring `clear()` is not called) rather than relying on visual verification via E2E scripts.

## 2025-05-20 - Intl.NumberFormat instantiation overhead

**Learning:** Re-instantiating `Intl.NumberFormat` in React functional components (even with `useMemo`) or within render loops (like mapping over quests) adds significant overhead. In a benchmark, repeated instantiation took ~600ms vs ~10ms for a cached instance over 10,000 runs.
**Action:** Always use the module-level caching utilities (`formatNumber` and `formatCurrency` in `src/utils/numberUtils.ts`) instead of `new Intl.NumberFormat` inline. Currency strings baked into toast `options` must be formatted at dispatch time with the active `i18n.language` — see the AGENTS.md note on locale-correct currency for reducers/action creators.

## 2026-03-18 - CSS token lookup overhead in PixiJS

**Learning:** Calling `getPixiColorFromToken` (which fetches computed CSS variables from the DOM) repeatedly inside a high-frequency `update(dt)` loop in PixiJS stage controllers causes severe frame drops. The utility caches internally, but the map lookup and repeated function calls are still too slow for 60fps game loops.
**Action:** When working with PixiJS controllers, cache CSS token color values to class instance properties (e.g., `this.colors = { ... }`) in the `constructor`/`setup` method, and read from those properties during the `update` phase.

## 2026-02-14 - Virality check: Set vs includes for small N

**Learning:** Using `Set.has()` instead of `Array.includes()` in `calculateViralityScore` didn't yield a noticeable improvement because dynamically allocating `new Set()` for small arrays dominates. O(1) lookups are mathematically better, but object allocation cost wins for N < ~5.
**Action:** When converting array lookups to Sets, ensure the Set is passed in / cached, or that N is large enough to offset instantiation. (Change was kept only because it was explicitly requested; the allocation caveat is noted.)

## 2026-04-02 - structuredClone overhead

**Learning:** `structuredClone` has significant overhead (~660ms vs ~10ms for 100k iterations) when duplicating simple nested objects on hot paths, like in `negotiateDeal`.
**Action:** Use manual shallow copying with object spread (`{ ...obj, nested: { ...obj.nested } }`) instead of `structuredClone` when deep cloning isn't strictly necessary or only specific nested objects are mutated.

## 2026-04-09 - Avoid instanceof checks in hot loops

**Learning:** In PixiJS render loops, `instanceof Sprite` walks the prototype chain every frame. The codebase tags display objects with an `isSprite: boolean` discriminant in `src/components/stage/CrowdManager.ts` and `src/components/stage/EffectSpritePool.ts` so per-frame branches stay O(1).
**Action:** When adding a hot-loop branch that distinguishes `Sprite` from `Graphics`, tag the object with a boolean flag at construction and read it in `update()`. Keep the `isSprite` discriminated-union pattern (`Sprite & { isSprite: true }` vs `Graphics & { isSprite: false }`) so TypeScript still narrows.

## 2026-04-12 - useRhythmGameAudio infinite loop and lock starvation

**Learning:** `useRhythmGameAudio` suffered an OOM infinite loop because it passed complex objects (`band`, `gameMap`, `setlist`) into a `useCallback` dependency array, recreating `initializeGigState` every render. This masked a lock-starvation issue where `isInitializingRef` was never released if setup aborted. The test suite (`rhythmGameLogicMultiSong.test.js`) had relied on the re-render loop and failed once the hook was stabilized.
**Action:** Stabilize `useCallback`/`useEffect` deps using strictly mapped primitives (`band?.members?.length`, `band?.harmony`, `player?.currentNodeId`, `setlist?.length`, …) and wrap initialization in `try/finally` to guarantee lock release.

## 2026-04-15 - Vitest project split (node vs jsdom)

**Learning:** Running pure-Node logic tests inside a global `jsdom` environment with heavy browser-API setup adds large per-file overhead, and `isolate: true` re-runs `setupFiles` per file. This project keeps two configs: `vitest.config.js` (jsdom, `setupFiles: ['./tests/vitest.setup.js']`) and `vitest.config.node.js` (node env, no DOM setup), with the legacy `node --test` suite also in use.
**Action:** Route new tests to the lightest viable runner — `node --test` for pure logic (see `AGENTS.md` for the command), `vitest.config.node.js` for fast DOM-less Vitest suites, and `vitest.config.js` only when JSDOM/RTL is required. Don't add heavy global mocks to `tests/vitest.setup.js` without weighing the per-file cost.

## 2026-04-15 - Heckler overlay rendering optimization

**Learning:** In a high-frequency `requestAnimationFrame` loop, modifying `node.style.top`/`node.style.left` causes layout thrashing (layout + paint).
**Action:** Prefer `node.style.transform` with `translate3d(x, y, 0)` for positional animations — hardware-accelerated and avoids layout recalculation.

## 2026-04-20 - Component list memoization (ShopItem)

**Learning:** Mapping arrays of complex sub-components without `React.memo` (like `ShopItem` inside `src/ui/bandhq/CatalogTab.tsx`) causes O(N) re-renders when parent BandHQ state changes, even with referentially stable primitive props.
**Action:** Wrap row components rendered inside high-frequency BandHQ tabs with `React.memo` and stabilize handler props with `useCallback`. The `useGameSelector(state=>state)` pattern provides no memoization benefit on its own — the child must be memoized.

## 2026-04-20 - Component list memoization (SongRow)

**Learning:** `SongRow` is implemented twice — in `src/ui/bandhq/SetlistTab.tsx` and in `src/components/pregig/SetlistBlock.tsx`. Both must stay wrapped in `React.memo` because they are mapped over the full setlist and otherwise re-render on every parent state change.
**Action:** When touching either `SongRow`, preserve `React.memo` and keep `toggleSongInSetlist` (and other handler props) stable with `useCallback` in the parent. Keep both copies in sync if the row prop shape changes.

## 2026-04-20 - Loop unrolling tradeoffs

**Learning:** Unrolling loops across configuration objects (e.g., `SOCIAL_PLATFORMS`) yields minor speedups but introduces significant maintainability regressions by hardcoding dynamic keys.
**Action:** Never unroll iterations over configuration data or sources of truth. Reserve loop unrolling for pure computational arrays of fixed size.

## 2026-04-20 - Array allocations in random utilities

**Learning:** Using `[...arr]` shallow-copying inside generic random subset utilities like `pickRandomSubset` is detrimental for performance and GC when array sizes scale or frequency is high.
**Action:** For subset/shuffle algorithms, prefer direct index lookups (k=1, k=2) or sparse Fisher-Yates with a Map (for small subsets relative to array length) rather than unconditionally copying the whole source array.

## 2026-05-12 - isEmptyObject vs Object.keys().length

**Learning:** `Object.keys(obj).length === 0` allocates an array just to count it. In hot paths that frequently check "is this object empty", `isEmptyObject` (from `src/utils/gameStateUtils.ts`) uses a `for…in` short-circuit instead.
**Action:** Import `isEmptyObject` from `src/utils/gameStateUtils.ts` for empty-object checks on hot paths (event delta containers, reducer guards, selector early-outs). Don't reintroduce `Object.keys(x).length === 0` there.

## 2026-05-24 - Avoid monkey-patching JS native objects for performance

**Learning:** Monkey-patching `Set.prototype.includes = Set.prototype.has` was used to give O(1) lookups to consumers expecting Arrays. It works but is an anti-pattern. Passing Sets inside `optimizedState` directly and using a `hasStateItem` utility to route `has` vs `includes` preserves the same performance profile while keeping data structures pure.
**Action:** Use polymorphic helpers like `hasStateItem(collection, item)` instead of mutating instance methods on built-in types when optimized state objects may temporarily change their underlying representation.

## 2026-05-24 - Avoiding array allocation for nullable state

**Learning:** In PixiJS and similar mutable rendering contexts, tearing down collections (filters, graphics modifiers) by re-assigning empty arrays (`[]`) triggers internal tracking, dirty checks, and GC overhead. Assigning `null` bypasses these systems with zero allocation.
**Action:** Use `null` instead of `[]` when clearing optional property collections on rendering objects.

## 2026-05-24 - Redundant child removal before destroy() in PixiJS

**Learning:** Calling `container.removeChild(sprite)` before `sprite.destroy()` is redundant — PixiJS automatically removes a destroyed display object from its parent.
**Action:** Call `sprite.destroy()` directly when cleaning up entities in PixiJS update loops.

## 2026-05-25 - Wrap prop-derived collections in useMemo

**Learning:** Recreating objects like Sets inside a functional component body from props forces re-allocation and GC on every render (compounded when `Object.values(obj).filter()` chains feed the Set with intermediate arrays). Observed in CableList.
**Action:** When a Set/collection is derived from props, wrap it in `useMemo` so unrelated prop changes don't reallocate it, and build it with a `for...in` loop inside the memo to avoid intermediate arrays.

## 2024-06-12 - Conditional logging in dispatch

**Learning:** Unconditional string interpolation in high-frequency hooks (like reducers) creates string allocations even when the logger suppresses output. Missing property checks on action payloads can also crash.
**Action:** Guard string interpolations and logger calls behind `import.meta.env.DEV`, and verify payload objects before logging their properties in hot dispatch paths.

## 2024-06-14 - Memoizing stable props for React.memo components

**Learning:** Passing hook-derived functions (like `isConnected` from `useTravelLogic`) to heavily memoized children (like `OverworldMap`) without `useCallback` makes them unstable references, invalidating `React.memo` and forcing downstream `useMemo` recomputes every parent render.
**Action:** Wrap functions returned by custom hooks in `useCallback` (with correct deps) when they are passed as props to memoized components.

## 2024-06-15 - Validate module payload properties before slot generation

**Learning:** In `handleInstallModule` (`assetReducer.ts`), iterating `payload.newSlotIds` without checking the module's actual `addsSlots` config lets malformed payloads generate unauthorized slots.
**Action:** Validate payload arrays against the canonical config (`moduleInfo.addsSlots`) before applying state updates sized from the payload; correlate allowed slot types to requested entries in a `for` loop.

## 2024-06-25 - Batch network requests in high-frequency paths

**Learning:** Mapping over an array to fire multiple independent HTTP fetches for state submission (like per-song leaderboard scores in `submitLeaderboardScores`) causes an N+1 problem — connection overhead, backend load, latency.
**Action:** When a path requires multiple submissions to the same endpoint, batch the payloads into one array and send them in a single request.

## 2026-06-28 - Avoid O(N log N) sorting for top-N extraction

**Learning:** Using `.sort()` to extract the top N elements (e.g., top 3) is O(N log N) and adds sorting overhead in hot paths like `generatePostOptions`.
**Action:** Replace `.sort()` with an O(N) single-pass loop that tracks the top N directly when N is small.

## 2026-07-02 - React runtime import omission for types

**Learning:** Pulled in a runtime `React` import only to use `ReactNode` in a type context, causing CI pipeline failure due to the `isolatedModules` strict rule requiring type-only imports for types.
**Action:** Always use type-only imports (`import type { Foo }` or `import { type Foo }`) when importing items solely used as types, specifically `ReactNode` from `react`, to comply with strict module parsing bounds in the project.

## 2026-07-28 - countKeys procedural utility

**Learning:** Checking the number of keys on an object using `Object.keys(obj).length` causes unnecessary array allocation in memory, particularly in hot-path reducers.
**Action:** Use the `countKeys(obj)` or `isEmptyObject(obj)` utility from `src/utils/gameState/checks.ts` instead of `Object.keys(obj).length` to count keys using a procedural loop with zero allocation.
