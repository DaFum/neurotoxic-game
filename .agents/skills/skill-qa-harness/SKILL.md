---
name: skill-qa-harness
description: Discover, validate, and test all Codex skills in this repository (and optional user scope). Use when asked to run a skills test suite, check for broken references, or update golden outputs.
---

# Skill QA Harness

## Workflow

1. Inventory skills in `.agents/skills` (and optionally `~/.agents/skills`).
2. Validate structure, frontmatter, and duplicate names.
3. Run repository quality gate (lint, test, build) before skill checks.
4. Execute prompt-based checks using `.agents/skills/skilltest/tests/cases/*.cases.json`.
5. Report pass/fail per skill with actionable fixes.

## Commands

- Validate skills: `node .agents/skills/skilltest/scripts/validate-skills.mjs`
- Run tests: `node .agents/skills/skilltest/scripts/run-skill-tests.mjs`

## Output

- Produce a concise report with ✅/❌ per skill and fix suggestions.
