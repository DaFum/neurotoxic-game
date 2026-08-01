## 2026-07-28 - countKeys procedural utility

**Learning:** Checking the number of keys on an object using \`Object.keys(obj).length\` causes unnecessary array allocation in memory, particularly in hot-path reducers.
**Action:** Use the \`countKeys(obj)\` or \`isEmptyObject(obj)\` utility from \`src/utils/gameState/checks.ts\` instead of \`Object.keys(obj).length\` to count keys using a procedural loop with zero allocation.

## 2026-07-09 - Avoid IIFEs when replacing Array methods

**Learning:** When replacing array methods like \`.map()\` with procedural loops to avoid closure allocations, wrapping the loop in an Immediately Invoked Function Expression (IIFE) (e.g., \`(() => { ... })()\`) creates a new closure anyway, defeating the purpose of the optimization while also hurting readability.
**Action:** Refactor the surrounding function to use an explicit block body and compute the array procedurally before the \`return\` statement.

## 2026-07-09 - Explicit types for Array instantiation

**Learning:** Pre-allocating an array with \`new Array(length)\` returns \`any[]\` and breaks type safety.
**Action:** Always provide an explicit type argument like \`new Array<T>(length)\` to ensure the array stays strictly typed.

## 2024-07-11 - Procedural loop in Action Creators payload sanitization

**Learning:** Action payloads (like \`EventDeltaPayload\` which contains \`relationshipChange\`) are heavily processed. Using \`Array.some\` followed by \`Array.map\` to detect and stamp timestamps allocates closures and intermediate arrays on every high-frequency \`APPLY_EVENT_DELTA\` dispatch.
**Action:** Replace \`Array.some\` and \`Array.map\` in action creator payload sanitisers with procedural loops and explicitly typed pre-allocated arrays (e.g., \`new Array<unknown>(length)\`).

## 2026-07-14 - Missing inline comments in micro-optimizations

**Learning:** When performing performance optimizations, like replacing array methods (e.g. \`.filter()\`) with procedural loops to avoid closure allocations, code review requires explicitly explaining the change with comments inline in the codebase (e.g., \`// ⚡ BOLT OPTIMIZATION:\` and \`// Why:\` / \`// Impact:\`). Submitting un-commented micro-optimizations leads to rejection because they sacrifice readability without explaining the rationale.
**Action:** Always add the required comments right above the optimized block of code, outlining the \`What\`, \`Why\`, and \`Impact\`, just like in the PR description.

## 2024-10-27 - Procedural loops and Sparse Array Bugs

**Learning:** When performing micro-optimizations, replacing \`.map()\` with pre-allocated \`for\` loops (e.g. \`new Array(len)\`) and using \`if (!item) continue\` to guard against nulls inadvertently creates sparse arrays with uninitialized holes. \`.map()\` handles empty/null items differently. Additionally, replacing declarative array methods when the inner loop still allocates heavily (e.g., via object spread) provides negligible GC relief while sacrificing readability.
**Action:** Only refactor array methods to procedural loops when collapsing multiple array iteration passes (like a \`.filter().map()\` chain or an allocation followed by another iteration) into a single batching pass. Do not simply swap \`.map()\` for \`for\` loops if the iteration body still allocates new objects.

## 2024-11-20 - Rejecting Cold Path Micro-Optimizations

**Learning:** Replacing array methods like \`.filter().length\` with procedural \`for\` loops in cold paths (e.g., action creators triggered by user clicks, like \`installModule\`) does not produce measurable performance improvements and sacrifices code readability. Code review will reject such optimizations as premature and violating constraints.
**Action:** Only optimize arrays with procedural loops on highly active hot paths (e.g., game loop ticks, rendering updates, core state reducers) where garbage collection pressure is continuous and measurable.

## 2026-07-21 - Reducing Object.values on Game Loop Ticks

**Learning:** \`Object.values(obj)\` allocates an array on every invocation. If used inside high-frequency ticking operations (like the daily game tick \`processLiabilityTick\`), this results in constant intermediate array allocations which causes cumulative Garbage Collection pressure.
**Action:** Replace \`Object.values(obj)\` with \`for...in\` loops in hot path routines to avoid allocating temporary arrays altogether. Ensure to include the standard \`if (!Object.hasOwn(obj, key))\` bounds-checking and an existence check on the value.

## 2024-01-22 - Reducing Object.keys on Game State Updates

**Learning:** \`Object.keys(obj)\` allocates an array on every invocation. When applied to frequent operations like game state delta applications, sanitizers (e.g. loading game save files, handling high-frequency \`APPLY_EVENT_DELTA\` payloads), this causes unnecessary short-lived arrays that place heavy pressure on GC.
**Action:** Replace \`Object.keys(obj)\` iterations with \`for...in\` loops combined with \`Object.hasOwn()\` checks on these hot paths to eliminate the array allocation overhead completely. Make sure this is applied mainly to hot paths.
