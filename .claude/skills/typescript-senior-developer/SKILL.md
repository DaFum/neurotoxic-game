---
compatibility: Node.js 22.13+, pnpm
metadata:
  version: "1.0.0"
  author: "neurotoxic-project"
  category: "development"
  keywords: ["typescript", "typing", "refactoring"]
  maturity: "beta"
license: 'MIT. See /LICENSE for terms'
name: typescript-senior-developer
description: >
  TypeScript senior-developer guidance for the NEUROTOXIC codebase — writing,
  reviewing, refactoring, and migrating TypeScript with strict-mode discipline.
  Trigger when: adding types to a `.js`/`.jsx` file, migrating JS to TS, fixing
  `tsc` errors, chasing `any` leaks, writing generics or conditional/mapped types,
  designing a discriminated union, typing a reducer or action creator, picking
  `type` vs `interface`, narrowing `unknown` (API/JSON/localStorage), writing
  type guards, typing React 19 props/refs/hooks, asking "how do I type this?",
  deciding between `as` / `satisfies` / type assertion, choosing a utility type
  (`Partial`/`Pick`/`Extract`/`Omit`/`Record`/`ReturnType`/`Parameters`), handling
  `@ts-expect-error` suppressions, touching `src/types/` or `src/context/action*`,
  extending a clamp in `gameStateUtils.ts`, or working with `SONGS_BY_ID`-style
  lookup Maps. Also trigger for tsconfig questions, `isolatedModules` / `import type`
  errors, module augmentation, and `.d.ts` editing.
---

# TypeScript Senior Developer

## Table of Contents
- [Core Principles](#core-principles)
- [Project Conventions Cheat Sheet](#project-conventions-cheat-sheet)
- [Type vs Interface](#type-vs-interface)
- [`as const` + `keyof typeof` for Enum-Like Objects](#as-const-keyof-typeof-for-enum-like-objects)
- [Discriminated Unions + `Extract<>`](#discriminated-unions-extract)
- [Narrowing `unknown` at Boundaries](#narrowing-unknown-at-boundaries)
- [Utility Types — Used in This Project](#utility-types-used-in-this-project)
- [`satisfies` — Prefer Over `as`](#satisfies-prefer-over-as)
- [`import type` and `isolatedModules`](#import-type-and-isolatedmodules)
- [Generics — Constrain Narrowly](#generics-constrain-narrowly)
- [React 19 + TypeScript](#react-19-typescript)
- [Common Anti-Patterns (Found in Real Reviews)](#common-anti-patterns-found-in-real-reviews)
- [Migration Guide (JS → TS)](#migration-guide-js-ts)
- [Review Checklist](#review-checklist)
- [References](#references)


Expert TypeScript guidance for strict, idiomatic, production-quality code in this
codebase. The project runs `strict: true`, `strictNullChecks`, `noImplicitAny`,
`checkJs`, `isolatedModules`, `moduleResolution: "bundler"`, with zero tolerance
for `@ts-nocheck` and a `@ts-expect-error` budget of 0 in `src/`.

Use in two modes:

- **Writing** — producing or editing TS (answer the immediate question, then scan
  for project-specific patterns below that apply).
- **Reviewing** — run the checklist at the bottom against the diff.

---

## Core Principles

**Encode constraints, not just shapes.** `harmony: number` allows `-999` or
`NaN`. Push invariants into the type system (or into a single clamp function) so
downstream code doesn't re-check. See the clamp pattern in
`src/utils/gameStateUtils.ts`.

**Narrow at the boundary, trust the interior.** Validate `unknown` once — on API
response, `JSON.parse`, `localStorage`, event payloads — then pass specific
types. Don't keep re-checking `if (x != null)` in every helper.

**Never `any`; `unknown` when genuinely unknown.** `any` disables checking and
leaks. `unknown` forces narrowing. Project allows `as any` only in legacy
hotspots (5 files, 15 sites) — don't add new ones.

**Explain suppressions.** `@ts-expect-error` (not `@ts-ignore`) with a one-line
reason. It auto-fails when the underlying error is fixed — prevents suppressions
from outliving the bug.

---

## Project Conventions Cheat Sheet

| Area              | Rule                                                                      | Source                          |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------- |
| Shared types      | Live in `src/types/*.d.ts` (`game.d.ts`, `audio.d.ts`, `components.d.ts`) | `src/types/index.ts`            |
| Action types      | `as const` object + `keyof typeof` for the union                          | `src/context/actionTypes.ts`    |
| Action creators   | Return `Extract<GameAction, { type: typeof ActionTypes.X }>`              | `src/context/actionCreators.ts` |
| Clamps            | Apply at the action creator, not the reducer                              | `createUpdatePlayerAction`      |
| Lookup maps       | `Map<ID, T>`, populated once, consumers use `.get()?`                     | `SONGS_BY_ID`                   |
| Type-only imports | Required — `isolatedModules: true`                                        | `tsconfig.json`                 |
| Strict JS         | `checkJs: true` — `.js` files are type-checked                            | `tsconfig.json`                 |

---

## Type vs Interface

`interface` for **extendable** object shapes (actual extension or declaration
merging):

```ts
// src/types/game.d.ts pattern
interface MapNode {
  id: string
  x: number
  y: number
  neighbors?: string[]
}
interface VenueNode extends MapNode {
  venueId: string
}
```

`type` for **unions, intersections, aliases, computed, and tuple types**:

```ts
// src/context/actionTypes.ts
export const ActionTypes = {
  CHANGE_SCENE: 'CHANGE_SCENE',
  UPDATE_PLAYER: 'UPDATE_PLAYER'
  // ...
} as const
export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes]
```

In doubt, prefer `type` — more composable. Use `interface` when you need
`extends` or ambient merging.

---

## `as const` + `keyof typeof` for Enum-Like Objects

The project doesn't use TS `enum` (not isolatedModules-friendly). Use frozen
objects instead:

```ts
// Good — runtime object + type derived from it
export const ActionTypes = {
  CHANGE_SCENE: 'CHANGE_SCENE',
  UPDATE_PLAYER: 'UPDATE_PLAYER'
} as const
export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes]
// ActionType = 'CHANGE_SCENE' | 'UPDATE_PLAYER'

// Consumers reference by key (refactor-safe)
dispatch({ type: ActionTypes.CHANGE_SCENE, payload: 'MENU' })
```

The `as const` is load-bearing — without it, values widen to `string` and the
discriminated union collapses.

---

## Discriminated Unions + `Extract<>`

The reducer action union is discriminated on `type`. Action creators use
`Extract` to return the exact member without re-declaring its payload:

```ts
// src/context/actionCreators.ts
export const createChangeSceneAction = (
  scene: string
): Extract<GameAction, { type: typeof ActionTypes.CHANGE_SCENE }> => ({
  type: ActionTypes.CHANGE_SCENE,
  payload: scene
})
```

Why `Extract` and not a hand-written `{ type: ...; payload: ... }`? Because
`GameAction` is the single source of truth. Add a new action variant and every
creator's return type updates automatically; the compiler catches creators that
drift.

### Exhaustive reducer

```ts
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case ActionTypes.CHANGE_SCENE:
      return { ...state, currentScene: action.payload }
    // ...
    default:
      return assertNever(action)
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`)
}
```

When you add a new action type, the `default` branch turns red at compile time —
the skill check that catches missing-case bugs.

---

## Narrowing `unknown` at Boundaries

External data (API, `JSON.parse`, `localStorage`, `postMessage`, user-generated
events) starts as `unknown`. Narrow once, then trust:

```ts
function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem('gameState')
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isGameState(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function isGameState(v: unknown): v is GameState {
  return (
    typeof v === 'object' &&
    v !== null &&
    Object.hasOwn(v, 'player') &&
    Object.hasOwn(v, 'currentScene')
  )
}
```

### Prototype-pollution-safe property checks

Because parsed JSON can carry `__proto__`, `constructor`, `prototype` keys, the
project uses `Object.hasOwn()` (not `in` or `hasOwnProperty`) before touching a
key. This pattern recurs in `gameStateUtils.ts` and `playerReducer`:

```ts
if (Object.hasOwn(updates, 'money')) {
  safeUpdates.money = clampPlayerMoney(updates.money)
}
```

Tests assert the forbidden keys are stripped using
`Object.hasOwn(obj, '__proto__')` (see `CLAUDE.md`).

---

## Utility Types — Used in This Project

| Utility          | Project use                                                                   |
| ---------------- | ----------------------------------------------------------------------------- |
| `Partial<T>`     | `UpdatePlayerPayload = Partial<PlayerState> \| ((s) => Partial<PlayerState>)` |
| `Pick<T, K>`     | Narrow a context value passed to a sub-component                              |
| `Omit<T, K>`     | Strip `id` before persisting, add it back on load                             |
| `Extract<U, V>`  | Action creator return types (see above)                                       |
| `Exclude<U, V>`  | Remove a scene from the allowed list for a sub-flow                           |
| `ReturnType<F>`  | Infer reducer or selector output without re-declaring                         |
| `Parameters<F>`  | Mirror a callback signature in a mock or wrapper                              |
| `NonNullable<T>` | After `.filter(Boolean)` / `.find(x => x)` narrowing                          |
| `Record<K, V>`   | Dictionaries keyed on a string union (`Record<SceneName, Config>`)            |
| `Readonly<T>`    | Frozen constants (`Object.freeze` + `Readonly`)                               |

```ts
// Extract a payload type by action name — project-idiomatic
type PayloadFor<T extends ActionType> = Extract<
  GameAction,
  { type: T }
>['payload']

// Usage
type ScenePayload = PayloadFor<typeof ActionTypes.CHANGE_SCENE> // string
```

---

## `satisfies` — Prefer Over `as`

`satisfies` checks a value against a type without widening or narrowing its
inferred shape. Use it for config objects keyed on a union:

```ts
type SceneName = 'MENU' | 'OVERWORLD' | 'PREGIG' | 'GIG' | 'POSTGIG'

// Bad: `as Record<SceneName, string>` discards literal types
const SCENE_BG = { MENU: 'menu.png', OVERWORLD: 'map.png' /* ... */ } as Record<
  SceneName,
  string
>

// Good: satisfies preserves literal inference AND checks keys exhaust the union
const SCENE_BG = {
  MENU: 'menu.png',
  OVERWORLD: 'map.png',
  PREGIG: 'pregig.png',
  GIG: 'gig.png',
  POSTGIG: 'postgig.png'
} as const satisfies Record<SceneName, string>

SCENE_BG.MENU // type: 'menu.png' (not string)
```

Rule of thumb: `satisfies` when you want the compiler to validate _and_ keep the
exact shape; `as` only for trailing type assertions you can't express otherwise
(and document why).

---

## `import type` and `isolatedModules`

`isolatedModules: true` means every file is transpiled independently (Vite /
esbuild). Type-only imports must be explicit:

```ts
// Good — elided at build time, no runtime import
import type { GameAction, PlayerState } from '../types/game'
import { ActionTypes } from './actionTypes' // runtime value

// Bad — may cause "isolatedModules" errors if the file only exports types
import { GameAction } from '../types/game'
```

If a file exports both types and values, mix forms:

```ts
import { ActionTypes, type ActionType } from './actionTypes'
```

Symptom of getting this wrong: Vite dev server builds fine, `tsc --noEmit`
reports `isolatedModules` violations, or an unused import warning on a type.

---

## Generics — Constrain Narrowly

Write generics when the operation is identical but the type varies. Constrain as
tightly as possible so callers get usable inference:

```ts
// Good — constrained
function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

// Good — typed lookup wrapper
function getById<T extends { id: string }>(
  map: Map<string, T>,
  id: string
): T | undefined {
  return map.get(id)
}

// Bad — too loose, T is unused
function logIt<T>(x: T): void {
  console.log(x)
} // just take unknown
```

### Typed Map lookup (project pattern)

```ts
// src/data/songs.ts
export const SONGS_BY_ID: Map<string, Song> = new Map(
  songs.map(s => [s.id, s] as const)
)

// Consumer
const song = SONGS_BY_ID.get(id)
if (!song) return // narrows .get() from Song | undefined -> Song below
const leaderboardId = song.leaderboardId
```

Never pretend `.get()` returns non-undefined via `!` — always narrow.

---

## React 19 + TypeScript

### Props

```tsx
// Inline for one-off components
function ScoreDisplay({ score, label }: { score: number; label: string }) {
  return (
    <div>
      {label}: {score}
    </div>
  )
}

// Named interface for shared/documented props
interface OverloadMeterProps {
  value: number // 0–100
  className?: string
}
function OverloadMeter({ value, className }: OverloadMeterProps) {
  /* ... */
}
```

### Ref as prop (NOT `forwardRef`)

React 19 passes `ref` as a normal prop; `forwardRef` is deprecated in this
codebase:

```tsx
interface InputProps extends React.ComponentProps<'input'> {
  ref?: React.Ref<HTMLInputElement>
}
function Input({ ref, ...props }: InputProps) {
  return <input ref={ref} {...props} />
}
```

### Typed hooks

```tsx
const [scene, setScene] = useState<SceneName>('MENU')
const canvasRef = useRef<HTMLCanvasElement>(null)

// Event handlers
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  /* ... */
}
```

### `t` in deps

Any callback/effect that calls `t('key')` inside must include `t` in deps —
stable across renders but linted. (See AGENTS.md.)

---

## Common Anti-Patterns (Found in Real Reviews)

| Anti-pattern                         | Why it bites                                      | Fix                                                    |
| ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| `as any`                             | Disables all downstream checking; silent breakage | `unknown` + guard, or proper type                      |
| `// @ts-ignore`                      | Hides errors forever, survives refactors          | `// @ts-expect-error <reason>` — auto-fails when fixed |
| `[key: string]: any`                 | Defeats key safety                                | `Record<K, V>` with explicit key union                 |
| `object`                             | Too broad — no property access                    | Specific interface or `Record<string, unknown>`        |
| `as X` without narrowing first       | Unsafe at runtime                                 | Narrow via guard, then cast if needed                  |
| `Function`                           | No signature check                                | `(...args: A) => R`                                    |
| `?.` as nullability-escape           | Hides the real optional field                     | Fix the source type                                    |
| Casting action types                 | Breaks discriminated union                        | Use `Extract<GameAction, { type: ... }>`               |
| Re-clamping in the reducer           | Work duplicated from action creator               | Clamp once in `createUpdate*Action`                    |
| `as const` missing on lookup objects | Values widen, union collapses                     | Add `as const satisfies Record<K, V>`                  |

---

## Migration Guide (JS → TS)

This project's migration is substantially complete. When converting a new file
or adding types to a `.js` file checked by `checkJs`:

1. **Boundary first** — type exported functions; interior inference usually
   follows.
2. **Use `unknown` for externally-shaped data**, then narrow with a guard.
3. **Lift shared shapes to `src/types/game.d.ts`** (or a sibling `.d.ts`) —
   don't duplicate structural types across modules.
4. **Prefer additive changes** — add optional fields, widen carefully. Breaking
   changes need matching updates to action types, reducers, and action creators
   in the same commit.
5. **`@ts-expect-error` with a reason** for truly unavoidable temporary
   suppressions. Delete it once the underlying issue is fixed (the compiler
   will force you to).

---

## Review Checklist

Run through this when reviewing a TS diff:

- [ ] No new `any` (check `as any`, `: any`, `any[]`, `Record<string, any>`)
- [ ] External data narrowed at the boundary, not sprinkled through consumers
- [ ] Action creators return `Extract<GameAction, ...>`; reducer uses discriminated union
- [ ] Reducer switch is exhaustive (`assertNever` in `default`)
- [ ] `as const` on lookup objects; `satisfies` preferred over `as` for config
- [ ] `Object.hasOwn()` (not `in` / `hasOwnProperty`) for untrusted property checks
- [ ] Clamps applied in action creators, not duplicated in reducers
- [ ] Shared contracts live in `src/types/`, not inlined in multiple modules
- [ ] `import type` for type-only imports; `isolatedModules` clean
- [ ] React 19 `ref` passed as prop; no new `forwardRef`
- [ ] Generic constraints as narrow as they can be
- [ ] Any `@ts-expect-error` has a one-line reason and is scoped to one line
- [ ] `t` included in React hook deps when used in callback scope

---

## References

For deeper dives, load from `references/`:

| Topic                                                        | File                                |
| ------------------------------------------------------------ | ----------------------------------- |
| Conditional types, `infer`, template literals, branded types | `references/advanced-types.md`      |
| Module augmentation, declaration merging, `.d.ts` authoring  | `references/module-augmentation.md` |
| tsconfig options deep-dive, `isolatedModules` edge cases     | `references/tsconfig.md`            |
