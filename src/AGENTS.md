# src - Agent Instructions

## Scope

Applies to `src/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Preserve action-creator-driven state transitions; components/hooks must not mutate state directly.
- Use existing shared contracts from `src/types/**` before adding new domain shapes.
- Keep user-facing copy in namespaced i18n keys and update EN/DE locale files together.
- Import React refs as normal props in React 19 code; do not add `forwardRef`.
- Use CSS variables for colors and Pixi token helpers for rendered colors.

## TypeScript

- CheckJS is strict in migrated domains. Narrow indexed lookups and optional values before use.
- Use `unknown` and explicit narrowing for storage, API, event, or external payloads.
- Prefer `as const satisfies` for literal maps and configs.

## Gotchas

- `currentGig` is the venue object, not `{ venue }`.
- `useArrivalLogic` owns all arrival routing.
- `START_GIG` resets `gigModifiers`.
- Dynamic Pixi images must load through `loadTexture`.
