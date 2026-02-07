---
name: project-brain-codex-instructions
description: Generate or update Codex project instructions for this repository using AGENTS.md and .github/copilot-instructions.md. Use when asked to summarize critical constraints, setup commands, quality checklist, architecture navigation, or instruction updates.
---

# Generate Codex Project Instructions

## Inputs

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/ARCHITECTURE.md`, `docs/STATE_TRANSITIONS.md`, `docs/CODING_STANDARDS.md` (if needed)

## Workflow

1. Read `AGENTS.md` to capture critical constraints, setup commands, and sub-agent routing.
2. Read `.github/copilot-instructions.md` for additional coding standards or workflow rules.
3. Summarize the repository setup in a short, actionable list.
4. List critical constraints (pinned versions, Tailwind v4 syntax, CSS variables, state safety).
5. Provide an architecture navigation section that points to `src/*/AGENTS.md` and the docs folder.
6. Provide a quality checklist (lint, test, build) and any required ordering.
7. Keep the output concise and in correct English.

## Output

- Produce a single Markdown section suitable for inclusion in `AGENTS.md` or a standalone instruction file.
- Do not invent new constraints.
- Do not upgrade dependencies.

## Related Skills

- `repo-guardrails-generator` — generates compact checklist-style guardrails
- `repo-navigator-agents-routing` — provides the domain routing this skill documents
