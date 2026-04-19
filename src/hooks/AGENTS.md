# src/hooks — Agent Instructions

## Scope

Applies to `src/hooks/**`.

## Hook Rules

- Keep hooks focused on orchestration/state derivation; avoid embedding heavy rendering concerns.
- Include `t` in dependency arrays when translations are used inside callbacks/effects.
- Route state mutations through context action creators.

## TypeScript Patterns

- Type the hook's return shape explicitly (`function useX(): { a: A; b: B }` or a named interface) — do not rely on inference for exported hooks. This is the public API of the hook and should not drift.
- Use `useState<T>` generics when the initial value doesn't carry the full type (e.g. `useState<SceneName>('MENU')`, `useState<User | null>(null)`).
- Annotate `useRef` with the precise element or value type (`useRef<HTMLCanvasElement>(null)`). Avoid `useRef<any>`.
- For pure logic reused across hooks, extract it to a plain function (outside the hook) and unit-test via `node:test` — see `CLAUDE.md` testing supplements.

## Domain Gotchas

- `useArrivalLogic` owns arrival routing decisions.
- Minigame hooks (`useTourbusLogic`, `useRoadieLogic`) must not import PIXI directly — they return reactive state only.

## Nested TypeScript Notes

- Exported hooks should expose explicit return contracts; avoid relying on inferred structural types for public hook APIs.
- Keep callback dependencies complete (`t`, derived state slices, handlers) to prevent stale closures despite valid typings.
- Use precise `useRef` and `useState` generics at hook boundaries to avoid hidden widening to `any`.
