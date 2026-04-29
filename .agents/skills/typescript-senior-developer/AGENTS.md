# .agents/skills/typescript-senior-developer - Agent Instructions

## Scope

Applies to `.agents/skills/typescript-senior-developer/**`.

## Constraints

- Keep this skill aligned with root and nested `AGENTS.md`; scoped repo files remain the source of truth when instructions differ.
- Prefer repo scripts such as `pnpm run typecheck:core` and `pnpm run typecheck`; do not suggest generic `npx tsc --noEmit`.
- Keep checklist rules definitive. Avoid exception wording that weakens the repo-wide TypeScript and CheckJS rules.
- This skill is not a product, gameplay, UX, or design authority; defer those rules to the relevant scoped `AGENTS.md`.

## Gotchas

- Mention `AGENTS.md` explicitly when referencing project policy.
- Do not duplicate the full root TypeScript policy here; keep only skill-specific guardrails.
