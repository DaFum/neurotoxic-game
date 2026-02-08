---
name: mega-lint-snapshot
description: 'Run a categorized lint/security/quality suite and emit MegaLinter-style logs with timestamps and INFO/NOTICE/ERROR blocks. Use for CI-like diagnostics that summarize BASH, CHECKOV, GITLEAKS, ESLint, Prettier, JSCPD, JSON, Markdown, Textlint, and shfmt. Do not modify files unless explicitly asked to auto-fix.'
---

# Mega Lint Snapshot

## Purpose

Produce deterministic, MegaLinter-style output for the repo's lint/quality checks, with consistent headers, timestamps, and error blocks.

## How to Use

1. Prefer running the script for consistent formatting:
   - `./.agents/skills/mega-lint-snapshot/scripts/run-mega-lint.sh`
2. If the user explicitly requests auto-fix, run:
   - `./.agents/skills/mega-lint-snapshot/scripts/run-mega-lint.sh --fix`
3. If the output references unavailable tools, report the errors and keep the rest of the report intact.

## Configuration

The runner reads the item list from:

- `assets/mega-lint.config.json`

Each item defines:

- `name`: MegaLinter category name
- `command`: executable to run
- `args`: check-mode arguments
- `fixArgs` (optional): arguments for auto-fix mode

## References

- See `references/tools.md` for the intended tool mapping and notes.
