---
name: neurotoxic-repo-guard
description: Use when modifying state reducers, action creators, i18n keys, audio calls, timing logic, or running test gates in the Neurotoxic codebase
---

# Neurotoxic Repo Guard

Ultimate developer skill for working on the **Neurotoxic** codebase cleanly, safely, and efficiently.

## Overview

This skill synthesizes all repository-specific architectural invariants, testing protocols, state safety rules, performance gotchas, and workflow requirements into a single actionable operational guide.

## Key Repository Rules & Guardrails

### 1. State Management & Reducer Integrity
- **Action Creators:** Always dispatch actions via typed action creators (`src/context/actionCreators.ts`). Never dispatch raw object literals.
- **Sanitization:** Action creators sanitize raw input; reducers remain authoritative and reject hostile payloads or re-clamp values.
- **Persisted Numbers:** Wrap stored addends with `finiteNumberOr(value, fallback)` before any arithmetic/clamp. `??` and `typeof value === 'number'` DO NOT reject `NaN` or `Infinity`.
- **Sparse Member Arrays:** `band.members` can contain sparse holes (`undefined`). Preserve exact array index positions using pre-allocated arrays (`new Array(members.length)`) during clones; do not use `.push()` or `.filter()`.
- **RNG Calls:** Do not advance global RNG streams (`state.rng()`) for zero-probability events. Guard with conditional checks (e.g., `if (critChance > 0)`).

### 2. Time & Clock System
- **Gameplay Timing:** Use `audioEngine.getGigTimeMs()`, NEVER direct Tone.js time reads.
- **Non-Gameplay Time:** Timestamps, cooldowns, and persistence metadata must use `IClock` from `src/utils/clock.ts` (`useClock()` in components, or parameter defaulting to `systemClock` in pure helpers).

### 3. Internationalization (i18n)
- **Locale Updates:** Always update English (`public/locales/en/*.json`) and German (`public/locales/de/*.json`) locale files together when adding or modifying keys.
- **Toast Currency:** Baked currency in dispatched toast options must use `formatCurrency(value, i18n.language, signDisplay)`.

### 4. Audio Engine & Nodes
- **Audio Stack:** The audio stack is strictly Tone.js through `src/utils/audio/audioEngine.ts`. Howler.js is prohibited.
- **Node Spread:** NEVER use object spread (`{ ...node }`) or `Object.assign({}, node)` on Web Audio / Tone.js nodes, as it strips class prototypes and native methods (`dispose`, `stop`).
- **Callback Returns:** Audio callbacks (`pauseAudio`, `resumeAudio`) can return `void`/`undefined` on success. Test strictly for explicit failure using `=== false` rather than `!result`.

### 5. Performance Guidelines
- **Hot Path Loops:** Avoid inline callback methods (`.map()`, `.filter()`, `.some()`) in high-frequency state reducers. Use pre-allocated procedural `for` loops.
- **Object Iteration:** Prefer procedural `for...in` loops with `Object.hasOwn(obj, key)` over `Object.values()` / `Object.entries()`. Use native `Object.keys(obj).length` for length checks.
- **Set Initialization:** Populate `Set` instances using procedural loops (`for ... set.add()`) instead of chaining `.map()`.

## Fast Verification Commands

| Action | Command |
| --- | --- |
| **Fast Tests** | `pnpm run test` or `pnpm run test:node:quick` |
| **Typecheck Core** | `pnpm run typecheck:core` |
| **Typecheck Reducers** | `pnpm run typecheck` |
| **Single Node Test** | `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js` |
| **Single Vitest File** | `pnpm exec vitest run tests/<file>.test.jsx` |
| **Dead Code Check** | `pnpm run deadcode:check` |
| **Full Build** | `pnpm run build` |

## Red Flags - STOP Immediately

- Dispatching raw inline objects (`dispatch({ type: ... })`)
- Coercing inputs using `Number(val)` instead of strict narrowing with `isFiniteNumber(val)`
- Using `??` for numeric sanitization instead of `finiteNumberOr()`
- Modifying `band.members` with `.filter()` or `.push()` directly
- Modifying EN locale JSON without updating DE locale JSON
