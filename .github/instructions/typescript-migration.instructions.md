---
applyTo: '.'
---

@AGENTS.md

## Purpose

Minimal Copilot instructions for safe TypeScript migration tasks. Import `AGENTS.md` as the single source of truth and add only non-discoverable, failure-causing rules.

## Critical Commands

- Install dev deps: `pnpm add -D typescript @types/node @types/react @types/jest` (adjust list for used libs).
- Typecheck: `pnpm run typecheck` (run after each migration PR).
- Build: `pnpm run build` to validate bundling after conversion.
- Tests: `pnpm run test` and `pnpm run test:ui` for UI-related changes.

## Quick validation recipe

- Run a focused local check before opening a PR:

```bash
pnpm install
pnpm run typecheck
pnpm run test      # optional, recommended for logic changes
pnpm run test:ui   # run when touching UI or i18n
```

## Architecture Constraints

- Prefer enabling `strict` mode in `tsconfig.json`. If enabling `strict` globally is risky, enable `noImplicitAny` and `strictNullChecks` as first steps.
- Keep `tsconfig` paths aligned with Vite `resolve.alias` (update `vite.config.ts` if needed).
- Use `.ts` for logic files and `.tsx` for React components.

If tests are noisy during validation: temporarily narrow `tsconfig.json` `include` to `src` only (or use an override `tsconfig.migration.json`) and re-introduce `tests/` in follow-up PRs. Do not leave tests excluded in the main branch.

## Testing

- Run `pnpm run typecheck` and fix type errors before opening a PR.
- Use small migration PRs (3–8 files) to keep reviewable diffs and easier bisecting.

If a migration PR touches UI-facing files or translations, run `pnpm run test:ui` to avoid regressions in rendering or i18n keys.

## Style & Conventions

- Add explicit public API types for exported functions and components.
- For third-party packages without types, prefer `pnpm add -D @types/<pkg>` or create a `types/<pkg>.d.ts` stub (place under `src/types` or a top-level `types/`).

## Gotchas

- Do NOT convert files in auto-generated folders (e.g., `output/`, `public/`, `lib/`, or any `generated/` directory) — update generators instead.
- Preserve game-specific runtime invariants (do not change audio timing sources or PIXI import locations). Verify behavior in `pnpm run test:ui`.
- If `noImplicitAny` produces many errors, prefer staged enabling (tests → core libs → UI) rather than blanket disabling.

- When adding `@types` packages, prefer pinned devDependencies (use project policy pins in `AGENTS.md`). If no `@types` exists, add a `types/<pkg>.d.ts` with minimal stubs under `src/types/` and document it in the PR.

## Notes for maintainers

- Keep these instructions minimal; if a rule belongs to project policy, add it to `AGENTS.md` instead.
- If requested, the companion prompt (`.github/prompts/typescript-migration.prompt.md`) can generate an actionable migration plan and patches.

## Type stubs & migration tsconfig

- If a package lacks types, create a local stub under `src/types/` named `<pkg>.d.ts` with this minimal content:

```ts
declare module '<pkg>' {
  const value: any
  export default value
}
```

- Example focused migration config (`tsconfig.migration.json`) to run targeted checks without affecting the main `tsconfig.json`:

```json
{
  "extends": "./tsconfig.json",
  "include": ["src"],
  "compilerOptions": {
    "noEmit": true,
    "checkJs": true,
    "typeRoots": ["src/types", "node_modules/@types"]
  }
}
```

Add the stub files to source control and document them in the PR when used.

- Before running an automated migration across many files, create a short checklist in the PR description: scope, changed tsconfig flags (if any), `@types` added, and test commands run.
