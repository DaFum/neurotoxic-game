---
name: typescript-senior-developer
description: >
  TypeScript senior developer guidance for writing, reviewing, and refactoring TypeScript code.
  Trigger when: adding types to JS files, migrating JS to TS, fixing type errors, writing generics,
  designing type-safe APIs, reviewing TypeScript code quality, asking "how do I type this?",
  choosing between type vs interface, handling unknown/any, or working with discriminated unions,
  utility types, conditional types, or mapped types. Also trigger for tsconfig questions,
  strict mode issues, and module augmentation.
---

# TypeScript Senior Developer

Expert TypeScript guidance for strict, idiomatic, production-quality code. This project runs
`strict: true`, `strictNullChecks`, `noImplicitAny`, and zero `@ts-nocheck` tolerance.

## When to Use

- Writing new `.ts`/`.tsx` files or typing existing `.js` files
- Fixing TS compiler errors or `any` leaks
- Designing shared type contracts in `src/types/`
- Migrating JavaScript modules to TypeScript
- Code review of type safety and correctness
- Choosing the right utility type or pattern

---

## Core Principles

**Prefer types that encode constraints, not just shapes.** A type like `harmony: number` is weaker
than `harmony: Clamped<1, 100>`. Push invariants into the type system so the compiler enforces them.

**Narrow early, trust late.** Do your null/union checks at the boundary (API response, user input,
localStorage). Once narrowed, pass specific types — don't keep re-checking.

**Avoid `any`. Use `unknown` when the type is genuinely unknown.** `any` disables checking.
`unknown` forces you to narrow before use.

---

## Type vs. Interface

Use **`interface`** for object shapes that may be extended or implemented:

```ts
interface MapNode {
  id: string
  x: number
  y: number
  neighbors?: string[]
}
// Can be extended: interface VenueNode extends MapNode { venueId: string }
```

Use **`type`** for unions, intersections, aliases, and computed types:

```ts
type ActionType = ActionTypes[keyof ActionTypes]
type SceneName = 'MENU' | 'OVERWORLD' | 'PREGIG' | 'GIG' | 'POSTGIG'
type Nullable<T> = T | null
```

When in doubt for simple shapes: prefer `type` — it's more composable.

---

## Narrowing Patterns

### Type Guards

```ts
function isVenue(v: unknown): v is Venue {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Venue).id === 'string'
  )
}
```

### Discriminated Unions

```ts
type GameAction =
  | { type: 'START_GIG'; payload: { songId: string } }
  | { type: 'END_GIG'; payload: { score: number } }
  | { type: 'SET_SCENE'; payload: { scene: SceneName } }

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GIG':
      // action.payload.songId is string here — fully typed
      return { ...state, currentSong: action.payload.songId }
    case 'END_GIG':
      return { ...state, lastScore: action.payload.score }
    // TypeScript will warn if a case is missing (with `noImplicitReturns`)
  }
}
```

### Exhaustiveness Check

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`)
}

// In switch default:
default:
  return assertNever(action)
```

---

## Utility Types — Quick Reference

| Utility | Use case |
|---|---|
| `Partial<T>` | All fields optional (e.g., patch/update payloads) |
| `Required<T>` | All fields required (e.g., after validation) |
| `Readonly<T>` | Immutable snapshot |
| `Pick<T, K>` | Extract specific fields |
| `Omit<T, K>` | Remove specific fields |
| `Record<K, V>` | Dictionary / lookup map |
| `ReturnType<F>` | Infer function return type |
| `Parameters<F>` | Infer function parameter tuple |
| `NonNullable<T>` | Strip `null | undefined` |
| `Extract<T, U>` | Narrow a union to matching members |
| `Exclude<T, U>` | Remove union members |

**Common in this project:**

```ts
// Typed lookup map
const SONGS_BY_ID: Map<string, Song> = new Map(songs.map(s => [s.id, s]))

// Patch type for partial state updates
type StatePatch = Partial<PlayerState>

// Typed action payload extractor
type PayloadFor<A extends GameAction, T extends A['type']> =
  Extract<A, { type: T }>['payload']
```

---

## Generics

Write generics when the operation is identical but the type varies. Avoid over-generalizing:

```ts
// Good: generic utility
function clamp<T extends number>(value: T, min: T, max: T): T {
  return Math.min(Math.max(value, min), max) as T
}

// Good: typed event emitter
type Listener<T> = (event: T) => void
function createEmitter<T>() {
  const listeners: Listener<T>[] = []
  return {
    on: (fn: Listener<T>) => listeners.push(fn),
    emit: (event: T) => listeners.forEach(fn => fn(event)),
  }
}

// Bad: unnecessary generic
function identity<T>(x: T): T { return x }  // just use the value directly
```

---

## Handling `unknown` from External Sources

Always validate at boundaries — API responses, localStorage, JSON.parse:

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
```

For runtime validation, use a narrowing function or a schema library (Zod if available):

```ts
function isGameState(v: unknown): v is GameState {
  return (
    typeof v === 'object' &&
    v !== null &&
    'player' in v &&
    'scene' in v
  )
}
```

---

## React + TypeScript Patterns (React 19)

### Props types

```tsx
// Inline for simple components
function ScoreDisplay({ score, label }: { score: number; label: string }) {
  return <div>{label}: {score}</div>
}

// Named type for shared/documented props
interface OverloadMeterProps {
  value: number       // 0–100
  className?: string
}

function OverloadMeter({ value, className }: OverloadMeterProps) { ... }
```

### React 19: ref as prop (no forwardRef)

```tsx
// React 19 — pass ref directly as a prop
function Input({ ref, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} {...props} />
}
```

### Event handlers

```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

### Typed hooks

```tsx
const [scene, setScene] = useState<SceneName>('MENU')
const ref = useRef<HTMLCanvasElement>(null)
```

---

## Migration Guide (JS → TS)

This project's migration is complete (`@ts-nocheck` budget = 0). When adding types:

1. **Start with the module boundary** — type the exported functions/values first.
2. **Add `unknown` for untyped external data**, then narrow with guards.
3. **Use `// @ts-expect-error` (not `@ts-ignore`)** for unavoidable temporary suppressions — it fails
   if the error disappears.
4. **Move shared types to `src/types/`** — don't duplicate structural types across modules.
5. **Prefer additive typing** during migration: adding optional fields is non-breaking.

---

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| `as any` | Disables type checking entirely | Use `unknown` + guard or proper type |
| `// @ts-ignore` | Silently hides errors | Use `// @ts-expect-error` with a reason |
| `object` type | Too broad, no property access | Use specific interface or `Record<string, unknown>` |
| `[key: string]: any` index | Defeats key safety | Use `Record<K, V>` with explicit key union |
| Casting with `as X` without guarding | Unsafe at runtime | Guard first, then assert or narrow |
| `Function` type | Too loose | Use `(...args: A) => R` signature |
| Optional chaining as type escape | Hides real nullability | Fix the type; don't just `?.` everywhere |

---

## Quick Checklist for TypeScript Code Review

- [ ] No `any` — use `unknown`, generics, or specific types
- [ ] External data is validated at the boundary before use
- [ ] Discriminated unions use exhaustiveness checking
- [ ] Utility types are preferred over manual conditional logic
- [ ] `interface` used for extendable shapes, `type` for unions/aliases
- [ ] `// @ts-expect-error` used (not `@ts-ignore`) with a comment explaining why
- [ ] Shared contracts live in `src/types/`, not duplicated inline
- [ ] React 19 `ref` passed as prop, no `forwardRef`
- [ ] Generic constraints are as narrow as needed (not `<T>` when `<T extends string>` would work)

---

## References

For advanced patterns, load from `references/`:

| Topic | File |
|---|---|
| Conditional types, infer, template literals | `references/advanced-types.md` |
| Module augmentation & declaration merging | `references/module-augmentation.md` |
| tsconfig options deep-dive | `references/tsconfig.md` |
