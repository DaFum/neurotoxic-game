---
name: skilltest
description: Comprehensive validation for repo and user skills against the Open Agent Skills standard, including discovery, metadata quality, optional openai.yaml checks, and prompt-case tests. Use when asked to run skilltest, validate skills, or diagnose why a skill does not appear or trigger.
---

# Skilltest Harness

## Workflow

1. Discover skills from `.agents/skills` (CWD up to repo root) and optionally `~/.agents/skills`.
2. Validate directory contract, frontmatter, naming, and symlink targets.
3. Check optional `agents/openai.yaml` fields when present (relative to each skill directory).
4. Verify script permissions and referenced files.
5. Execute prompt-case checks from `tests/cases/*.cases.json` (within this skill directory).
6. Emit JSON + human-readable reports.

## Commands

- Run the harness: `node .agents/skills/skilltest/scripts/skilltest.mjs`
- Validate openai.yaml only: `node .agents/skills/skilltest/scripts/validate-openai-yaml.mjs`

## Output

- JSON report written to `reports/skills/skilltest-report.json`.
- Console summary with ✅/⚠️/❌ per skill and suggested fixes.
