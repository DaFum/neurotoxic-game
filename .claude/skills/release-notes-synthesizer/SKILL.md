---
name: release-notes-synthesizer
description: Generate release notes and changelog summaries from commits or PRs, including breaking changes and known issues. Use when asked to draft release notes.
---

# Release Notes Synthesizer

## Commit Format

This repo uses Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

## Workflow

1. Run `git log --oneline` to review recent commits since the last release/tag.
2. Parse Conventional Commit prefixes to categorize: Features, Bug Fixes, Refactoring, Documentation.
3. Call out breaking changes (look for `BREAKING CHANGE:` in commit bodies or `!` suffix).
4. Note any dependency changes or version pin updates.
5. Provide a concise summary for stakeholders with the most impactful changes first.

## Output

- Produce a Markdown release note section grouped by category.

## Related Skills

- `change-plan-conventional-commits` — ensures commits follow the format this skill parses
