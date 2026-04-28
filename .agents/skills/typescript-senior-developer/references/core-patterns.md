# Core TypeScript Patterns

Use these snippets when the user asks how to type a feature, fix a type error, or refactor a recurring NEUROTOXIC pattern.

## Table of Contents

- Type vs interface
- Enum-like objects with `as const`
- Discriminated actions with `Extract`
- Boundary guards for `unknown`
- Prototype-pollution-safe property checks
- Utility types used in the project
- `satisfies` instead of unsafe assertions
- `import type` and `isolatedModules`
- Generic constraints
- Typed lookup maps
- React 19 typing patterns

## Type vs Interface

Use `interface` for extendable object shapes, inheritance, or declaration merging:

```ts
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

Use `type` for unions, intersections, aliases, computed types, and tuples:

```ts
export const ActionTypes = {
  CHANGE_SCENE: 'CHANGE_SCENE',
  UPDATE_PLAYER: 'UPDATE_PLAYER'
} as const

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes]
```

When in doubt, prefer `type` unless extension or ambient merging is useful.

## Enum-Like Objects with `as const`

Do not introduce TypeScript `enum`. Use frozen runtime objects and derive the type from values:

```ts
export const ActionTypes = {
  CHANGE_SCENE: 'CHANGE_SCENE',
  UPDATE_PLAYER: 'UPDATE_PLAYER'
} as const

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes]

dispatch({ type: ActionTypes.CHANGE_SCENE, payload: 'MENU' })
```

`as const` is load-bearing. Without it, values widen to `string` and the discriminated union loses precision.

## Discriminated Actions with `Extract`

Action creators should return the exact union member from `GameAction` instead of re-declaring payload shapes:

```ts
export const createChangeSceneAction = (
  scene: string
): Extract<GameAction, { type: typeof ActionTypes.CHANGE_SCENE }> => ({
  type: ActionTypes.CHANGE_SCENE,
  payload: scene
})
```

This keeps `GameAction` as the single source of truth and makes creators fail when the union changes.

Use an exhaustive reducer when local patterns support it:

```ts
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case ActionTypes.CHANGE_SCENE:
      return { ...state, currentScene: action.payload }
    default:
      return assertNever(action)
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`)
}
```

## Boundary Guards for `unknown`

External data starts as `unknown`: API responses, `JSON.parse`, `localStorage`, `postMessage`, URL params, and user-generated events. Validate once at the boundary, then pass specific types inward.

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

function isGameState(value: unknown): value is GameState {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.hasOwn(value, 'player') &&
    Object.hasOwn(value, 'currentScene')
  )
}
```

Do not replace this with `JSON.parse(raw) as GameState`; that moves the risk to runtime consumers.

## Prototype-Pollution-Safe Property Checks

When reading untrusted objects, use `Object.hasOwn()` before touching keys. Avoid `in`, because it checks the prototype chain, and avoid direct `obj.hasOwnProperty`, because the method can be shadowed.

```ts
if (Object.hasOwn(updates, 'money')) {
  safeUpdates.money = clampPlayerMoney(updates.money)
}
```

For sanitizers, explicitly ignore `__proto__`, `constructor`, and `prototype` if arbitrary keys can flow through.

## Utility Types Used in the Project

| Utility | Use |
| --- | --- |
| `Partial<T>` | update payloads such as partial player state |
| `Pick<T, K>` | narrow a context value passed to a sub-component |
| `Omit<T, K>` | strip persisted fields and restore them on load |
| `Extract<U, V>` | action creator return types |
| `Exclude<U, V>` | remove scene variants from a sub-flow |
| `ReturnType<F>` | infer reducer, selector, or factory output |
| `Parameters<F>` | mirror callback signatures in wrappers or mocks |
| `NonNullable<T>` | express a value after explicit null/undefined filtering |
| `Record<K, V>` | dictionaries keyed by a finite string union |
| `Readonly<T>` | frozen constants and immutable config surfaces |

Reusable helper for action payloads:

```ts
type PayloadFor<T extends ActionType> = Extract<
  GameAction,
  { type: T }
>['payload']

type ScenePayload = PayloadFor<typeof ActionTypes.CHANGE_SCENE>
```

## `satisfies` Instead of Unsafe Assertions

Use `satisfies` for config objects keyed by a union:

```ts
type SceneName = 'MENU' | 'OVERWORLD' | 'PREGIG' | 'GIG' | 'POSTGIG'

const SCENE_BG = {
  MENU: 'menu.png',
  OVERWORLD: 'map.png',
  PREGIG: 'pregig.png',
  GIG: 'gig.png',
  POSTGIG: 'postgig.png'
} as const satisfies Record<SceneName, string>
```

This validates key coverage and keeps literal inference. `as Record<SceneName, string>` discards useful literal information and can hide incomplete objects.

## `import type` and `isolatedModules`

With `isolatedModules: true`, type-only imports must be explicit:

```ts
import type { GameAction, PlayerState } from '../types/game'
import { ActionTypes, type ActionType } from './actionTypes'
```

Symptoms of mistakes include `tsc --noEmit` errors, unused runtime imports, or runtime import attempts from files that only export types.

## Generic Constraints

Only introduce a generic when the operation is identical and the type varies. Constrain narrowly enough for useful inference:

```ts
function getById<T extends { id: string }>(
  map: Map<string, T>,
  id: string
): T | undefined {
  return map.get(id)
}
```

Avoid unused or cosmetic generics:

```ts
function logIt(value: unknown): void {
  console.log(value)
}
```

## Typed Lookup Maps

Populate maps once and narrow `.get()` results before use:

```ts
export const SONGS_BY_ID: Map<string, Song> = new Map(
  songs.map(song => [song.id, song] as const)
)

const song = SONGS_BY_ID.get(id)
if (!song) return

const leaderboardId = song.leaderboardId
```

Avoid `SONGS_BY_ID.get(id)!`; missing IDs should remain visible in control flow.

## React 19 Typing Patterns

Inline props are fine for one-off components:

```tsx
function ScoreDisplay({ score, label }: { score: number; label: string }) {
  return <div>{label}: {score}</div>
}
```

Use named interfaces for shared or documented props:

```tsx
interface OverloadMeterProps {
  value: number
  className?: string
}
```

Use ref-as-prop for new React 19 components:

```tsx
interface InputProps extends React.ComponentProps<'input'> {
  ref?: React.Ref<HTMLInputElement>
}

function Input({ ref, ...props }: InputProps) {
  return <input ref={ref} {...props} />
}
```

Type hooks only when inference is not specific enough:

```tsx
const [scene, setScene] = useState<SceneName>('MENU')
const canvasRef = useRef<HTMLCanvasElement>(null)

const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  // handle event
}
```

Any callback or effect that uses `t('key')` must include `t` in its dependency array.
