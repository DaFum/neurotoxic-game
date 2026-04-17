# Advanced TypeScript Types

## Conditional Types

Conditional types select a type based on whether a type extends another:

```ts
type IsArray<T> = T extends unknown[] ? true : false
type IsArray<string[]>  // true
type IsArray<string>    // false
```

### With `infer`

Extract parts of a type:

```ts
// Unwrap a Promise
type Awaited<T> = T extends Promise<infer U> ? U : T

// Get element type of array
type ElementOf<T> = T extends (infer E)[] ? E : never

// Extract return type (same as ReturnType<F>)
type ReturnOf<F> = F extends (...args: unknown[]) => infer R ? R : never
```

### Distributive Conditional Types

Conditional types distribute over naked type parameters in unions:

```ts
type NonNullable<T> = T extends null | undefined ? never : T
// NonNullable<string | null | undefined> = string  (distributes over each member)
```

To prevent distribution, wrap in a tuple:

```ts
type IsUnion<T> = [T] extends [T] ? false : true  // prevents distribution
```

---

## Mapped Types

Transform all properties of an object type:

```ts
// Make all fields optional (same as Partial<T>)
type Optional<T> = { [K in keyof T]?: T[K] }

// Make all fields readonly
type Frozen<T> = { readonly [K in keyof T]: T[K] }

// Map values through a transform
type Stringify<T> = { [K in keyof T]: string }

// Filter keys by value type
type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K]
}

// Example: extract only numeric fields
type NumericFields = PickByValue<PlayerState, number>
```

### Key Remapping (`as`)

```ts
// Prefix all keys
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K]
}
```

---

## Template Literal Types

Build string types dynamically:

```ts
type EventName = 'click' | 'focus' | 'blur'
type Handler = `on${Capitalize<EventName>}`
// = 'onClick' | 'onFocus' | 'onBlur'

type SceneAction = `ENTER_${SceneName}` | `EXIT_${SceneName}`
```

---

## `satisfies` Operator (TS 4.9+)

Validate a value against a type without widening:

```ts
const config = {
  theme: 'dark',
  volume: 0.8,
} satisfies Partial<AppConfig>
// config.theme is still 'dark' (not widened to string)
```

Useful for config objects and records where you want both safety and inference.

---

## Variance and `in`/`out` Modifiers (TS 4.7+)

Mark type parameters explicitly for better variance checking:

```ts
type Producer<out T> = () => T         // covariant
type Consumer<in T> = (x: T) => void   // contravariant
type Both<in out T> = (x: T) => T      // invariant
```

---

## `const` Type Parameters (TS 5.0+)

Preserve literal types in generic functions:

```ts
function identity<const T>(value: T): T { return value }
const x = identity(['a', 'b'])
// x: readonly ['a', 'b']  — not string[]
```

---

## `NoInfer<T>` (TS 5.4+)

Prevent a type parameter from being inferred from a specific argument:

```ts
function createStore<T>(initial: T, fallback: NoInfer<T>): T {
  return initial ?? fallback
}
// T inferred only from `initial`; `fallback` must be compatible but won't influence inference
```
