---
name: repo-guardrails-generator
description: Generate or update concise repo-specific working agreements (commands, conventions, do/don't rules) for Codex. Use when asked to write or refresh repository guardrails.
---

# Repo Guardrails Generator

## Key Files

- `AGENTS.md` — root project guidance (Quick Reference, Critical Constraints, Sub-Agent Architecture)
- `src/*/AGENTS.md` — domain-specific rules (7 files: context, hooks, scenes, utils, components, data, ui)
- `package.json` — `scripts` section defines quality gate commands
- `.github/copilot-instructions.md` — additional AI assistant conventions

## Workflow

1. Read `AGENTS.md` and `package.json` scripts for required commands.
2. Read `src/*/AGENTS.md` files to capture domain-specific rules.
3. Summarize conventions, folder routing, and critical constraints (version pins, Tailwind v4, CSS variables, state safety).
4. Keep guidance short and immediately actionable — prefer checklists over prose.

## Output

- Produce a compact Markdown checklist suitable for inclusion in AGENTS.md.

## Related Skills

- `project-brain-codex-instructions` — generates full Codex instructions from these same sources
- `skill-aligner` — ensures skills match the guardrails this skill generates
