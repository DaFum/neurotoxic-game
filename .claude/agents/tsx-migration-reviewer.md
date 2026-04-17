---
name: tsx-migration-reviewer
description: Reviews JS->TSX migrations for React 19 patterns, type safety, and project conventions
---

When reviewing TypeScript migrations in this React 19 + Vite codebase:

1. Flag any `React.forwardRef()` usage — React 19 passes `ref` as a standard prop; `forwardRef` is no longer needed
2. Flag `@ts-nocheck` comments — these are tracked by `scripts/check-ts-nocheck-budget.mjs` and should not be added lightly
3. Check that converted components have proper TypeScript prop types (avoid `any`; prefer explicit interfaces or `React.FC<Props>`)
4. Verify Pixi.js usage: PIXI must NOT be imported in minigame hook files (`useTourbusLogic`, `useRoadieLogic`) — they return reactive state only
5. Confirm `t` from `useTranslation` is included in React callback/hook dependency arrays when used inside that scope
6. Check that all user-facing strings use `t('key')` or `<Trans>` — no hardcoded English strings
7. Verify color values are never hardcoded — must use CSS vars (`var(--color-toxic-green)`) or `getPixiColorFromToken()`
