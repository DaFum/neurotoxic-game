---
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
compatibility: Node.js 22.13+, pnpm
metadata:
  version: "1.0.0"
  author: "neurotoxic-project"
  category: "development"
  keywords: ["typescript", "typing", "refactoring"]
  maturity: "beta"
license: 'MIT. See LICENSE for terms'
---

# TypeScript Senior Developer

This skill guides you in writing and reviewing TypeScript code in the NEUROTOXIC repository, adhering to strict-mode safety and codebase-specific patterns.

## Table of Contents
- [Why This Skill Exists](#why-this-skill-exists)
- [Strict Mode & "Never Any"](#strict-mode--never-any)
- [Common TypeScript Patterns](#common-typescript-patterns)
- [State & Actions (Redux-Style)](#state--actions-redux-style)
- [Unknowns, Assertions, & Guards](#unknowns-assertions--guards)
- [Handling Maps and Lookups](#handling-maps-and-lookups)
- [React Components & Hooks](#react-components--hooks)
- [Migrating JS to TS](#migrating-js-to-ts)
- [Tsconfig & Build Boundaries](#tsconfig--build-boundaries)

## Why This Skill Exists

The `NEUROTOXIC` codebase is migrating toward a highly robust, strict TypeScript environment. We reject leaky `any`s, dangerous assertions, and unchecked accesses. This skill ensures you write types that actually provide safety, rather than just satisfying the compiler.

## Strict Mode & "Never Any"

1. **Absolutely No `any`:** Never use `any`. Use `unknown` and narrow it with type guards.
2. **No `@ts-nocheck`:** The `@ts-nocheck` directive is banned.
3. **Use `@ts-expect-error` Sparingly:** If a typing issue is genuinely insurmountable or a library type is broken, use `@ts-expect-error <reason>` and leave a comment explaining why. Never use `@ts-ignore`.

## Common TypeScript Patterns

### `type` vs `interface`
- Use `type` for unions (`type Minigame = 'bloodbank' | 'merch'`), intersections, and simple aliases.
- Use `interface` for object shapes, especially when they might be augmented (e.g., PIXI options or React props).

### Utility Types
Leverage built-ins instead of repeating shapes:
- `Partial<T>`
- `Pick<T, Keys>`
- `Omit<T, Keys>`
- `Record<KeyType, ValueType>`
- `ReturnType<typeof fn>`
- `Parameters<typeof fn>`

### `typeof` with Constants
If a type is derived from a constant (like a list of event IDs), derive it dynamically.
**Crucial:** Do not use `import type` for the constant if you need its value for `typeof`.

```typescript
// ✅ CORRECT: Import the value to derive its type
import { GAME_PHASES } from '../constants';
type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];

// ❌ WRONG: 'import type' strips the runtime value
import type { GAME_PHASES } from '../constants';
```

## State & Actions (Redux-Style)

NEUROTOXIC uses a centralized state with a reducer.

### Action Types
Action types must be a frozen, discriminated union.
```typescript
export const ActionTypes = {
  ADD_MONEY: 'ADD_MONEY',
  CHANGE_PHASE: 'CHANGE_PHASE',
} as const; // <-- as const is mandatory
```

### Action Creators
Always type action creators explicitly. Do not let TS infer an overly broad type.
```typescript
export function addMoney(amount: number): { type: typeof ActionTypes.ADD_MONEY; payload: number } {
  return { type: ActionTypes.ADD_MONEY, payload: amount };
}
```

### Reducer Typing
The reducer must maintain a strict, non-nullable return type matching the `GameState` interface. Avoid implicit `any` in switch cases.

## Unknowns, Assertions, & Guards

### Validating Untrusted Data
Data from `localStorage`, `sessionStorage`, or external APIs is `unknown`.

```typescript
// ❌ WRONG: Unsafe assertion
const mode = sessionStorage.getItem('mode') as Minigame;

// ✅ CORRECT: Type guard
function isMinigame(val: unknown): val is Minigame {
  return typeof val === 'string' && ['bloodbank', 'merch'].includes(val);
}

const rawMode = sessionStorage.getItem('mode');
const mode: Minigame = isMinigame(rawMode) ? rawMode : 'bloodbank';
```

### `as` vs `satisfies`
- Use `as` only when you know more than the compiler (e.g., mapping over a DOM NodeList).
- Use `satisfies` when you want the compiler to check a shape but retain the exact literal types.

```typescript
const colors = {
  primary: '#ff0000',
  secondary: '#00ff00'
} satisfies Record<string, string>;
```

### Accessing Unknown Objects
If an argument is `unknown` (e.g., an error object in a catch block), cast it to a record before accessing properties to prevent `TS18046`.

```typescript
catch (error: unknown) {
  // ❌ WRONG
  console.log(error.message);

  // ✅ CORRECT
  const err = error as Record<string, unknown>;
  console.log(err.message);
}
```

## Handling Maps and Lookups

Always provide explicit generic parameters when instantiating Collections.
```typescript
// ❌ WRONG: defaults to Map<any, any>
const bandMembers = new Map();

// ✅ CORRECT
const bandMembers = new Map<string, BandMember>();
```

When doing lookups against dynamic keys, explicitly verify the key exists or use optional chaining.

## React Components & Hooks

### Component Props
Always define an interface for props. Never use `any`.
```typescript
interface GlitchButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function GlitchButton({ label, onClick, disabled = false }: GlitchButtonProps) { ... }
```

### `useRef`
Always type refs, especially if they can be null initially.
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const timerRef = useRef<NodeJS.Timeout | null>(null); // Note: NodeJS.Timeout in Vite/Node
```

### `useState`
Provide generics if the initial state doesn't perfectly infer the type (e.g., nulls or empty arrays).
```typescript
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);
```

## Migrating JS to TS

1. Change extension to `.ts` or `.tsx`.
2. Fix all implicit `any` errors immediately.
3. Create interfaces for any objects passed as arguments.
4. Ensure return types of exported functions are explicit.
5. If migrating PIXI components, ensure `Container` and `Application` references use concrete PIXI types from `import * as PIXI from 'pixi.js'`.

## Tsconfig & Build Boundaries

- Do not modify `tsconfig.json` without explicit authorization.
- The project runs via Vite, which uses `esbuild` for transpilation. This means `isolatedModules` is `true`.
- Because of `isolatedModules`, you cannot re-export a type using standard syntax. You must use `export type { MyType } from './file'`.
