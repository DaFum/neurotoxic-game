# .agents/skills/typescript-senior-developer — Agent Instructions

## Scope

Applies to `.agents/skills/typescript-senior-developer/**`.

## Domain Gotchas

- Keep checklist rules definitive and repo-aligned; avoid exception clauses that weaken project-wide constraints.
- Repository command guidance must prefer `pnpm` scripts over generic package-manager-agnostic commands.
- When referencing project policy, explicitly name `AGENTS.md` as the source of truth.

## Recent Findings (2026-04)

- Generic `npx tsc --noEmit` guidance caused drift from repo gates; skill docs now require `pnpm run typecheck:core` and `pnpm run typecheck`.
