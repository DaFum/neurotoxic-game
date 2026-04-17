# src — Agent Instructions

## Scope
Applies to everything under `src/` unless a deeper `AGENTS.md` overrides it.

## Critical Rules
- Do not hardcode UI colors. Use project CSS variables (`var(--color-...)`).
- Tailwind v4 syntax only (`@import "tailwindcss"`; no legacy `@tailwind base/components/utilities`).
- All user-facing strings must come from i18n (`t('ns:key')` / `<Trans>`). If adding keys, update both `public/locales/en/*` and `public/locales/de/*` in the same change.
- React 19 convention: pass `ref` as a normal prop; do not add `React.forwardRef()` wrappers.

## Migration Constraints
- Prefer narrow, domain-scoped edits while removing `@ts-nocheck`.
- Keep behavior unchanged in type-only PRs.
- Avoid adding new `@ts-nocheck` in migrated modules.
- `jsconfig.checkjs.json` scopes strict CheckJS to already-migrated domains (`src/context`, `src/hooks/rhythmGame`, `src/utils/audio`, `src/ui/bandhq`). When adding a new domain to the TypeScript migration, expand the `include` list in that file in the same PR.

## Gotchas
- `useArrivalLogic` owns arrival routing and scene transitions after travel completion.
- Minigame hooks (`useTourbusLogic`, `useRoadieLogic`) must stay reactive-only (no direct PIXI imports).
