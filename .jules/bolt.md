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
## 2024-05-24 - Avoid monkey patching JS native objects for performance tricks
**Learning:** Monkey-patching `Set.prototype.includes = Set.prototype.has` was used as a workaround to provide O(1) performance to consumer functions expecting Arrays. While performant, this is an anti-pattern. Passing Sets inside `optimizedState` directly and using a `hasStateItem` utility to route `has` vs `includes` preserves the exact same performance profile but keeps data structures pure.
**Action:** Use polymorphic helpers like `hasStateItem(collection, item)` instead of mutating instance methods on built-in types when dealing with optimized state objects that may temporarily convert underlying representations for lookup speed.

## 2025-05-24 - Avoiding Array Allocation for Nullable State
**Learning:** In PixiJS and similar mutable rendering contexts, actively tearing down collections (like filters or graphics modifiers) by re-assigning empty arrays (`[]`) triggers internal tracking, dirty checks, and GC overhead. Replacing it with `null` entirely bypasses these internal systems with zero allocations.
**Action:** Use `null` instead of `[]` when clearing optional property collections on rendering objects.
