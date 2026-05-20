# src - Agent Instructions

## State & Types

- Preserve action-creator-driven state transitions; components/hooks must not mutate state directly.
- Use existing shared contracts from `src/types/**` before adding new domain shapes. If none fits, add the contract to the appropriate `src/types/*.d.ts` file and import it instead of cloning shapes locally.

## UI & Copy

- Keep user-facing copy in namespaced i18n keys and update EN/DE locale files together.
- Pass React refs as standard `ref` props (for example, `ref?: Ref<HTMLButtonElement>`) in React 19 components; do not add `forwardRef`.
- Use CSS variables for colors and Pixi token helpers for rendered colors.

## TypeScript

- CheckJS is strict in migrated domains. Narrow indexed lookups and optional values before use.
- Use `unknown` and explicit narrowing for storage, API, event, or external payloads.
- Prefer `as const satisfies` for literal maps and configs.
