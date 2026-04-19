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

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

## TypeScript Best Practices (Repo)

- Keep TS interfaces and runtime validators/PropTypes synchronized in the same PR; optional vs required mismatches are contract bugs.
- Prefer `unknown` at untrusted boundaries (`JSON.parse`, storage, API payloads) and narrow with guards; never use `any`.
- Use `Object.hasOwn()` for untrusted property checks instead of `in`/`hasOwnProperty` to avoid prototype-chain pollution.
- Under strict CheckJS + `noUncheckedIndexedAccess`, guard indexed reads (`array[i]`) before use.
- Preserve discriminated-union safety in reducers/action creators (`Extract<...>`, `assertNever(action)`) when adding new action variants.
- Use `import type` for type-only imports (`isolatedModules: true`) and keep type-only refactors behavior-preserving.
- Prefer `??` over `||` when `0`/`''` are valid values.
- Use `@ts-expect-error <reason>` only with a tracked follow-up; never use `@ts-ignore`.
