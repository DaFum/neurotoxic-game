---
applyTo: '.'
---

@AGENTS.md

## Purpose

Copilot instructions for TypeScript type-safety work in this repo. The JS→TS
migration is complete (baseline `2026-04-16`, `@ts-nocheck` budget = 0). Use
this file for: tightening existing types, adding types to new code, and
resolving strict-mode errors. Defer to `AGENTS.md` for all project-wide rules.

## Critical Commands

- Full typecheck: `pnpm run typecheck:core` (runs `tsc --noEmit` over
  `jsconfig.checkjs.json` scope).
- Reducer gate (CI): `pnpm run typecheck` — fails on any error inside
  `gameReducer.ts`, `reducers/bandReducer.ts`, `reducers/eventReducer.ts`,
  `reducers/sceneReducer.ts`, or any non-zero `tsc` status.
- Nocheck budget guard: `pnpm run guard:nocheck` (must stay at 0 in `src/`).
- Install type packages with pinned versions: `pnpm add -D @types/<pkg>` — do
  not upgrade already-pinned deps without discussion.

## Required Validation Before a PR

```bash
pnpm install
pnpm run guard:nocheck
pnpm run typecheck
pnpm run test:all
pnpm run test:ui   # when touching UI or i18n
```

## Type-Safety Patterns (project-specific)

- Never `any`. Use `unknown` at external boundaries (API responses,
  `JSON.parse`, `localStorage`) and narrow once with a type guard.
- `Object.hasOwn()` for untrusted property checks — never `in` or
  `hasOwnProperty`. Tests assert forbidden prototype keys (`__proto__`) are
  stripped.
- Action creators return `Extract<GameAction, { type: typeof ActionTypes.X }>`
  — do not hand-write `{ type, payload }` shapes.
- Reducer `default` must call `assertNever(action)` (exhaustive check).
- Lookup constants: `as const satisfies Record<Union, T>` — `as Record<...>`
  discards literal inference.
- Type-only imports require `import type` (enforced by `isolatedModules`).
- Shared domain contracts belong in `src/types/*.d.ts`; do not re-declare
  structural clones in consumer modules.
- Apply bounded-state clamps once, in the action creator, via
  `src/utils/gameStateUtils.ts`. Do not re-clamp in reducers.

## Widening the Stricter Scope

`jsconfig.checkjs.json` adds `noUncheckedIndexedAccess` for migrated domains
(`src/context`, `src/hooks/rhythmGame`, `src/utils/audio`, `src/ui/bandhq`).
When graduating a new domain into this scope, add it to `include` in the same
PR that lands the type-tightening.

## Suppression Policy

- `@ts-nocheck` is banned in `src/` (budget 0).
- `@ts-expect-error` must include a one-line reason and be scoped to one line;
  prefer a tracked issue link. `@ts-ignore` is never acceptable — it silently
  survives the underlying fix.

## Third-Party Types

- `framer-motion`, `lucide-react`, `pixi.js`, `tone`, `@tonejs/midi` ship their
  own declarations — do not add stub `.d.ts` shims for them.
- When a package genuinely lacks types, prefer `pnpm add -D @types/<pkg>`. As a
  last resort, add a minimal stub under `src/types/` and document it in the PR.

## Gotchas

- Generated output (`output/`, `public/`, `lib/`, anything `generated/`) is not
  type-migrated — update the generator, not the output.
- Keep `tsconfig.json` paths aligned with Vite `resolve.alias`; mismatches
  silently break `@/*` imports at typecheck time.
- `.cjs` extension is required for ad-hoc Node scripts using `require()`.

## Notes for Maintainers

- Keep this file minimal; fold durable rules into `AGENTS.md` instead.
- The companion prompt (`.github/prompts/typescript-migration.prompt.md`)
  targets type-tightening plans, not JS→TS conversion.
