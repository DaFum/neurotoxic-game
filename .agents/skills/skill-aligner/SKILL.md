---
name: skill-aligner
description: Analyze existing repo skills and rewrite them to match this codebase's architecture, commands, and terminology. Use when asked to align skills with current conventions, update skill triggers, or fix mismatches with repo constraints.
---

# Skill Aligner

## Workflow

1. Read `AGENTS.md` and relevant `src/*/AGENTS.md` files to capture authoritative conventions.
2. Review `package.json` scripts for real commands and required ordering.
3. Scan `.agents/skills` to identify skills with mismatched commands, paths, or terminology.
4. Rewrite `SKILL.md` files to match repo language, paths, and constraints.
5. Ensure descriptions clearly define when the skill should and should not trigger.
6. Provide a brief summary of changes and reasoning.

## Output

- Updated `SKILL.md` files with repo-aligned descriptions and steps.
- A short alignment report highlighting corrected mismatches.
