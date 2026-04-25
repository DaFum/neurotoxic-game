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
- Keep callback dependencies complete (`t`, derived state slices, handlers) to prevent stale closures despite valid typings.

## Domain Gotchas

- `useArrivalLogic` owns arrival routing decisions.
- Minigame hooks (`useTourbusLogic`, `useRoadieLogic`) must not import PIXI directly — they return reactive state only.

## Recent Findings (2026-04)

- If a hook returns modal controls (`show/open/close/trigger`), verify at least one active caller consumes `open*`; otherwise remove the hook wiring or restore the entry point.
