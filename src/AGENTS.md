# src - Agent Instructions

## State & Types

- Preserve action-creator-driven state transitions; components/hooks must not mutate state directly.
- Use existing shared contracts from `src/types/**` before adding new domain shapes. If none fits, add the contract to the appropriate `src/types/*.d.ts` file and import it instead of cloning shapes locally.

## Runtime Import Cycles

- New runtime import cycles are forbidden. `tests/node/runtimeImportCycleGate.test.js` compares the cyclic edges of `src` with `.ci/runtime-import-cycle-baseline.json` and prints a witness cycle for each new edge.
- Inside a cycle, import the low-level module directly instead of a broad barrel (`index.ts`) that re-exports its importers.
- Baseline edits only remove stale entries. Break a new cycle instead of adding it; a new entry needs explicit review.

## UI & Copy

- Keep user-facing copy in namespaced i18n keys and update EN/DE locale files together.
- Pass React refs as standard `ref` props (for example, `ref?: Ref<HTMLButtonElement>`) in React 19 components; do not add `forwardRef`.
- Use CSS variables for colors and Pixi token helpers for rendered colors.
- Tailwind v4: prefer the custom-property shorthand `z-(--z-stage-controls)`. The explicit arbitrary-value form `z-[var(--z-stage-controls)]` is equivalent and also valid. Do not use the v3 variable shorthand `z-[--z-stage-controls]`; v4 replaced it with the parenthesis form.

## TypeScript

- CheckJS is strict in migrated domains. Narrow indexed lookups and optional values before use.
- Use `unknown` and explicit narrowing for storage, API, event, or external payloads.
- Prefer `as const satisfies` for literal maps and configs.

- When reading optional values, fall back safely with `finiteNumberOr(value, 0)` rather than `?? 0` when the value could be `NaN`.
