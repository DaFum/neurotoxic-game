---
name: skill-aligner
description: Analyze existing repo skills and rewrite them to match this codebase's architecture, commands, and terminology. Use when asked to align skills with current conventions, update skill triggers, or fix mismatches with repo constraints.
---

# Skill Aligner

## Key Files

- `AGENTS.md` — authoritative repo conventions and critical constraints
- `src/*/AGENTS.md` — domain-specific rules (one per domain)
- `.agents/skills/*/SKILL.md` — all skill definitions to scan
- `package.json` — real commands and script names

## Workflow

1. Read `AGENTS.md` and relevant `src/*/AGENTS.md` files to capture authoritative conventions.
2. Review `package.json` scripts for real commands and required ordering (lint → test → build).
3. Scan all `.agents/skills/*/SKILL.md` files for mismatched commands, paths, or terminology.
4. Verify each skill has a "Key Files" section with actual project paths.
5. Verify each skill has a "Related Skills" section for cross-references.
6. Rewrite `SKILL.md` files to match repo language, paths, and constraints.
7. Ensure descriptions clearly define when the skill should and should not trigger.

## Output

- Updated `SKILL.md` files with repo-aligned descriptions and steps.
- A short alignment report highlighting corrected mismatches.

## Related Skills

- `skilltest` — validates skill structure and metadata after alignment
- `skill-qa-harness` — runs prompt-case tests to verify skill content
- `repo-guardrails-generator` — the guardrails that skills must align with
