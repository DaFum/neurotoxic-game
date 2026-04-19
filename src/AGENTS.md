# src — Agent Instructions

## Scope

Applies to everything under `src/` unless a deeper `AGENTS.md` overrides it.

## Critical Rules

- Do not hardcode UI colors. Use project CSS variables (`var(--color-...)`).
- Tailwind v4 syntax only (`@import "tailwindcss"`; no legacy `@tailwind base/components/utilities`).
- All user-facing strings must come from i18n (`t('ns:key')` / `<Trans>`). If adding keys, update both `public/locales/en/*` and `public/locales/de/*` in the same change.
- React 19 convention: pass `ref` as a normal prop; do not add `React.forwardRef()` wrappers.

## TypeScript Constraints

- Migration is complete: `@ts-nocheck` is banned in `src/**` (budget 0 via `.ci/ts-nocheck-budget.json`; enforced by `pnpm run guard:nocheck`). Do not reintroduce it; use `@ts-expect-error <reason>` only with a tracked follow-up, never `@ts-ignore`.
- Keep behavior unchanged in type-only PRs; separate refactors from type-shape changes.
- `jsconfig.checkjs.json` scopes the stricter CheckJS (adds `noUncheckedIndexedAccess`) to `src/context`, `src/hooks/rhythmGame`, `src/utils/audio`, and `src/ui/bandhq`. When moving a new domain into that scope, expand the `include` list in the same PR.
- Shared domain contracts belong in `src/types/*.d.ts` — do not duplicate structural shapes inline across modules.

## Gotchas

- `useArrivalLogic` owns arrival routing and scene transitions after travel completion.
- Minigame hooks (`useTourbusLogic`, `useRoadieLogic`) must stay reactive-only (no direct PIXI imports).

## Nested TypeScript Hinweise

- In `src/**` gilt strikt: kein `@ts-nocheck`, kein `any`, und `import type` für type-only Imports.
- Runtime-Validierung und Typvertrag müssen zusammen geändert werden (z. B. Interface + PropTypes im selben PR).
