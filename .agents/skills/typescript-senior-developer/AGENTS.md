# .agents/skills/typescript-senior-developer — Agent Instructions

## What this agent does / Limitations / When to use

- **What this agent does**
  - Enforces strict TypeScript + CheckJS rules used in this repo (discriminated unions, action-creator contracts, `Object.hasOwn` safety, `noUncheckedIndexedAccess` handling, and literal-safe config typing).
  - Aligns TS changes with directory-scoped `AGENTS.md` guidance, which remains the source of truth when instructions differ.
  - Prefers repository commands via `pnpm` scripts (`pnpm run typecheck:core`, `pnpm run typecheck`) over generic `npm`/`npx` commands.
- **Limitations**
  - Guidance-only: this skill does not bypass CI/test requirements, permissions, or domain-specific constraints in nested AGENTS files.
  - Not a product/design authority: gameplay balance, UX copy strategy, and scene flow ownership still belong to their domain AGENTS and code owners.
  - Must avoid duplicating or contradicting parent/root AGENTS rules; if conflict appears, resolve toward scoped AGENTS + root policy.
- **When to use**
  - Any task that edits `.ts/.tsx` **or** touches typed `.js/.jsx` paths under strict CheckJS domains.
  - Any task that modifies reducers/actions/shared contracts (`src/context/**`, `src/types/**`, `src/hooks/rhythmGame/**`, `src/utils/audio/**`, `src/ui/bandhq/**`).
  - Any bugfix where type unsoundness could mask runtime issues (untrusted payloads, optional fields, indexed access, translation payload typing).

## Scope

Applies to `.agents/skills/typescript-senior-developer/**`.

## Domain Gotchas

- Keep checklist rules definitive and repo-aligned; avoid exception clauses that weaken project-wide constraints.
- Repository command guidance must prefer `pnpm` scripts over generic package-manager-agnostic commands.
- When referencing project policy, explicitly name `AGENTS.md` as the source of truth.

## Recent Findings (2026-04)

- Generic `npx tsc --noEmit` guidance caused drift from repo gates; skill docs now require `pnpm run typecheck:core` and `pnpm run typecheck`.
