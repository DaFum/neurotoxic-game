---
name: skilltest
description: validate skill structure and metadata. Trigger when developing skills, checking CI, or debugging skill loading issues.
---

# Skilltest Harness

Discover, validate, and test skills against the Open Agent Skills standard.

## Workflow

1.  **Discovery**
    *   Search `.claude/skills/` recursively.
    *   Find `SKILL.md` files.

2.  **Validation**
    *   **Structure**: Skill folder must contain `SKILL.md`.
    *   **Metadata**: `SKILL.md` frontmatter must be valid YAML.
    *   **Paths**: Scripts and references must exist.
    *   **Symlinks**: Validate targets.

3.  **Execution**
    *   Run test cases from `tests/cases/*.cases.json`.
    *   Report successes and failures.

## Commands

Use the bundled validator:

```bash
node .claude/skills/skilltest/scripts/validate-skills.mjs
```

Use the test runner:

```bash
node .claude/skills/skilltest/scripts/skilltest.mjs
```

## Example

**Input**: "Why isn't my skill showing up?"

**Action**:
Run validator.

**Output**:
```text
[FAIL] myskill/SKILL.md: Invalid YAML frontmatter.
```
"The frontmatter in `myskill/SKILL.md` is invalid. Fix the YAML syntax."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
