# TypeScript Migration Prompt Template

Purpose

- Provide a concise, repeatable prompt that returns a safe, reviewable TypeScript migration plan and optional patch set for this repository.
- Follow the "Golden Rule": include only steps that are non-discoverable or failure-causing if omitted.

How to use

- Fill the placeholders in the template, attach the minimal context files (see examples below), and paste the filled prompt to your assistant.
- The assistant must ask 1–3 clarifying questions when inputs are ambiguous and must NOT emit a plan until clarified.

Minimal prompt template (copy & paste)

```
You are a concise TypeScript migration specialist.
Goal: Produce a minimal, safe migration plan for converting JavaScript to TypeScript (and enabling type-checking) in this repository.

Inputs (fill these):
- Purpose (one line): e.g. "Enable strict TypeScript checks; convert core modules to .ts/.tsx"
- Scope (glob): e.g. `src/**`, `tests/**`, `scripts/**`, or `.` for repo-wide
- Files to read (comma-separated): e.g. `package.json, tsconfig.json, vite.config.ts, AGENTS.md`
- Migration goals (bullet list):
  - e.g. `enable strict`, `convert top-level components`, `add @types for missing packages`
- Constraints (optional): e.g. `pnpm`, `Node 22.13+`, `Vite`
- Validate (yes/no): run `pnpm run typecheck` automatically after patches

Requirements for assistant output:
1. Produce a short migration plan (<= 300 words) listing ordered steps, risk level, and recommended batch sizes (3–8 files per PR).
2. Provide exact shell commands for each step (install, typecheck, build, test) in copy-pasteable blocks.
3. When requested, provide unified diffs (patches). Otherwise list files to change with a short rationale.
4. Explicitly list files/folders to skip (generated, public, output, lib) and recommend `types/` stubs when `@types` are missing.
5. If inputs are missing or ambiguous, return 1–3 clarifying questions and do NOT produce a plan.

Return format (exact, machine-parseable):
---PLAN---
<short markdown plan>
---COMMANDS---
<copy-paste shell commands>
---PATCHES---
<optional unified diff or empty>
---QUESTIONS---
<empty list or 1-3 clarifying questions>
```

Examples

- Quick: `Scope: src/**`, Goals: `enable strict`, `add @types/react,node`, `convert top-level components`.
- Conservative: `Scope: tests/**` first to stabilize tests, then migrate `src/` in small batches.

Validation tip

- Run `pnpm run typecheck` after each PR. If tests produce noisy failures, temporarily narrow `tsconfig.json` `include` to `src` only and re-introduce `tests/` in a later PR.

Assistant behavior & patch guidelines

- When producing patches, output unified diffs in the `---PATCHES---` section. If the user requests workspace-ready edits, prefer the agent `apply_patch` format and include an explicit Conventional Commit message in `---COMMIT---`.
- When recommending `@types`, list exact `pnpm add -D` commands (prefer pinned versions when available) and where to add them (devDependencies).
- For each proposed batch include a numeric risk estimate (1 = low, 5 = high) and list the top 3 files likely to require follow-up fixes.

Saved-by: typescript-migration.prompt.md
