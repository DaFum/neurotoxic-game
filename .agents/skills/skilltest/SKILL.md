---
name: skilltest
description: validate skill structure and metadata. Trigger when developing skills, checking CI, or debugging skill loading issues. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Validate skill schema/metadata/tests and report failing IDs, cause category, and rerun command.
---
# Skilltest Harness

Discover, validate, and test skills against the Open Agent Skills standard.

## Workflow

1.  **Discovery**
    - Search `.agents/skills/` recursively.
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
node .agents/skills/skilltest/scripts/validate-skills.mjs
```

Use the test runner:

```bash
node .agents/skills/skilltest/scripts/skilltest.mjs
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

## Intent Paths

- **Schema/metadata breakage**: run `validate-skills.mjs` first and stop on first structural blocker.
- **Behavioral test failures**: run `skilltest.mjs` with the relevant case set.
- **CI drift investigations**: run both validators, then compare output ordering and failing case IDs.

## Output Contract

Return results in this order:

1. `Failing skill/case IDs`
2. `Root cause category` (frontmatter, path, symlink, behavior)
3. `Minimal fix` (single-file first)
4. `Re-run command`

## Verification Checklist

- [ ] Failure reproduced with command output.
- [ ] Fix validated by re-running the same command.
- [ ] No new failures introduced in adjacent case files.


_Skill sync: compatible with React 19.2.4 / Vite 8.0.0 baseline as of 2026-03-18._
