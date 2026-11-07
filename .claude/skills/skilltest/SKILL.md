---
name: skilltest
description: validate skill structure and metadata. Trigger when developing skills, checking CI, or debugging skill loading issues.
---

# Skilltest Harness

Discover, validate, and test skills against the Open Agent Skills standard.
Canonical implementation is located in `scripts/skilltest/harness.mjs` and `scripts/skilltest/cli.mjs`.

## Architecture & Contract

- **Root Contract**: Standardized discovery across configured tree (`.claude`), with user-root lookup (`~/.claude/skills`), shared disabled config (`~/.codex/config.toml`), and standard quality gates (`lint`, `test`, `build`).
- **Bundled Case Behavior**: Test suites load bundled case fixtures from tree-specific `tests/cases/*.cases.json`.
- **Repository-Bound Packaging**: The canonical harness is housed in `scripts/skilltest/`, with tree-specific bindings exporting thin wrappers to keep execution repository-bound.

## Workflow

1.  **Discovery**
    - Search `.claude/skills/` recursively.
    - Find `SKILL.md` files.

2.  **Validation**
    - **Structure**: Skill folder must contain `SKILL.md`.
    - **Metadata**: `SKILL.md` frontmatter must be valid YAML.
    - **Paths**: Scripts and references must exist.
    - **Symlinks**: Validate targets.

3.  **Execution**
    - Run test cases from `tests/cases/*.cases.json`.
    - Report successes and failures.

## Commands

Use the bundled validator:

```bash
node .claude/skills/skilltest/scripts/validate-skills.mjs
```

Use the test runner:

```bash
node .claude/skills/skilltest/scripts/skilltest.mjs
```

Generated report path:

`reports/skills/skilltest-report.json`

## Example

**Input**: "Why isn't my skill showing up?"

**Action**:
Run validator.

**Output**:

```text
[FAIL] myskill/SKILL.md: Invalid YAML frontmatter.
```

"The frontmatter in `myskill/SKILL.md` is invalid. Fix the YAML syntax."

_Skill sync: compatible with React 19.2.8 / Vite 8.2.2 / Tailwind 4.3.3 baseline as of 2026-05-20._
